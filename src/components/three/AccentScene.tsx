"use client";

import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { FloatingCheck } from "@/components/three/FloatingCheck";
import { FloatingDocument } from "@/components/three/FloatingDocument";
import { palette } from "@/components/three/palette";
import { PlacedFloat } from "@/components/three/PlacedFloat";
import { SceneLights } from "@/components/three/SceneLights";
import { ClayMaterial } from "@/components/three/ClayMaterial";

export function AccentScene() {
  const reduce = useReducedMotion() === true;

  return (
    <Canvas
      dpr={[1, 1.25]}
      camera={{ position: [0.35, 0.45, 2.7], fov: 35 }}
      gl={{ antialias: true, alpha: true, stencil: false }}
      frameloop={reduce ? "demand" : "always"}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor("#000000", 0);
        camera.lookAt(0, 0, 0);
      }}
    >
      <SceneLights />
      <PlacedFloat position={[0.05, -0.05, 0]} speed={0.9} active={!reduce}>
        <FloatingCheck />
      </PlacedFloat>
      <PlacedFloat position={[-0.72, -0.12, 0.15]} rotation={[0.1, 0.4, 0.1]} speed={1.1} active={!reduce}>
        <group scale={0.62}>
          <FloatingDocument />
        </group>
      </PlacedFloat>
      <PlacedFloat position={[0.72, 0.38, -0.1]} speed={1.25} active={!reduce}>
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <ClayMaterial color={palette.blush} />
        </mesh>
      </PlacedFloat>
    </Canvas>
  );
}
