import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ArrowUpRight, ArrowRight, Plus } from "lucide-react";
import InfiniteMenu from "../components/InfiniteMenu";
import FlowingMenu from "../components/FlowingMenu";
import Hyperspeed from "../components/Hyperspeed";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const HYPER_OPTIONS = {
  distortion: "turbulentDistortion",
  length: 400,
  roadWidth: 9,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 50,
  lightPairsPerRoadWay: 50,
  movingAwaySpeed: [60, 80] as [number, number],
  movingCloserSpeed: [-120, -160] as [number, number],
  carLightsLength: [400 * 0.05, 400 * 0.2] as [number, number],
  carLightsRadius: [0.05, 0.14] as [number, number],
  carWidthPercentage: [0.3, 0.5] as [number, number],
  carShiftX: [-0.2, 0.2] as [number, number],
  carFloorSeparation: [0.05, 1] as [number, number],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0x131318,
    brokenLines: 0x131318,
    leftCars: [0x6366f1, 0x8b5cf6, 0xc247ac],
    rightCars: [0x06b6d4, 0x0e5ea5, 0x324555],
    sticks: 0x06b6d4,
  },
};

function splitChars(el: HTMLElement): HTMLElement[] {
  const text = el.textContent || "";
  el.textContent = "";
  const spans: HTMLElement[] = [];
  const words = text.split(" ");
  words.forEach((word, wi) => {
    const wordSpan = document.createElement("span");
    wordSpan.style.display = "inline-block";
    wordSpan.style.whiteSpace = "nowrap";
    for (const ch of word) {
      const s = document.createElement("span");
      s.style.display = "inline-block";
      s.style.willChange = "transform";
      s.textContent = ch;
      wordSpan.appendChild(s);
      spans.push(s);
    }
    el.appendChild(wordSpan);
    if (wi < words.length - 1) {
      el.appendChild(document.createTextNode(" "));
    }
  });
  return spans;
}

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

const OFFERINGS = [
  { n: "01", t: "Hands-on Learning", d: "Workshops and labs where members learn the fundamentals of machine learning by building, not just watching.", img: "/images/learn.jpg" },
  { n: "02", t: "Coding & AI Tools", d: "Practical sessions with modern AI tooling and frameworks — from first scripts to working models.", img: "/images/coding.jpg" },
  { n: "03", t: "Ethical Discussions", d: "Open forums on responsible AI: bias, fairness, privacy, and the impact of technology on society.", img: "/images/discuss.jpg" },
  { n: "04", t: "Competitions", d: "Team entries into AI and machine-learning challenges that test skill under real constraints.", img: "/images/compete.jpg" },
  { n: "05", t: "Hackathons", d: "Intensive build sprints where members prototype, collaborate, and ship ideas end to end.", img: "/images/hackathon.jpg" },
  { n: "06", t: "Research Projects", d: "Student-led investigations into open questions, mentored from proposal through to results.", img: "/images/research.jpg" },
  { n: "07", t: "Global Outreach", d: "Connections with the wider AI community and opportunities that reach beyond the classroom.", img: "/images/outreach.jpg" },
];

const MENU_ITEMS = [
  { image: "/images/learn-python.jpg", link: "/login", title: "Python Programming", description: "Write your first code and AI scripts from scratch." },
  { image: "/images/learn-ml.jpg", link: "/login", title: "Machine Learning", description: "Train models that learn patterns from real data." },
  { image: "/images/learn-deep.jpg", link: "/login", title: "Deep Learning", description: "Build neural networks and run them on real hardware." },
  { image: "/images/learn-robotics.jpg", link: "/login", title: "Robotics", description: "Program robots that sense, decide, and respond." },
  { image: "/images/learn-build.jpg", link: "/login", title: "Hands-on Builds", description: "Prototype with sensors, boards, and hardware kits." },
  { image: "/images/learn-applied.jpg", link: "/login", title: "Applied AI", description: "Solve real-world problems with automation." },
  { image: "/images/learn-tools.jpg", link: "/login", title: "Developer Tools", description: "Master the editors and workflows engineers use." },
  { image: "/images/learn-ship.jpg", link: "/login", title: "Ship Projects", description: "Take ideas from prototype to a working demo." },
];

const FLOW_ITEMS = [
  { link: "#gallery", text: "The Programme", image: "/images/discuss.jpg" },
  { link: "#explore", text: "What You Learn", image: "/images/learn-python.jpg" },
  { link: "#pillars", text: "Our Principles", image: "/images/outreach.jpg" },
  { link: "/login", text: "Join the Club", image: "/images/cta.jpg" },
];

