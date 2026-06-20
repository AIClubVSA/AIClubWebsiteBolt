import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Brain,
  Code2,
  Sparkles,
  Users,
  Calendar,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Zap,
  Menu,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Github,
  Twitter,
  Linkedin,
  Hammer,
  Palette,
  Star,
  Cpu,
  BookOpen,
  Trophy,
  Lightbulb,
  MessageSquare,
  Plus,
  Minus,
} from 'lucide-react';
import {
  getFeaturedEvents,
  getFeaturedTestimonials,
  signupNewsletter,
  type Event,
  type Testimonial,
} from '../lib/supabase';

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress((window.scrollY / totalHeight) * 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return progress;
}

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('active');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach((el) =>
      observer.observe(el)
    );
    return () => observer.disconnect();
  }, []);
}

function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated) {
          setAnimated(true);
          let start = 0;
          const step = value / (2000 / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= value) { setCount(value); clearInterval(timer); }
            else setCount(Math.floor(start));
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, animated]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function Particles() {
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 4,
    size: 2 + Math.random() * 3,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{ left: `${p.left}%`, bottom: '-10px', width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
        />
      ))}
    </div>
  );
}

function NeuralNetwork() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 600" aria-hidden="true">
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <g className="data-stream" fill="none" stroke="url(#lineGrad)" strokeWidth="1">
        <path d="M0,300 Q250,100 500,300 T1000,300" />
        <path d="M0,200 Q250,400 500,200 T1000,200" />
        <path d="M0,400 Q250,200 500,400 T1000,400" />
        <path d="M100,0 Q300,300 100,600" />
        <path d="M300,0 Q500,300 300,600" />
        <path d="M500,0 Q700,300 500,600" />
        <path d="M700,0 Q900,300 700,600" />
        <path d="M900,0 Q1100,300 900,600" />
      </g>
      {[[100,300],[250,150],[400,350],[550,200],[700,400],[850,250],[175,400],[325,100],[475,500],[625,150],[775,350],[925,200]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#0ea5e9" className="node-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
    </svg>
  );
}

const pathData: Record<string, { label: string; title: string; text: string; items: { icon: React.ElementType; heading: string; body: string }[] }> = {
  beginner: {
    label: 'Beginner path',
    title: 'Learn the basics without feeling behind.',
    text: "You'll get plain-English explanations, low-pressure demos, and guided practice so AI stops feeling intimidating and starts feeling usable.",
    items: [
      { icon: BookOpen, heading: 'Plain-English sessions', body: 'No jargon. We explain everything as if you just arrived.' },
      { icon: Lightbulb, heading: 'Guided demos', body: 'Watch, follow, then try. No one left behind.' },
      { icon: Sparkles, heading: 'Quick wins', body: 'Build something you can show in your first few weeks.' },
    ],
  },
  builder: {
    label: 'Builder path',
    title: 'Turn your coding skills into actual AI projects.',
    text: "If you already know a bit of Python or web dev, you'll build real tools — chatbots, classifiers, image generators — and learn how to deploy them.",
    items: [
      { icon: Code2, heading: 'APIs & models', body: 'Use OpenAI, Gemini, Hugging Face in your own builds.' },
      { icon: Hammer, heading: 'Build sprints', body: 'Ship a working project every 3–4 weeks.' },
      { icon: Trophy, heading: 'Competitions', body: 'Enter inter-school AI challenges and hackathons.' },
    ],
  },
  creator: {
    label: 'Creator path',
    title: 'Use AI as a creative superpower.',
    text: "You don't need to code. Use AI tools for design, writing, storytelling, music, and more. Bring your creative ideas to life faster than ever.",
    items: [
      { icon: Palette, heading: 'Generative art', body: 'Create stunning visuals and animations with AI.' },
      { icon: MessageSquare, heading: 'AI writing', body: 'Craft stories, scripts, and presentations with AI assistance.' },
      { icon: Cpu, heading: 'No-code tools', body: 'Build impressive projects without writing a single line of code.' },
    ],
  },
  leader: {
    label: 'Leader path',
    title: 'Shape the direction of the club and your future.',
    text: "Take on a leadership role — run sessions, organise events, mentor newer members. These are the skills that stand out on applications.",
    items: [
      { icon: Users, heading: 'Run sessions', body: 'Lead workshops and teach what you know to others.' },
      { icon: Calendar, heading: 'Organise events', body: 'Plan competitions, demos, and community projects.' },
      { icon: Star, heading: 'Build your profile', body: 'Get recognition that matters for university and career applications.' },
    ],
  },
};

