import { ClayMaterial } from "@/components/three/ClayMaterial";

type SparkProps = {
  position: [number, number, number];
  scale?: number;
  color: string;
  shape?: "star" | "sphere";
};

export function FloatingSpark({
  position,
  scale = 1,
  color,
  shape = "star",
}: SparkProps) {
  return (
    <mesh position={position} scale={scale}>
      {shape === "star" ? (
        <octahedronGeometry args={[0.09, 0]} />
      ) : (
        <sphereGeometry args={[0.08, 16, 16]} />
      )}
      <ClayMaterial color={color} roughness={0.58} />
    </mesh>
  );
}
