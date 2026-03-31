import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import CityGrid3D from './CityGrid3D';
import Vehicle3D from './Vehicle3D';
import Signal3D from './Signal3D';
import { Vehicle, TrafficSignal, CellType } from '@/lib/trafficEngine';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface TrafficScene3DProps {
  grid: CellType[][];
  vehicles: Vehicle[];
  signals: TrafficSignal[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string | null) => void;
  aiMode: boolean;
  timeOfDay: "day" | "night";
}

export default function TrafficScene3D({
  grid,
  vehicles,
  signals,
  selectedVehicleId,
  onSelectVehicle,
  aiMode,
  timeOfDay,
}: TrafficScene3DProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const rows = grid.length;
  const cols = grid[0].length;

  const isNight = timeOfDay === "night";

  useEffect(() => {
    if (!selectedVehicleId || !controlsRef.current) return;
    const v = vehicles.find((v) => v.id === selectedVehicleId);
    if (v) {
      controlsRef.current.target.set(v.worldPos.x, 0, v.worldPos.z);
    }
  }, [selectedVehicleId, vehicles]);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 65, 30], fov: 50, near: 0.1, far: 500 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true }}
    >
      {/* Background color shifts with AI mode */}
      <color
        attach="background"
        args={[
          aiMode ? "#0c1828" : isNight ? "#06111f" : "#dce8f4",
        ]}
      />

      {/* Lighting shifts dramatically between modes */}
      {aiMode ? (
        <>
          <ambientLight intensity={0.25} color="#2040a0" />
          <directionalLight position={[40, 80, 30]} intensity={0.4} color="#4060c0" castShadow
            shadow-mapSize={[2048, 2048]} shadow-camera-far={200}
            shadow-camera-left={-80} shadow-camera-right={80}
            shadow-camera-top={80} shadow-camera-bottom={-80} shadow-bias={-0.0005}
          />
          <directionalLight position={[-30, 40, -20]} intensity={0.15} color="#2040a0" />
          <hemisphereLight intensity={0.15} color="#1a3060" groundColor="#0a1020" />
        </>
      ) : (
        <>
          <ambientLight intensity={isNight ? 0.25 : 0.8} color={isNight ? "#0b2a5f" : "#ffffff"} />
          <directionalLight position={[40, 80, 30]} intensity={1.0} color="#fff8e8" castShadow
            shadow-mapSize={[2048, 2048]} shadow-camera-far={200}
            shadow-camera-left={-80} shadow-camera-right={80}
            shadow-camera-top={80} shadow-camera-bottom={-80} shadow-bias={-0.0005}
          />
          <directionalLight
            position={[-30, 40, -20]}
            intensity={isNight ? 0.12 : 0.25}
            color={isNight ? "#3b82f6" : "#c8d8f0"}
          />
          <hemisphereLight
            intensity={isNight ? 0.2 : 0.5}
            color={isNight ? "#0b4c7a" : "#87ceeb"}
            groundColor={isNight ? "#06111f" : "#e0e8d0"}
          />
        </>
      )}

      <fog
        attach="fog"
        args={[
          aiMode ? "#0c1828" : isNight ? "#040a12" : "#d0dff0",
          aiMode ? 40 : isNight ? 45 : 80,
          aiMode ? 120 : isNight ? 140 : 180,
        ]}
      />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.06}
        minDistance={5}
        maxDistance={150}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.05}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
        panSpeed={0.8}
        target={[0, 0, 0]}
      />

      <CityGrid3D grid={grid} aiMode={aiMode} />

      {vehicles.filter((v) => !v.arrived).map((v) => (
        <Vehicle3D
          key={v.id}
          vehicle={v}
          isSelected={v.id === selectedVehicleId}
          onClick={() => onSelectVehicle(v.id === selectedVehicleId ? null : v.id)}
        />
      ))}

      {signals.map((s, i) => (
        <Signal3D key={i} signal={s} gridRows={rows} gridCols={cols} aiMode={aiMode} />
      ))}
    </Canvas>
  );
}
