"use client";

import { Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { MathUtils, type Group } from "three";

type PlacedFloatProps = {
  position: [number, number, number];
  rotation?: [number, number, number];
  speed?: number;
  active?: boolean;
  children: ReactNode;
};

export function PlacedFloat({
  position,
  rotation = [0, 0, 0],
  speed = 1,
  active = true,
  children,
}: PlacedFloatProps) {
  const reduce = useReducedMotion() === true;
  const hover = useRef<Group>(null);
  const lift = useRef(0);
  const moving = active && !reduce;

  useFrame(() => {
    const node = hover.current;
    if (!node || !moving) return;
    node.position.y = MathUtils.lerp(node.position.y, lift.current, 0.08);
  });

  return (
    <group position={position} rotation={rotation}>
      <Float
        enabled={moving}
        speed={speed}
        rotationIntensity={0.7}
        floatIntensity={0.85}
        floatingRange={[-0.06, 0.08]}
        autoInvalidate={false}
      >
        <group
          ref={hover}
          onPointerOver={(event) => {
            event.stopPropagation();
            if (moving) lift.current = 0.12;
          }}
          onPointerOut={() => {
            lift.current = 0;
          }}
        >
          {children}
        </group>
      </Float>
    </group>
  );
}
