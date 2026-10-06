import { ClayMaterial } from "@/components/three/ClayMaterial";
import { palette } from "@/components/three/palette";

export function FloatingSearch() {
  return (
    <group rotation={[0.2, 0.4, 0.35]}>
      <mesh>
        <torusGeometry args={[0.24, 0.045, 12, 28]} />
        <ClayMaterial color={palette.violet} roughness={0.62} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.19, 24]} />
        <meshStandardMaterial color={palette.powder} roughness={0.55} />
      </mesh>
      <mesh position={[0.24, -0.24, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.038, 0.038, 0.28, 12]} />
        <ClayMaterial color={palette.violetDeep} roughness={0.7} />
      </mesh>
    </group>
  );
}
