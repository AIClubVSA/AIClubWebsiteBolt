"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Calendar, Trophy, BookOpen, Settings,
  LogOut, Bell, Search, TrendingUp, Cpu, ChevronRight,
  Plus, MoreHorizontal, UserCheck, Clock, Award, Globe,
  BarChart3, Activity, X, Check, Trash2, Edit3
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const memberData = [
  { month: "Jan", members: 82, active: 64 },
  { month: "Feb", members: 88, active: 70 },
  { month: "Mar", members: 95, active: 78 },
  { month: "Apr", members: 102, active: 85 },
  { month: "May", members: 110, active: 90 },
  { month: "Jun", members: 120, active: 98 },
];

const activityData = [
  { day: "Mon", events: 3, submissions: 12 },
  { day: "Tue", events: 5, submissions: 18 },
  { day: "Wed", events: 2, submissions: 9 },
  { day: "Thu", events: 7, submissions: 25 },
  { day: "Fri", events: 4, submissions: 15 },
  { day: "Sat", events: 8, submissions: 30 },
  { day: "Sun", events: 1, submissions: 5 },
];

const students = [
  { id: 1, name: "Alex Johnson", grade: "11A", joined: "Jan 2026", projects: 3, points: 450, status: "active" },
  { id: 2, name: "Sarah Chen", grade: "10B", joined: "Feb 2026", projects: 2, points: 380, status: "active" },
  { id: 3, name: "Marcus Williams", grade: "12A", joined: "Sep 2025", projects: 5, points: 720, status: "active" },
  { id: 4, name: "Priya Patel", grade: "11B", joined: "Mar 2026", projects: 1, points: 210, status: "inactive" },
  { id: 5, name: "James Liu", grade: "10A", joined: "Jan 2026", projects: 4, points: 560, status: "active" },
  { id: 6, name: "Emma Davis", grade: "12B", joined: "Aug 2025", projects: 6, points: 890, status: "active" },
];

const events = [
  { id: 1, title: "AI Hackathon: Build the Future", date: "Jul 12–13", type: "Hackathon", participants: 48, status: "upcoming" },
  { id: 2, title: "Deep Learning Workshop", date: "Jun 28", type: "Workshop", participants: 24, status: "upcoming" },
  { id: 3, title: "Ethics of AI Panel", date: "Jul 5", type: "Talk", participants: 80, status: "upcoming" },
  { id: 4, title: "Intro to Python AI", date: "Jun 10", type: "Workshop", participants: 32, status: "completed" },
  { id: 5, title: "Kaggle Competition", date: "May 25", type: "Competition", participants: 20, status: "completed" },
];

const notifications = [
  { id: 1, text: "New member request: Jordan Kim", time: "2m ago", type: "user" },
  { id: 2, text: "Hackathon registration is 80% full", time: "15m ago", type: "alert" },
  { id: 3, text: "Emma Davis submitted a research paper", time: "1h ago", type: "success" },
  { id: 4, text: "Monthly report is ready to review", time: "3h ago", type: "info" },
];

