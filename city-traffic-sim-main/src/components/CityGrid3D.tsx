import { useMemo } from 'react';
import { CellType, BUILDING, INTERSECTION, cellToWorld } from '@/lib/trafficEngine';

const CELL_SIZE = 2;

interface CityGridProps {
  grid: CellType[][];
  aiMode: boolean;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const BUILDING_PALETTES = [
  { body: '#e8d8c8', roof: '#d4c0a8' },
  { body: '#d4b896', roof: '#c0a480' },
  { body: '#f0e0cc', roof: '#e0ccb4' },
  { body: '#b8cce0', roof: '#a0b8d0' },
  { body: '#98b4cc', roof: '#88a0b8' },
  { body: '#c4d4e4', roof: '#b0c4d8' },
  { body: '#c8c8cc', roof: '#b4b4b8' },
  { body: '#b0b0b8', roof: '#9c9ca4' },
  { body: '#d8d8dc', roof: '#c4c4c8' },
  { body: '#cc9878', roof: '#b88060' },
  { body: '#d4a888', roof: '#c09070' },
  { body: '#e8dcc8', roof: '#d8ccb0' },
  { body: '#f0e8d4', roof: '#e0d4bc' },
  { body: '#8cb4d8', roof: '#78a0c8' },
  { body: '#c4a8c0', roof: '#b094ac' },
  { body: '#a8c8a4', roof: '#94b490' },
  { body: '#707888', roof: '#606878' },
  { body: '#585e6e', roof: '#484e5e' },
  { body: '#e0c4b0', roof: '#ccb09c' },
  { body: '#c8b8a0', roof: '#b4a48c' },
];

export default function CityGrid3D({ grid, aiMode }: CityGridProps) {
  const rows = grid.length;
  const cols = grid[0].length;

  const campusCenterRow = Math.floor(rows / 2);
  const campusCenterCol = Math.floor(cols / 2);
  const isCampusCell = (r: number, c: number) => {
    const dr = Math.abs(r - campusCenterRow);
    const dc = Math.abs(c - campusCenterCol);
    return dr <= 4 && dc <= 4 && grid[r][c] === BUILDING;
  };

  const cityData = useMemo(() => {
    const roads: { x: number; z: number; isH: boolean; isV: boolean }[] = [];
    const buildings: {
      x: number; z: number; h: number; w: number; d: number;
      palette: typeof BUILDING_PALETTES[0]; seed: number;
      hasAntenna: boolean; hasStripe: boolean;
    }[] = [];
    const intersections: { x: number; z: number }[] = [];
    const parks: { x: number; z: number; treeCount: number }[] = [];
    const campusGround: { x: number; z: number }[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const w = cellToWorld({ row: r, col: c }, rows, cols);
        const cell = grid[r][c];
        const seed = r * 1000 + c;
        const rng = seededRandom(seed);

        if (isCampusCell(r, c)) {
          campusGround.push({ x: w.x, z: w.z });
          continue;
        }

        if (cell === BUILDING) {
          if (rng > 0.9) {
            parks.push({ x: w.x, z: w.z, treeCount: 1 + Math.floor(seededRandom(seed + 10) * 3) });
          } else {
            const height = 1.0 + seededRandom(seed + 1) * 6;
            buildings.push({
              x: w.x, z: w.z, h: height,
              w: CELL_SIZE * (0.72 + seededRandom(seed + 2) * 0.2),
              d: CELL_SIZE * (0.72 + seededRandom(seed + 3) * 0.2),
              palette: BUILDING_PALETTES[Math.floor(seededRandom(seed + 4) * BUILDING_PALETTES.length)],
              seed,
              hasAntenna: seededRandom(seed + 5) > 0.85 && height > 4,
              hasStripe: seededRandom(seed + 7) > 0.5,
            });
          }
        } else if (cell === INTERSECTION) {
          intersections.push({ x: w.x, z: w.z });
        } else {
          roads.push({ x: w.x, z: w.z, isH: r % 5 === 0, isV: c % 5 === 0 });
        }
      }
    }
    return { roads, buildings, intersections, parks, campusGround };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, rows, cols]);

