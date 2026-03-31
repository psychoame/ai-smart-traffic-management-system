// ── Cell Types ──────────────────────────────────────────────────
export const ROAD = 0;
export const BUILDING = 1;
export const INTERSECTION = 2;
export type CellType = typeof ROAD | typeof BUILDING | typeof INTERSECTION;

// ── Data Types ──────────────────────────────────────────────────
export interface Position { row: number; col: number; }
export interface Vec3 { x: number; y: number; z: number; }

export type VehicleType = 'car' | 'ambulance';

export interface Vehicle {
  id: string;
  type: VehicleType;
  position: Position;
  worldPos: Vec3;       // smooth interpolated world position
  destination: Position;
  path: Position[];
  pathIndex: number;
  progress: number;     // 0..1 between current and next cell
  speed: number;        // cells per second
  color: string;
  waiting: boolean;
  arrived: boolean;
}

export type SignalState = 'red' | 'yellow' | 'green';

export interface TrafficSignal {
  position: Position;
  state: SignalState;
  timer: number;
  greenDuration: number;
  yellowDuration: number;
  redDuration: number;
  nearbyVehicleCount: number; // for AI mode
}

export interface SimulationState {
  grid: CellType[][];
  vehicles: Vehicle[];
  signals: TrafficSignal[];
  aiMode: boolean;
  time: number;
}

// ── Constants ───────────────────────────────────────────────────
const CELL_WORLD_SIZE = 2; // each cell = 2 world units

export function cellToWorld(pos: Position, gridRows: number, gridCols: number): Vec3 {
  return {
    x: (pos.col - gridCols / 2) * CELL_WORLD_SIZE,
    y: 0,
    z: (pos.row - gridRows / 2) * CELL_WORLD_SIZE,
  };
}

// ── Grid Generation ─────────────────────────────────────────────
export function generateCityGrid(rows: number, cols: number): CellType[][] {
  const grid: CellType[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(BUILDING)
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isH = r % 5 === 0;
      const isV = c % 5 === 0;
      if (isH || isV) grid[r][c] = ROAD;
      if (isH && isV) grid[r][c] = INTERSECTION;
    }
  }
  return grid;
}

// ── Signal Generation ───────────────────────────────────────────
export function generateSignals(grid: CellType[][]): TrafficSignal[] {
  const signals: TrafficSignal[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === INTERSECTION) {
        signals.push({
          position: { row: r, col: c },
          state: Math.random() > 0.5 ? 'green' : 'red',
          timer: Math.random() * 5,
          greenDuration: 6 + Math.random() * 4,
          yellowDuration: 2,
          redDuration: 6 + Math.random() * 4,
          nearbyVehicleCount: 0,
        });
      }
    }
  }
  return signals;
}

// ── A* Pathfinding ──────────────────────────────────────────────
export function findPath(grid: CellType[][], start: Position, end: Position): Position[] {
  const rows = grid.length;
  const cols = grid[0].length;
  if (grid[start.row][start.col] === BUILDING || grid[end.row][end.col] === BUILDING) return [];

  const key = (p: Position) => `${p.row},${p.col}`;
  const h = (a: Position, b: Position) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

  const open = new Map<string, { pos: Position; g: number; f: number }>();
  const closed = new Set<string>();
  const parents = new Map<string, string | null>();

  const sk = key(start);
  open.set(sk, { pos: start, g: 0, f: h(start, end) });
  parents.set(sk, null);

  while (open.size > 0) {
    let bestKey = '';
    let bestF = Infinity;
    for (const [k, n] of open) {
      if (n.f < bestF) { bestF = n.f; bestKey = k; }
    }

    const cur = open.get(bestKey)!;
    if (cur.pos.row === end.row && cur.pos.col === end.col) {
      const path: Position[] = [];
      let k: string | null = bestKey;
      while (k !== null) {
        const [r, c] = k.split(',').map(Number);
        path.unshift({ row: r, col: c });
        k = parents.get(k) ?? null;
      }
      return path;
    }

    open.delete(bestKey);
    closed.add(bestKey);

    for (const d of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = cur.pos.row + d[0], nc = cur.pos.col + d[1];
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc] === BUILDING) continue;
      const nk = key({ row: nr, col: nc });
      if (closed.has(nk)) continue;

      const g = cur.g + 1;
      const existing = open.get(nk);
      if (!existing || g < existing.g) {
        const pos = { row: nr, col: nc };
        open.set(nk, { pos, g, f: g + h(pos, end) });
        parents.set(nk, bestKey);
      }
    }
  }
  return [];
}

// ── Helpers ─────────────────────────────────────────────────────
export function getRandomRoadCell(grid: CellType[][]): Position {
  const roads: Position[] = [];
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0].length; c++)
      if (grid[r][c] !== BUILDING) roads.push({ row: r, col: c });
  return roads[Math.floor(Math.random() * roads.length)];
}

const CAR_COLORS = [
  '#3B82F6', '#2563EB', '#1D4ED8', '#60A5FA', '#06B6D4',
  '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899',
];

