import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Crown,
  UserCog,
  Target,
  BookOpen,
  Globe,
  Heart,
  Code2,
  Palette,
  ArrowRight,
  ArrowUpRight,
  Heart as HeartIcon,
  Target as TargetIcon,
  Users,
  Lightbulb,
  BookOpen as BookOpenIcon,
  Globe as GlobeIcon,
  MapPin,
  Clock,
  Sparkles,
  Brain,
  Star,
  Lightbulb as Lightbulb2,
  Rocket,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

gsap.registerPlugin(ScrollTrigger);

function SpatialBackground() {
  return (
    <div className="spatial" aria-hidden>
      <div className="spatial-grid" />
      <div className="blob" style={{ width: 620, height: 620, top: "-8%", left: "-6%", background: "radial-gradient(circle, rgba(99,102,241,0.55), transparent 65%)", opacity: 0.4 }} />
      <div className="blob" style={{ width: 540, height: 540, top: "32%", right: "-10%", background: "radial-gradient(circle, rgba(6,182,212,0.42), transparent 65%)", opacity: 0.32 }} />
      <div className="blob" style={{ width: 700, height: 700, bottom: "-12%", left: "20%", background: "radial-gradient(circle, rgba(139,92,246,0.45), transparent 65%)", opacity: 0.3 }} />
    </div>
  );
}

function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const dot = dotRef.current!, ring = ringRef.current!;
    document.body.classList.add("cursor-active");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 1 });
    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.42, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.42, ease: "power3" });
    const move = (e: MouseEvent) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); };
    const sel = "a, button, [data-cursor]";
    const over = (e: MouseEvent) => { if ((e.target as Element).closest?.(sel)) ring.classList.add("hover"); };
    const out = (e: MouseEvent) => { if ((e.target as Element).closest?.(sel)) ring.classList.remove("hover"); };
    const leave = () => gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
    const enter = () => gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    document.documentElement.addEventListener("mouseleave", leave);
    document.documentElement.addEventListener("mouseenter", enter);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.documentElement.removeEventListener("mouseenter", enter);
      document.body.classList.remove("cursor-active");
    };
  }, []);
  return (<>
    <div ref={ringRef} className="cursor-ring" />
    <div ref={dotRef} className="cursor-dot" />
  </>);
}

const FIRST_FOUR = [
  { name: 'Sammit Basu', role: 'Founder and Head', icon: Crown, color: 'from-amber-500 to-orange-500', desc: 'Leading the vision and direction of the AI Centre' },
  { name: 'Aarush M Reddy', role: 'Chairman', icon: UserCog, color: 'from-cyan-500 to-blue-500', desc: 'Overseeing club operations and strategic initiatives' },
  { name: 'Aarav Nadig', role: 'Director', icon: Target, color: 'from-emerald-500 to-teal-500', desc: 'Guiding projects and member development' },
  { name: 'Arav Prasad', role: 'Secretary', icon: BookOpen, color: 'from-violet-500 to-purple-500', desc: 'Managing communications and documentation' },
];

const REST = [
  { name: 'Kushal Rao', role: 'Head of Communications', icon: Globe, color: 'from-blue-500 to-indigo-500', desc: 'Leading outreach and external engagement' },
  { name: 'Rehaan Malhotra', role: 'Ethics Officer', icon: Heart, color: 'from-rose-500 to-pink-500', desc: 'Ensuring responsible AI practices in all projects' },
  { name: 'Aarav Nitin Dev', role: 'Programmer and Developer', icon: Code2, color: 'from-green-500 to-emerald-500', desc: 'Building tools and technical infrastructure' },
  { name: 'Harsh Mehra', role: 'Head of Design', icon: Palette, color: 'from-fuchsia-500 to-pink-500', desc: 'Crafting visual identity and user experiences' },
];

const milestones = [
  { year: '2023', title: 'The Spark', desc: 'A small group of curious students gathered after school to experiment with ChatGPT. The first session was messy, exciting, and everyone wanted more.', icon: Lightbulb2 },
  { year: '2024', title: 'First Builds', desc: 'Students shipped their first real projects — chatbots, image generators, and AI-assisted writing tools. Some entered inter-school competitions.', icon: Rocket },
  { year: '2025', title: 'Growth & Structure', desc: 'The club formalized into tracks: Beginner, Builder, Creator, and Leader. Mentorship pairs and weekly sprints became the rhythm.', icon: Trophy },
  { year: '2026', title: 'The AI Centre', desc: 'Now a thriving community of 20+ students building real projects. The club is the creative hub for AI at Vidyashilp Academy.', icon: Star },
];

