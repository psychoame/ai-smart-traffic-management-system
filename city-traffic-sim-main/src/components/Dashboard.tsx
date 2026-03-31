import type { ReactNode } from "react";
import {
  Play,
  Pause,
  Plus,
  RotateCcw,
  Car,
  Siren,
  Brain,
  Eye,
  Zap,
  Sun,
  Moon,
  Activity,
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type Vehicle, type TrafficSignal, getTrafficDensity } from "@/lib/trafficEngine";
import { formatVehicleNumber, formatVehicleType } from "@/lib/vehicleLabels";

interface DashboardProps {
  isRunning: boolean;
  vehicles: Vehicle[];
  signals: TrafficSignal[];
  aiMode: boolean;
  selectedVehicleId: string | null;
  timeOfDay: "day" | "night";
  onSetTimeOfDay: (t: "day" | "night") => void;
  onStart: () => void;
  onPause: () => void;
  onAddVehicle: () => void;
  onAddAmbulance: () => void;
  onReset: () => void;
  onToggleAI: () => void;
  onSelectVehicle: (id: string | null) => void;
}

export default function Dashboard({
  isRunning,
  vehicles,
  signals,
  aiMode,
  selectedVehicleId,
  timeOfDay,
  onSetTimeOfDay,
  onStart,
  onPause,
  onAddVehicle,
  onAddAmbulance,
  onReset,
  onToggleAI,
  onSelectVehicle,
}: DashboardProps) {
  const activeVehicles = vehicles.filter((v) => !v.arrived);
  const totalVehicles = vehicles.length;
  const ambulancesActive = vehicles.filter((v) => v.type === "ambulance" && !v.arrived).length;
  const density = getTrafficDensity(vehicles);
  const signalsActive = signals.length;

  const isDark = aiMode || timeOfDay === "night";

  const fgTitle = isDark ? "text-blue-200/80" : "text-blue-900/70";
  const fgPrimary = isDark ? "text-white/90" : "text-gray-900/90";
  const fgMuted = isDark ? "text-white/60" : "text-gray-600";
  const fgSubtle = isDark ? "text-white/80" : "text-gray-700";

  const selectedVehicle = selectedVehicleId ? vehicles.find((v) => v.id === selectedVehicleId) : undefined;
  const selectedPlate = selectedVehicle ? formatVehicleNumber(selectedVehicle.id) : "-";
  const selectedType = selectedVehicle ? formatVehicleType(selectedVehicle.type) : "-";
  const selectedStatus = !selectedVehicle ? "-" : selectedVehicle.waiting ? "Waiting" : "Moving";

  const isNight = timeOfDay === "night";
  const cardBg = aiMode
    ? "bg-[#0a1430]/90 border-[#1a3a80]/60"
    : isNight
      ? "bg-[#07111f]/85 border-[#14314c]/70"
      : "bg-white/90 border-gray-200 shadow-lg";

  const densityColor = isDark
    ? density >= 70
      ? "text-red-300"
      : density >= 40
        ? "text-amber-300"
        : "text-green-300"
    : density >= 70
      ? "text-red-700"
      : density >= 40
        ? "text-amber-700"
        : "text-green-700";
  const densityBarColor =
    density >= 70
      ? "linear-gradient(90deg, #ef4444, #dc2626)"
      : density >= 40
        ? "linear-gradient(90deg, #f59e0b, #d97706)"
        : "linear-gradient(90deg, #22c55e, #16a34a)";

  return (
    <div className="absolute top-28 left-3 z-10 flex flex-col gap-3 w-[320px] max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
      {/* A. System Status */}
      <div className={`backdrop-blur-md rounded-xl border p-3 transition-all duration-500 ${cardBg}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-300" />
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${fgTitle}`}>System Status</p>
              <p className={`text-[12px] font-extrabold ${isDark ? "text-blue-50/95" : "text-blue-900/85"} leading-tight`}>
                Simulation Status: {isRunning ? "Running" : "Paused"}
              </p>
              <p className={`text-[11px] font-semibold ${fgSubtle}`}>
                AI Mode: {aiMode ? "ON" : "OFF"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <Tooltip>
              <TooltipTrigger>
                <span className="inline-flex">
                  {isRunning ? (
                    <Button size="sm" variant="secondary" onClick={onPause} className="gap-1.5 text-xs h-8">
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </Button>
                  ) : (
                    <Button size="sm" onClick={onStart} className="gap-1.5 text-xs h-8">
                      <Play className="w-3.5 h-3.5" /> Start Simulation
                    </Button>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isRunning ? "Pause the simulation loop (signals and vehicles stop updating)." : "Start the simulation (real-time signals + vehicle movement)."}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <span className="inline-flex">
                  <Button size="sm" variant="destructive" onClick={onReset} className="gap-1.5 text-xs h-8">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset System
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Stop, clear vehicles, and regenerate city signals.</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <span className="inline-flex">
                  <Button size="sm" variant="outline" onClick={onAddVehicle} className="gap-1.5 text-xs h-8">
                    <Plus className="w-3.5 h-3.5" /> Add Vehicle
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Spawn a new car and navigate using A* pathfinding.</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <span className="inline-flex">
                  <Button size="sm" variant="outline" onClick={onAddAmbulance} className="gap-1.5 text-xs h-8">
                    <Siren className="w-3.5 h-3.5" /> Dispatch Ambulance
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Dispatch an emergency vehicle with priority routing.</TooltipContent>
            </Tooltip>
          </div>

          <Tooltip>
            <TooltipTrigger>
              <span className="inline-flex">
                <Button
                  size="sm"
                  onClick={onToggleAI}
                  className={`w-full gap-2 text-xs h-9 font-bold transition-all duration-500 ${
                    aiMode
                      ? "bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white shadow-[0_0_15px_rgba(0,200,255,0.3)]"
                    : isDark
                      ? "bg-white/10 text-white hover:bg-white/15 border border-white/15"
                      : "bg-blue-600/10 text-blue-900 hover:bg-blue-600/15 border border-blue-600/25"
                  }`}
                >
                  <Brain className={`w-4 h-4 ${aiMode ? "text-cyan-300" : ""}`} />
                  {aiMode ? "AI Mode: ON" : "AI Mode: OFF"}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle intelligent agent-based signal timing.</TooltipContent>
          </Tooltip>

          {/* Night / Day option */}
          <div>
            <div className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${fgMuted} mb-1`}>
              <span>Time Theme</span>
              <span className={isNight ? (isDark ? "text-red-300" : "text-red-700") : (isDark ? "text-green-300" : "text-green-700")}>
                {isNight ? "Night" : "Day"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Tooltip>
                <TooltipTrigger>
                  <span className="inline-flex">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSetTimeOfDay("day")}
                      className={`h-8 text-xs ${
                      !isNight
                        ? isDark
                          ? "bg-green-600/30 border-green-400/30 text-green-100"
                          : "bg-green-600/20 border-green-600/40 text-green-900 hover:bg-green-600/25"
                        : "bg-transparent border-white/15 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" /> Day
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">Day lighting preset.</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <span className="inline-flex">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSetTimeOfDay("night")}
                      className={`h-8 text-xs ${
                        isNight
                          ? "bg-red-600/25 border-red-400/35 text-red-100"
                          : isDark
                            ? "bg-transparent border-white/15 text-white/80 hover:bg-white/10"
                            : "bg-transparent border-gray-300/60 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" /> Night
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">Night lighting preset.</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* B. Live Metrics */}
      <div className={`backdrop-blur-md rounded-xl border p-3 transition-all duration-500 ${cardBg}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${fgTitle} flex items-center gap-2`}>
          <Zap className="w-3.5 h-3.5 text-cyan-300" /> Live Metrics
        </p>

        <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
          <StatCard isDark={isDark} icon={<Car className="w-3.5 h-3.5" />} label="Total Vehicles" value={String(totalVehicles)} tone="blue" />
          <StatCard isDark={isDark} icon={<Siren className="w-3.5 h-3.5" />} label="Ambulances Active" value={String(ambulancesActive)} tone="red" />
          <StatCard
            isDark={isDark}
            icon={<Activity className="w-3.5 h-3.5" />}
            label="Traffic Density (%)"
            value={`${density}%`}
            tone={density >= 70 ? "red" : density >= 40 ? "amber" : "green"}
            rightAlign
          />
          <StatCard isDark={isDark} icon={<Eye className="w-3.5 h-3.5" />} label="Signals Active" value={String(signalsActive)} tone="cyan" />
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-[10px] mb-1">
            <span className={fgMuted}>Traffic Density</span>
            <span className={`font-extrabold ${densityColor}`}>{density}%</span>
          </div>
          <div className={`w-full rounded-full h-2 ${aiMode ? "bg-[#152040]" : isNight ? "bg-[#0b1b2f]" : "bg-gray-200"}`}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${density}%`, background: densityBarColor }} />
          </div>
        </div>
      </div>

      {/* C. Selected Vehicle */}
      <div className={`backdrop-blur-md rounded-xl border p-3 transition-all duration-500 ${cardBg}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${fgTitle} flex items-center gap-2`}>
          <Eye className="w-3.5 h-3.5 text-cyan-300" /> Selected Vehicle
        </p>

        <div className="mt-2 space-y-2 text-xs">
          <KVRow isDark={isDark} k="Vehicle Number" v={selectedPlate} />
          <KVRow isDark={isDark} k="Type" v={selectedType} />
          <KVRow
            isDark={isDark}
            k="Current Status"
            v={
              selectedStatus === "Waiting" ? (
                <span className={`${isDark ? "text-red-200" : "text-red-700"} font-extrabold`}>Waiting</span>
              ) : selectedStatus === "Moving" ? (
                <span className={`${isDark ? "text-green-200" : "text-green-700"} font-extrabold`}>Moving</span>
              ) : (
                "-"
              )
            }
          />
        </div>

        {activeVehicles.length > 0 && (
          <div className={`mt-3 pt-3 border-t ${isDark ? "border-white/10" : "border-gray-200/60"}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${fgMuted} flex items-center gap-2`}>
              <Eye className="w-3 h-3" /> Vehicle Tracking
            </p>
            <div className="mt-2 max-h-32 overflow-y-auto pr-1 space-y-1">
              {activeVehicles.slice(0, 8).map((v) => {
                const plate = formatVehicleNumber(v.id);
                const isSelected = v.id === selectedVehicleId;
                return (
                  <button
                    key={v.id}
                    onClick={() => onSelectVehicle(v.id === selectedVehicleId ? null : v.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all text-[11px] ${
                      isSelected
                        ? isDark
                          ? "bg-blue-600/25 border-blue-400/40 text-blue-50"
                          : "bg-blue-600/15 border-blue-600/25 text-blue-900"
                        : isDark
                          ? "bg-transparent border-white/10 text-white/85 hover:bg-white/5"
                          : "bg-transparent border-gray-200/70 text-gray-700/85 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: v.color }} />
                    <span className="font-mono text-[10.5px]">{plate}</span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${v.type === "ambulance" ? "text-red-200" : "text-blue-200"}`}>{v.type === "ambulance" ? "AMB" : "CAR"}</span>
                      <span className={v.waiting ? "text-red-300" : "text-green-300"}>{v.waiting ? "WAIT" : "MOV"}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights */}
      <div className={`backdrop-blur-md rounded-xl border p-3 transition-all duration-500 ${cardBg}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${fgTitle}`}>System Capabilities:</p>
        <ul className={`mt-2 space-y-1 text-xs ${isDark ? "text-white/80" : "text-gray-700"}`}>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-400/90" /> Real-time traffic optimization
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400/90" /> Emergency vehicle priority routing
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-400/90" /> Intelligent signal control
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-cyan-300/90" /> Dynamic pathfinding using A*
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  rightAlign,
  isDark,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "blue" | "green" | "red" | "amber" | "cyan";
  rightAlign?: boolean;
  isDark: boolean;
}) {
  const toneClass = isDark
    ? tone === "red"
      ? "text-red-200"
      : tone === "green"
        ? "text-green-200"
        : tone === "amber"
          ? "text-amber-200"
          : tone === "cyan"
            ? "text-cyan-200"
            : "text-blue-200"
    : tone === "red"
      ? "text-red-700"
      : tone === "green"
        ? "text-green-700"
        : tone === "amber"
          ? "text-amber-700"
          : tone === "cyan"
            ? "text-cyan-700"
            : "text-blue-700";

  const labelClass = isDark ? "text-white/60" : "text-gray-600";

  return (
    <div
      className={`flex items-center gap-2 p-1.5 rounded-lg border ${
        isDark ? "border-white/10" : "border-gray-200/70"
      } ${isDark ? (tone === "red" ? "bg-red-500/5" : "bg-white/5") : "bg-white/70"}`}
    >
      <span className={toneClass}>{icon}</span>
      <div className="min-w-0">
        <p className={`text-[9px] ${labelClass} ${rightAlign ? "text-right" : ""}`}>{label}</p>
        <p className={`font-extrabold text-xs ${toneClass} ${rightAlign ? "text-right" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

function KVRow({
  k,
  v,
  isDark,
}: {
  k: string;
  v: string | ReactNode;
  isDark: boolean;
}) {
  const keyClass = isDark ? "text-white/60" : "text-gray-600";
  const valClass = isDark ? "text-white/90" : "text-gray-900";
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-[10px] font-bold uppercase tracking-widest ${keyClass}`}>{k}</span>
      <span className={`text-[12px] font-extrabold ${valClass} text-right`}>{v}</span>
    </div>
  );
}
