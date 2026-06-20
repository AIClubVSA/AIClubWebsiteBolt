"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Calendar, Trophy, User, LogOut,
  Bell, Cpu, CheckCircle2, Clock, Star, Zap, Target,
  ChevronRight, Play, Lock, Award, TrendingUp, X, Check,
  Rocket, Swords, Shield, Brain, Flame
} from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const skillData = [
  { skill: "Python", value: 75 },
  { skill: "ML", value: 55 },
  { skill: "Math", value: 68 },
  { skill: "NLP", value: 40 },
  { skill: "CV", value: 50 },
  { skill: "Ethics", value: 80 },
];

const progressData = [
  { week: "W1", points: 20 }, { week: "W2", points: 45 },
  { week: "W3", points: 70 }, { week: "W4", points: 95 },
  { week: "W5", points: 130 }, { week: "W6", points: 175 },
];

const courses = [
  { id: 1, title: "Introduction to Machine Learning", progress: 75, lessons: 12, done: 9, category: "ML", locked: false },
  { id: 2, title: "Neural Networks & Deep Learning", progress: 30, lessons: 16, done: 5, category: "DL", locked: false },
  { id: 3, title: "Natural Language Processing", progress: 0, lessons: 10, done: 0, category: "NLP", locked: false },
  { id: 4, title: "Computer Vision Fundamentals", progress: 0, lessons: 14, done: 0, category: "CV", locked: true },
  { id: 5, title: "AI Ethics & Responsible AI", progress: 90, lessons: 8, done: 7, category: "Ethics", locked: false },
];

const upcomingEvents = [
  { title: "AI Hackathon: Build the Future", date: "Jul 12–13", type: "Hackathon", registered: true },
  { title: "Deep Learning Workshop", date: "Jun 28", type: "Workshop", registered: false },
  { title: "Kaggle Bootcamp", date: "Jul 19", type: "Workshop", registered: false },
];

const achievements = [
  { title: "First Project", Icon: Rocket, earned: true, desc: "Completed your first AI project" },
  { title: "Hackathon Participant", Icon: Swords, earned: true, desc: "Participated in a hackathon" },
  { title: "Ethics Champion", Icon: Shield, earned: true, desc: "Completed AI Ethics course" },
  { title: "ML Master", Icon: Brain, earned: false, desc: "Complete all ML courses" },
  { title: "Consistency", Icon: Flame, earned: false, desc: "Learn for 100 days in a row" },
  { title: "Top Performer", Icon: Trophy, earned: false, desc: "Reach the top tier of members" },
];

type Tab = "dashboard" | "courses" | "events" | "achievements" | "profile";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: "#a5b4fc", fontWeight: 600 }}>Points: {p.value}</p>
      ))}
    </div>
  );
}