  const cw = cellToWorld({ row: campusCenterRow, col: campusCenterCol }, rows, cols);
  const campusSize = 9 * CELL_SIZE;

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[cols * CELL_SIZE + 20, rows * CELL_SIZE + 20]} />
        <meshStandardMaterial color="#c5d4b8" />
      </mesh>

      {/* ════════ ROADS ════════ */}
      {cityData.roads.map((rd, i) => (
        <group key={`r-${i}`}>
          <mesh position={[rd.x, 0.01, rd.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
            <meshStandardMaterial color="#e8e4da" />
          </mesh>
          <mesh position={[rd.x + (rd.isV ? 0 : CELL_SIZE * 0.47), 0.04, rd.z + (rd.isH ? CELL_SIZE * 0.47 : 0)]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[rd.isV ? CELL_SIZE : 0.12, rd.isH ? CELL_SIZE : 0.12]} />
            <meshStandardMaterial color="#d0ccc0" />
          </mesh>
          {i % 2 === 0 && (
            <mesh position={[rd.x, 0.02, rd.z]} rotation={[-Math.PI / 2, 0, rd.isH ? Math.PI / 2 : 0]}>
              <planeGeometry args={[0.06, CELL_SIZE * 0.35]} />
              <meshStandardMaterial color="#f8f0d0" />
            </mesh>
          )}
        </group>
      ))}

      {/* ════════ INTERSECTIONS + ZEBRA ════════ */}
      {cityData.intersections.map((int, i) => (
        <group key={`int-${i}`}>
          <mesh position={[int.x, 0.015, int.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
            <meshStandardMaterial color="#e4dfce" />
          </mesh>
          {/* Zebra crossings all 4 sides */}
          {[
            { ox: 0, oz: CELL_SIZE * 0.44, stripeW: 0.16, stripeH: 0.45, dir: 'h' as const },
            { ox: 0, oz: -CELL_SIZE * 0.44, stripeW: 0.16, stripeH: 0.45, dir: 'h' as const },
            { ox: CELL_SIZE * 0.44, oz: 0, stripeW: 0.45, stripeH: 0.16, dir: 'v' as const },
            { ox: -CELL_SIZE * 0.44, oz: 0, stripeW: 0.45, stripeH: 0.16, dir: 'v' as const },
          ].map((side, si) => (
            <group key={`z-${si}`}>
              {Array.from({ length: 6 }).map((_, s) => (
                <mesh key={s} position={[
                  int.x + side.ox + (side.dir === 'h' ? (-0.65 + s * 0.26) : 0),
                  0.025,
                  int.z + side.oz + (side.dir === 'v' ? (-0.65 + s * 0.26) : 0)
                ]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[side.stripeW, side.stripeH]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
              ))}
            </group>
          ))}
          {/* Stop lines */}
          {[[0, CELL_SIZE * 0.35, CELL_SIZE * 0.7, 0.06],
            [0, -CELL_SIZE * 0.35, CELL_SIZE * 0.7, 0.06],
            [CELL_SIZE * 0.35, 0, 0.06, CELL_SIZE * 0.7],
            [-CELL_SIZE * 0.35, 0, 0.06, CELL_SIZE * 0.7]
          ].map(([ox, oz, w, h], si) => (
            <mesh key={`sl${si}`} position={[int.x + ox, 0.022, int.z + oz]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w, h]} />
              <meshStandardMaterial color="#ffffff" opacity={0.9} transparent />
            </mesh>
          ))}

          {/* AI Mode: intersection optimization ring */}
          {aiMode && (
            <mesh position={[int.x, 0.03, int.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.85, 0.95, 32]} />
              <meshStandardMaterial color="#00e5ff" transparent opacity={0.4} emissive="#00e5ff" emissiveIntensity={0.5} />
            </mesh>
          )}
        </group>
      ))}

      {/* ════════ SRM INSTITUTE OF SCIENCE AND TECHNOLOGY — RAMAPURAM ════════ */}
      {/* Campus ground — concrete/paved */}
      {cityData.campusGround.map((cg, i) => (
        <mesh key={`cg-${i}`} position={[cg.x, 0.02, cg.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
          <meshStandardMaterial color="#d8d4c8" />
        </mesh>
      ))}

      {/* Campus boundary wall — solid with pillars */}
      {[
        [cw.x, 0.4, cw.z - campusSize / 2, campusSize + 1, 0.8, 0.2],
        [cw.x, 0.4, cw.z + campusSize / 2, campusSize + 1, 0.8, 0.2],
        [cw.x - campusSize / 2, 0.4, cw.z, 0.2, 0.8, campusSize + 1],
        [cw.x + campusSize / 2, 0.4, cw.z, 0.2, 0.8, campusSize + 1],
      ].map(([x, y, z, w, h, d], wi) => (
        <mesh key={`wall-${wi}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#c8b898" metalness={0.05} roughness={0.9} />
        </mesh>
      ))}

      {/* Main Gate — Grand entrance */}
      <group position={[cw.x, 0, cw.z + campusSize / 2]}>
        {/* Gate arch */}
        <mesh position={[0, 2.0, 0]} castShadow>
          <boxGeometry args={[4.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#1a3366" metalness={0.3} roughness={0.5} />
        </mesh>
        {/* Left pillar */}
        <mesh position={[-2.0, 1.4, 0]} castShadow>
          <boxGeometry args={[0.5, 2.8, 0.5]} />
          <meshStandardMaterial color="#d0c0a0" metalness={0.1} />
        </mesh>
        {/* Right pillar */}
        <mesh position={[2.0, 1.4, 0]} castShadow>
          <boxGeometry args={[0.5, 2.8, 0.5]} />
          <meshStandardMaterial color="#d0c0a0" metalness={0.1} />
        </mesh>
        {/* SRM Name board — Blue */}
        <mesh position={[0, 2.8, 0.1]}>
          <boxGeometry args={[5.0, 0.8, 0.15]} />
          <meshStandardMaterial color="#0d2654" metalness={0.2} roughness={0.4} />
        </mesh>
        {/* Gold text strip */}
        <mesh position={[0, 2.85, 0.2]}>
          <boxGeometry args={[4.6, 0.15, 0.05]} />
          <meshStandardMaterial color="#d4a830" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, 2.55, 0.2]}>
          <boxGeometry args={[3.8, 0.12, 0.05]} />
          <meshStandardMaterial color="#d4a830" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* SRM Logo circle on gate */}
        <mesh position={[0, 3.5, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
          <meshStandardMaterial color="#1a3366" metalness={0.3} />
        </mesh>
        <mesh position={[0, 3.5, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.05, 32]} />
          <meshStandardMaterial color="#d4a830" metalness={0.6} roughness={0.2} />
        </mesh>
      </group>

      {/* ── Campus Buildings ── */}
      {/* Main Academic Block — Large, imposing */}
      <group>
        <mesh position={[cw.x, 3.0, cw.z - 2]} castShadow receiveShadow>
          <boxGeometry args={[6, 6, 4]} />
          <meshStandardMaterial color="#d8ceb8" metalness={0.08} roughness={0.75} />
        </mesh>
        <mesh position={[cw.x, 6.1, cw.z - 2]}>
          <boxGeometry args={[6.3, 0.15, 4.3]} />
          <meshStandardMaterial color="#b8a890" />
        </mesh>
        {/* Windows grid */}
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => (
            <mesh key={`mw-${row}-${col}`} position={[cw.x - 2.4 + col * 0.7, 1.0 + row * 1.0, cw.z - 2 + 2.01]}>
              <planeGeometry args={[0.4, 0.6]} />
              <meshStandardMaterial
                color="#78a8d0"
                metalness={0.4} roughness={0.15}
                emissive="#f0e080"
                emissiveIntensity={seededRandom(row * 10 + col) > 0.5 ? 0.2 : 0}
              />
            </mesh>
          ))
        )}
        {/* Name plate */}
        <mesh position={[cw.x, 4.5, cw.z - 2 + 2.02]}>
          <planeGeometry args={[3.5, 0.5]} />
          <meshStandardMaterial color="#0d2654" />
        </mesh>
        <mesh position={[cw.x, 4.5, cw.z - 2 + 2.03]}>
          <planeGeometry args={[3.2, 0.12]} />
          <meshStandardMaterial color="#d4a830" metalness={0.6} />
        </mesh>
      </group>

      {/* IT / Tech Block — right side */}
      <group>
        <mesh position={[cw.x + 5, 2.5, cw.z + 1]} castShadow receiveShadow>
          <boxGeometry args={[3.5, 5, 3]} />
          <meshStandardMaterial color="#b0c4d8" metalness={0.15} roughness={0.6} />
        </mesh>
        <mesh position={[cw.x + 5, 5.1, cw.z + 1]}>
          <boxGeometry args={[3.7, 0.12, 3.2]} />
          <meshStandardMaterial color="#90a8c0" />
        </mesh>
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => (
            <mesh key={`tw-${row}-${col}`} position={[cw.x + 5 - 1.5 + col * 0.7, 0.8 + row * 1.1, cw.z + 1 + 1.51]}>
              <planeGeometry args={[0.45, 0.65]} />
              <meshStandardMaterial color="#6898c0" metalness={0.5} roughness={0.1} />
            </mesh>
          ))
        )}
      </group>

      {/* Library — left side */}
      <group>
        <mesh position={[cw.x - 5, 1.8, cw.z - 1]} castShadow receiveShadow>
          <boxGeometry args={[3, 3.6, 3.5]} />
          <meshStandardMaterial color="#d4c0a0" metalness={0.05} roughness={0.8} />
        </mesh>
        <mesh position={[cw.x - 5, 3.7, cw.z - 1]}>
          <boxGeometry args={[3.2, 0.12, 3.7]} />
          <meshStandardMaterial color="#c0a880" />
        </mesh>
        {/* Large front windows */}
        {Array.from({ length: 3 }).map((_, col) => (
          <mesh key={`lw-${col}`} position={[cw.x - 5 - 1.0 + col * 1.0, 1.8, cw.z - 1 + 1.76]}>
            <planeGeometry args={[0.7, 2.2]} />
            <meshStandardMaterial color="#88b8d8" metalness={0.4} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* Hostel Block — tall, behind main */}
      <group>
        <mesh position={[cw.x - 3, 3.5, cw.z - 6]} castShadow receiveShadow>
          <boxGeometry args={[3.5, 7, 2.5]} />
          <meshStandardMaterial color="#c8b8c8" metalness={0.05} roughness={0.8} />
        </mesh>
        <mesh position={[cw.x - 3, 7.1, cw.z - 6]}>
          <boxGeometry args={[3.7, 0.1, 2.7]} />
          <meshStandardMaterial color="#b0a0b0" />
        </mesh>
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => (
            <mesh key={`hw-${row}-${col}`} position={[cw.x - 3 - 1.2 + col * 0.6, 0.8 + row * 1.0, cw.z - 6 + 1.26]}>
              <planeGeometry args={[0.35, 0.5]} />
              <meshStandardMaterial
                color="#a0c0d8"
                emissive="#f8e080"
                emissiveIntensity={seededRandom(row * 7 + col * 3) > 0.4 ? 0.15 : 0}
              />
            </mesh>
          ))
        )}
      </group>

      {/* Auditorium — round-ish structure */}
      <group>
        <mesh position={[cw.x + 4, 1.5, cw.z - 5]} castShadow receiveShadow>
          <boxGeometry args={[4, 3, 3]} />
          <meshStandardMaterial color="#c8a898" metalness={0.08} roughness={0.75} />
        </mesh>
        {/* Dome top */}
        <mesh position={[cw.x + 4, 3.2, cw.z - 5]} castShadow>
          <sphereGeometry args={[1.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#b89888" metalness={0.1} roughness={0.6} />
        </mesh>
      </group>

      {/* Campus internal roads/pathways */}
      {[
        [cw.x, 0.025, cw.z, 1.2, campusSize * 0.8],
        [cw.x, 0.025, cw.z, campusSize * 0.8, 1.2],
        [cw.x + 3, 0.025, cw.z - 3, 0.8, 6],
        [cw.x - 3, 0.025, cw.z + 2, 0.8, 4],
      ].map(([x, y, z, w, h], pi) => (
        <mesh key={`cp-${pi}`} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#e0dace" />
        </mesh>
      ))}

      {/* Campus central roundabout with fountain */}
      <mesh position={[cw.x, 0.03, cw.z + 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 32]} />
        <meshStandardMaterial color="#70b8d8" metalness={0.3} roughness={0.2} />
      </mesh>
      <mesh position={[cw.x, 0.04, cw.z + 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 1.8, 32]} />
        <meshStandardMaterial color="#a09880" />
      </mesh>
      <mesh position={[cw.x, 0.5, cw.z + 3]}>
        <cylinderGeometry args={[0.2, 0.35, 1.0, 12]} />
        <meshStandardMaterial color="#808888" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Campus trees — along pathways */}
      {Array.from({ length: 16 }).map((_, t) => {
        const angle = (t / 16) * Math.PI * 2;
        const radius = 3 + (t % 2) * 1.5;
        const tx = cw.x + Math.cos(angle) * radius;
        const tz = cw.z + Math.sin(angle) * radius;
        return (
          <group key={`ctree-${t}`}>
            <mesh position={[tx, 0.35, tz]}>
              <cylinderGeometry args={[0.04, 0.06, 0.7, 6]} />
              <meshStandardMaterial color="#6B4226" />
            </mesh>
            <mesh position={[tx, 0.85, tz]} castShadow>
              <sphereGeometry args={[0.38, 8, 8]} />
              <meshStandardMaterial color={t % 3 === 0 ? '#2d7a2a' : t % 3 === 1 ? '#3d9a3a' : '#4aaa4a'} />
            </mesh>
          </group>
        );
      })}

      {/* Parking lot area */}
      <mesh position={[cw.x + 6, 0.025, cw.z + 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color="#b8b4a8" />
      </mesh>
      {/* Parking lines */}
      {Array.from({ length: 5 }).map((_, p) => (
        <mesh key={`pk-${p}`} position={[cw.x + 5 + p * 0.6, 0.03, cw.z + 5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.04, 2.5]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* ════════ CITY BUILDINGS ════════ */}
      {cityData.buildings.map((b, i) => (
        <group key={`bld-${i}`}>
          <mesh position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.palette.body} metalness={0.05} roughness={0.8} />
          </mesh>
          <mesh position={[b.x, b.h + 0.03, b.z]}>
            <boxGeometry args={[b.w + 0.06, 0.06, b.d + 0.06]} />
            <meshStandardMaterial color={b.palette.roof} metalness={0.1} roughness={0.6} />
          </mesh>
          {b.hasStripe && Array.from({ length: Math.floor(b.h / 0.8) }).map((_, wi) => (
            <mesh key={`w${wi}`} position={[b.x, 0.6 + wi * 0.8, b.z + b.d / 2 + 0.01]}>
              <planeGeometry args={[b.w * 0.7, 0.2]} />
              <meshStandardMaterial
                color={seededRandom(b.seed + wi + 100) > 0.5 ? '#a0c8e8' : '#d0e0f0'}
                metalness={0.3} roughness={0.2}
                emissive={seededRandom(b.seed + wi + 200) > 0.6 ? '#f8e8a0' : '#000000'}
                emissiveIntensity={seededRandom(b.seed + wi + 200) > 0.6 ? 0.15 : 0}
              />
            </mesh>
          ))}
          {b.hasStripe && Array.from({ length: Math.floor(b.h / 0.8) }).map((_, wi) => (
            <mesh key={`sw${wi}`} position={[b.x + b.w / 2 + 0.01, 0.6 + wi * 0.8, b.z]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[b.d * 0.7, 0.2]} />
              <meshStandardMaterial color="#a8c0d8" metalness={0.3} roughness={0.2} />
            </mesh>
          ))}
          {b.hasAntenna && (
            <group>
              <mesh position={[b.x, b.h + 0.5, b.z]}>
                <cylinderGeometry args={[0.02, 0.02, 0.9, 4]} />
                <meshStandardMaterial color="#666" metalness={0.8} />
              </mesh>
              <mesh position={[b.x, b.h + 0.95, b.z]}>
                <sphereGeometry args={[0.04, 6, 6]} />
                <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={0.5} />
              </mesh>
            </group>
          )}
          <mesh position={[b.x, 0.012, b.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[b.w + 0.1, b.d + 0.1]} />
            <meshStandardMaterial color="#a0a098" />
          </mesh>
        </group>
      ))}

      {/* Parks */}
      {cityData.parks.map((p, i) => (
        <group key={`park-${i}`}>
          <mesh position={[p.x, 0.02, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[CELL_SIZE * 0.92, CELL_SIZE * 0.92]} />
            <meshStandardMaterial color="#7cc878" />
          </mesh>
          {Array.from({ length: p.treeCount }).map((_, t) => {
            const tx = p.x + (seededRandom(i * 100 + t) - 0.5) * 0.8;
            const tz = p.z + (seededRandom(i * 100 + t + 50) - 0.5) * 0.8;
            return (
              <group key={t}>
                <mesh position={[tx, 0.25, tz]}>
                  <cylinderGeometry args={[0.04, 0.06, 0.5, 6]} />
                  <meshStandardMaterial color="#6B4226" />
                </mesh>
                <mesh position={[tx, 0.6, tz]} castShadow>
                  <sphereGeometry args={[0.3, 8, 8]} />
                  <meshStandardMaterial color={seededRandom(i * 100 + t + 33) > 0.5 ? '#4a9e46' : '#5aae56'} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}