const VALUES = [
  { icon: HeartIcon, title: "Beginner First", body: "You don't need to know how to code. We design every session, demo, and resource so that students who are brand new feel just as welcome as those who are advanced.", accent: "bg-gradient-to-br from-cyan-500 to-cyan-600" },
  { icon: TargetIcon, title: "Build, Don't Just Watch", body: "Every track has a project at the end. We don't do passive lectures. You will make something real — a chatbot, a design, a presentation, a working app.", accent: "bg-gradient-to-br from-emerald-500 to-emerald-600" },
  { icon: Users, title: "Collaboration Over Competition", body: "We work together. Senior students mentor newer ones. Teachers support the ambitious. The best ideas come from teams, not individuals.", accent: "bg-gradient-to-br from-blue-500 to-blue-600" },
  { icon: Lightbulb, title: "Curiosity Is Enough", body: "You don't need to want a career in AI. You don't need to be good at STEM. If you're curious and willing to try, you belong here.", accent: "bg-gradient-to-br from-amber-500 to-amber-600" },
  { icon: BookOpenIcon, title: "Ethics and Responsibility", body: "We don't just teach how to use AI. We teach how to use it well — critically, responsibly, and with awareness of bias and impact.", accent: "bg-gradient-to-br from-violet-500 to-violet-600" },
  { icon: GlobeIcon, title: "Real-World Relevance", body: "We bring in real tools, real projects, and real competitions. What you build here can go on your portfolio, your application, or your personal website.", accent: "bg-gradient-to-br from-rose-500 to-rose-600" },
];

