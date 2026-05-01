"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import ShareButton from "@/components/ui/ShareButton";

interface Category {
  weight: number;
  color: [number, number, number];
  angle: number;
  label: string;
}

interface PortraitCardProps {
  categories: Category[];
  heatmap: number[][];
  totalDataPoints: number;
}

export default function PortraitCard({ categories, heatmap, totalDataPoints }: PortraitCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;

    const w = frame.clientWidth || window.innerWidth;
    const h = frame.clientHeight || window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.z = 22;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Seeded random
    let rng = totalDataPoints;
    function rand() { rng = (rng * 16807 + 0) % 2147483647; return rng / 2147483647; }

    const group = new THREE.Group();

    // Hour totals for time ring
    const hourTotals = new Array(24).fill(0);
    for (let hr = 0; hr < 24; hr++) {
      for (let d = 0; d < 7; d++) hourTotals[hr] += heatmap[d][hr];
    }
    const maxHour = Math.max(...hourTotals);

    // Layer 1: Category nebulae
    categories.forEach(cat => {
      const count = Math.max(80, Math.floor(cat.weight * 5000));
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const spread = 0.3 + cat.weight * 2.5;
        const baseAngle = cat.angle + (rand() - 0.5) * spread;
        const rBase = 1.5 + rand() * (2.5 + cat.weight * 9);
        const gaussR = rBase * (0.3 + 0.7 * Math.exp(-0.5 * Math.pow((rand() - 0.5) * 3, 2)));
        const y = (rand() - 0.5) * (1.5 + cat.weight * 5);
        pos[i*3] = Math.cos(baseAngle) * gaussR + (rand() - 0.5) * 1.2;
        pos[i*3+1] = y;
        pos[i*3+2] = Math.sin(baseAngle) * gaussR + (rand() - 0.5) * 1.2;
        const v = 0.18;
        col[i*3]   = Math.min(1, Math.max(0, cat.color[0] + (rand()-0.5)*v));
        col[i*3+1] = Math.min(1, Math.max(0, cat.color[1] + (rand()-0.5)*v));
        col[i*3+2] = Math.min(1, Math.max(0, cat.color[2] + (rand()-0.5)*v));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const mat = new THREE.PointsMaterial({
        size: cat.weight > 0.3 ? 0.06 : (cat.weight > 0.05 ? 0.10 : 0.14),
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      group.add(new THREE.Points(geo, mat));
    });

    // Layer 2: Time ring
    const ringCount = 600;
    const ringPos = new Float32Array(ringCount * 3);
    const ringCol = new Float32Array(ringCount * 3);
    let rIdx = 0;
    for (let hr = 0; hr < 24 && rIdx < ringCount; hr++) {
      const density = hourTotals[hr] / maxHour;
      const numForHour = Math.max(2, Math.floor(density * 50));
      for (let j = 0; j < numForHour && rIdx < ringCount; j++) {
        const angle = ((hr + rand()) / 24) * Math.PI * 2;
        const r = 9.5 + (rand() - 0.5) * (0.6 + density * 1.5);
        ringPos[rIdx*3] = Math.cos(angle) * r;
        ringPos[rIdx*3+1] = (rand() - 0.5) * 0.6;
        ringPos[rIdx*3+2] = Math.sin(angle) * r;
        const bright = 0.3 + density * 0.7;
        ringCol[rIdx*3]   = density * 0.4 * bright;
        ringCol[rIdx*3+1] = (0.6 + density * 0.4) * bright;
        ringCol[rIdx*3+2] = 1.0 * bright;
        rIdx++;
      }
    }
    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute("position", new THREE.BufferAttribute(ringPos.slice(0, rIdx*3), 3));
    ringGeo.setAttribute("color", new THREE.BufferAttribute(ringCol.slice(0, rIdx*3), 3));
    group.add(new THREE.Points(ringGeo, new THREE.PointsMaterial({
      size: 0.08, vertexColors: true, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })));

    // Layer 3: Accent stars
    categories.forEach(cat => {
      const starGeo = new THREE.SphereGeometry(0.3 + cat.weight * 0.4, 16, 16);
      const starMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(cat.color[0], cat.color[1], cat.color[2]),
        transparent: true, opacity: 0.3,
      });
      const mesh = new THREE.Mesh(starGeo, starMat);
      const r = 3 + cat.weight * 5;
      mesh.position.set(Math.cos(cat.angle) * r, (rand() - 0.5) * 2, Math.sin(cat.angle) * r);
      group.add(mesh);
      // Halo
      const haloGeo = new THREE.SphereGeometry((0.3 + cat.weight * 0.4) * 2.5, 8, 8);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(cat.color[0], cat.color[1], cat.color[2]),
        transparent: true, opacity: 0.06,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(mesh.position);
      group.add(halo);
    });

    // Layer 4: Core
    const coreGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff00aa, transparent: true, opacity: 0.15 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);
    const glowGeo = new THREE.SphereGeometry(2.0, 32, 32);
    group.add(new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ color: 0xff00aa, transparent: true, opacity: 0.04 })));

    // Layer 5: Structural rings
    const outerRingGeo = new THREE.RingGeometry(9.2, 9.35, 128);
    group.add(new THREE.Mesh(outerRingGeo, new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.06, side: THREE.DoubleSide })));
    const innerRingGeo = new THREE.RingGeometry(4.8, 4.9, 64);
    group.add(new THREE.Mesh(innerRingGeo, new THREE.MeshBasicMaterial({ color: 0xff00aa, transparent: true, opacity: 0.05, side: THREE.DoubleSide })));

    scene.add(group);

    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      group.rotation.y += 0.0015;
      group.rotation.x = Math.sin(t * 0.15) * 0.1;
      const pulse = 1 + Math.sin(t * 1.5) * 0.08;
      core.scale.set(pulse, pulse, pulse);
      coreMat.opacity = 0.12 + Math.sin(t * 1.5) * 0.04;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [categories, heatmap, totalDataPoints]);

  return (
    <section className="card" id="card4" style={{ padding: 0, overflow: "hidden" }}>
      <div className="card-inner" style={{ position: "relative", width: "100%", height: "100%" }}>
        <div ref={frameRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "24px 20px",
          background: "linear-gradient(transparent, rgba(3,7,17,0.85) 40%)",
          textAlign: "center", zIndex: 2,
        }}>
          <div className="card-title" style={{ fontSize: 20, marginBottom: 4 }}>データ肖像画</div>
          <div className="card-sub" style={{ fontSize: 11, lineHeight: 1.4, color: "var(--text2)" }}>
            あなたの全データから生成された世界で唯一の抽象画
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: "var(--text3)",
            letterSpacing: 2, marginTop: 6,
          }}>
            {totalDataPoints.toLocaleString()}データポイントから生成
          </div>
        </div>
      </div>
      <ShareButton cardId="card4" label="データ肖像画" />
    </section>
  );
}
