"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import ShareButton from "@/components/ui/ShareButton";

interface IntroCardProps {
  totalDataPoints: number;
  sourceCount: number;
  sources?: string[];
}

export default function IntroCard({ totalDataPoints, sourceCount, sources }: IntroCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const helixGroup = new THREE.Group();
    const strandMat1 = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.7 });
    const strandMat2 = new THREE.MeshBasicMaterial({ color: 0xff00aa, transparent: true, opacity: 0.7 });
    const bondMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 });
    const sphereGeo = new THREE.SphereGeometry(0.2, 8, 8);

    const NUM_POINTS = 140;
    const HELIX_TURNS = 6;
    const HELIX_RADIUS = 4.5;
    const HELIX_HEIGHT = 44;

    for (let i = 0; i < NUM_POINTS; i++) {
      const t = (i / NUM_POINTS) * Math.PI * 2 * HELIX_TURNS;
      const y = (i / NUM_POINTS) * HELIX_HEIGHT - HELIX_HEIGHT / 2;
      const x1 = Math.cos(t) * HELIX_RADIUS;
      const z1 = Math.sin(t) * HELIX_RADIUS;
      const x2 = Math.cos(t + Math.PI) * HELIX_RADIUS;
      const z2 = Math.sin(t + Math.PI) * HELIX_RADIUS;

      const s1 = new THREE.Mesh(sphereGeo, strandMat1);
      s1.position.set(x1, y, z1);
      helixGroup.add(s1);

      const s2 = new THREE.Mesh(sphereGeo, strandMat2);
      s2.position.set(x2, y, z2);
      helixGroup.add(s2);

      if (i % 5 === 0) {
        const midX = (x1 + x2) / 2;
        const midZ = (z1 + z2) / 2;
        const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
        const bondGeo = new THREE.CylinderGeometry(0.03, 0.03, len, 4);
        const bond = new THREE.Mesh(bondGeo, bondMat);
        bond.position.set(midX, y, midZ);
        bond.lookAt(new THREE.Vector3(x2, y, z2));
        bond.rotateX(Math.PI / 2);
        helixGroup.add(bond);
      }
    }
    scene.add(helixGroup);

    // Background particles
    const pCount = 400;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 60;
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.06, transparent: true, opacity: 0.3 });
    scene.add(new THREE.Points(pGeo, pMat));

    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      helixGroup.rotation.y += 0.003;
      helixGroup.rotation.x = Math.sin(Date.now() * 0.0003) * 0.08;
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <section className="card" id="card0">
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}
      />
      <div className="scanline" />
      <div className="card-inner" style={{
        zIndex: 2,
        position: "relative",
        background: "rgba(3, 7, 17, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: 24,
        padding: "40px 28px",
        border: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: 12,
          color: "var(--cyan)",
          opacity: 0.7,
          marginBottom: 16,
        }}>
          DATA MIRROR
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: 3,
          color: "var(--text2)",
          marginBottom: 32,
          textShadow: "0 0 20px rgba(0,229,255,0.3)",
        }}>
          デジタルDNAを解析中...
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--cyan)",
              textShadow: "0 0 20px rgba(0,229,255,0.4)",
            }}>
              {totalDataPoints.toLocaleString()}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: 2,
              color: "var(--text3)",
              marginTop: 4,
            }}>
              データポイント
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--cyan)",
              textShadow: "0 0 20px rgba(0,229,255,0.4)",
            }}>
              {sourceCount}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: 2,
              color: "var(--text3)",
              marginTop: 4,
            }}>
              ソース
            </div>
          </div>
        </div>
        {sources && sources.length > 0 && sources[0] !== "データなし" && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            justifyContent: "center",
            marginTop: 16,
            maxWidth: 320,
          }}>
            {sources.map((source) => (
              <span key={source} style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: 1,
                padding: "4px 10px",
                borderRadius: 12,
                border: "1px solid rgba(0,229,255,0.2)",
                color: "var(--cyan)",
                background: "rgba(0,229,255,0.04)",
              }}>
                {source}
              </span>
            ))}
          </div>
        )}
        <div className="badge badge-green" style={{ marginTop: 20 }}>
          <span className="badge-dot green" />
          WORLD ID VERIFIED
        </div>
      </div>
      <ShareButton cardId="card0" label="デジタルDNA" />
      <div className="scroll-hint">
        <span>スクロールして探索</span>
        <div className="scroll-arrow" />
      </div>
    </section>
  );
}
