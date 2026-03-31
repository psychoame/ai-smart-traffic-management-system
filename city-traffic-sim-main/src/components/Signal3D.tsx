import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TrafficSignal, cellToWorld } from '@/lib/trafficEngine';
import * as THREE from 'three';

interface Signal3DProps {
  signal: TrafficSignal;
  gridRows: number;
  gridCols: number;
  aiMode: boolean;
}

const COLORS = {
  red: '#ff2222',
  yellow: '#ffcc00',
  green: '#00dd44',
};

export default function Signal3D({ signal, gridRows, gridCols, aiMode }: Signal3DProps) {
  const glowRef = useRef<THREE.PointLight>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const world = cellToWorld(signal.position, gridRows, gridCols);

  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.color.set(COLORS[signal.state]);
      // Pulse effect
      const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      glowRef.current.intensity = signal.state === 'red' ? 2 * pulse : signal.state === 'green' ? 1.5 : 1;
    }
    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.color.set(COLORS[signal.state]);
      mat.opacity = 0.25 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
    }
  });

  const activeColor = COLORS[signal.state];

  return (
    <group position={[world.x + 0.85, 0, world.z + 0.85]}>
      {/* Pole — thicker, taller */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 3.6, 8]} />
        <meshStandardMaterial color="#444c58" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Base plate */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 8]} />
        <meshStandardMaterial color="#555" metalness={0.5} />
      </mesh>

      {/* Signal housing — bigger */}
      <mesh position={[0, 3.4, 0]}>
        <boxGeometry args={[0.45, 1.2, 0.35]} />
        <meshStandardMaterial color="#1a1f28" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Red light */}
      <mesh position={[0, 3.75, 0.18]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial
          color={signal.state === 'red' ? '#ff2222' : '#4a1515'}
          emissive={signal.state === 'red' ? '#ff2222' : '#000'}
          emissiveIntensity={signal.state === 'red' ? 2 : 0}
        />
      </mesh>

      {/* Yellow light */}
      <mesh position={[0, 3.4, 0.18]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial
          color={signal.state === 'yellow' ? '#ffcc00' : '#4a3a10'}
          emissive={signal.state === 'yellow' ? '#ffcc00' : '#000'}
          emissiveIntensity={signal.state === 'yellow' ? 2 : 0}
        />
      </mesh>

      {/* Green light */}
      <mesh position={[0, 3.05, 0.18]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial
          color={signal.state === 'green' ? '#00dd44' : '#103318'}
          emissive={signal.state === 'green' ? '#00dd44' : '#000'}
          emissiveIntensity={signal.state === 'green' ? 2 : 0}
        />
      </mesh>

      {/* Ground halo — big glowing circle on road surface */}
      <mesh ref={haloRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial color={activeColor} transparent opacity={0.3} />
      </mesh>

      {/* Bright glow light — illuminates the road */}
      <pointLight
        ref={glowRef}
        position={[0, 3.4, 0.5]}
        intensity={1.5}
        distance={8}
        color={activeColor}
      />

      {/* AI mode: extra scanning ring effect */}
      {aiMode && (
        <group>
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 2.0, 32]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.25} />
          </mesh>
          <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.2, 2.35, 32]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.12} />
          </mesh>
          {/* AI vehicle count indicator — vertical beam */}
          {signal.nearbyVehicleCount > 2 && (
            <pointLight
              position={[0, 5, 0]}
              intensity={0.5}
              distance={6}
              color="#00e5ff"
            />
          )}
        </group>
      )}
    </group>
  );
}