const sessionData = [
  { icon: Brain, title: 'Core sessions', body: 'Structured learning on a key AI concept — explained clearly, then practised hands-on.' },
  { icon: Hammer, title: 'Build labs', body: 'Open time to work on projects with support from peers and mentors.' },
  { icon: Trophy, title: 'Showcase demos', body: 'Present what you built. Get feedback. Celebrate progress together.' },
];

const toolsData = [
  { name: 'ChatGPT / Claude', desc: 'For experimenting with prompts, reasoning, and language tasks.' },
  { name: 'Google Colab', desc: 'Free, browser-based Python environment — no install needed.' },
  { name: 'Canva AI / Adobe Firefly', desc: 'AI-powered design tools for visual creators.' },
  { name: 'Hugging Face', desc: 'Explore and use open-source AI models easily.' },
  { name: 'Scratch + ML for Kids', desc: 'Beginner-friendly machine learning projects.' },
  { name: 'Teachable Machine', desc: 'Train a model with your own data in minutes.' },
];

const faqData = [
  { q: 'Do I need to know how to code?', a: "No. The club has tracks for complete beginners. You'll learn alongside others, and coding is just one of many paths — design, writing, and leading are equally valued." },
  { q: 'How often does the club meet?', a: 'We meet weekly during a dedicated club period. Most projects and activities happen during school hours, with some optional extended sessions for competitions or big builds.' },
  { q: 'Will I actually build something, or just watch?', a: "You'll build things. That's the whole point. From your first session, the goal is to make something you can show — even if it's small. We believe building beats watching every time." },
  { q: "What if I get stuck or don't understand something?", a: "That's expected and totally fine. We have a support structure — senior members, teacher advisors, and a collaborative group chat so no one is left stuck for long." },
  { q: 'Can this help me with university applications?', a: "Yes. Real projects, leadership roles, and competition results are all things you can write about. The club is designed to give you concrete, credible things to point to." },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-xl overflow-hidden reveal">
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-white pr-4">{question}</span>
        {open ? <Minus className="w-5 h-5 text-cyan-400 shrink-0" /> : <Plus className="w-5 h-5 text-cyan-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
          {answer}
        </div>
      )}
    </div>
  );
}