type Tab = "dashboard" | "members" | "events" | "analytics" | "settings";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("ai_centre_user");
    if (!stored) { router.push("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "admin") { router.push("/student"); return; }
    setUser(u);
  }, [router]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const logout = () => { localStorage.removeItem("ai_centre_user"); router.push("/login"); };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQ.toLowerCase()) || s.grade.toLowerCase().includes(searchQ.toLowerCase()));

  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "members", icon: Users, label: "Members" },
    { id: "events", icon: Calendar, label: "Events" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Toast */}
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
            <div style={{ fontSize: 11, color: "#64748b" }}>Admin Panel</div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {navItems.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className="sidebar-item"
              style={{
                background: tab === id ? "rgba(99,102,241,0.12)" : "transparent",
                borderLeft: tab === id ? "3px solid #6366f1" : "3px solid transparent",
                color: tab === id ? "white" : "#64748b",
                fontWeight: tab === id ? 700 : 500,
                fontSize: 14, border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: tab === id ? "0 10px 10px 0" : 10,
                transition: "all 0.2s",
              }}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid rgba(99,102,241,0.1)", paddingTop: 16, marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white" }}>A</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Administrator</div>
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
              {tab === "dashboard" && "Dashboard"}
              {tab === "members" && "Member Management"}
              {tab === "events" && "Events & Activities"}
              {tab === "analytics" && "Analytics"}
              {tab === "settings" && "Settings"}
            </h2>
            <p style={{ fontSize: 12, color: "#475569" }}>AI Centre ERP — Admin Portal</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(!notifOpen)} style={{ position: "relative", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                <Bell size={18} />
                <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
              </button>
              {notifOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320, background: "#0f172a", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 20 }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(99,102,241,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                    <button onClick={() => setNotifOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><X size={14} /></button>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} style={{ padding: "12px 20px", borderBottom: "1px solid rgba(99,102,241,0.06)", display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", transition: "background 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.05)")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.type === "alert" ? "#ef4444" : n.type === "success" ? "#10b981" : "#6366f1", marginTop: 5, flexShrink: 0 }} />
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
          {/* DASHBOARD TAB */}
          {tab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                {[
                  { label: "Total Members", value: "120", icon: Users, change: "+12%", color: "#6366f1" },
                  { label: "Active Projects", value: "15", icon: Activity, change: "+3", color: "#8b5cf6" },
                  { label: "Upcoming Events", value: "6", icon: Calendar, change: "Next: Jun 28", color: "#06b6d4" },
                  { label: "Awards Won", value: "8", icon: Trophy, change: "+2 this year", color: "#10b981" },
                ].map((kpi, i) => (
                  <div key={i} className="card-glow rounded-2xl" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${kpi.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <kpi.icon size={20} color={kpi.color} />
                      </div>
                      <span style={{ fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "3px 8px", borderRadius: 100, fontWeight: 600 }}>{kpi.change}</span>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1px", marginBottom: 4 }}>{kpi.value}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
                <div className="card-glow rounded-2xl" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Membership Growth</h3>
                      <p style={{ fontSize: 12, color: "#64748b" }}>Total vs active members over 6 months</p>
                    </div>
                    <span className="badge badge-green">+46%</span>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={memberData}>
                      <defs>
                        <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="members" name="Total" stroke="#6366f1" fill="url(#colorMembers)" strokeWidth={2} />
                      <Area type="monotone" dataKey="active" name="Active" stroke="#06b6d4" fill="url(#colorActive)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="card-glow rounded-2xl" style={{ padding: 24 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>This Week</h3>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Events & submissions</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={activityData}>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="submissions" name="Submissions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="events" name="Events" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Members + Events */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="card-glow rounded-2xl" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>Top Members</h3>
                    <button onClick={() => setTab("members")} style={{ fontSize: 12, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
                  </div>
                  {students.slice(0, 4).map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white" }}>{s.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: "#475569" }}>Grade {s.grade}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>{s.points}pts</span>
                    </div>
                  ))}
                </div>

                <div className="card-glow rounded-2xl" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>Upcoming Events</h3>
                    <button onClick={() => setTab("events")} style={{ fontSize: 12, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
                  </div>
                  {events.filter(e => e.status === "upcoming").slice(0, 4).map(e => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Calendar size={15} color="#6366f1" /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
                        <div style={{ fontSize: 11, color: "#475569" }}>{e.date}</div>
                      </div>
                      <span className={`badge ${e.type === "Hackathon" ? "badge-purple" : e.type === "Workshop" ? "badge-cyan" : "badge-green"}`} style={{ fontSize: 10 }}>{e.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MEMBERS TAB */}
          {tab === "members" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
                  <Search size={15} color="#475569" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <input className="input-field" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search members…" style={{ paddingLeft: 40, paddingRight: 16 }} />
                </div>
                <button className="btn-primary" onClick={() => { setShowAddStudent(true); }} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "10px 20px" }}>
                  <Plus size={15} /> Add Member
                </button>
              </div>

              {showAddStudent && (
                <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: 24 }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Add New Member</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <input className="input-field" placeholder="Full Name" />
                    <input className="input-field" placeholder="Grade (e.g. 11A)" />
                    <input className="input-field" placeholder="Email address" />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <button className="btn-primary" onClick={() => { setShowAddStudent(false); showToast("Member added successfully!"); }} style={{ fontSize: 13, padding: "10px 20px" }}>Add Member</button>
                    <button className="btn-secondary" onClick={() => setShowAddStudent(false)} style={{ fontSize: 13, padding: "10px 20px" }}>Cancel</button>
                  </div>
                </div>
              )}

              <div className="card-glow rounded-2xl" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
                      {["Member", "Grade", "Joined", "Projects", "Points", "Status", "Actions"].map(h => (
                        <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 12, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(s => (
                      <tr key={s.id} style={{ borderBottom: "1px solid rgba(99,102,241,0.06)", transition: "background 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.04)")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white" }}>{s.name[0]}</div>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#94a3b8" }}>{s.grade}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#94a3b8" }}>{s.joined}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#94a3b8" }}>{s.projects}</td>
                        <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: "#a5b4fc" }}>{s.points}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span className={`badge ${s.status === "active" ? "badge-green" : "badge-red"}`}>{s.status}</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => showToast(`Editing ${s.name}`)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4, transition: "color 0.2s" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "#a5b4fc")} onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => showToast(`${s.name} removed`)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4, transition: "color 0.2s" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EVENTS TAB */}
          {tab === "events" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn-primary" onClick={() => showToast("Create event form coming soon!")} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "10px 20px" }}>
                  <Plus size={15} /> Create Event
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                {events.map(e => (
                  <div key={e.id} className="card-glow rounded-2xl" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <span className={`badge ${e.type === "Hackathon" ? "badge-purple" : e.type === "Workshop" ? "badge-cyan" : e.type === "Talk" ? "badge-green" : "badge-amber"}`}>{e.type}</span>
                      <span className={`badge ${e.status === "upcoming" ? "badge-cyan" : "badge-red"}`}>{e.status}</span>
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#f1f5f9" }}>{e.title}</h4>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                      <span><Calendar size={11} style={{ display: "inline", marginRight: 4 }} />{e.date}</span>
                      <span><Users size={11} style={{ display: "inline", marginRight: 4 }} />{e.participants} participants</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => showToast(`Editing: ${e.title}`)} className="btn-secondary" style={{ flex: 1, fontSize: 12, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Edit3 size={12} /> Edit</button>
                      <button onClick={() => showToast(`${e.title} deleted`)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "8px 12px", color: "#fca5a5", cursor: "pointer", fontSize: 12 }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {tab === "analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="card-glow rounded-2xl" style={{ padding: 24 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Member Growth</h3>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>6-month trend</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={memberData}>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="members" name="Total" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4 }} />
                      <Line type="monotone" dataKey="active" name="Active" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: "#06b6d4", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="card-glow rounded-2xl" style={{ padding: 24 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Weekly Activity</h3>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Events & submissions</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={activityData}>
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="submissions" name="Submissions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="events" name="Events" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { label: "Avg Points / Member", value: "458", icon: TrendingUp, color: "#6366f1" },
                  { label: "Projects This Term", value: "15", icon: BookOpen, color: "#8b5cf6" },
                  { label: "Global Partnerships", value: "4", icon: Globe, color: "#06b6d4" },
                  { label: "Mentors", value: "12", icon: UserCheck, color: "#10b981" },
                  { label: "Avg Session Duration", value: "2.4h", icon: Clock, color: "#f59e0b" },
                  { label: "Awards This Year", value: "8", icon: Award, color: "#ef4444" },
                ].map((s, i) => (
                  <div key={i} className="card-glow rounded-2xl" style={{ padding: 20 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                      <s.icon size={18} color={s.color} />
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {tab === "settings" && (
            <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { title: "Club Information", fields: [{ label: "Club Name", value: "AI Centre" }, { label: "School", value: "International Academy" }, { label: "Founded", value: "2023" }] },
                { title: "Admin Account", fields: [{ label: "Admin Name", value: user.name }, { label: "Email", value: "admin@aicentre.edu" }] },
              ].map((section, i) => (
                <div key={i} className="card-glow rounded-2xl" style={{ padding: 24 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{section.title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {section.fields.map(f => (
                      <div key={f.label}>
                        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>{f.label}</label>
                        <input className="input-field" defaultValue={f.value} />
                      </div>
                    ))}
                    <button className="btn-primary" onClick={() => showToast("Settings saved!")} style={{ width: "fit-content", fontSize: 13, padding: "10px 24px", marginTop: 4 }}>Save Changes</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <style>{`@keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
