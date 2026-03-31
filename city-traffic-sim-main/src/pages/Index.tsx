import { useState, useCallback, useRef, useEffect } from 'react';
import { TrafficCone } from "lucide-react";
import TrafficScene3D from '@/components/TrafficScene3D';
import Dashboard from '@/components/Dashboard';
import { formatVehicleNumber } from '@/lib/vehicleLabels';
import {
  generateCityGrid,
  generateSignals,
  createVehicle,
  updateSignals,
  updateVehicles,
  Vehicle,
  TrafficSignal,
  CellType,
} from '@/lib/trafficEngine';

const GRID_ROWS = 31;
const GRID_COLS = 41;

const Index = () => {
  const [grid] = useState<CellType[][]>(() => generateCityGrid(GRID_ROWS, GRID_COLS));
  const [signals, setSignals] = useState<TrafficSignal[]>(() => generateSignals(grid));
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<"day" | "night">("day");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const vehicleIdRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef(0);

  // Use refs for simulation state to avoid stale closures
  const vehiclesRef = useRef(vehicles);
  const signalsRef = useRef(signals);
  const aiModeRef = useRef(aiMode);
  vehiclesRef.current = vehicles;
  signalsRef.current = signals;
  aiModeRef.current = aiMode;

  const addVehicle = useCallback((type: 'car' | 'ambulance' = 'car') => {
    vehicleIdRef.current += 1;
    const v = createVehicle(grid, `v${vehicleIdRef.current}`, type);
    if (v) setVehicles((prev) => [...prev, v]);
  }, [grid]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setVehicles([]);
    setSignals(generateSignals(grid));
    setSelectedVehicleId(null);
    vehicleIdRef.current = 0;
    lastTimeRef.current = 0;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, [grid]);

  // Seed initial vehicles
  useEffect(() => {
    for (let i = 0; i < 8; i++) addVehicle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Simulation loop using requestAnimationFrame
  useEffect(() => {
    if (!isRunning) {
      lastTimeRef.current = 0;
      return;
    }

    const hasEmergency = vehiclesRef.current.some((v) => v.type === 'ambulance' && !v.arrived);

    const loop = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1); // cap at 100ms
      lastTimeRef.current = time;

      setSignals((prev) => updateSignals(prev, dt, aiModeRef.current, vehiclesRef.current));
      setVehicles((prev) =>
        updateVehicles(prev, signalsRef.current, dt, GRID_ROWS, GRID_COLS, hasEmergency)
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning]);

  // Auto-replenish vehicles
  useEffect(() => {
    if (!isRunning) return;
    const active = vehicles.filter((v) => !v.arrived).length;
    if (active < 4) {
      addVehicle();
    }
  }, [vehicles, isRunning, addVehicle]);

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${timeOfDay === "night" ? "bg-[#050b14]" : "bg-background"}`}>
      {/* Watermark/logo */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-start justify-center pt-28">
        <div className="select-none text-[56px] font-black tracking-tight text-blue-200/10">
          SRM AI Lab Project
        </div>
      </div>

      {/* 3D Scene */}
      <TrafficScene3D
        grid={grid}
        vehicles={vehicles}
        signals={signals}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={setSelectedVehicleId}
        aiMode={aiMode}
        timeOfDay={timeOfDay}
      />

      {/* Product header */}
      <div className="absolute top-4 left-0 right-0 z-20 pointer-events-none">
        <div className="mx-auto w-[min(980px,calc(100%-2rem))]">
          <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-700/35 via-cyan-600/20 to-blue-500/20 p-4 shadow-[0_0_36px_rgba(34,211,238,0.18)] backdrop-blur-md">
            <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.75),transparent_45%)] pointer-events-none" />
            <div className="relative text-center">
              <div className="flex items-center justify-center gap-2 font-extrabold text-[18px] tracking-tight text-blue-50">
                <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-300/25 shadow-[0_0_18px_rgba(59,130,246,0.25)]">
                  <TrafficCone className="w-4 h-4 text-blue-100" />
                </span>
                AI Smart Traffic Management System
              </div>
              <div className="mt-1 text-[12px] font-semibold text-blue-50/85">
                SRM Ramapuram Smart City Simulation using Artificial Intelligence
              </div>
              <div className="mt-2 text-[12px] font-bold text-white/80">
                Optimizing Urban Traffic using Intelligent Agents, A* Search, and Real-Time Decision Systems
              </div>
            </div>
            <div className="absolute right-3 top-3 text-[10px] font-semibold tracking-wide text-white/60">
              SRM AI Lab Project
            </div>
          </div>
        </div>
      </div>

      {/* Camera mode label */}
      <div className="absolute top-28 right-4 z-20">
        <div className="rounded-xl border border-white/15 bg-black/30 backdrop-blur-md px-3 py-2 text-[11px] text-white/90 shadow-[0_0_18px_rgba(0,0,0,0.3)]">
          {(() => {
            if (!selectedVehicleId) return <>Free Camera Mode</>;
            const v = vehicles.find((vv) => vv.id === selectedVehicleId);
            if (!v) return <>Free Camera Mode</>;
            return <>Tracking Vehicle: {formatVehicleNumber(v.id)}</>;
          })()}
        </div>
      </div>

      {/* Dashboard overlay */}
      <Dashboard
        isRunning={isRunning}
        vehicles={vehicles}
        signals={signals}
        aiMode={aiMode}
        selectedVehicleId={selectedVehicleId}
        timeOfDay={timeOfDay}
        onSetTimeOfDay={setTimeOfDay}
        onStart={() => setIsRunning(true)}
        onPause={() => setIsRunning(false)}
        onAddVehicle={() => addVehicle('car')}
        onAddAmbulance={() => addVehicle('ambulance')}
        onReset={reset}
        onToggleAI={() => setAiMode((prev) => !prev)}
        onSelectVehicle={setSelectedVehicleId}
      />

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 z-20 pointer-events-none">
        <div className="mx-auto w-[min(980px,calc(100%-2rem))]">
          <div className="rounded-full border border-white/15 bg-black/30 backdrop-blur-md px-5 py-2 text-center text-[11px] text-white/85 shadow-[0_0_22px_rgba(0,0,0,0.35)]">
            Built using Artificial Intelligence concepts: Search Algorithms | Intelligent Agents | Planning Systems
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
