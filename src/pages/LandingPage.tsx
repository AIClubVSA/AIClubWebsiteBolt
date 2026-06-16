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
  Zap,
  Target,
  Lightbulb,
  MessageSquare,
  Github,
  Twitter,
  Linkedin,
  Menu,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
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
      const scrollPosition = window.scrollY;
      setProgress((scrollPosition / totalHeight) * 100);
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
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 4,
    size: 2 + Math.random() * 4,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function NeuralNetwork() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 600">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <g className="data-stream" fill="none" stroke="url(#lineGradient)" strokeWidth="1">
        <path d="M0,300 Q250,100 500,300 T1000,300" />
        <path d="M0,200 Q250,400 500,200 T1000,200" />
        <path d="M0,400 Q250,200 500,400 T1000,400" />
        <path d="M100,0 Q300,300 100,600" />
        <path d="M300,0 Q500,300 300,600" />
        <path d="M500,0 Q700,300 500,600" />
        <path d="M700,0 Q900,300 700,600" />
        <path d="M900,0 Q1100,300 900,600" />
      </g>
      {[
        [100, 300], [250, 150], [400, 350], [550, 200], [700, 400], [850, 250],
        [175, 400], [325, 100], [475, 500], [625, 150], [775, 350], [925, 200],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="4"
          fill="#0ea5e9"
          className="node-pulse"
          style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </svg>
  );
}

function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000;
          const increment = value / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl md:text-6xl font-bold gradient-text mb-2">
        {count}{suffix}
      </div>
      <div className="text-gray-400 text-lg">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <div
      className="reveal-scale glass rounded-2xl p-8 card-hover group"
      style={{ transitionDelay: `${delay}ms` } as React.CSSProperties}
    >
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Icon className="w-7 h-7 text-cyan-400" />
      </div>
      <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function EventCard({ title, date, time, type, description }: {
  title: string;
  date: string;
  time: string;
  type: string;
  description: string;
}) {
  const typeStyles: Record<string, string> = {
    Workshop: 'bg-cyan-500/20 text-cyan-400',
    Talk: 'bg-emerald-500/20 text-emerald-400',
    Hackathon: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="reveal glass rounded-2xl p-6 card-hover group">
      <div className="flex items-start justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeStyles[type] || typeStyles.Workshop}`}>
          {type}
        </span>
        <Calendar className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-cyan-400 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>{date}</span>
        <span className="w-1 h-1 rounded-full bg-gray-600" />
        <span>{time}</span>
      </div>
    </div>
  );
}

function TestimonialCard({ name, role, content, avatar }: {
  name: string;
  role: string;
  content: string;
  avatar: string;
}) {
  return (
    <div className="reveal glass rounded-2xl p-8 card-hover">
      <div className="flex items-start gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Sparkles key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        ))}
      </div>
      <p className="text-gray-300 mb-6 leading-relaxed">"{content}"</p>
      <div className="flex items-center gap-4">
        <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
        <div>
          <div className="font-semibold text-white">{name}</div>
          <div className="text-sm text-gray-500">{role}</div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const scrollProgress = useScrollProgress();
  useScrollReveal();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventsData, testimonialsData] = await Promise.all([
          getFeaturedEvents(),
          getFeaturedTestimonials(),
        ]);
        setEvents(eventsData);
        setTestimonials(testimonialsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    }
    loadData();
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
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI Fundamentals',
      description: 'Master the core concepts of artificial intelligence, from neural networks to natural language processing.',
    },
    {
      icon: Code2,
      title: 'Hands-on Projects',
      description: 'Build real AI applications using industry-standard tools like TensorFlow, PyTorch, and OpenAI APIs.',
    },
    {
      icon: Sparkles,
      title: 'Cutting-edge Research',
      description: 'Explore the latest breakthroughs in AI research and understand their real-world implications.',
    },
    {
      icon: Users,
      title: 'Collaborative Learning',
      description: 'Work alongside passionate peers on team projects, competitions, and research initiatives.',
    },
    {
      icon: Target,
      title: 'Career Prep',
      description: 'Get mentorship, resume reviews, and interview prep from AI professionals in the industry.',
    },
    {
      icon: Lightbulb,
      title: 'Innovation Challenges',
      description: 'Participate in hackathons and innovation challenges to solve real problems with AI solutions.',
    },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <div className="scroll-progress">
        <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
      </div>

      <Particles />

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass py-4' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <div className="relative w-10 h-10 floating">
              <Brain className="w-10 h-10 text-cyan-400" />
            </div>
            <span className="text-xl font-bold gradient-text">AI Club</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a>
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">Programs</a>
            <a href="#events" className="text-gray-400 hover:text-white transition-colors">Events</a>
            <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Stories</a>
            {user ? (
              <Link to="/dashboard" className="btn-shine px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link>
                <Link to="/signup" className="btn-shine px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                  Join Us
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden glass mt-4 mx-4 rounded-xl p-4">
            <div className="flex flex-col gap-4">
              <a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a>
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">Programs</a>
              <a href="#events" className="text-gray-400 hover:text-white transition-colors">Events</a>
              <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Stories</a>
              {user ? (
                <Link to="/dashboard" className="text-center px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg font-medium">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link>
                  <Link to="/signup" className="text-center px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg font-medium">
                    Join Us
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <section className="relative min-h-screen flex items-center justify-center gradient-bg grid-pattern overflow-hidden">
        <NeuralNetwork />

        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl morph-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl morph-blob" style={{ animationDelay: '-4s' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center pt-20">
          <div className="reveal-scale mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-cyan-400">
              <Zap className="w-4 h-4" />
              Exploring the Future of Intelligence
            </span>
          </div>

          <h1 className="reveal text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            Learn AI.<br />
            <span className="gradient-text">Build the Future.</span>
          </h1>

          <p className="reveal text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join our community of innovators, researchers, and enthusiasts exploring artificial intelligence through hands-on projects, workshops, and collaboration.
          </p>

          <div className="reveal flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {user ? (
              <Link to="/dashboard" className="btn-shine group px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn-shine group px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2">
                  Start Your AI Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#about" className="px-8 py-4 glass rounded-xl font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  Learn More
                </a>
              </>
            )}
          </div>

          <div className="reveal absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500">
            <span className="text-sm">Scroll to explore</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </div>
      </section>

      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <StatCounter value={15} label="Active Members" suffix="+" />
            <StatCounter value={5} label="Workshops Held" suffix="+" />
            <StatCounter value={8} label="Projects" suffix="+" />
            <StatCounter value={3} label="Events" suffix="+" />
          </div>
        </div>
      </section>

      <section id="about" className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="reveal-left">
              <span className="text-cyan-400 font-mono text-sm mb-4 block">WHO WE ARE</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Pioneering AI Education<br />
                <span className="gradient-text">on Campus</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                We're a community of students, researchers, and AI enthusiasts dedicated to democratizing artificial intelligence education. Our club bridges the gap between theory and practice, empowering members to create innovative AI solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-semibold">Open to All</div>
                    <div className="text-sm text-gray-500">No experience needed</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-semibold">Industry Mentors</div>
                    <div className="text-sm text-gray-500">Professional guidance</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal-right relative">
              <div className="relative aspect-square rounded-3xl overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?w=600&h=600&fit=crop"
                  alt="Students collaborating"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20" />
              </div>
              <div className="absolute -top-4 -right-4 glass rounded-xl p-4 float" style={{ animationDelay: '0s' }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium">Active Learning</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 glass rounded-xl p-4 float" style={{ animationDelay: '-3s' }}>
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-medium">Real Projects</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-500/5" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="reveal text-cyan-400 font-mono text-sm mb-4 block">WHAT WE OFFER</span>
            <h2 className="reveal text-4xl md:text-5xl font-bold mb-6">
              Programs Designed for<br />
              <span className="gradient-text">Every Skill Level</span>
            </h2>
            <p className="reveal text-gray-400 text-lg max-w-2xl mx-auto">
              From beginners to advanced practitioners, we have something for everyone interested in artificial intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="reveal text-cyan-400 font-mono text-sm mb-4 block">UPCOMING EVENTS</span>
            <h2 className="reveal text-4xl md:text-5xl font-bold mb-6">
              Learn, Build, and<br />
              <span className="gradient-text">Connect</span>
            </h2>
            <p className="reveal text-gray-400 text-lg max-w-2xl mx-auto">
              Join our upcoming workshops, talks, and hackathons to level up your AI skills.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {events.length > 0 ? (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  date={formatDate(event.event_date)}
                  time={event.event_time || 'TBD'}
                  type={event.event_type}
                  description={event.description || ''}
                />
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500 py-12">
                Loading events...
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-emerald-500/5" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="reveal text-cyan-400 font-mono text-sm mb-4 block">SUCCESS STORIES</span>
            <h2 className="reveal text-4xl md:text-5xl font-bold mb-6">
              Hear from Our<br />
              <span className="gradient-text">Community</span>
            </h2>
            <p className="reveal text-gray-400 text-lg max-w-2xl mx-auto">
              Our members have gone on to achieve incredible things in AI and tech.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.length > 0 ? (
              testimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  name={testimonial.name}
                  role={testimonial.role || ''}
                  content={testimonial.content}
                  avatar={testimonial.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?w=100&h=100&fit=crop'}
                />
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500 py-12">
                Loading testimonials...
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="join" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="reveal-scale glass rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 rounded-3xl rotating-border opacity-30" style={{ zIndex: -1 }} />

            <Brain className="reveal w-16 h-16 text-cyan-400 mx-auto mb-8" />
            <h2 className="reveal text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your<br />
              <span className="gradient-text">AI Journey?</span>
            </h2>
            <p className="reveal text-gray-400 text-lg max-w-xl mx-auto mb-10">
              Join our community of innovators and get access to workshops, mentorship, projects, and networking opportunities.
            </p>

            {user ? (
              <Link to="/dashboard" className="reveal btn-shine group px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all inline-flex items-center gap-2">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <form onSubmit={handleSignup} className="reveal max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-shine px-6 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Joining...</span>
                      </>
                    ) : (
                      'Get Started'
                    )}
                  </button>
                </div>

                {submitStatus === 'success' && (
                  <div className="flex items-center justify-center gap-2 text-emerald-400 mt-4">
                    <CheckCircle className="w-5 h-5" />
                    <span>Thanks for subscribing! Check your email for confirmation.</span>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="flex items-center justify-center gap-2 text-red-400 mt-4">
                    <AlertCircle className="w-5 h-5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <p className="text-gray-500 text-sm mt-4">
                  Join 15+ students already learning. No spam, unsubscribe anytime.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-8 h-8 text-cyan-400" />
                <span className="text-lg font-bold gradient-text">AI Club</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Empowering students to explore and build with artificial intelligence.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">About Us</a></li>
                <li><a href="#features" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">Programs</a></li>
                <li><a href="#events" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">Events</a></li>
                <li><a href="#join" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">Join Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">Learning Path</a></li>
                <li><a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">Project Showcase</a></li>
                <li><a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">Blog</a></li>
                <li><a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-cyan-500/20 transition-colors">
                  <Github className="w-5 h-5 text-gray-400" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-cyan-500/20 transition-colors">
                  <Twitter className="w-5 h-5 text-gray-400" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-cyan-500/20 transition-colors">
                  <Linkedin className="w-5 h-5 text-gray-400" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; 2026 AI Club. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