const PILLAR_FLOW = [
  { link: "#join", text: "Technical Skill", image: "/images/learn-tools.jpg" },
  { link: "#join", text: "Critical Thinking", image: "/images/research.jpg" },
  { link: "#join", text: "Leadership", image: "/images/hackathon.jpg" },
  { link: "#join", text: "Innovation", image: "/images/learn-deep.jpg" },
];

const PILLARS = [
  { k: "Technical skill", d: "Real competence with the tools and methods of modern AI." },
  { k: "Critical thinking", d: "The judgement to ask better questions, not just produce answers." },
  { k: "Leadership", d: "Members who organise, mentor, and carry projects forward." },
  { k: "Innovation", d: "A bias toward building things that did not exist before." },
];

const MANIFESTO = "AI Centre is a student-led community where members learn, build, collaborate, and responsibly shape the future of artificial intelligence.";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const spotlight = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(".hero-line span", { yPercent: 120, rotateX: -55, transformOrigin: "50% 0%", duration: 1.2, stagger: 0.13 })
        .from(".hero-eyebrow", { opacity: 0, y: 16, duration: 0.8 }, 0.2)
        .from(".hero-sub", { opacity: 0, y: 24, duration: 0.9 }, "-=0.6")
        .from(".hero-cta > *", { opacity: 0, y: 20, duration: 0.7, stagger: 0.1 }, "-=0.5")
        .from(".hero-meta", { opacity: 0, duration: 0.8 }, "-=0.3");

      gsap.to(".hero-content", {
        yPercent: -32, scale: 0.86, opacity: 0, filter: "blur(14px)", ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".hero-canvas-wrap", {
        yPercent: 26, scale: 1.25, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".hero-eyebrow", {
        letterSpacing: "0.5em", ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "40% top", scrub: true },
      });

      const words = gsap.utils.toArray<HTMLElement>(".lp-word");
      ScrollTrigger.create({
        trigger: ".manifesto",
        start: "top 70%",
        end: "bottom 75%",
        scrub: true,
        onUpdate: (self) => {
          const lit = Math.floor(self.progress * words.length);
          words.forEach((wd, i) => wd.classList.toggle("lit", i < lit));
        },
      });
      gsap.fromTo(".manifesto p",
        { scale: 0.9, rotateX: 12, transformOrigin: "50% 100%" },
        { scale: 1, rotateX: 0, ease: "none",
          scrollTrigger: { trigger: ".manifesto", start: "top 90%", end: "center 55%", scrub: true } });

      const track = trackRef.current!;
      const cards = gsap.utils.toArray<HTMLElement>(".gallery-card");
      const getScroll = () => track.scrollWidth - window.innerWidth;
      const depth = () => {
        const mid = window.innerWidth / 2;
        cards.forEach((c) => {
          const r = c.getBoundingClientRect();
          const d = (r.left + r.width / 2 - mid) / mid;
          const ad = Math.min(Math.abs(d), 1.4);
          gsap.set(c, {
            rotateY: d * -26,
            rotateZ: d * 2.5,
            scale: 1 - ad * 0.2,
            y: ad * 36,
            opacity: 1 - ad * 0.6,
            filter: `blur(${ad * 5}px) brightness(${1 - ad * 0.35})`,
            transformOrigin: "center center",
            z: -ad * 240,
          });
          const img = c.querySelector<HTMLElement>("img");
          if (img) gsap.set(img, { x: d * -28, scale: 1.12 });
        });
      };
      gsap.to(track, {
        x: () => -getScroll(),
        ease: "none",
        scrollTrigger: {
          trigger: ".gallery",
          start: "top top",
          end: () => "+=" + getScroll(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: depth,
          onRefresh: depth,
        },
      });

      gsap.fromTo(".band-img img",
        { clipPath: "inset(100% 0% 0% 0%)", scale: 1.25 },
        { clipPath: "inset(0% 0% 0% 0%)", scale: 1.05, duration: 1.5, ease: "expo.out",
          scrollTrigger: { trigger: ".band", start: "top 78%" } });
      gsap.fromTo(".band-img", { yPercent: -8 }, {
        yPercent: 8, ease: "none",
        scrollTrigger: { trigger: ".band", start: "top bottom", end: "bottom top", scrub: true },
      });
      gsap.utils.toArray<HTMLElement>(".split-head").forEach((h) => {
        const chars = splitChars(h);
        gsap.from(chars, {
          yPercent: 130, rotateX: -90, opacity: 0, transformOrigin: "50% 100%",
          stagger: 0.018, ease: "power3.out",
          scrollTrigger: { trigger: h, start: "top 88%", end: "top 42%", scrub: 1 },
        });
      });

      gsap.to(".spatial .blob:nth-child(2)", { x: "+=70", scale: 1.18, duration: 16, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".spatial .blob:nth-child(3)", { x: "-=90", scale: 1.12, duration: 20, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".spatial .blob:nth-child(4)", { x: "+=60", scale: 1.2, duration: 24, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".spatial .blob:nth-child(2)", { yPercent: 60, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 1 } });
      gsap.to(".spatial .blob:nth-child(3)", { yPercent: -45, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 1 } });
      gsap.to(".spatial .blob:nth-child(4)", { yPercent: 35, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 1.4 } });
      gsap.to(".spatial-grid", { yPercent: 22, scale: 1.15, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
      gsap.to(".spatial", { filter: "hue-rotate(220deg)", ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 1.5 } });

      gsap.to(".pillar-num", {
        xPercent: 120, ease: "none",
        scrollTrigger: { trigger: ".pillars", start: "top bottom", end: "bottom top", scrub: 1 },
      });

      gsap.fromTo(".cta-img", { scale: 1.25, yPercent: -6 }, {
        scale: 1, yPercent: 6, ease: "none",
        scrollTrigger: { trigger: "#join", start: "top bottom", end: "bottom top", scrub: true },
      });

      gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 40, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 86%" },
        });
      });

      gsap.from(".pillar", {
        opacity: 0, yPercent: 60, rotateX: -45, transformOrigin: "50% 0%",
        duration: 1, stagger: 0.14, ease: "power3.out",
        scrollTrigger: { trigger: ".pillars", start: "top 72%" },
      });
      gsap.utils.toArray<HTMLElement>(".pillar").forEach((p) => {
        const bar = p.querySelector<HTMLElement>(".pillar-sweep");
        if (bar) gsap.fromTo(bar, { scaleX: 0 }, {
          scaleX: 1, transformOrigin: "left", duration: 1.1, ease: "power3.inOut",
          scrollTrigger: { trigger: p, start: "top 80%" },
        });
      });

      if (progressRef.current) {
        gsap.set(progressRef.current, { scaleX: 0, transformOrigin: "left center" });
        gsap.to(progressRef.current, {
          scaleX: 1, ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
        });
      }

      const skewTargets = gsap.utils.toArray<HTMLElement>(".vel-skew");
      const setters = skewTargets.map((el) => gsap.quickTo(el, "skewY", { duration: 0.45, ease: "power3" }));
      const gridOpacity = gsap.quickTo(".spatial-grid", "opacity", { duration: 0.5, ease: "power2" });
      const sectionIds = ["top", "mission", "gallery", "pillars", "join"];
      let lastIdx = -1;
      ScrollTrigger.create({
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-7, 7, self.getVelocity() / -260);
          setters.forEach((s) => s(v));
          const av = Math.min(Math.abs(self.getVelocity()) / 3000, 1);
          gridOpacity(0.5 + av * 0.5);
          const mid = window.scrollY + window.innerHeight * 0.5;
          let idx = 0;
          sectionIds.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el && el.getBoundingClientRect().top + window.scrollY <= mid) idx = i;
          });
          if (idx !== lastIdx) { lastIdx = idx; setActiveSection(idx); }
        },
      });
    });
    return () => ctx.revert();
  }, []);

  const scrollTo = (id: string) =>
    gsap.to(window, { duration: 1.1, scrollTo: { y: `#${id}`, offsetY: 0 }, ease: "power3.inOut" });

  return (
    <div className="lp" style={{ position: "relative", background: "transparent" }}>
      <SpatialBackground />
      <CustomCursor />
      <div className="lp-content" style={{ position: "relative", zIndex: 1 }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 200, background: "transparent" }}>
        <div ref={progressRef} style={{ height: "100%", width: "100%", background: "linear-gradient(90deg, var(--accent), var(--accent3))", boxShadow: "0 0 12px rgba(99,102,241,0.6)" }} />
      </div>

      <div className="lp-hide-mobile" style={{ position: "fixed", right: 28, top: "50%", transform: "translateY(-50%)", zIndex: 120, display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-end" }}>
        {[["top", "Home"], ["mission", "Mission"], ["gallery", "Programme"], ["pillars", "Principles"], ["join", "Join"]].map(([id, label], i) => (
          <button key={id} onClick={() => scrollTo(id)}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", color: activeSection === i ? "var(--text)" : "var(--text-muted)" }}>
            <span className="lp-eyebrow" style={{ fontSize: 9.5, opacity: activeSection === i ? 1 : 0, transform: activeSection === i ? "translateX(0)" : "translateX(8px)", transition: "all 0.4s ease" }}>{label}</span>
            <span style={{ width: activeSection === i ? 26 : 12, height: 2, borderRadius: 2, background: activeSection === i ? "var(--text)" : "rgba(255,255,255,0.25)", transition: "all 0.45s cubic-bezier(.22,1,.36,1)" }} />
          </button>
        ))}
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
            {[["Mission", "mission"], ["Programme", "gallery"], ["Principles", "pillars"]].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="lp-link" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-muted)" }}>{label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link to="/login" className="lp-link lp-hide-mobile" style={{ fontSize: 14, color: "var(--text-muted)" }}>Log in</Link>
            <Link to="/login" className="lp-btn lp-btn-solid" style={{ padding: "9px 18px", fontSize: 13 }}>Join the club <ArrowRight size={14} /></Link>
          </div>
        </div>
      </nav>

      <section id="top" className="hero" style={{ position: "relative", height: "100vh", minHeight: 680, overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div className="hero-canvas-wrap" style={{ position: "absolute", inset: 0, opacity: 0.9 }}>
          <Hyperspeed effectOptions={HYPER_OPTIONS} />
        </div>
        <div className="lp-grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />
        <div className="lp-vignette" style={{ position: "absolute", inset: 0 }} />

        <div className="hero-content" style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 1320, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)" }}>
          <div className="hero-eyebrow lp-eyebrow" style={{ marginBottom: 28 }}>Student-led · Artificial Intelligence &amp; Machine Learning</div>
          <h1 className="lp-display" style={{ fontSize: "clamp(2.7rem, 8.5vw, 8rem)", margin: 0, perspective: 800 }}>
            <div className="hero-line lp-reveal"><span>Learn. Build.</span></div>
            <div className="hero-line lp-reveal"><span style={{ color: "var(--text-muted)" }}>Shape the future</span></div>
            <div className="hero-line lp-reveal"><span>of AI.</span></div>
          </h1>
          <p className="hero-sub" style={{ maxWidth: 540, marginTop: 32, fontSize: "clamp(15px,1.4vw,18px)", lineHeight: 1.6, color: "var(--text-muted)" }}>
            A community where students develop real technical skill, critical thinking, and the judgement to build artificial intelligence responsibly.
          </p>
          <div className="hero-cta" style={{ display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap" }}>
            <Link to="/login" className="lp-btn lp-btn-solid">Join the club <ArrowUpRight size={16} /></Link>
            <button onClick={() => scrollTo("mission")} className="lp-btn lp-btn-ghost">Explore the programme</button>
          </div>
        </div>

        <div className="hero-meta lp-hide-mobile" style={{ position: "absolute", bottom: 32, left: 0, right: 0, zIndex: 2 }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span className="lp-eyebrow">Scroll to begin</span>
            <span className="lp-eyebrow" style={{ maxWidth: 280, textAlign: "right", lineHeight: 1.6 }}>Hands-on learning · Competitions · Research · Global outreach</span>
          </div>
        </div>
      </section>

      <section id="mission" className="manifesto" style={{ padding: "clamp(120px,18vh,220px) clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <div className="lp-eyebrow" style={{ marginBottom: 40 }} data-fade>[ Our mission ]</div>
          <p className="lp-display" style={{ fontSize: "clamp(1.6rem, 4vw, 3.6rem)", fontWeight: 400, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
            {MANIFESTO.split(" ").map((w, i) => (
              <span key={i}>
                <span className="lp-word">{w}</span>{" "}
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className="band" style={{ position: "relative", height: "70vh", minHeight: 420, overflow: "hidden", borderTop: "1px solid var(--line)" }}>
        <div className="band-img" style={{ position: "absolute", inset: "-12% 0", willChange: "transform" }}>
          <img src="/images/band.jpg" alt="Members collaborating at AI Centre"
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.35) brightness(0.5) contrast(1.05)" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(8,8,10,0.85) 0%, rgba(8,8,10,0.4) 50%, rgba(8,8,10,0.7) 100%)" }} />
        <div style={{ position: "relative", height: "100%", maxWidth: 1320, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="lp-eyebrow" style={{ marginBottom: 28 }} data-fade>[ Inside the Centre ]</div>
          <div style={{ overflow: "hidden" }}>
            <h2 className="lp-display split-head" style={{ fontSize: "clamp(1.8rem,4vw,3.4rem)", lineHeight: 1.1, maxWidth: 760 }}>
              Real students, real projects — learning by building together.
            </h2>
          </div>
        </div>
      </section>

      <section id="gallery" className="gallery" style={{ height: "100vh", overflow: "hidden", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div ref={trackRef} style={{ display: "flex", height: "100%", alignItems: "center", width: "max-content", padding: "0 clamp(20px,4vw,56px)", gap: 28, perspective: 1400, transformStyle: "preserve-3d" }}>
          <div style={{ width: "min(82vw, 460px)", flexShrink: 0 }}>
            <div className="lp-eyebrow" style={{ marginBottom: 24 }}>[ The programme ]</div>
            <h2 className="lp-display" style={{ fontSize: "clamp(2rem,4.5vw,3.4rem)", lineHeight: 1.05 }}>
              Seven ways<br />members grow.
            </h2>
            <p style={{ color: "var(--text-muted)", marginTop: 24, fontSize: 16, lineHeight: 1.6, maxWidth: 380 }}>
              From a first line of code to research and global competition — scroll through how the Centre works.
            </p>
            <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted)" }}>
              <ArrowRight size={16} /><span className="lp-eyebrow">Scroll horizontally</span>
            </div>
          </div>

          {OFFERINGS.map((o) => (
            <article key={o.n} className="lp-panel gallery-card" onMouseMove={spotlight}
              style={{ width: "min(80vw, 380px)", flexShrink: 0, height: 480, display: "flex", flexDirection: "column", position: "relative", willChange: "transform" }}>
              <div style={{ position: "relative", height: 240, overflow: "hidden" }}>
                <img src={o.img} alt={o.t} loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.2) contrast(1.02)" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,8,10,0.1) 0%, rgba(8,8,10,0.55) 70%, var(--surface) 100%)" }} />
                <span className="lp-display" style={{ position: "absolute", top: 18, left: 22, fontSize: 13, color: "rgba(255,255,255,0.9)", mixBlendMode: "difference" }}>{o.n}</span>
                <div style={{ position: "absolute", top: 18, right: 22, width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.3)", display: "grid", placeItems: "center", background: "rgba(8,8,10,0.3)", backdropFilter: "blur(4px)" }}>
                  <Plus size={13} color="#fff" />
                </div>
              </div>
              <div style={{ padding: "8px 30px 32px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "flex-start" }}>
                <h3 className="lp-display" style={{ fontSize: 26, marginBottom: 12, letterSpacing: "-0.02em" }}>{o.t}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 14.5, lineHeight: 1.6 }}>{o.d}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="explore" className="explore" style={{ position: "relative", padding: "clamp(90px,12vh,140px) 0 clamp(40px,6vh,80px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)", textAlign: "center" }}>
          <div className="lp-eyebrow" style={{ marginBottom: 24 }} data-fade>[ What you&apos;ll learn ]</div>
          <h2 className="lp-display" data-fade style={{ fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 1.02, marginBottom: 16 }}>
            Spin through the skills.
          </h2>
          <p data-fade style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
            Drag the sphere to explore the skills you&apos;ll build at the Centre — from your first line of Python to shipping real AI projects.
          </p>
        </div>
        <div className="explore-sphere" style={{ position: "relative", height: "clamp(460px, 70vh, 720px)", marginTop: 8 }}>
          <InfiniteMenu items={MENU_ITEMS} />
        </div>
      </section>

      <section id="pillars" className="pillars" style={{ padding: "clamp(120px,16vh,200px) clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", perspective: 1200 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24, marginBottom: 72 }}>
            <div style={{ overflow: "hidden", maxWidth: 620 }}>
              <h2 className="lp-display split-head" style={{ fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 1.02 }}>
                What the Centre builds in people.
              </h2>
            </div>
            <p style={{ color: "var(--text-muted)", maxWidth: 320, fontSize: 16, lineHeight: 1.6 }}>
              Beyond the tools, membership develops the qualities that outlast any single technology.
            </p>
          </div>
          <div className="lp-rule" />
          {PILLARS.map((p, i) => (
            <div key={p.k} className="pillar" style={{ position: "relative", display: "grid", gridTemplateColumns: "60px 1fr 1.4fr", gap: "clamp(16px,4vw,80px)", alignItems: "center", padding: "clamp(28px,4vw,48px) 0", borderBottom: "1px solid var(--line)" }}>
              <span className="pillar-sweep" style={{ position: "absolute", left: 0, bottom: -1, height: 1, width: "100%", background: "linear-gradient(90deg, var(--accent), transparent)" }} />
              <span className="lp-display pillar-num" style={{ fontSize: 14, color: "var(--text-muted)", display: "inline-block" }}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className="lp-display" style={{ fontSize: "clamp(1.4rem,2.6vw,2.2rem)", letterSpacing: "-0.02em" }}>{p.k}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.6 }}>{p.d}</p>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", height: "clamp(380px, 52vh, 520px)", marginTop: "clamp(56px,8vh,96px)", borderTop: "1px solid var(--line)" }}>
          <FlowingMenu
            items={PILLAR_FLOW}
            speed={20}
            textColor="#ededef"
            bgColor="transparent"
            marqueeBgColor="#06b6d4"
            marqueeTextColor="#08080a"
            borderColor="rgba(255,255,255,0.1)"
          />
        </div>
      </section>

      <section style={{ padding: "clamp(40px,8vh,90px) 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", overflow: "hidden" }}>
        <div className="lp-marquee vel-skew">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} style={{ display: "flex", alignItems: "center" }}>
              {["Learn", "Build", "Collaborate", "Compete", "Research", "Question", "Lead", "Innovate"].map((word, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                  <span className="lp-display" style={{ fontSize: "clamp(2rem,5vw,4.5rem)", padding: "0 36px", color: i % 2 ? "var(--text-muted)" : "var(--text)" }}>{word}</span>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="flow" style={{ position: "relative", borderTop: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "clamp(80px,12vh,130px) clamp(20px,4vw,56px) clamp(40px,6vh,60px)", textAlign: "center" }}>
          <div className="lp-eyebrow" style={{ marginBottom: 24 }} data-fade>[ Find your way in ]</div>
          <h2 className="lp-display" data-fade style={{ fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 1.02 }}>
            Where to next.
          </h2>
        </div>
        <div style={{ position: "relative", height: "clamp(420px, 60vh, 560px)" }}>
          <FlowingMenu
            items={FLOW_ITEMS}
            speed={18}
            textColor="#ededef"
            bgColor="transparent"
            marqueeBgColor="#6366f1"
            marqueeTextColor="#08080a"
            borderColor="rgba(255,255,255,0.1)"
          />
        </div>
      </section>

      <section id="join" style={{ padding: "clamp(120px,18vh,220px) clamp(20px,4vw,56px)", position: "relative", overflow: "hidden" }}>
        <img src="/images/cta.jpg" alt="" aria-hidden className="cta-img"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.4) brightness(0.32)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(8,8,10,0.55), var(--bg) 95%)" }} />
        <div className="lp-grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.25 }} />
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative" }} data-fade>
          <div className="lp-eyebrow" style={{ marginBottom: 32 }}>[ Membership is open ]</div>
          <div style={{ overflow: "hidden", marginBottom: 36 }}>
            <h2 className="lp-display split-head" style={{ fontSize: "clamp(2.4rem,7vw,6rem)", lineHeight: 1 }}>
              Build the future with us.
            </h2>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 18, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 44px" }}>
            Sign in to the member portal to access learning resources, track your progress, and join the next project.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/login" className="lp-btn lp-btn-solid" style={{ padding: "15px 30px", fontSize: 15 }}>Enter the portal <ArrowUpRight size={17} /></Link>
            <button onClick={() => scrollTo("mission")} className="lp-btn lp-btn-ghost" style={{ padding: "15px 30px", fontSize: 15 }}>Read the mission</button>
          </div>
        </div>
      </section>

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
                {[["Mission", "mission"], ["Programme", "gallery"], ["Principles", "pillars"]].map(([l, id]) => (
                  <button key={id} onClick={() => scrollTo(id)} className="lp-link" style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, padding: "6px 0", textAlign: "left" }}>{l}</button>
                ))}
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
