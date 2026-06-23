import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  Target,
  Heart,
  Zap,
  Users,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Star,
  MapPin,
  Award,
  Lightbulb,
  Rocket,
  Globe,
  BookOpen,
  Trophy,
  ChevronDown,
  Menu,
  X,
  Clock,
  Crown,
  UserCog,
  Code2,
  Palette,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('active');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function ValueCard({
  icon: Icon,
  title,
  body,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <div className="reveal glass rounded-2xl p-8 card-hover group">
      <div className={`w-12 h-12 rounded-xl ${accent} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

const milestones = [
  { year: '2023', title: 'The Spark', desc: 'A small group of curious students gathered after school to experiment with ChatGPT. The first session was messy, exciting, and everyone wanted more.', icon: Lightbulb },
  { year: '2024', title: 'First Builds', desc: 'Students shipped their first real projects — chatbots, image generators, and AI-assisted writing tools. Some entered inter-school competitions.', icon: Rocket },
  { year: '2025', title: 'Growth & Structure', desc: 'The club formalized into tracks: Beginner, Builder, Creator, and Leader. Mentorship pairs and weekly sprints became the rhythm.', icon: Trophy },
  { year: '2026', title: 'The AI Centre', desc: 'Now a thriving community of 20+ students building real projects. The club is the creative hub for AI at Vidyashilp Academy.', icon: Star },
];

export default function AboutUsPage() {
  useScrollReveal();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" aria-label="AI Centre home">
            <img src="/images/WhatsApp_Image_2026-06-03_at_5.22.16_PM.jpeg" className="w-9 h-9 object-contain rounded-lg" alt="AI Club" />
            <div className="leading-tight">
              <div className="text-white font-bold text-sm">AI Centre</div>
              <div className="text-gray-500 text-xs">Vidyashilp Academy</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
            {navLinks.map((l) => (
              <Link key={l.href} to={l.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                {l.label}
              </Link>
            ))}
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

          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden glass mt-3 mx-4 rounded-xl p-4 flex flex-col gap-4">
            {navLinks.map((l) => (
              <Link key={l.href} to={l.href} className="text-gray-300 hover:text-white text-sm transition-colors" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
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

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5" aria-hidden="true" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} aria-hidden="true" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <p className="reveal inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full text-xs text-cyan-400 mb-6">
            <Zap className="w-3.5 h-3.5" />
            About the AI Centre
          </p>
          <h1 className="reveal text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Built by students, <br />
            <span className="gradient-text">for students who want to make things.</span>
          </h1>
          <p className="reveal text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            The AI Centre at Vidyashilp Academy is a student-led club where curiosity meets creativity. We believe AI is a tool anyone can learn to use, and we're building a community that proves it.
          </p>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="reveal text-cyan-400 font-mono text-xs mb-3">LEADERSHIP</p>
            <h2 className="reveal text-3xl md:text-4xl font-bold mb-5">
              Meet the team <br />
              <span className="gradient-text">behind the AI Centre.</span>
            </h2>
            <p className="reveal text-gray-400 max-w-xl mx-auto">
              Our student leadership team drives the club's vision, organizes events, and ensures every member has the support they need to grow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: 'Sammit Basu', role: 'Founder and Head', icon: Crown, color: 'from-amber-500 to-orange-500', desc: 'Leading the vision and direction of the AI Centre' },
              { name: 'Aarush M Reddy', role: 'Chairman', icon: UserCog, color: 'from-cyan-500 to-blue-500', desc: 'Overseeing club operations and strategic initiatives' },
              { name: 'Aarav Nadig', role: 'Director', icon: Target, color: 'from-emerald-500 to-teal-500', desc: 'Guiding projects and member development' },
              { name: 'Arav Prasad', role: 'Secretary', icon: BookOpen, color: 'from-violet-500 to-purple-500', desc: 'Managing communications and documentation' },
              { name: 'Kushal Rao', role: 'Head of Communications', icon: Globe, color: 'from-blue-500 to-indigo-500', desc: 'Leading outreach and external engagement' },
              { name: 'Rehaan Malhotra', role: 'Ethics Officer', icon: Heart, color: 'from-rose-500 to-pink-500', desc: 'Ensuring responsible AI practices in all projects' },
              { name: 'Aarav Nitin Dev', role: 'Programmer and Developer', icon: Code2, color: 'from-green-500 to-emerald-500', desc: 'Building tools and technical infrastructure' },
              { name: 'Harsh Mehra', role: 'Head of Design', icon: Palette, color: 'from-fuchsia-500 to-pink-500', desc: 'Crafting visual identity and user experiences' },
            ].map((member) => {
              const Icon = member.icon;
              return (
                <div key={member.name} className="reveal glass rounded-2xl p-6 text-center card-hover group">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-base mb-1">{member.name}</h3>
                  <p className="text-cyan-400 text-xs font-medium mb-2">{member.role}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{member.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Stand For */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="reveal text-cyan-400 font-mono text-xs mb-3">OUR VALUES</p>
            <h2 className="reveal text-3xl md:text-4xl font-bold mb-5">
              What makes this club <br />
              <span className="gradient-text">feel different.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <ValueCard
              icon={Heart}
              title="Beginner First"
              body="You don't need to know how to code. We design every session, demo, and resource so that students who are brand new feel just as welcome as those who are advanced."
              accent="bg-gradient-to-br from-cyan-500 to-cyan-600"
            />
            <ValueCard
              icon={Target}
              title="Build, Don't Just Watch"
              body="Every track has a project at the end. We don't do passive lectures. You will make something real — a chatbot, a design, a presentation, a working app."
              accent="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
            <ValueCard
              icon={Users}
              title="Collaboration Over Competition"
              body="We work together. Senior students mentor newer ones. Teachers support the ambitious. The best ideas come from teams, not individuals."
              accent="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <ValueCard
              icon={Lightbulb}
              title="Curiosity Is Enough"
              body="You don't need to want a career in AI. You don't need to be good at STEM. If you're curious and willing to try, you belong here."
              accent="bg-gradient-to-br from-amber-500 to-amber-600"
            />
            <ValueCard
              icon={BookOpen}
              title="Ethics and Responsibility"
              body="We don't just teach how to use AI. We teach how to use it well — critically, responsibly, and with awareness of bias and impact."
              accent="bg-gradient-to-br from-violet-500 to-violet-600"
            />
            <ValueCard
              icon={Globe}
              title="Real-World Relevance"
              body="We bring in real tools, real projects, and real competitions. What you build here can go on your portfolio, your application, or your personal website."
              accent="bg-gradient-to-br from-rose-500 to-rose-600"
            />
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-emerald-500/5" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '20+', label: 'Active Members' },
              { value: '4', label: 'Learning Tracks' },
              { value: '15+', label: 'Projects Built' },
              { value: '3', label: 'Competitions Entered' },
            ].map((stat) => (
              <div key={stat.label} className="reveal glass rounded-2xl p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story / Timeline */}
      <section className="py-24 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="reveal text-cyan-400 font-mono text-xs mb-3">OUR JOURNEY</p>
            <h2 className="reveal text-3xl md:text-4xl font-bold mb-5">
              How the club <br />
              <span className="gradient-text">came to life.</span>
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-emerald-500/30 to-transparent md:-translate-x-px" />

            <div className="space-y-12">
              {milestones.map((m, i) => {
                const Icon = m.icon;
                const isLeft = i % 2 === 0;
                return (
                  <div key={m.year} className="reveal relative flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-0">
                    {/* Node on timeline */}
                    <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center z-10 ring-4 ring-[#0a0a0f]">
                      <Icon className="w-4 h-4 text-white" />
                    </div>

                    {/* Content */}
                    <div className={`pl-14 md:pl-0 md:w-1/2 ${isLeft ? 'md:pr-12 md:text-right' : 'md:ml-auto md:pl-12 md:text-left'}`}>
                      <div className="glass rounded-2xl p-6 card-hover">
                        <span className="text-cyan-400 font-mono text-xs mb-2 inline-block">{m.year}</span>
                        <h3 className="text-xl font-bold text-white mb-2">{m.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{m.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Team / Advisors */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-500/5" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="reveal text-cyan-400 font-mono text-xs mb-3">THE PEOPLE</p>
            <h2 className="reveal text-3xl md:text-4xl font-bold mb-5">
              Who makes this club <br />
              <span className="gradient-text">actually run.</span>
            </h2>
            <p className="reveal text-gray-400 max-w-xl mx-auto">
              The AI Centre is student-led with support from teacher advisors. Leadership rotates, and every member has a voice in shaping the club.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="reveal glass rounded-2xl p-8 text-center card-hover">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Student Leaders</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Senior members who run sessions, plan events, and mentor newer students. The leadership team rotates every term to keep ideas fresh.
              </p>
            </div>

            <div className="reveal glass rounded-2xl p-8 text-center card-hover">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Teacher Advisors</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Faculty members who guide structure, connect the club to school resources, and help students navigate competitions and applications.
              </p>
            </div>

            <div className="reveal glass rounded-2xl p-8 text-center card-hover">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Every Member</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                The club is shaped by everyone who shows up. Ideas, feedback, and new directions come from the full community — not just the leadership.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location & When */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="reveal text-cyan-400 font-mono text-xs mb-3">GET INVOLVED</p>
              <h2 className="reveal text-3xl md:text-4xl font-bold mb-6">
                Where and when<br />
                <span className="gradient-text">we meet.</span>
              </h2>
              <div className="reveal space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Vidyashilp Academy</h3>
                    <p className="text-gray-400 text-sm">Bangalore, Karnataka</p>
                    <p className="text-gray-500 text-sm">Sessions held in the school's Innovation Lab and other designated spaces.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Weekly During Club Period</h3>
                    <p className="text-gray-400 text-sm">Scheduled sessions during school hours, plus optional extended builds for competitions and showcase prep.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Open to All Students</h3>
                    <p className="text-gray-400 text-sm">No application required. Just create an account and show up. Every skill level and background is welcome.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal glass rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Ready to join?</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  If you're curious about AI, creative about what you want to make, and want to be around people who feel the same — the club is for you. No experience needed.
                </p>
                {user ? (
                  <Link to="/dashboard" className="btn-shine group w-full px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl font-semibold hover:shadow-xl hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <Link to="/signup" className="btn-shine group w-full px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl font-semibold hover:shadow-xl hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2">
                    Create your account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img src="/images/WhatsApp_Image_2026-06-03_at_5.22.16_PM.jpeg" className="w-8 h-8 object-contain rounded-lg" alt="AI Club" />
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
                <li><Link to="/" className="text-gray-500 hover:text-cyan-400 transition-colors text-xs">Home</Link></li>
                <li><Link to="/about" className="text-gray-500 hover:text-cyan-400 transition-colors text-xs">About Us</Link></li>
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
                {[{ Icon: Users }, { Icon: Star }, { Icon: Brain }].map(({ Icon }, i) => (
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