export default function StudentPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string; username: string } | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [toast, setToast] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ai_centre_user");
    if (!stored) { router.push("/login"); return; }
    const u = JSON.parse(stored);
    setUser(u);
  }, [router]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const logout = () => { localStorage.removeItem("ai_centre_user"); router.push("/login"); };

  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "courses", icon: BookOpen, label: "My Courses" },
    { id: "events", icon: Calendar, label: "Events" },
    { id: "achievements", icon: Trophy, label: "Achievements" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "rgba(99,102,241,0.9)", color: "white", padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 1000, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 40px rgba(99,102,241,0.4)", animation: "slideInUp 0.3s ease" }}>
          <Check size={16} /> {toast}
        </div>
      )}

      {/* SIDEBAR */}
      <aside style={{ width: 240, background: "rgba(15,23,42,0.95)", borderRight: "1px solid rgba(99,102,241,0.1)", display: "flex", flexDirection: "column", padding: "24px 16px", position: "sticky", top: 0, height: "100vh", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, padding: "0 8px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
            <Cpu size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>AI Centre</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Student Portal</div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {navItems.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ background: tab === id ? "rgba(99,102,241,0.12)" : "transparent", borderLeft: tab === id ? "3px solid #6366f1" : "3px solid transparent", color: tab === id ? "white" : "#64748b", fontWeight: tab === id ? 700 : 500, fontSize: 14, border: "none", cursor: "pointer", width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: tab === id ? "0 10px 10px 0" : 10, transition: "all 0.2s" }}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid rgba(99,102,241,0.1)", paddingTop: 16, marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white" }}>{user.name[0]}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Student</div>
            </div>
          </div>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "10px 12px", borderRadius: 10, fontSize: 14, transition: "all 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(20px)", background: "rgba(3,7,18,0.85)", borderBottom: "1px solid rgba(99,102,241,0.08)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.3px" }}>
              {tab === "dashboard" && `Welcome back, ${user.name.split(" ")[0]}`}
              {tab === "courses" && "My Courses"}
              {tab === "events" && "Events"}
              {tab === "achievements" && "Achievements"}
              {tab === "profile" && "My Profile"}
            </h2>
            <p style={{ fontSize: 12, color: "#475569" }}>AI Centre — Student Portal</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 100, padding: "6px 14px" }}>
              <Star size={13} color="#fcd34d" fill="#fcd34d" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fcd34d" }}>450 pts</span>
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(!notifOpen)} style={{ position: "relative", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                <Bell size={18} />
                <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
              </button>
              {notifOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 300, background: "#0f172a", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 20 }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(99,102,241,0.1)", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                    <button onClick={() => setNotifOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><X size={14} /></button>
                  </div>
                  {[
                    { text: "Hackathon registration confirmed!", time: "1h ago", color: "#10b981" },
                    { text: "New lesson added: Transformers 101", time: "3h ago", color: "#6366f1" },
                    { text: "You earned the Ethics Champion badge!", time: "1d ago", color: "#f59e0b" },
                  ].map((n, i) => (
                    <div key={i} style={{ padding: "12px 20px", borderBottom: "1px solid rgba(99,102,241,0.06)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.color, marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 2 }}>{n.text}</p>
                        <p style={{ fontSize: 11, color: "#475569" }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={{ padding: 32 }}>
          {/* DASHBOARD */}
          {tab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                {[
                  { label: "Total Points", value: "450", icon: Star, color: "#f59e0b", sub: "Top 30%" },
                  { label: "Courses Active", value: "3", icon: BookOpen, color: "#6366f1", sub: "2 in progress" },
                  { label: "Events Joined", value: "2", icon: Calendar, color: "#06b6d4", sub: "1 upcoming" },
                  { label: "Badges Earned", value: "3/6", icon: Award, color: "#10b981", sub: "3 remaining" },
                ].map((k, i) => (
                  <div key={i} className="card-glow rounded-2xl" style={{ padding: 18 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${k.color}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <k.icon size={18} color={k.color} />
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 2 }}>{k.value}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>{k.label}</div>
                    <div style={{ fontSize: 11, color: k.color }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Progress + Skill radar */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
                <div className="card-glow rounded-2xl" style={{ padding: 24 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Point Progression</h3>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Last 6 weeks</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={progressData}>
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="points" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="card-glow rounded-2xl" style={{ padding: 24 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Skill Radar</h3>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Your competency map</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={skillData}>
                      <PolarGrid stroke="rgba(99,102,241,0.15)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <Radar name="Skills" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Continue learning */}
              <div className="card-glow rounded-2xl" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15 }}>Continue Learning</h3>
                  <button onClick={() => setTab("courses")} style={{ fontSize: 12, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer" }}>See all →</button>
                </div>
                {courses.filter(c => c.progress > 0 && c.progress < 100).map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BookOpen size={18} color="#6366f1" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{c.title}</div>
                      <div className="progress-bar" style={{ marginBottom: 4 }}>
                        <div className="progress-fill" style={{ width: `${c.progress}%` }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{c.done}/{c.lessons} lessons · {c.progress}% complete</div>
                    </div>
                    <button onClick={() => showToast(`Opening: ${c.title}`)} style={{ background: "none", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, padding: "8px 14px", color: "#a5b4fc", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.1)")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <Play size={12} /> Resume
                    </button>
                  </div>
                ))}
              </div>

              {/* Upcoming events */}
              <div className="card-glow rounded-2xl" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15 }}>Upcoming Events</h3>
                  <button onClick={() => setTab("events")} style={{ fontSize: 12, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer" }}>See all →</button>
                </div>
                {upcomingEvents.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(6,182,212,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Calendar size={17} color="#06b6d4" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{e.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{e.date} · {e.type}</div>
                    </div>
                    {e.registered
                      ? <span className="badge badge-green" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={10} /> Registered</span>
                      : <button onClick={() => showToast(`Registered for ${e.title}!`)} className="btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>Register</button>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COURSES */}
          {tab === "courses" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {courses.map(c => (
                <div key={c.id} className="card-glow rounded-2xl" style={{ padding: 24, display: "flex", gap: 20, alignItems: "center", opacity: c.locked ? 0.6 : 1 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: c.locked ? "rgba(100,116,139,0.15)" : "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {c.locked ? <Lock size={22} color="#475569" /> : <BookOpen size={22} color="#6366f1" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{c.title}</span>
                      <span className={`badge ${c.category === "Ethics" ? "badge-green" : c.category === "NLP" || c.category === "CV" ? "badge-cyan" : "badge-purple"}`} style={{ fontSize: 11 }}>{c.category}</span>
                      {c.locked && <span className="badge badge-red" style={{ fontSize: 11 }}>Locked</span>}
                    </div>
                    <div className="progress-bar" style={{ marginBottom: 8 }}>
                      <div className="progress-fill" style={{ width: `${c.progress}%` }} />
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748b" }}>
                      <span><CheckCircle2 size={11} style={{ display: "inline", marginRight: 4 }} />{c.done}/{c.lessons} lessons</span>
                      <span><Clock size={11} style={{ display: "inline", marginRight: 4 }} />{c.progress}% complete</span>
                    </div>
                  </div>
                  <button
                    onClick={() => !c.locked && showToast(c.progress === 0 ? `Starting: ${c.title}` : `Resuming: ${c.title}`)}
                    disabled={c.locked}
                    className={c.locked ? "" : "btn-primary"}
                    style={{ flexShrink: 0, fontSize: 13, padding: "10px 20px", display: "flex", alignItems: "center", gap: 6, ...(c.locked ? { background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.2)", borderRadius: 10, color: "#475569", cursor: "not-allowed" } : {}) }}>
                    {c.locked ? <Lock size={14} /> : <Play size={14} />}
                    {c.locked ? "Locked" : c.progress === 0 ? "Start" : "Resume"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* EVENTS */}
          {tab === "events" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              {upcomingEvents.map((e, i) => (
                <div key={i} className="card-glow rounded-2xl" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <span className={`badge ${e.type === "Hackathon" ? "badge-purple" : "badge-cyan"}`}>{e.type}</span>
                    {e.registered && <span className="badge badge-green" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={10} /> Registered</span>}
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "#f1f5f9" }}>{e.title}</h4>
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}><Calendar size={13} /> {e.date}</p>
                  {!e.registered && (
                    <button onClick={() => showToast(`Registered for ${e.title}!`)} className="btn-primary" style={{ width: "100%", fontSize: 13, padding: "10px" }}>Register Now →</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ACHIEVEMENTS */}
          {tab === "achievements" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                {achievements.map((a, i) => (
                  <div key={i} className="card-glow rounded-2xl" style={{ padding: 20, opacity: a.earned ? 1 : 0.45, position: "relative", overflow: "hidden" }}>
                    {a.earned && <div style={{ position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={13} color="white" /></div>}
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: a.earned ? "rgba(99,102,241,0.12)" : "rgba(100,116,139,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                      <a.Icon size={22} color={a.earned ? "#a5b4fc" : "#475569"} />
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{a.title}</h4>
                    <p style={{ fontSize: 13, color: "#64748b" }}>{a.desc}</p>
                    {!a.earned && (
                      <div style={{ marginTop: 12, fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                        <Lock size={11} /> Not earned yet
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE */}
          {tab === "profile" && (
            <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="card-glow rounded-2xl" style={{ padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "white", boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}>{user.name[0]}</div>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800 }}>{user.name}</h3>
                    <p style={{ color: "#64748b", fontSize: 14 }}>Student Member · AI Centre</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <span className="badge badge-purple">Grade 11A</span>
                      <span className="badge badge-cyan">ML Track</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { label: "Full Name", value: user.name },
                    { label: "Email", value: `${user.username}@aicentre.edu` },
                    { label: "Member Since", value: "January 2026" },
                    { label: "Learning Track", value: "Machine Learning" },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input className="input-field" defaultValue={f.value} />
                    </div>
                  ))}
                  <button className="btn-primary" onClick={() => showToast("Profile updated!")} style={{ width: "fit-content", fontSize: 13, padding: "10px 24px", marginTop: 4 }}>Save Changes</button>
                </div>
              </div>

              <div className="card-glow rounded-2xl" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>My Stats</h3>
                {[
                  { label: "Total Points", value: "450", icon: Star, color: "#f59e0b" },
                  { label: "Leaderboard Rank", value: "#18 of 120", icon: TrendingUp, color: "#6366f1" },
                  { label: "Projects Completed", value: "3", icon: Target, color: "#10b981" },
                  { label: "Lessons Finished", value: "21", icon: CheckCircle2, color: "#06b6d4" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <s.icon size={15} color={s.color} />
                    </div>
                    <span style={{ flex: 1, fontSize: 13, color: "#94a3b8" }}>{s.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
