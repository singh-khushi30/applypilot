import { ClayMaterial } from "@/components/three/ClayMaterial";
import { palette } from "@/components/three/palette";

export function FloatingCheck() {
  return (
    <group rotation={[0.55, 0.35, 0.1]}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.08, 28]} />
        <ClayMaterial color={palette.lavender} roughness={0.8} />
      </mesh>
      <mesh position={[-0.06, 0.05, 0.04]} rotation={[0, 0.55, 0]}>
        <boxGeometry args={[0.07, 0.03, 0.16]} />
        <ClayMaterial color={palette.violetDeep} roughness={0.66} />
      </mesh>
      <mesh position={[0.08, 0.05, -0.02]} rotation={[0, -0.85, 0]}>
        <boxGeometry args={[0.07, 0.03, 0.24]} />
        <ClayMaterial color={palette.violetDeep} roughness={0.66} />
      </mesh>
    </group>
  );
}
