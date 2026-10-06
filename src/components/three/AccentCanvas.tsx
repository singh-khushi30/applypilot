"use client";

import { useInView } from "motion/react";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { SceneErrorBoundary } from "@/components/three/SceneErrorBoundary";

const AccentScene = dynamic(
  () => import("@/components/three/AccentScene").then((mod) => mod.AccentScene),
  { ssr: false },
);

export function AccentCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "160px" });

  return (
    <div
      ref={ref}
      className="relative mx-auto h-40 w-40 shrink-0 sm:h-44 sm:w-44"
      aria-hidden="true"
    >
      {visible ? (
        <SceneErrorBoundary fallback={null}>
          <AccentScene />
        </SceneErrorBoundary>
      ) : null}
    </div>
  );
}
