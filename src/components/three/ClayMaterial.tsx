type ClayMaterialProps = {
  color: string;
  roughness?: number;
};

export function ClayMaterial({ color, roughness = 0.78 }: ClayMaterialProps) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={roughness}
      metalness={0}
      sheen={0.32}
      sheenRoughness={0.86}
      sheenColor="#fff8f2"
      clearcoat={0.04}
      clearcoatRoughness={0.92}
    />
  );
}
