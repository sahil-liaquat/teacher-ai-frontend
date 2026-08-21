"use client";

/**
 * The hero's WebGL depth layer.
 *
 * A small three.js scene that lives *behind* the composition: soft physical
 * objects drawn from the page's own vocabulary — curriculum cards, a textbook
 * block, the improvement loop, a faceted core — floating in the margins around
 * the headline and the connected-system diagram, lit by a procedural
 * environment and drifting on a very slow clock.
 *
 * Deliberate constraints, because this is a marketing page a principal will
 * open on whatever device is to hand:
 *
 *   · **Nothing here carries information.** Every label, every number and every
 *     connector stays in the DOM. If WebGL never loads, the page is complete.
 *   · **It is opt-in.** The module is dynamically imported and only mounted on
 *     a pointer-capable desktop viewport, with motion allowed and a working
 *     WebGL context — see `useHeroDepthEnabled` in `atmosphere.tsx`, which is
 *     what decides whether this module is ever fetched.
 *   · **It stops when it is not being looked at.** The frame loop is gated on
 *     an IntersectionObserver and on page visibility, so scrolling past the
 *     hero costs nothing.
 *   · **No env-map asset, no textures, no models.** The environment and the
 *     particle sprite are generated on a canvas at runtime, so the whole scene
 *     adds no network requests at all.
 *
 * Raw three rather than a React renderer: it is one self-contained scene with
 * no React state, and going direct keeps the payload to the library itself.
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ─── Geometry helpers ────────────────────────────────────────────────

/** A rounded rectangle, for the card and book shapes. */
function roundedRectShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;

  shape.moveTo(-w + radius, -h);
  shape.lineTo(w - radius, -h);
  shape.quadraticCurveTo(w, -h, w, -h + radius);
  shape.lineTo(w, h - radius);
  shape.quadraticCurveTo(w, h, w - radius, h);
  shape.lineTo(-w + radius, h);
  shape.quadraticCurveTo(-w, h, -w, h - radius);
  shape.lineTo(-w, -h + radius);
  shape.quadraticCurveTo(-w, -h, -w + radius, -h);

  return shape;
}