export function createVehicle(grid: CellType[][], id: string, type: VehicleType = 'car'): Vehicle | null {
  for (let attempt = 0; attempt < 30; attempt++) {
    const start = getRandomRoadCell(grid);
    const dest = getRandomRoadCell(grid);
    if (start.row === dest.row && start.col === dest.col) continue;

    const path = findPath(grid, start, dest);
    if (path.length > 5) {
      const rows = grid.length, cols = grid[0].length;
      return {
        id,
        type,
        position: start,
        worldPos: cellToWorld(start, rows, cols),
        destination: dest,
        path,
        pathIndex: 0,
        progress: 0,
        speed: type === 'ambulance' ? 4 : 1.5 + Math.random() * 1.5,
        color: type === 'ambulance' ? '#FF0000' : CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
        waiting: false,
        arrived: false,
      };
    }
  }
  return null;
}

// ── Signal Logic ────────────────────────────────────────────────
export function updateSignals(signals: TrafficSignal[], dt: number, aiMode: boolean, vehicles: Vehicle[]): TrafficSignal[] {
  return signals.map((s) => {
    // Count nearby vehicles for AI
    let nearby = 0;
    if (aiMode) {
      nearby = vehicles.filter((v) => {
        const dr = Math.abs(v.position.row - s.position.row);
        const dc = Math.abs(v.position.col - s.position.col);
        return dr + dc <= 5 && !v.arrived;
      }).length;
    }

    const newTimer = s.timer + dt;
    const duration = s.state === 'green'
      ? (aiMode && nearby > 3 ? s.greenDuration * 1.5 : s.greenDuration)
      : s.state === 'yellow'
        ? s.yellowDuration
        : (aiMode && nearby > 3 ? s.redDuration * 0.6 : s.redDuration);

    if (newTimer >= duration) {
      const nextState: SignalState =
        s.state === 'green' ? 'yellow' : s.state === 'yellow' ? 'red' : 'green';
      return { ...s, state: nextState, timer: 0, nearbyVehicleCount: nearby };
    }
    return { ...s, timer: newTimer, nearbyVehicleCount: nearby };
  });
}

// ── Vehicle Movement ────────────────────────────────────────────
export function updateVehicles(
  vehicles: Vehicle[],
  signals: TrafficSignal[],
  dt: number,
  gridRows: number,
  gridCols: number,
  isEmergencyOverride: boolean
): Vehicle[] {
  // Emergency vehicle paths for signal override
  const emergencyPaths = new Set<string>();
  if (isEmergencyOverride) {
    vehicles.filter((v) => v.type === 'ambulance' && !v.arrived).forEach((v) => {
      v.path.forEach((p) => emergencyPaths.add(`${p.row},${p.col}`));
    });
  }

  return vehicles.map((v) => {
    if (v.arrived) return v;
    if (v.pathIndex >= v.path.length - 1) return { ...v, arrived: true };

    const nextIdx = v.pathIndex + 1;
    const nextPos = v.path[nextIdx];
    const nextKey = `${nextPos.row},${nextPos.col}`;

    // Check signal
    const signal = signals.find(
      (s) => s.position.row === nextPos.row && s.position.col === nextPos.col
    );

    // Ambulances ignore signals; override makes signals green on emergency path
    const isAmbulance = v.type === 'ambulance';
    const isBlocked =
      signal &&
      signal.state !== 'green' &&
      !isAmbulance &&
      !(isEmergencyOverride && emergencyPaths.has(nextKey));

    if (isBlocked) {
      return { ...v, waiting: true };
    }

    // Non-ambulance vehicles slow down near ambulances
    let speedMult = 1;
    if (!isAmbulance && isEmergencyOverride) {
      const nearAmbulance = vehicles.some((a) => {
        if (a.type !== 'ambulance' || a.arrived) return false;
        const dr = Math.abs(v.position.row - a.position.row);
        const dc = Math.abs(v.position.col - a.position.col);
        return dr + dc <= 3;
      });
      if (nearAmbulance) speedMult = 0.3;
    }

    const newProgress = v.progress + dt * v.speed * speedMult;

    if (newProgress >= 1) {
      const curPos = v.path[nextIdx];
      return {
        ...v,
        position: curPos,
        worldPos: cellToWorld(curPos, gridRows, gridCols),
        pathIndex: nextIdx,
        progress: 0,
        waiting: false,
      };
    }

    // Interpolate world position
    const fromWorld = cellToWorld(v.path[v.pathIndex], gridRows, gridCols);
    const toWorld = cellToWorld(nextPos, gridRows, gridCols);
    const eased = easeInOut(newProgress);

    return {
      ...v,
      worldPos: {
        x: fromWorld.x + (toWorld.x - fromWorld.x) * eased,
        y: 0,
        z: fromWorld.z + (toWorld.z - fromWorld.z) * eased,
      },
      progress: newProgress,
      waiting: false,
    };
  });
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ── Stats ───────────────────────────────────────────────────────
export function getTrafficDensity(vehicles: Vehicle[]): number {
  const active = vehicles.filter((v) => !v.arrived).length;
  return Math.min(100, active * 5);
}
