"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type RefObject } from "react";
import { SceneErrorBoundary } from "@/components/three/SceneErrorBoundary";
import { SceneFallback } from "@/components/three/SceneFallback";

const HeroScene = dynamic(
  () => import("@/components/three/HeroScene").then((mod) => mod.HeroScene),
  {
    ssr: false,
    loading: () => <SceneFallback />,
  },
);

function useIsVisible(ref: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return visible;
}

export function HeroCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIsVisible(ref);

  return (
    <div ref={ref} className="absolute inset-0" aria-hidden="true">
      <SceneErrorBoundary fallback={<SceneFallback notice />}>
        <HeroScene active={visible} />
      </SceneErrorBoundary>
    </div>
  );
}
