import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vehicle } from '@/lib/trafficEngine';
import * as THREE from 'three';

interface Vehicle3DProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onClick: () => void;
}

export default function Vehicle3D({ vehicle, isSelected, onClick }: Vehicle3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(vehicle.worldPos.x, 0.25, vehicle.worldPos.z));
  const currentAngle = useRef(0);

  useFrame(() => {
    if (!groupRef.current) return;
    targetPos.current.set(vehicle.worldPos.x, 0.25, vehicle.worldPos.z);
    groupRef.current.position.lerp(targetPos.current, 0.12);

    // Smooth rotation
    if (!vehicle.waiting && vehicle.pathIndex < vehicle.path.length - 1) {
      const nextPos = vehicle.path[Math.min(vehicle.pathIndex + 1, vehicle.path.length - 1)];
      const curPos = vehicle.path[vehicle.pathIndex];
      const dx = nextPos.col - curPos.col;
      const dz = nextPos.row - curPos.row;
      if (dx !== 0 || dz !== 0) {
        const targetAngle = Math.atan2(dx, dz);
        currentAngle.current = THREE.MathUtils.lerp(currentAngle.current, targetAngle, 0.08);
        groupRef.current.rotation.y = currentAngle.current;
      }
    }
  });

  const isAmbulance = vehicle.type === 'ambulance';

  return (
    <group
      ref={groupRef}
      position={[vehicle.worldPos.x, 0.25, vehicle.worldPos.z]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* Car body */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[isAmbulance ? 0.7 : 0.6, 0.3, isAmbulance ? 1.3 : 1.0]} />
        <meshStandardMaterial
          color={vehicle.color}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Car cabin / top */}
      <mesh castShadow position={[0, 0.2, isAmbulance ? -0.05 : -0.05]}>
        <boxGeometry args={[isAmbulance ? 0.55 : 0.45, 0.2, isAmbulance ? 0.7 : 0.55]} />
        <meshStandardMaterial
          color={isAmbulance ? '#ffffff' : '#a8c8e8'}
          metalness={0.2}
          roughness={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Wheels */}
      {[[-0.32, -0.12, 0.3], [0.32, -0.12, 0.3], [-0.32, -0.12, -0.3], [0.32, -0.12, -0.3]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 8]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      ))}

      {/* Ambulance siren light */}
      {isAmbulance && (
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.2, 0.08, 0.12]} />
          <meshStandardMaterial
            color="#ff0000"
            emissive="#ff0000"
            emissiveIntensity={1.5}
          />
        </mesh>
      )}

      {/* Headlights */}
      <mesh position={[0.18, 0.0, 0.5]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffcc" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.18, 0.0, 0.5]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffcc" emissiveIntensity={0.8} />
      </mesh>

      {/* Tail lights */}
      <mesh position={[0.18, 0.0, -0.5]}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.18, 0.0, -0.5]}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.5} />
      </mesh>

      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.85, 32]} />
          <meshBasicMaterial color="#3B82F6" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Shadow on road */}
      <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 1.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
