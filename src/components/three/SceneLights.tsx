export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.62} color="#fff8f3" />
      <hemisphereLight args={["#fff8f3", "#e4daf3", 0.42]} />
      <directionalLight position={[3.6, 5.4, 3.2]} intensity={1.2} color="#fffaf6" />
      <directionalLight position={[-3.4, 2.4, -1.2]} intensity={0.42} color="#ddd2f0" />
      <directionalLight position={[1.2, 0.6, 4.2]} intensity={0.28} color="#f6ddd8" />
    </>
  );
}
