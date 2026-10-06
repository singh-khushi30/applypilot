import { RoundedBox } from "@react-three/drei";
import { ClayMaterial } from "@/components/three/ClayMaterial";
import { palette } from "@/components/three/palette";

const lines = [
  { y: 0.24, width: 0.28, color: palette.violet },
  { y: 0.1, width: 0.42, color: palette.lavenderDeep },
  { y: -0.02, width: 0.38, color: palette.lavenderDeep },
  { y: -0.16, width: 0.3, color: palette.powderDeep },
] as const;

export function FloatingDocument() {
  return (
    <group>
      <RoundedBox args={[0.68, 0.88, 0.045]} radius={0.018} smoothness={3}>
        <ClayMaterial color={palette.cream} roughness={0.88} />
      </RoundedBox>
      {lines.map((line) => (
        <mesh key={line.y} position={[-0.04, line.y, 0.03]}>
          <boxGeometry args={[line.width, 0.035, 0.012]} />
          <ClayMaterial color={line.color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
