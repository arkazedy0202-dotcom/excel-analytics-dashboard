"use client";

import { Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

const BAR_DATA = [
  { height: 0.62, x: -1.62 },
  { height: 1.02, x: -0.8 },
  { height: 1.46, x: 0.02 },
  { height: 1.92, x: 0.84 },
  { height: 2.36, x: 1.66 },
];

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const updatePreference = () => {
      setReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return reducedMotion;
}

function SignalBars({ reducedMotion }) {
  const barRefs = useRef([]);
  const markerRefs = useRef([]);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;

    BAR_DATA.forEach((bar, index) => {
      const rise = reducedMotion
        ? 1
        : Math.min(
            1,
            Math.max(0, (elapsed - 0.45 - index * 0.17) / 0.85)
          );
      const easedRise = 1 - (1 - rise) ** 3;
      const floatOffset = reducedMotion
        ? 0
        : Math.sin(elapsed * 0.78 + index * 0.8) * 0.035;
      const mesh = barRefs.current[index];
      const marker = markerRefs.current[index];

      if (mesh) {
        mesh.scale.y = Math.max(easedRise, 0.02);
        mesh.position.y =
          -1.46 + (bar.height * easedRise) / 2 + floatOffset;
      }

      if (marker) {
        marker.position.y =
          -1.46 + bar.height * easedRise + floatOffset;
        marker.scale.setScalar(Math.max(easedRise, 0.02));
      }
    });
  });

  return (
    <group position={[0, -0.18, 0.35]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.47, -0.03]}>
        <planeGeometry args={[4.9, 1.45]} />
        <meshBasicMaterial
          color="#164542"
          transparent
          opacity={0.14}
        />
      </mesh>

      {BAR_DATA.map((bar, index) => (
        <group key={bar.x}>
          <mesh
            ref={(node) => {
              barRefs.current[index] = node;
            }}
            position={[bar.x, -1.46, 0]}
          >
            <boxGeometry args={[0.43, bar.height, 0.43]} />
            <meshStandardMaterial
              color="#55d9cb"
              emissive="#0f5c57"
              emissiveIntensity={0.3}
              metalness={0.48}
              roughness={0.42}
            />
          </mesh>

          <mesh
            ref={(node) => {
              markerRefs.current[index] = node;
            }}
            position={[bar.x, -1.46, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.075, 0.118, 24]} />
            <meshBasicMaterial
              color="#a1fff4"
              transparent
              opacity={0.92}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function DataObject({ reducedMotion }) {
  const groupRef = useRef(null);
  const orbitRef = useRef(null);
  const primaryWireRef = useRef(null);
  const secondaryWireRef = useRef(null);

  useFrame((state, delta) => {
    if (reducedMotion) return;

    const elapsed = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
      groupRef.current.rotation.x =
        Math.sin(elapsed * 0.28) * 0.055;
      groupRef.current.position.y =
        Math.sin(elapsed * 0.5) * 0.08;
    }

    if (orbitRef.current) {
      orbitRef.current.rotation.z += delta * 0.045;
    }

    if (primaryWireRef.current) {
      primaryWireRef.current.material.opacity =
        0.74 + Math.sin(elapsed * 1.1) * 0.1;
    }

    if (secondaryWireRef.current) {
      secondaryWireRef.current.rotation.y -= delta * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.75, -0.42]}>
      <mesh ref={primaryWireRef}>
        <icosahedronGeometry args={[1.28, 2]} />
        <meshBasicMaterial
          color="#78eee1"
          transparent
          opacity={0.76}
          wireframe
        />
      </mesh>

      <mesh ref={secondaryWireRef} scale={0.94}>
        <icosahedronGeometry args={[1.28, 1]} />
        <meshBasicMaterial
          color="#2e9a91"
          transparent
          opacity={0.24}
          wireframe
        />
      </mesh>

      <mesh ref={orbitRef} rotation={[1.13, 0.32, 0.26]}>
        <torusGeometry args={[1.53, 0.009, 8, 80]} />
        <meshBasicMaterial
          color="#74e8dc"
          transparent
          opacity={0.52}
        />
      </mesh>

      <mesh scale={0.19}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial
          color="#a1fff4"
          transparent
          opacity={0.52}
        />
      </mesh>
    </group>
  );
}

function SceneContent({ reducedMotion }) {
  return (
    <>
      <ambientLight intensity={0.48} />
      <directionalLight
        position={[3.5, 4.8, 4]}
        intensity={1.25}
        color="#dffcf7"
      />
      <pointLight
        position={[-3.6, 1.1, 2.4]}
        intensity={7}
        distance={8}
        color="#46cfc2"
      />
      <pointLight
        position={[2.8, -1.8, 1.8]}
        intensity={2.2}
        distance={7}
        color="#1b615c"
      />

      <Sparkles
        count={54}
        scale={[6.7, 5.4, 3.1]}
        size={1.25}
        speed={reducedMotion ? 0 : 0.13}
        color="#9bf5eb"
      />

      <DataObject reducedMotion={reducedMotion} />
      <SignalBars reducedMotion={reducedMotion} />
    </>
  );
}

export default function DataScene() {
  const reducedMotion = useReducedMotion();

  return (
    <Canvas
      camera={{
        position: [0, 0.18, 6.9],
        fov: 43,
      }}
      dpr={[1, 1.6]}
      frameloop={reducedMotion ? "demand" : "always"}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      }}
    >
      <SceneContent reducedMotion={reducedMotion} />
    </Canvas>
  );
}