export default function AboutUsPage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const spotlight = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el) => {
        gsap.from(el, { opacity: 0, y: 40, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 86%" } });
      });

      if (progressRef.current) {
        gsap.set(progressRef.current, { scaleX: 0, transformOrigin: "left center" });
        gsap.to(progressRef.current, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
      }

      gsap.to(".spatial .blob:nth-child(2)", { x: "+=70", scale: 1.18, duration: 16, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".spatial .blob:nth-child(3)", { x: "-=90", scale: 1.12, duration: 20, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".spatial .blob:nth-child(4)", { x: "+=60", scale: 1.2, duration: 24, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".spatial .blob:nth-child(2)", { yPercent: 60, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 1 } });
      gsap.to(".spatial .blob:nth-child(3)", { yPercent: -45, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 1 } });
      gsap.to(".spatial .blob:nth-child(4)", { yPercent: 35, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 1.4 } });
      gsap.to(".spatial-grid", { yPercent: 22, scale: 1.15, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
      gsap.to(".spatial", { filter: "hue-rotate(220deg)", ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 1.5 } });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="lp" style={{ position: "relative", background: "transparent" }}>
      <SpatialBackground />
      <CustomCursor />
      <div className="lp-content" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 200, background: "transparent" }}>
          <div ref={progressRef} style={{ height: "100%", width: "100%", background: "linear-gradient(90deg, var(--accent), var(--accent3))", boxShadow: "0 0 12px rgba(99,102,241,0.6)" }} />
        </div>

        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          transition: "all 0.4s ease", padding: "0 clamp(20px,4vw,56px)",
          background: scrolled ? "rgba(8,8,10,0.72)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
        }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(255,255,255,0.25)", display: "grid", placeItems: "center" }}>
                <div style={{ width: 8, height: 8, background: "#f5f5f7", borderRadius: 2 }} />
              </div>
              <span className="lp-display" style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>AI Centre</span>
            </div>
            <div className="lp-hide-mobile" style={{ display: "flex", gap: 36, alignItems: "center" }}>
              <Link to="/" className="lp-link" style={{ fontSize: 14, color: "var(--text-muted)" }}>Home</Link>
              <Link to="/about" className="lp-link" style={{ fontSize: 14, color: "var(--text)" }}>About Us</Link>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Link to="/login" className="lp-link lp-hide-mobile" style={{ fontSize: 14, color: "var(--text-muted)" }}>Log in</Link>
              <Link to="/login" className="lp-btn lp-btn-solid" style={{ padding: "9px 18px", fontSize: 13 }}>Join the club <ArrowRight size={14} /></Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ position: "relative", height: "70vh", minHeight: 520, overflow: "hidden", display: "flex", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
          <div className="lp-grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />
          <div className="lp-vignette" style={{ position: "absolute", inset: 0 }} />
          <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 1320, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)" }}>
            <div className="lp-eyebrow" style={{ marginBottom: 28 }} data-fade>[ About the AI Centre ]</div>
            <h1 className="lp-display" style={{ fontSize: "clamp(2.4rem, 7vw, 5.2rem)", margin: 0, lineHeight: 1.05, maxWidth: 860 }}>
              Built by students,<br />
              <span style={{ color: "var(--text-muted)" }}>for students who want to make things.</span>
            </h1>
            <p style={{ maxWidth: 580, marginTop: 32, fontSize: "clamp(15px,1.4vw,18px)", lineHeight: 1.6, color: "var(--text-muted)" }} data-fade>
              The AI Centre at Vidyashilp Academy is a student-led club where curiosity meets creativity. We believe AI is a tool anyone can learn to use, and we're building a community that proves it.
            </p>
          </div>
        </section>

        {/* Leadership Team */}
        <section style={{ padding: "clamp(120px,18vh,220px) clamp(20px,4vw,56px)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <div className="lp-eyebrow" style={{ marginBottom: 24 }} data-fade>[ Leadership ]</div>
            <h2 className="lp-display" data-fade style={{ fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 1.02, marginBottom: 16 }}>
              Meet the team behind the AI Centre.
            </h2>
            <p data-fade style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.6, maxWidth: 560, marginBottom: 72 }}>
              Our student leadership team drives the club's vision, organizes events, and ensures every member has the support they need to grow.
            </p>

            {/* First 4 — individual rows, first slightly larger */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28, marginBottom: 72 }}>
              {FIRST_FOUR.map((member, idx) => {
                const Icon = member.icon;
                const isFirst = idx === 0;
                return (
                  <div
                    key={member.name}
                    data-fade
                    className="lp-panel"
                    onMouseMove={spotlight}
                    style={{
                      display: "grid",
                      gridTemplateColumns: isFirst ? "100px 1fr 280px" : "80px 1fr 260px",
                      gap: "clamp(16px,4vw,48px)",
                      alignItems: "center",
                      padding: isFirst ? "32px 36px" : "24px 32px",
                      borderRadius: 16,
                      border: "1px solid var(--line)",
                      background: "linear-gradient(160deg, rgba(255,255,255,0.025), rgba(255,255,255,0))",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{
                      width: isFirst ? 72 : 56,
                      height: isFirst ? 72 : 56,
                      borderRadius: "50%",
                      background: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }} className={`bg-gradient-to-br ${member.color}`}>
                      <Icon size={isFirst ? 32 : 24} color="#fff" />
                    </div>
                    <div>
                      <h3 className="lp-display" style={{ fontSize: isFirst ? "clamp(1.4rem,2.4vw,1.9rem)" : "clamp(1.1rem,2vw,1.5rem)", letterSpacing: "-0.02em", marginBottom: 6 }}>{member.name}</h3>
                      <p style={{ color: "var(--text-muted)", fontSize: isFirst ? 15 : 13.5, lineHeight: 1.5 }}>{member.desc}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="lp-eyebrow" style={{ fontSize: 10, color: "var(--accent3)" }}>{member.role}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rest in a 4-col grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {REST.map((member) => {
                const Icon = member.icon;
                return (
                  <div
                    key={member.name}
                    data-fade
                    className="lp-panel"
                    onMouseMove={spotlight}
                    style={{ padding: "24px", borderRadius: 14, textAlign: "center" }}
                  >
                    <div className={`bg-gradient-to-br ${member.color}`} style={{ width: 52, height: 52, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
                      <Icon size={24} color="#fff" />
                    </div>
                    <h3 className="lp-display" style={{ fontSize: 16, letterSpacing: "-0.02em", marginBottom: 4 }}>{member.name}</h3>
                    <p style={{ color: "var(--accent3)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>{member.role}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5 }}>{member.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Values */}
        <section style={{ padding: "clamp(120px,18vh,220px) clamp(20px,4vw,56px)", borderTop: "1px solid var(--line)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <div className="lp-eyebrow" style={{ marginBottom: 24 }} data-fade>[ Our Values ]</div>
            <h2 className="lp-display" data-fade style={{ fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 1.02, marginBottom: 72 }}>
              What makes this club feel different.
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {VALUES.map((v) => {
                const Icon = v.icon;
                return (
                  <div
                    key={v.title}
                    data-fade
                    className="lp-panel"
                    onMouseMove={spotlight}
                    style={{ padding: "32px", borderRadius: 16 }}
                  >
                    <div className={v.accent} style={{ width: 44, height: 44, borderRadius: 10, display: "grid", placeItems: "center", marginBottom: 18 }}>
                      <Icon size={20} color="#fff" />
                    </div>
                    <h3 className="lp-display" style={{ fontSize: 18, letterSpacing: "-0.02em", marginBottom: 10 }}>{v.title}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>{v.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section style={{ padding: "clamp(60px,10vh,100px) clamp(20px,4vw,56px)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {[
              { value: '20+', label: 'Active Members' },
              { value: '4', label: 'Learning Tracks' },
              { value: '15+', label: 'Projects Built' },
              { value: '3', label: 'Competitions Entered' },
            ].map((stat) => (
              <div key={stat.label} data-fade className="lp-panel" style={{ padding: "32px", textAlign: "center", borderRadius: 16 }}>
                <div className="lp-display" style={{ fontSize: "clamp(2rem,4vw,3rem)", background: "linear-gradient(135deg, var(--accent), var(--accent3))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>{stat.value}</div>
                <span className="lp-eyebrow">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section style={{ padding: "clamp(120px,18vh,220px) clamp(20px,4vw,56px)" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div className="lp-eyebrow" style={{ marginBottom: 24 }} data-fade>[ Our Journey ]</div>
            <h2 className="lp-display" data-fade style={{ fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 1.02, marginBottom: 72 }}>
              How the club came to life.
            </h2>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 1, background: "linear-gradient(to bottom, var(--accent), var(--accent3), transparent)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
                {milestones.map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.year} data-fade style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 28, alignItems: "flex-start", paddingLeft: 24 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent3))", display: "grid", placeItems: "center", marginLeft: -44, flexShrink: 0, border: "3px solid var(--bg)" }}>
                        <Icon size={16} color="#fff" />
                      </div>
                      <div>
                        <span className="lp-eyebrow" style={{ color: "var(--accent3)", marginBottom: 6, display: "inline-block" }}>{m.year}</span>
                        <h3 className="lp-display" style={{ fontSize: "clamp(1.2rem,2.2vw,1.6rem)", letterSpacing: "-0.02em", marginBottom: 8 }}>{m.title}</h3>
                        <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6, maxWidth: 560 }}>{m.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Team / Advisors */}
        <section style={{ padding: "clamp(120px,18vh,220px) clamp(20px,4vw,56px)", borderTop: "1px solid var(--line)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <div className="lp-eyebrow" style={{ marginBottom: 24 }} data-fade>[ The People ]</div>
            <h2 className="lp-display" data-fade style={{ fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 1.02, marginBottom: 16 }}>
              Who makes this club actually run.
            </h2>
            <p data-fade style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.6, maxWidth: 560, marginBottom: 72 }}>
              The AI Centre is student-led with support from teacher advisors. Leadership rotates, and every member has a voice in shaping the club.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {[
                { title: "Student Leaders", body: "Senior members who run sessions, plan events, and mentor newer students. The leadership team rotates every term to keep ideas fresh.", icon: Users },
                { title: "Teacher Advisors", body: "Faculty members who guide structure, connect the club to school resources, and help students navigate competitions and applications.", icon: Star },
                { title: "Every Member", body: "The club is shaped by everyone who shows up. Ideas, feedback, and new directions come from the full community — not just the leadership.", icon: Sparkles },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} data-fade className="lp-panel" onMouseMove={spotlight} style={{ padding: "36px", borderRadius: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(99,102,241,0.12)", display: "grid", placeItems: "center", marginBottom: 18 }}>
                      <Icon size={22} color="var(--accent)" />
                    </div>
                    <h3 className="lp-display" style={{ fontSize: 18, letterSpacing: "-0.02em", marginBottom: 10 }}>{card.title}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>{card.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Location & When */}
        <section style={{ padding: "clamp(120px,18vh,220px) clamp(20px,4vw,56px)", borderTop: "1px solid var(--line)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px,6vw,80px)", alignItems: "start" }}>
            <div>
              <div className="lp-eyebrow" style={{ marginBottom: 24 }} data-fade>[ Get Involved ]</div>
              <h2 className="lp-display" data-fade style={{ fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 1.02, marginBottom: 48 }}>
                Where and when we meet.
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {[
                  { icon: MapPin, title: "Vidyashilp Academy", lines: ["Bangalore, Karnataka", "Sessions held in the school's Innovation Lab and other designated spaces."] },
                  { icon: Clock, title: "Weekly During Club Period", lines: ["Scheduled sessions during school hours, plus optional extended builds for competitions and showcase prep."] },
                  { icon: Sparkles, title: "Open to All Students", lines: ["No application required. Just create an account and show up. Every skill level and background is welcome."] },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} data-fade style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(6,182,212,0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <Icon size={20} color="var(--accent3)" />
                      </div>
                      <div>
                        <h3 className="lp-display" style={{ fontSize: 16, letterSpacing: "-0.02em", marginBottom: 4 }}>{item.title}</h3>
                        {item.lines.map((l, i) => (
                          <p key={i} style={{ color: i === 0 ? "var(--text-muted)" : "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>{l}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div data-fade className="lp-panel" onMouseMove={spotlight} style={{ padding: "40px", borderRadius: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(6,182,212,0.12)", display: "grid", placeItems: "center" }}>
                  <Brain size={20} color="var(--accent3)" />
                </div>
                <h3 className="lp-display" style={{ fontSize: 20, letterSpacing: "-0.02em" }}>Ready to join?</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                If you're curious about AI, creative about what you want to make, and want to be around people who feel the same — the club is for you. No experience needed.
              </p>
              {user ? (
                <Link to="/dashboard" className="lp-btn lp-btn-solid" style={{ width: "100%", justifyContent: "center", padding: "14px 24px" }}>
                  Go to Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <Link to="/signup" className="lp-btn lp-btn-solid" style={{ width: "100%", justifyContent: "center", padding: "14px 24px" }}>
                  Create your account <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid var(--line)", padding: "56px clamp(20px,4vw,56px) 40px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 40, marginBottom: 56 }}>
              <div style={{ maxWidth: 360 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid rgba(255,255,255,0.25)", display: "grid", placeItems: "center" }}>
                    <div style={{ width: 7, height: 7, background: "#f5f5f7", borderRadius: 2 }} />
                  </div>
                  <span className="lp-display" style={{ fontSize: 16, fontWeight: 600 }}>AI Centre</span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
                  A student-led artificial intelligence and machine learning club.
                </p>
              </div>
              <div style={{ display: "flex", gap: "clamp(40px,8vw,100px)", flexWrap: "wrap" }}>
                <div>
                  <div className="lp-eyebrow" style={{ marginBottom: 16 }}>Explore</div>
                  <Link to="/" className="lp-link" style={{ display: "block", color: "var(--text-muted)", fontSize: 14, padding: "6px 0" }}>Home</Link>
                  <Link to="/about" className="lp-link" style={{ display: "block", color: "var(--text-muted)", fontSize: 14, padding: "6px 0" }}>About Us</Link>
                </div>
                <div>
                  <div className="lp-eyebrow" style={{ marginBottom: 16 }}>Portal</div>
                  <Link to="/login" className="lp-link" style={{ display: "block", color: "var(--text-muted)", fontSize: 14, padding: "6px 0" }}>Member log in</Link>
                  <Link to="/login" className="lp-link" style={{ display: "block", color: "var(--text-muted)", fontSize: 14, padding: "6px 0" }}>Join the club</Link>
                </div>
              </div>
            </div>
            <div className="lp-rule" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, paddingTop: 28 }}>
              <span className="lp-eyebrow">© {new Date().getFullYear()} AI Centre</span>
              <span className="lp-eyebrow">Learn · Build · Collaborate · Shape the future</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
