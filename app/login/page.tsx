"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Cpu, Eye, EyeOff, ArrowLeft, Sparkles, Lock, User, BookOpen, Trophy, Users } from "lucide-react";
import Link from "next/link";

const ACCOUNTS = {
  admin: { password: "admin123", role: "admin", name: "Admin User" },
  student: { password: "student123", role: "student", name: "Alex Johnson" },
  "aarav.nadig@gmail.com": { password: "password123", role: "student", name: "Aarav Nadig" },
};

function ParticleRing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 500; canvas.height = 500;
    let raf: number, t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, 500, 500);
      t += 0.008;
      const cx = 250, cy = 250;
      for (let i = 0; i < 120; i++) {
        const angle = (i / 120) * Math.PI * 2 + t;
        const r1 = 180 + Math.sin(t * 2 + i * 0.15) * 20;
        const x = cx + Math.cos(angle) * r1;
        const y = cy + Math.sin(angle) * r1;
        const hue = 240 + (i / 120) * 60 + t * 20;
        const alpha = 0.3 + Math.sin(t * 3 + i * 0.2) * 0.2;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
        ctx.fill();
      }
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2 - t * 1.5;
        const r2 = 120 + Math.cos(t * 2.5 + i * 0.2) * 15;
        const x = cx + Math.cos(angle) * r2;
        const y = cy + Math.sin(angle) * r2;
        const hue = 280 + (i / 60) * 60 - t * 15;
        const alpha = 0.2 + Math.sin(t * 4 + i * 0.3) * 0.15;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${alpha})`;
        ctx.fill();
      }
      // Center glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      grad.addColorStop(0, `hsla(240, 80%, 60%, ${0.08 + Math.sin(t) * 0.04})`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2); ctx.fill();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.6, pointerEvents: "none" }} />;
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const key = username.toLowerCase().trim();
    const account = ACCOUNTS[key as keyof typeof ACCOUNTS];
    if (account && account.password === password) {
      localStorage.setItem("ai_centre_user", JSON.stringify({ username: key, role: account.role, name: account.name }));
      router.push(account.role === "admin" ? "/admin" : "/student");
    } else {
      setError("Invalid username or password. Try admin/admin123 or student/student123");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", position: "relative", overflow: "hidden", background: "var(--bg)" }}>
      {/* Left panel - visual */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", padding: 40 }}>
        <img src="/images/auth.jpg" alt="" aria-hidden
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.5) brightness(0.28)", opacity: 0.5 }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, rgba(3,7,18,0.85) 75%)" }} />
        <div style={{ position: "relative", textAlign: "center", zIndex: 2 }}>
          <div style={{ position: "relative", width: 300, height: 300, margin: "0 auto 40px" }}>
            <ParticleRing />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 60px rgba(99,102,241,0.5)" }}>
              <Cpu size={40} color="white" />
            </div>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 12 }}>
            Welcome to <span className="gradient-text">AI Centre</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, maxWidth: 340 }}>
            Your hub for AI learning, competitions, research, and building the future of technology.
          </p>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { Icon: BookOpen, text: "Access learning resources & workshops" },
              { Icon: Trophy, text: "Track your competition performance" },
              { Icon: Users, text: "Collaborate with team members" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 12, padding: "12px 16px", textAlign: "left" }}>
                <item.Icon size={17} color="#a5b4fc" />
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{ width: 480, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 48px", background: "rgba(15,23,42,0.6)", borderLeft: "1px solid rgba(99,102,241,0.1)", backdropFilter: "blur(20px)" }}>
        <div style={{ width: "100%", maxWidth: 380, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(30px)", transition: "all 0.7s cubic-bezier(.4,0,.2,1)" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, marginBottom: 40, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#a5b4fc")} onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock size={18} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>Sign In</h1>
              <p style={{ fontSize: 13, color: "#64748b" }}>Access your AI Centre portal</p>
            </div>
          </div>

          {/* Demo hint */}
          <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Sparkles size={12} color="#a5b4fc" />
              <span style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 600 }}>Demo Accounts</span>
            </div>
            <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
              Admin: <code style={{ color: "#a5b4fc" }}>admin</code> / <code style={{ color: "#a5b4fc" }}>admin123</code><br />
              Student: <code style={{ color: "#a5b4fc" }}>student</code> / <code style={{ color: "#a5b4fc" }}>student123</code>
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 8 }}>Username</label>
              <div style={{ position: "relative" }}>
                <User size={16} color="#475569" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input className="input-field" value={username} onChange={e => { setUsername(e.target.value); setError(""); }}
                  placeholder="admin or student"
                  style={{ paddingLeft: 42 }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 8 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="#475569" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input className="input-field" type={showPw ? "text" : "password"} value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  style={{ paddingLeft: 42, paddingRight: 44 }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
                <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#475569", cursor: "pointer" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <button className="btn-primary" onClick={handleLogin} disabled={loading}
              style={{ width: "100%", padding: "14px", fontSize: 15, borderRadius: 12, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Signing in...
                </>
              ) : "Sign In →"}
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: 13, color: "#334155", marginTop: 32 }}>
            New student?{" "}
            <a href="#" style={{ color: "#a5b4fc", textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>
              Contact your admin to register
            </a>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
