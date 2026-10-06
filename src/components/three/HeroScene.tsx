"use client";

import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { FloatingCheck } from "@/components/three/FloatingCheck";
import { FloatingDocument } from "@/components/three/FloatingDocument";
import { FloatingJobCard } from "@/components/three/FloatingJobCard";
import { FloatingMail } from "@/components/three/FloatingMail";
import { FloatingSearch } from "@/components/three/FloatingSearch";
import { FloatingSpark } from "@/components/three/FloatingSpark";
import { Laptop } from "@/components/three/Laptop";
import { palette } from "@/components/three/palette";
import { PlacedFloat } from "@/components/three/PlacedFloat";
import { SceneLights } from "@/components/three/SceneLights";
import { MathUtils, type Group, type PerspectiveCamera } from "three";

function useCompactScene() {
  const [compact, setCompact] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return compact;
}

function CameraFrame({ compact }: { compact: boolean }) {
  const camera = useThree((state) => state.camera);

  useLayoutEffect(() => {
    camera.position.set(
      compact ? 0.1 : 0.25,
      compact ? 1.35 : 1.2,
      compact ? 6.4 : 6.15,
    );
    camera.lookAt(0, 0.02, 0);
    if ("updateProjectionMatrix" in camera) {
      (camera as PerspectiveCamera).updateProjectionMatrix();
    }
  }, [camera, compact]);

  return null;
}

function Parallax({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const ref = useRef<Group>(null);
  const finePointer = useRef(false);
  const reduce = useReducedMotion() === true;

  useEffect(() => {
    finePointer.current = window.matchMedia("(pointer: fine)").matches;
  }, []);

  useFrame((state) => {
    const node = ref.current;
    if (!node || !active || reduce || !finePointer.current) return;
    node.rotation.y = MathUtils.lerp(node.rotation.y, state.pointer.x * 0.16, 0.045);
    node.rotation.x = MathUtils.lerp(node.rotation.x, -state.pointer.y * 0.07, 0.045);
  });

  return <group ref={ref}>{children}</group>;
}

type HeroSceneProps = {
  active?: boolean;
};

export function HeroScene({ active = true }: HeroSceneProps) {
  const compact = useCompactScene();
  const reduce = useReducedMotion() === true;
  const playing = active && !reduce;

  return (
    <Canvas
      dpr={compact ? [1, 1.25] : [1, 1.5]}
      camera={{ position: [0.25, 1.2, 6.15], fov: 36 }}
      gl={{ antialias: true, alpha: true, stencil: false, powerPreference: "default" }}
      frameloop={playing ? "always" : "demand"}
      style={{ width: "100%", height: "100%", touchAction: "pan-y" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#000000", 0);
      }}
    >
      <CameraFrame compact={compact} />
      <SceneLights />
      <Parallax active={playing}>
        <group scale={compact ? 0.78 : 0.92}>
          <PlacedFloat position={[0, -0.05, 0]} speed={0.75} active={playing}>
            <Laptop />
          </PlacedFloat>
          <PlacedFloat
            position={compact ? [-1.15, 0.48, 0.35] : [-1.35, 0.55, 0.25]}
            rotation={[0.12, 0.4, 0.16]}
            speed={1.05}
            active={playing}
          >
            <FloatingDocument />
          </PlacedFloat>
          <PlacedFloat
            position={compact ? [1.1, 0.38, 0.25] : [1.35, 0.42, 0.1]}
            rotation={[-0.08, -0.35, -0.06]}
            speed={0.9}
            active={playing}
          >
            <FloatingJobCard />
          </PlacedFloat>
          <PlacedFloat
            position={compact ? [-1.05, -0.5, 0.55] : [-1.25, -0.38, 0.7]}
            speed={1.15}
            active={playing}
          >
            <FloatingCheck />
          </PlacedFloat>
          {compact ? null : (
            <>
              <PlacedFloat
                position={[1.15, -0.12, 0.55]}
                rotation={[0.2, -0.4, 0.15]}
                speed={1.2}
                active={playing}
              >
                <FloatingMail />
              </PlacedFloat>
              <PlacedFloat position={[0.72, 1.05, -0.15]} speed={0.85} active={playing}>
                <FloatingSearch />
              </PlacedFloat>
              <FloatingSpark position={[-0.95, 1.12, -0.15]} color={palette.blush} />
              <FloatingSpark position={[1.55, 0.95, -0.3]} scale={0.8} color={palette.lavender} />
              <FloatingSpark
                position={[-1.55, -0.05, 0.15]}
                scale={0.7}
                color={palette.powder}
                shape="sphere"
              />
              <FloatingSpark
                position={[0.1, 1.2, 0.15]}
                scale={0.55}
                color={palette.violet}
                shape="sphere"
              />
            </>
          )}
          {compact ? (
            <FloatingSpark position={[0.15, 1.0, 0.1]} scale={0.7} color={palette.blush} shape="sphere" />
          ) : null}
        </group>
      </Parallax>
      <ContactShadows
        position={[0, -1.15, 0]}
        opacity={0.28}
        scale={7}
        blur={2.4}
        far={3.4}
        resolution={256}
        frames={1}
        color="#8d7aaa"
      />
    </Canvas>
  );
}
