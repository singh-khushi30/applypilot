import { RoundedBox } from "@react-three/drei";
import { ClayMaterial } from "@/components/three/ClayMaterial";
import { palette } from "@/components/three/palette";

export function Laptop() {
  return (
    <group position={[0, -0.15, 0]} rotation={[0.08, 0.28, 0]}>
      <RoundedBox args={[1.92, 0.09, 1.28]} radius={0.04} smoothness={4} position={[0, 0, 0.08]}>
        <ClayMaterial color={palette.cream} roughness={0.84} />
      </RoundedBox>
      <RoundedBox args={[1.42, 0.015, 0.62]} radius={0.008} smoothness={2} position={[0, 0.052, 0.02]}>
        <ClayMaterial color={palette.creamDeep} roughness={0.92} />
      </RoundedBox>
      <RoundedBox args={[0.46, 0.012, 0.32]} radius={0.006} smoothness={2} position={[0, 0.055, 0.42]}>
        <ClayMaterial color={palette.lavender} roughness={0.9} />
      </RoundedBox>

      <group position={[0, 0.02, -0.54]} rotation={[-0.48, 0, 0]}>
        <RoundedBox args={[1.88, 1.2, 0.07]} radius={0.045} smoothness={4} position={[0, 0.6, 0]}>
          <ClayMaterial color={palette.cream} roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[1.68, 1.02, 0.02]} radius={0.02} smoothness={3} position={[0, 0.6, 0.04]}>
          <ClayMaterial color={palette.screen} roughness={0.62} />
        </RoundedBox>
        <mesh position={[-0.42, 0.92, 0.058]}>
          <boxGeometry args={[0.62, 0.055, 0.012]} />
          <ClayMaterial color={palette.violet} roughness={0.7} />
        </mesh>
        <mesh position={[-0.28, 0.72, 0.058]}>
          <boxGeometry args={[0.78, 0.22, 0.012]} />
          <ClayMaterial color={palette.cream} roughness={0.86} />
        </mesh>
        <mesh position={[-0.34, 0.48, 0.058]}>
          <boxGeometry args={[0.5, 0.04, 0.012]} />
          <ClayMaterial color={palette.lavenderDeep} roughness={0.8} />
        </mesh>
        <mesh position={[0.48, 0.62, 0.058]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.02, 24]} />
          <ClayMaterial color={palette.blush} roughness={0.74} />
        </mesh>
      </group>
    </group>
  );
}