function EventCard({ title, date, time, type, description }: { title: string; date: string; time: string; type: string; description: string }) {
  const typeStyles: Record<string, string> = {
    Workshop: 'bg-cyan-500/20 text-cyan-400',
    Talk: 'bg-emerald-500/20 text-emerald-400',
    Hackathon: 'bg-violet-500/20 text-violet-400',
  };
  return (
    <div className="reveal glass rounded-2xl p-6 card-hover group">
      <div className="flex items-start justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeStyles[type] || typeStyles.Workshop}`}>{type}</span>
        <Calendar className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-cyan-400 transition-colors">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>{date}</span>
        <span className="w-1 h-1 rounded-full bg-gray-600" />
        <span>{time}</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const scrollProgress = useScrollProgress();
  useScrollReveal();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activePath, setActivePath] = useState<keyof typeof pathData>('beginner');
  const [events, setEvents] = useState<Event[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    Promise.all([getFeaturedEvents(), getFeaturedTestimonials()]).then(([ev, te]) => {
      setEvents(ev);
      setTestimonials(te);
    }).catch(console.error);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    try {
      await signupNewsletter(email);
      setSubmitStatus('success');
      setEmail('');
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const path = pathData[activePath];

  const navLinks = [
    { href: '/about', label: 'About Us' },
    { href: '#why', label: 'Why Join' },
    { href: '#experience', label: "What You'll Do" },
    { href: '#sessions', label: 'Sessions' },
    { href: '#tools', label: 'Tools' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Scroll progress bar */}
      <div className="scroll-progress" aria-hidden="true">
        <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
      </div>

      <Particles />

      {/* ── Header ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Brand */}
          <a href="#home" className="flex items-center gap-3" aria-label="AI Centre home">
            <img src="/files_10604804-2026-06-17T04-45-00-187Z-unnamed.png" className="w-9 h-9 object-contain rounded-lg" alt="AI Club" />
            <div className="leading-tight">
              <div className="text-white font-bold text-sm">AI Centre</div>
              <div className="text-gray-500 text-xs">Vidyashilp Academy</div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
            {navLinks.map((l) =>
              l.href.startsWith('#') ? (
                <a key={l.href} href={l.href} className="text-gray-400 hover:text-white text-sm transition-colors">{l.label}</a>
              ) : (
                <Link key={l.href} to={l.href} className="text-gray-400 hover:text-white text-sm transition-colors">{l.label}</Link>
              )
            )}
            {user ? (
              <Link to="/dashboard" className="btn-shine px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-gray-400 hover:text-white text-sm transition-colors">Sign In</Link>
                <Link to="/signup" className="btn-shine px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                  Join
                </Link>
              </>
            )}
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden glass mt-3 mx-4 rounded-xl p-4 flex flex-col gap-4">
            {navLinks.map((l) =>
              l.href.startsWith('#') ? (
                <a key={l.href} href={l.href} className="text-gray-300 hover:text-white text-sm transition-colors" onClick={() => setMobileOpen(false)}>{l.label}</a>
              ) : (
                <Link key={l.href} to={l.href} className="text-gray-300 hover:text-white text-sm transition-colors" onClick={() => setMobileOpen(false)}>{l.label}</Link>
              )
            )}
            <hr className="border-white/10" />
            {user ? (
              <Link to="/dashboard" className="text-center py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg text-sm font-semibold">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white text-sm transition-colors text-center">Sign In</Link>
                <Link to="/signup" className="text-center py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg text-sm font-semibold">Join the Club</Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section id="home" className="relative min-h-screen flex items-center justify-center gradient-bg grid-pattern overflow-hidden">
        <NeuralNetwork />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl morph-blob" aria-hidden="true" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl morph-blob" style={{ animationDelay: '-4s' }} aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div>
              <p className="reveal-scale inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full text-xs text-cyan-400 mb-6">
                <Zap className="w-3.5 h-3.5" />
                Vidyashilp Academy student club
              </p>
              <h1 className="reveal text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Join the AI Centre and turn your curiosity into{' '}
                <span className="gradient-text">something real.</span>
              </h1>
              <p className="reveal text-gray-400 text-lg leading-relaxed mb-8">
                If you've ever used ChatGPT, wanted to build something useful, or just wondered how AI is changing the world — this club gives you the space, support, and tools to start.
              </p>
              <div className="reveal flex flex-col sm:flex-row gap-3 mb-10">
                {user ? (
                  <Link to="/dashboard" className="btn-shine group px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl font-semibold hover:shadow-xl hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link to="/signup" className="btn-shine group px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl font-semibold hover:shadow-xl hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2">
                      See why students join
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a href="#faq" className="px-6 py-3.5 glass rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                      Check how it works
                    </a>
                  </>
                )}
              </div>

              {/* Stats */}
              <dl className="reveal grid grid-cols-3 gap-4" aria-label="Key club highlights">
                {[
                  { label: 'Beginner friendly', value: 100, suffix: '%' },
                  { label: 'Hands-on tracks', value: 4, suffix: '' },
                  { label: 'Members this year', value: 15, suffix: '+' },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-xl p-4 text-center">
                    <dd className="text-2xl font-bold gradient-text mb-1">
                      <Counter value={s.value} suffix={s.suffix} />
                    </dd>
                    <dt className="text-xs text-gray-500">{s.label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* Panel */}
            <aside aria-label="Join preview">
              <div className="reveal-right glass rounded-2xl p-6 mb-4 card-hover">
                <p className="text-xs text-cyan-400 font-mono mb-3">WHAT YOU GET</p>
                <ul className="space-y-3">
                  {[
                    'Real AI builds you can present with confidence',
                    'A friendly space for beginners and experienced students',
                    'Workshops, demos, competitions, and creative challenges',
                    'Support from teachers and older members when you get stuck',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                      <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="reveal-right glass rounded-2xl p-6 card-hover">
                <p className="text-sm font-semibold text-white mb-2">Why it feels different</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Instead of just talking about AI, you'll actually use it, test it, build with it, and learn how to make it useful, creative, and responsible.
                </p>
              </div>
            </aside>
          </div>

          <div className="reveal flex flex-col items-center gap-2 text-gray-600 mt-12">
            <span className="text-xs">Scroll to explore</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Why Join ── */}
      <section id="why" className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="reveal text-cyan-400 font-mono text-xs mb-3">WHY JOIN</p>
            <h2 className="reveal text-3xl md:text-4xl font-bold mb-5">
              Because this is more than a club.<br />
              <span className="gradient-text">It's a place to get better at making things.</span>
            </h2>
            <p className="reveal text-gray-400 max-w-2xl mx-auto">
              Students join when they want to learn skills that feel useful, creative, and future-ready — without the pressure of already being an expert.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Hammer, title: 'Make real builds', body: 'Build chatbots, visuals, smart tools, and mini apps that are worth showing to friends, teachers, and future colleges.' },
              { icon: Sparkles, title: 'Start from zero', body: 'No special background required. If you are curious, you already belong here.' },
              { icon: Users, title: 'Meet your people', body: 'Work with students who like tech, design, debate, coding, writing, or just trying something new.' },
            ].map(({ icon: Icon, title, body }) => (
              <article key={title} className="reveal-scale glass rounded-2xl p-8 card-hover group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Experience / Path switcher ── */}
      <section id="experience" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-500/5" aria-hidden="true" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="reveal text-cyan-400 font-mono text-xs mb-3">WHAT YOU'LL DO</p>
            <h2 className="reveal text-3xl md:text-4xl font-bold mb-5">
              A club that mixes learning,<br />
              <span className="gradient-text">building, and showing your work.</span>
            </h2>
            <p className="reveal text-gray-400 max-w-2xl mx-auto">
              Choose a path below and see how the club fits different interests — whether you're a beginner, a builder, or a creative thinker.
            </p>
          </div>

          {/* Path tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10" role="tablist" aria-label="Member paths">
            {(Object.keys(pathData) as Array<keyof typeof pathData>).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={activePath === key}
                onClick={() => setActivePath(key)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activePath === key
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/25'
                    : 'glass text-gray-400 hover:text-white'
                }`}
              >
                {key === 'beginner' ? "I'm new to AI" : key === 'builder' ? 'I like coding' : key === 'creator' ? 'I like design' : 'I want to lead'}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-cyan-400 font-mono text-xs mb-2">{path.label.toUpperCase()}</p>
              <h3 className="text-2xl font-bold text-white mb-4">{path.title}</h3>
              <p className="text-gray-400 leading-relaxed">{path.text}</p>
            </div>
            <div className="grid gap-4">
              {path.items.map(({ icon: Icon, heading, body }) => (
                <div key={heading} className="glass rounded-xl p-5 flex gap-4 items-start card-hover">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">{heading}</p>
                    <p className="text-gray-400 text-sm">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Sessions ── */}
      <section id="sessions" className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="reveal text-cyan-400 font-mono text-xs mb-3">WEEKLY RHYTHM</p>
            <h2 className="reveal text-3xl md:text-4xl font-bold mb-5">
              The kind of sessions that make<br />
              <span className="gradient-text">you want to come back.</span>
            </h2>
            <p className="reveal text-gray-400 max-w-2xl mx-auto">
              Every meeting should feel productive, social, and a little exciting — not like another worksheet.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {sessionData.map(({ icon: Icon, title, body }) => (
              <div key={title} className="reveal-scale glass rounded-2xl p-8 card-hover group text-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          {/* Upcoming events pulled from DB */}
          {events.length > 0 && (
            <div className="mt-16">
              <div className="text-center mb-10">
                <p className="reveal text-cyan-400 font-mono text-xs mb-3">UPCOMING EVENTS</p>
                <h3 className="reveal text-2xl font-bold text-white">What's on next</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {events.map((ev) => (
                  <EventCard key={ev.id} title={ev.title} date={formatDate(ev.event_date)} time={ev.event_time || 'TBD'} type={ev.event_type} description={ev.description || ''} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Tools ── */}
      <section id="tools" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-emerald-500/5" aria-hidden="true" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="reveal text-cyan-400 font-mono text-xs mb-3">TOOLS</p>
            <h2 className="reveal text-3xl md:text-4xl font-bold mb-5">
              Free tools, real possibilities,<br />
              <span className="gradient-text">and no expensive setup.</span>
            </h2>
            <p className="reveal text-gray-400 max-w-2xl mx-auto">
              We focus on software students can actually access, so the club stays practical and open to everyone.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
              {toolsData.map(({ name, desc }) => (
                <div key={name} className="reveal glass rounded-xl p-5 card-hover">
                  <p className="font-semibold text-white mb-1">{name}</p>
                  <p className="text-gray-400 text-sm">{desc}</p>
                </div>
              ))}
            </div>
            <aside className="reveal-right glass rounded-2xl p-6 self-start">
              <h3 className="font-semibold text-white mb-4">Good to know</h3>
              <ul className="space-y-3">
                {[
                  'You do not need to be an expert to start',
                  'Many activities work on school laptops or BYOD',
                  'We keep the workflow simple and collaborative',
                  'Sessions are shaped around curiosity, not pressure',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-400">
                    <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Member stories ── */}
      {testimonials.length > 0 && (
        <section className="py-24 relative">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="reveal text-cyan-400 font-mono text-xs mb-3">MEMBER STORIES</p>
              <h2 className="reveal text-3xl md:text-4xl font-bold mb-5">
                Hear from our<br />
                <span className="gradient-text">community</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="reveal glass rounded-2xl p-8 card-hover">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <Sparkles key={i} className="w-3.5 h-3.5 text-yellow-500" />)}
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed text-sm">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <img src={t.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=100&h=100&fit=crop'} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-white text-sm">{t.name}</p>
                      <p className="text-gray-500 text-xs">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-500/5" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="reveal text-cyan-400 font-mono text-xs mb-3">FAQ</p>
            <h2 className="reveal text-3xl md:text-4xl font-bold mb-5">
              Questions students usually ask<br />
              <span className="gradient-text">before they join.</span>
            </h2>
            <p className="reveal text-gray-400">
              Tap a question to open it. This section is built to remove the usual doubts that stop people from signing up.
            </p>
          </div>
          <div className="space-y-3">
            {faqData.map((item) => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Join / CTA ── */}
      <section id="join" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="reveal-scale glass rounded-3xl p-8 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 rounded-3xl rotating-border opacity-20" style={{ zIndex: -1 }} />

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-cyan-400 font-mono text-xs mb-3">READY TO JOIN?</p>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  If you want a club that feels creative, useful, and future-facing —{' '}
                  <span className="gradient-text">this is your sign.</span>
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Come for the AI. Stay for the people, the builds, and the chance to create something impressive before everyone else catches up.
                </p>
              </div>

              <div>
                {user ? (
                  <Link to="/dashboard" className="btn-shine group w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-3">
                    <Link to="/signup" className="btn-shine group w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl font-semibold hover:shadow-xl hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 mb-4">
                      Create your account
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <p className="text-center text-gray-500 text-xs">or stay in the loop with email</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Notify me'}
                      </button>
                    </div>
                    {submitStatus === 'success' && (
                      <p className="flex items-center gap-2 text-emerald-400 text-xs">
                        <CheckCircle className="w-4 h-4" /> You're on the list!
                      </p>
                    )}
                    {submitStatus === 'error' && (
                      <p className="flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4" /> {errorMessage}
                      </p>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img src="/files_10604804-2026-06-17T04-45-00-187Z-unnamed.png" className="w-8 h-8 object-contain rounded-lg" alt="AI Club" />
                <div>
                  <p className="text-white font-bold text-sm">AI Centre</p>
                  <p className="text-gray-600 text-xs">Vidyashilp Academy</p>
                </div>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">Build, create, and lead.</p>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Navigation</p>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-500 hover:text-cyan-400 transition-colors text-xs">About Us</Link></li>
                {navLinks.filter(l => l.href.startsWith('#')).map((l) => (
                  <li key={l.href}><a href={l.href} className="text-gray-500 hover:text-cyan-400 transition-colors text-xs">{l.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Account</p>
              <ul className="space-y-2">
                {user ? (
                  <li><Link to="/dashboard" className="text-gray-500 hover:text-cyan-400 transition-colors text-xs">Dashboard</Link></li>
                ) : (
                  <>
                    <li><Link to="/signup" className="text-gray-500 hover:text-cyan-400 transition-colors text-xs">Join the club</Link></li>
                    <li><Link to="/login" className="text-gray-500 hover:text-cyan-400 transition-colors text-xs">Sign in</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Connect</p>
              <div className="flex gap-3">
                {[{ Icon: Github }, { Icon: Twitter }, { Icon: Linkedin }].map(({ Icon }, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-cyan-500/20 transition-colors">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-600 text-xs">AI Centre &bull; Vidyashilp Academy &bull; Build, create, and lead</p>
            <p className="text-gray-600 text-xs">&copy; {new Date().getFullYear()} AI Centre. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
