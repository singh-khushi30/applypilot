import { RoundedBox } from "@react-three/drei";
import { ClayMaterial } from "@/components/three/ClayMaterial";
import { palette } from "@/components/three/palette";

export function FloatingMail() {
  return (
    <group>
      <RoundedBox args={[0.78, 0.5, 0.06]} radius={0.03} smoothness={3}>
        <ClayMaterial color={palette.blush} roughness={0.82} />
      </RoundedBox>
      <mesh position={[0, 0.08, 0.04]} rotation={[0.55, 0, 0]}>
        <boxGeometry args={[0.68, 0.02, 0.32]} />
        <ClayMaterial color={palette.blushDeep} roughness={0.78} />
      </mesh>
      <mesh position={[0, -0.02, 0.04]}>
        <boxGeometry args={[0.42, 0.02, 0.28]} />
        <ClayMaterial color="#f8e4df" roughness={0.86} />
      </mesh>
    </group>
  );
}