/** An extruded, bevelled rounded rectangle — the "card" primitive. */
function cardGeometry(width: number, height: number, depth: number, radius = 0.14) {
  const geometry = new THREE.ExtrudeGeometry(roundedRectShape(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 4,
    curveSegments: 14,
  });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

// ─── Runtime-generated assets ────────────────────────────────────────

/**
 * A tiny equirectangular gradient used as `scene.environment`.
 *
 * Physical materials need something to reflect or they read as flat plastic.
 * A 256×128 canvas gradient is enough for the soft sheen these shapes want, and
 * it costs no request and no HDR decode.
 */
function makeEnvironment(variant: Variant) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const sky = ctx.createLinearGradient(0, 0, 0, 128);
  if (variant === "dark") {
    sky.addColorStop(0, "#2a3f6d");
    sky.addColorStop(0.45, "#152442");
    sky.addColorStop(1, "#080f1e");
  } else {
    sky.addColorStop(0, "#ffffff");
    sky.addColorStop(0.45, "#e8f1ff");
    sky.addColorStop(1, "#c9d9f4");
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 256, 128);

  // A single soft key, up and to the left, so highlights all agree.
  const key = ctx.createRadialGradient(74, 24, 0, 74, 24, 66);
  key.addColorStop(0, variant === "dark" ? "rgba(150,190,255,0.9)" : "rgba(255,255,255,1)");
  key.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, 256, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A soft round dot for the dust particles. */
function makeDotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const dot = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  dot.addColorStop(0, "rgba(255,255,255,1)");
  dot.addColorStop(0.35, "rgba(255,255,255,0.65)");
  dot.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = dot;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─── The scene ───────────────────────────────────────────────────────

export type Variant = "light" | "dark";

/**
 * The two palettes. Geometry, layout and motion are shared; only the light and
 * the surfaces change, because the composition works for the same reason in
 * both places — objects in the margins, content in the middle.
 */
const PALETTE: Record<
  Variant,
  {
    exposure: number;
    hemisphere: [number, number, number];
    key: number;
    points: [number, number][];
    card: number;
    cardTint: number;
    block: number;
    loop: number;
    coreMetalness: number;
    coreColor: number;
    bead: [number, number];
    opacity: number;
    dust: { color: number; opacity: number };
  }
> = {
  light: {
    exposure: 1.34,
    hemisphere: [0xffffff, 0xd8e4fb, 1.15],
    key: 2.15,
    points: [
      [0x0165fd, 26],
      [0x7c5cff, 20],
    ],
    card: 0xfdfeff,
    cardTint: 0xd5e4ff,
    block: 0xa9c6ff,
    loop: 0xc3b6ff,
    coreMetalness: 0.3,
    coreColor: 0xffffff,
    bead: [0x9fe3c9, 0xa9c6ff],
    opacity: 0.92,
    dust: { color: 0x0165fd, opacity: 0.3 },
  },
  dark: {
    exposure: 1.1,
    hemisphere: [0x9ec0ff, 0x0a1224, 0.5],
    key: 1.2,
    points: [
      [0x2f7dff, 58],
      [0x7c5cff, 44],
    ],
    card: 0x1e2f52,
    cardTint: 0x17253f,
    block: 0x24457f,
    loop: 0x6f5cff,
    coreMetalness: 0.85,
    coreColor: 0xbcd4ff,
    bead: [0x3ad6a6, 0x5b9bff],
    opacity: 0.9,
    dust: { color: 0xbcd4ff, opacity: 0.45 },
  },
};

type FloatingObject = {
  mesh: THREE.Mesh;
  /** Where it lives before any drift is applied. */
  home: THREE.Vector3;
  spin: THREE.Vector3;
  bobAmplitude: number;
  bobSpeed: number;
  phase: number;
  /** 0 → unaffected by the pointer, 1 → moves the most. Sells the depth. */
  depth: number;
};

export default function HeroDepth({ variant = "light" }: { variant?: Variant }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const palette = PALETTE[variant];

    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    // Capping the pixel ratio matters more than any other single setting here:
    // this scene is nearly all fragment work, so a retina display would
    // otherwise quadruple the cost for a backdrop nobody is staring at.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = palette.exposure;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const environment = makeEnvironment(variant);
    if (environment) scene.environment = environment;

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

    /**
     * Frame a constant world width whatever the viewport shape.
     *
     * The DOM diagram occupies roughly the middle ±3.8 units, so the objects
     * live outside that at |x| ≥ 4.2. A fixed camera distance would push them
     * off-screen the moment the hero is taller than it is wide — which it is on
     * most laptops — so the camera backs off until `FRAME_WIDTH` units are
     * visible instead, which also fixes how large they read at any width.
     */
    const FRAME_WIDTH = 12;
    const fitCamera = () => {
      const width = host.clientWidth;
      const height = Math.max(host.clientHeight, 1);
      const aspect = width / height;
      camera.aspect = aspect;
      camera.position.z =
        FRAME_WIDTH / (2 * aspect * Math.tan((camera.fov * Math.PI) / 360));
      camera.updateProjectionMatrix();
    };
    fitCamera();

    // ── Light ──
    scene.add(new THREE.HemisphereLight(...palette.hemisphere));

    const key = new THREE.DirectionalLight(0xffffff, palette.key);
    key.position.set(-4, 5, 6);
    scene.add(key);

    const brandFill = new THREE.PointLight(palette.points[0][0], palette.points[0][1], 22, 2);
    brandFill.position.set(4.5, -1.6, 3.4);
    scene.add(brandFill);

    const violetRim = new THREE.PointLight(palette.points[1][0], palette.points[1][1], 22, 2);
    violetRim.position.set(-5, 2.4, -1.6);
    scene.add(violetRim);

    // ── Objects ──
    // They sit out in the margins, clear of the DOM diagram in the middle: this
    // layer is atmosphere around the composition, never on top of it.
    const group = new THREE.Group();
    scene.add(group);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    // Pale, high-roughness tints on purpose. These shapes sit *behind* the
    // headline and the diagram, so anything saturated enough to be noticed on
    // its own is already too loud for the job.
    const paper = (color: number, roughness = 0.42) =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness,
        metalness: 0.02,
        clearcoat: 0.85,
        clearcoatRoughness: 0.28,
        reflectivity: 0.35,
        envMapIntensity: 1.15,
        transparent: true,
        opacity: palette.opacity,
      });

    const specs: {
      geometry: THREE.BufferGeometry;
      material: THREE.Material;
      position: [number, number, number];
      rotation: [number, number, number];
      scale?: number;
      depth: number;
    }[] = [];

    // Curriculum cards — the recurring object of the whole page.
    const cardBig = cardGeometry(1.5, 1.95, 0.16);
    const cardSmall = cardGeometry(1.1, 1.4, 0.13);
    const bookBlock = cardGeometry(1.25, 1.6, 0.44, 0.1);
    geometries.push(cardBig, cardSmall, bookBlock);

    specs.push(
      {
        geometry: cardBig,
        material: paper(palette.card, 0.34),
        position: [-4.85, 2.15, -0.4],
        rotation: [0.28, 0.5, -0.16],
        scale: 0.82,
        depth: 0.85,
      },
      {
        geometry: cardSmall,
        material: paper(palette.cardTint, 0.4),
        position: [-4.45, -2.35, 0.7],
        rotation: [-0.24, -0.42, 0.3],
        scale: 0.9,
        depth: 1,
      },
      {
        geometry: bookBlock,
        material: paper(palette.block, 0.46),
        position: [4.95, 2.45, -0.7],
        rotation: [0.34, -0.55, 0.22],
        scale: 0.85,
        depth: 0.8,
      },
      {
        geometry: cardSmall,
        material: paper(palette.card, 0.34),
        position: [4.6, -2.25, 0.55],
        rotation: [-0.3, 0.46, -0.24],
        scale: 0.9,
        depth: 1,
      }
    );

    // The improvement loop, and a faceted core echoing the diagram's centre.
    const loop = new THREE.TorusGeometry(0.62, 0.16, 20, 72);
    const core = new THREE.IcosahedronGeometry(0.56, 0);
    const bead = new THREE.SphereGeometry(0.2, 28, 20);
    geometries.push(loop, core, bead);

    specs.push(
      {
        geometry: loop,
        material: paper(palette.loop, 0.4),
        position: [-4.3, -0.15, 1.5],
        rotation: [0.9, 0.2, 0],
        scale: 0.8,
        depth: 1.25,
      },
      {
        geometry: core,
        material: new THREE.MeshPhysicalMaterial({
          color: palette.coreColor,
          roughness: 0.16,
          metalness: palette.coreMetalness,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
          envMapIntensity: 1.2,
          transparent: true,
          opacity: palette.opacity,
        }),
        position: [4.35, 0.3, 1.35],
        rotation: [0.3, 0.4, 0.1],
        scale: 0.85,
        depth: 1.25,
      },
      {
        geometry: bead,
        material: paper(palette.bead[0], 0.34),
        position: [-5.45, 3.25, 0.9],
        rotation: [0, 0, 0],
        depth: 1.1,
      },
      {
        geometry: bead,
        material: paper(palette.bead[1], 0.34),
        position: [5.3, -3.55, 1.1],
        rotation: [0, 0, 0],
        scale: 0.78,
        depth: 1.15,
      }
    );

    const objects: FloatingObject[] = specs.map((spec, index) => {
      const mesh = new THREE.Mesh(spec.geometry, spec.material);
      mesh.position.set(...spec.position);
      mesh.rotation.set(...spec.rotation);
      if (spec.scale) mesh.scale.setScalar(spec.scale);
      materials.push(spec.material);
      group.add(mesh);

      return {
        mesh,
        home: mesh.position.clone(),
        spin: new THREE.Vector3(
          (index % 2 === 0 ? 1 : -1) * 0.021,
          0.028 + (index % 3) * 0.008,
          (index % 3 === 0 ? 1 : -1) * 0.014
        ),
        bobAmplitude: 0.1 + (index % 4) * 0.035,
        bobSpeed: 0.28 + (index % 5) * 0.055,
        phase: index * 1.27,
        depth: spec.depth,
      };
    });

    // ── Dust ──
    const dotTexture = makeDotTexture();
    const dustCount = 150;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 17;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 11;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      size: 0.06,
      map: dotTexture ?? undefined,
      color: palette.dust.color,
      transparent: true,
      opacity: palette.dust.opacity,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.NormalBlending,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);
    geometries.push(dustGeometry);
    materials.push(dustMaterial);

    // ── Motion ──
    const pointer = new THREE.Vector2(0, 0);
    const smoothed = new THREE.Vector2(0, 0);
    let scrollLift = 0;
    let smoothedLift = 0;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * 2 - 1
      );
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const onScroll = () => {
      const bounds = host.getBoundingClientRect();
      // 0 while the hero fills the viewport, 1 once it has fully left.
      scrollLift = Math.min(Math.max(-bounds.top / Math.max(bounds.height, 1), 0), 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // ── Frame loop ──
    // Only runs while the hero is actually on screen and the tab is in front.
    let frame = 0;
    let onScreen = true;
    const clock = new THREE.Clock();

    const render = () => {
      frame = requestAnimationFrame(render);
      const elapsed = clock.getElapsedTime();

      smoothed.lerp(pointer, 0.045);
      smoothedLift += (scrollLift - smoothedLift) * 0.08;

      group.rotation.y = smoothed.x * 0.16;
      group.rotation.x = smoothed.y * 0.1;
      group.position.y = smoothedLift * 1.3;
      group.position.z = smoothedLift * -1.6;

      for (const object of objects) {
        const { mesh, home, spin, bobAmplitude, bobSpeed, phase, depth } = object;
        mesh.position.set(
          home.x - smoothed.x * 0.34 * depth,
          home.y + Math.sin(elapsed * bobSpeed + phase) * bobAmplitude - smoothed.y * 0.2 * depth,
          home.z
        );
        mesh.rotation.x += spin.x * 0.01;
        mesh.rotation.y += spin.y * 0.01;
        mesh.rotation.z += spin.z * 0.01;
      }

      dust.rotation.y = elapsed * 0.012 + smoothed.x * 0.06;
      dust.position.y = Math.sin(elapsed * 0.14) * 0.13;

      renderer.render(scene, camera);
    };

    const start = () => {
      if (frame) return;
      clock.getDelta();
      frame = requestAnimationFrame(render);
    };
    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && !document.hidden) start();
        else stop();
      },
      { threshold: 0 }
    );
    observer.observe(host);

    const onVisibility = () => {
      if (document.hidden || !onScreen) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const resizeObserver = new ResizeObserver(() => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      fitCamera();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(host);

    start();

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);

      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      environment?.dispose();
      dotTexture?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [variant]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] [&>canvas]:!h-full [&>canvas]:!w-full"
    />
  );
}
