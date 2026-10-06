import { RoundedBox } from "@react-three/drei";
import { ClayMaterial } from "@/components/three/ClayMaterial";
import { palette } from "@/components/three/palette";

export function FloatingJobCard() {
  return (
    <group>
      <RoundedBox args={[0.86, 0.58, 0.05]} radius={0.02} smoothness={3}>
        <ClayMaterial color={palette.powder} roughness={0.84} />
      </RoundedBox>
      <mesh position={[-0.16, 0.14, 0.032]}>
        <boxGeometry args={[0.36, 0.06, 0.012]} />
        <ClayMaterial color={palette.violet} roughness={0.72} />
      </mesh>
      <mesh position={[-0.08, -0.02, 0.032]}>
        <boxGeometry args={[0.48, 0.035, 0.012]} />
        <ClayMaterial color="#f7f4fb" roughness={0.9} />
      </mesh>
      <mesh position={[-0.14, -0.12, 0.032]}>
        <boxGeometry args={[0.32, 0.035, 0.012]} />
        <ClayMaterial color="#f7f4fb" roughness={0.9} />
      </mesh>
    </group>
  );
}
