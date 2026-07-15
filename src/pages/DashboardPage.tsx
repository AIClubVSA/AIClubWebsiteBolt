import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Project, Message, Announcement, Class, Note, Attendance, ClassNoteFile, Poll, PollOption, PollVote } from '../types/database';
import {
  LayoutDashboard,
  FolderGit,
  MessageSquare,
  CalendarDays,
  Bell,
  LogOut,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Trash2,
  StickyNote,
  Save,
  FileText,
  File,
  Download,
  ExternalLink,
  BarChart2,
  Settings,
  User,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';

type TabType = 'overview' | 'projects' | 'messages' | 'planner' | 'notes' | 'announcements' | 'polls' | 'settings';

export default function DashboardPage() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [classNoteFiles, setClassNoteFiles] = useState<ClassNoteFile[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [myVotes, setMyVotes] = useState<PollVote[]>([]);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [pollSubmitting, setPollSubmitting] = useState(false);

  const fetchDashboardDataRef = useRef<() => void>(() => {});

  const fetchDashboardData = useCallback(async () => {
    try {
      const [projectsRes, messagesRes, announcementsRes, classesRes, adminsRes, notesRes, attendanceRes, classNoteFilesRes, pollsRes, pollOptionsRes, myVotesRes] = await Promise.all([
        supabase.from('projects').select('*').eq('student_id', profile!.id).order('created_at', { ascending: false }),
        supabase.from('messages').select('*').or(`sender_id.eq.${profile!.id},receiver_id.eq.${profile!.id}`).order('created_at', { ascending: false }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('classes').select('*').order('date', { ascending: true }),
        supabase.from('profiles').select('id, full_name').eq('role', 'admin'),
        supabase.from('notes').select('*').eq('student_id', profile!.id),
        supabase.from('attendance').select('*').eq('student_id', profile!.id),
        supabase.from('class_notes_files').select('*').order('created_at', { ascending: false }),
        supabase.from('polls').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('poll_options').select('*').order('display_order', { ascending: true }),
        supabase.from('poll_votes').select('*').eq('student_id', profile!.id),
      ]);

      setProjects(projectsRes.data || []);
      setMessages(messagesRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      setClasses(classesRes.data || []);
      setAdmins(adminsRes.data || []);
      setNotes(notesRes.data || []);
      setAttendance(attendanceRes.data || []);
      setClassNoteFiles(classNoteFilesRes.data || []);
      setPolls(pollsRes.data || []);
      setPollOptions(pollOptionsRes.data || []);
      setMyVotes(myVotesRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchDashboardDataRef.current = fetchDashboardData;
  });

  useEffect(() => {
    if (!profile) return;
    fetchDashboardData();

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => fetchDashboardDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => fetchDashboardDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchDashboardDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchDashboardDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () => fetchDashboardDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => fetchDashboardDataRef.current())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedAdmin) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: profile!.id,
        receiver_id: selectedAdmin,
        content: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage('');
      fetchDashboardData();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(messageId: string) {
    try {
      await supabase.from('messages').delete().eq('id', messageId);
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  const upcomingClasses = classes.filter((c) => {
    const classDate = parseISO(c.date);
    return classDate >= new Date() && isThisWeek(classDate, { weekStartsOn: 1 });
  });

  const unvotedPollCount = polls.filter((p) => !myVotes.some((v) => v.poll_id === p.id)).length;

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: 0 },
    { id: 'projects', label: 'My Projects', icon: FolderGit, badge: 0 },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: 0 },
    { id: 'planner', label: 'Class Planner', icon: CalendarDays, badge: 0 },
    { id: 'notes', label: 'Notes', icon: StickyNote, badge: 0 },
    { id: 'announcements', label: 'Announcements', icon: Bell, badge: 0 },
    { id: 'polls', label: 'Polls', icon: BarChart2, badge: unvotedPollCount },
    { id: 'settings', label: 'Settings', icon: Settings, badge: 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-sky-50 to-primary-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg shadow-primary-200 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
          <p className="text-primary-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-sky-50 to-primary-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-primary-100 shadow-xl shadow-primary-100/50">
        {/* Logo */}
        <div className="p-6 border-b border-primary-100/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-primary-200/60">
              <img src="/images/WhatsApp_Image_2026-06-03_at_5.22.16_PM.jpeg" className="w-full h-full object-cover" alt="AI Club" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-primary-900 leading-none block">AI Centre</span>
              <span className="text-[10px] text-primary-400 font-medium tracking-widest uppercase">Vidyashilp</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-lg shadow-primary-300/50 scale-[1.02]'
                  : 'text-primary-700/70 hover:text-primary-800 hover:bg-primary-50'
              }`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold leading-none">{item.badge > 9 ? '9+' : item.badge}</span>
                  </span>
                )}
              </div>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Profile footer */}
        <div className="p-4 border-t border-primary-100/80">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md shadow-primary-300/40">
              <span className="text-white font-bold text-sm">
                {profile?.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary-900 font-semibold text-sm truncate">{profile?.full_name}</p>
              <p className="text-primary-400 text-xs truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-primary-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-primary-100 z-40 shadow-sm shadow-primary-100/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden">
                <img src="/images/WhatsApp_Image_2026-06-03_at_5.22.16_PM.jpeg" className="w-full h-full object-cover" alt="AI Club" />
              </div>
              <span className="font-display text-base font-bold text-primary-900">AI Centre</span>
            </div>
            <button onClick={signOut} className="p-2 text-primary-400 hover:text-red-500 transition-colors rounded-lg">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all text-xs font-medium ${
                  activeTab === item.id
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-300/40'
                    : 'text-primary-500 hover:bg-primary-50'
                }`}
              >
                <div className="relative">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                  )}
                </div>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="pt-28 lg:pt-8 p-5 lg:p-10">

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Hero greeting */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-500 to-primary-400 p-8 shadow-xl shadow-primary-300/40">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary-100" />
                    <span className="text-primary-100 text-sm font-medium uppercase tracking-widest">Dashboard</span>
                  </div>
                  <h1 className="font-display text-3xl font-bold text-white mb-1">
                    Welcome back, {profile?.full_name.split(' ')[0]}!
                  </h1>
                  <p className="text-primary-100/80">Here's what's happening with your AI journey</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: 'Active Projects', value: projects.filter((p) => p.status === 'in_progress').length, color: 'text-primary-600', bg: 'from-primary-50 to-sky-50', border: 'border-primary-100' },
                  { label: 'Completed', value: projects.filter((p) => p.status === 'completed').length, color: 'text-accent-600', bg: 'from-accent-50 to-emerald-50', border: 'border-accent-100' },
                  { label: 'Unread Messages', value: messages.filter((m) => m.receiver_id === profile?.id && !m.read_at).length, color: 'text-sky-600', bg: 'from-sky-50 to-blue-50', border: 'border-sky-100' },
                  { label: 'Classes This Week', value: upcomingClasses.length, color: 'text-violet-600', bg: 'from-violet-50 to-purple-50', border: 'border-violet-100' },
                ].map((stat) => (
                  <div key={stat.label} className={`p-6 bg-gradient-to-br ${stat.bg} border ${stat.border} rounded-3xl shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="text-secondary-500 text-xs font-semibold uppercase tracking-wider mb-3">{stat.label}</div>
                    <div className={`font-display text-4xl font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Upcoming Classes */}
              {upcomingClasses.length > 0 && (
                <div>
                  <h2 className="font-display text-base font-bold text-primary-900 mb-4 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary-400" /> Upcoming Classes
                  </h2>
                  <div className="space-y-3">
                    {upcomingClasses.slice(0, 3).map((c) => (
                      <div key={c.id} className="flex items-center gap-4 p-5 bg-white/80 backdrop-blur-sm border border-primary-100 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md shadow-primary-300/40 shrink-0">
                          <CalendarDays className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-primary-900 font-semibold">{c.title}</p>
                          <p className="text-primary-500 text-sm">{format(parseISO(c.date), 'EEEE, MMM d')} at {c.start_time}</p>
                        </div>
                        {c.location && (
                          <div className="flex items-center gap-1 text-primary-400 text-sm">
                            <MapPin className="w-3.5 h-3.5" />{c.location}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Announcements */}
              {announcements.length > 0 && (
                <div>
                  <h2 className="font-display text-base font-bold text-primary-900 mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary-400" /> Recent Announcements
                  </h2>
                  <div className="space-y-3">
                    {announcements.slice(0, 2).map((a) => (
                      <div key={a.id} className={`p-5 rounded-2xl border shadow-sm ${a.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-white/80 border-primary-100'}`}>
                        <div className="flex items-start gap-3">
                          {a.priority === 'high' && <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                          <div>
                            <p className="text-primary-900 font-semibold">{a.title}</p>
                            <p className="text-primary-600/70 text-sm mt-1 line-clamp-2">{a.content}</p>
                            <p className="text-primary-400 text-xs mt-2">{format(parseISO(a.created_at), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Polls */}
              {unvotedPollCount > 0 && (
                <div>
                  <h2 className="font-display text-base font-bold text-primary-900 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-amber-400" />
                    Polls Awaiting Your Vote
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-semibold">{unvotedPollCount}</span>
                  </h2>
                  <div className="space-y-3">
                    {polls.filter((p) => !myVotes.some((v) => v.poll_id === p.id)).slice(0, 2).map((poll) => (
                      <div key={poll.id} className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                          <BarChart2 className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-primary-900 font-semibold truncate">{poll.question}</p>
                          <p className="text-primary-500 text-xs mt-0.5">Your vote is needed</p>
                        </div>
                        <button onClick={() => setActiveTab('polls')} className="shrink-0 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                          Vote
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Projects ── */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <PageHeader title="My Projects" subtitle="Projects assigned by your mentors" />
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <EmptyState icon={FolderGit} message="No projects assigned yet. Your mentor will assign projects to you." />
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className="p-6 bg-white/80 backdrop-blur-sm border border-primary-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {project.status === 'completed'
                              ? <CheckCircle2 className="w-5 h-5 text-accent-500" />
                              : <Circle className="w-5 h-5 text-primary-300" />}
                            <h3 className="text-primary-900 font-bold text-lg">{project.title}</h3>
                          </div>
                          {project.description && <p className="text-primary-600/70 mt-1">{project.description}</p>}
                          {project.mentor_notes && (
                            <div className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded-xl">
                              <p className="text-primary-700 text-sm"><span className="font-semibold">Mentor Notes:</span> {project.mentor_notes}</p>
                            </div>
                          )}
                          {project.due_date && (
                            <p className="text-primary-400 text-sm mt-3">Due: {format(parseISO(project.due_date), 'MMMM d, yyyy')}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 ${
                          project.status === 'completed' ? 'bg-accent-100 text-accent-700'
                          : project.status === 'in_progress' ? 'bg-primary-100 text-primary-700'
                          : project.status === 'review' ? 'bg-amber-100 text-amber-700'
                          : 'bg-secondary-100 text-secondary-500'
                        }`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Messages ── */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <PageHeader title="Messages" subtitle="Communicate with your mentors" />

              <div className="bg-white/80 backdrop-blur-sm border border-primary-100 rounded-2xl p-4 shadow-sm">
                <label className="block text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">Send message to</label>
                <select
                  value={selectedAdmin || ''}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                  className="w-full bg-primary-50 border border-primary-200 rounded-xl px-4 py-2.5 text-primary-900 focus:outline-none focus:border-primary-400 transition-colors text-sm"
                >
                  <option value="">Select a mentor</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>{admin.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <EmptyState icon={MessageSquare} message="No messages yet. Start a conversation with a mentor." />
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === profile?.id;
                    return (
                      <div key={msg.id} className={`group relative p-4 rounded-2xl ${isOwn ? 'bg-gradient-to-r from-primary-500 to-primary-400 ml-10 shadow-md shadow-primary-200/50' : 'bg-white/80 border border-primary-100 shadow-sm mr-10'}`}>
                        <p className={`pr-7 ${isOwn ? 'text-white' : 'text-primary-900'}`}>{msg.content}</p>
                        <p className={`text-xs mt-2 ${isOwn ? 'text-primary-100/70' : 'text-primary-400'}`}>
                          {isOwn ? 'You' : 'Mentor'} · {format(parseISO(msg.created_at), 'MMM d, h:mm a')}
                        </p>
                        {isOwn && (
                          <button onClick={() => handleDeleteMessage(msg.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white transition-all" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {selectedAdmin && (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/80 border border-primary-200 rounded-2xl px-4 py-3 text-primary-900 placeholder-primary-300 focus:border-primary-400 focus:outline-none shadow-sm transition-colors"
                  />
                  <button type="submit" disabled={sending || !newMessage.trim()} className="px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500 text-white rounded-2xl disabled:opacity-50 shadow-md shadow-primary-300/40 transition-all">
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── Planner ── */}
          {activeTab === 'planner' && (
            <div className="space-y-6">
              <PageHeader title="Class Planner" subtitle="Your upcoming scheduled sessions" />
              <div className="space-y-4">
                {classes.length === 0 ? (
                  <EmptyState icon={CalendarDays} message="No upcoming classes scheduled yet." />
                ) : (
                  classes.filter((c) => parseISO(c.date) >= new Date(new Date().setHours(0, 0, 0, 0))).map((c) => {
                    const classDate = parseISO(c.date);
                    let dateLabel = format(classDate, 'MMMM d, yyyy');
                    if (isToday(classDate)) dateLabel = 'Today';
                    else if (isTomorrow(classDate)) dateLabel = 'Tomorrow';
                    return (
                      <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 bg-white/80 backdrop-blur-sm border border-primary-100 rounded-3xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-300/40 shrink-0">
                            <CalendarDays className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-primary-900 font-bold text-lg">{c.title}</h3>
                            {c.description && <p className="text-primary-500 text-sm mt-0.5">{c.description}</p>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-xl text-primary-700">
                            <Clock className="w-3.5 h-3.5 text-primary-400" />
                            {dateLabel} · {c.start_time}–{c.end_time}
                          </span>
                          {c.location && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-xl text-primary-700">
                              <MapPin className="w-3.5 h-3.5 text-primary-400" />{c.location}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── Notes ── */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              <PageHeader title="Class Notes" subtitle="Select a class to view or write your notes" />
              {classes.length === 0 ? (
                <EmptyState icon={StickyNote} message="No classes available yet. Notes will appear here once classes are scheduled." />
              ) : (
                <>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {classes.map((c) => {
                      const isSelected = selectedClassId === c.id;
                      const att = attendance.find((a) => a.class_id === c.id);
                      const wasAbsent = att?.status === 'absent';
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedClassId(c.id);
                            const existing = notes.find((n) => n.class_id === c.id);
                            setNoteDraft(existing?.content || '');
                          }}
                          className={`flex-shrink-0 px-5 py-3 rounded-2xl border-2 transition-all text-left ${
                            isSelected
                              ? wasAbsent ? 'bg-red-50 border-red-400 shadow-md' : 'bg-primary-500 border-primary-500 shadow-lg shadow-primary-300/40'
                              : wasAbsent ? 'bg-white border-red-200 hover:border-red-300' : 'bg-white/80 border-primary-100 hover:border-primary-300'
                          }`}
                        >
                          <div className={`font-semibold whitespace-nowrap text-sm ${isSelected && !wasAbsent ? 'text-white' : 'text-primary-900'}`}>{c.title}</div>
                          <div className={`text-xs mt-0.5 ${isSelected && !wasAbsent ? 'text-primary-100' : 'text-primary-400'}`}>
                            {format(parseISO(c.date), 'MMM d, yyyy')}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedClassId ? (
                    (() => {
                      const selectedClass = classes.find((c) => c.id === selectedClassId)!;
                      const att = attendance.find((a) => a.class_id === selectedClassId);
                      const wasAbsent = att?.status === 'absent';
                      return (
                        <div className={`p-6 rounded-3xl border-2 bg-white/80 backdrop-blur-sm shadow-sm ${wasAbsent ? 'border-red-200' : 'border-primary-100'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <div>
                              <h2 className="font-display text-xl font-bold text-primary-900">{selectedClass.title}</h2>
                              <div className="flex items-center gap-3 mt-1 text-sm text-primary-400">
                                <span>{format(parseISO(selectedClass.date), 'EEEE, MMM d, yyyy')}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selectedClass.start_time}–{selectedClass.end_time}</span>
                                {selectedClass.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedClass.location}</span>}
                              </div>
                            </div>
                          </div>

                          {wasAbsent && (
                            <div className="mb-5 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                              </div>
                              <div>
                                <p className="text-red-700 font-semibold">You missed this class</p>
                                <p className="text-red-500 text-sm">Review the materials below and catch up on what you missed.</p>
                              </div>
                            </div>
                          )}

                          {att && !wasAbsent && (
                            <div className={`mb-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                              att.status === 'present' ? 'bg-accent-50 text-accent-700 border border-accent-200'
                              : att.status === 'late' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}>
                              <CheckCircle2 className="w-4 h-4" />
                              {att.status === 'present' ? 'You attended this class' : att.status === 'late' ? 'You were late' : 'Absence excused'}
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">Your Notes</label>
                            <textarea
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              rows={10}
                              placeholder="Write your notes for this class here..."
                              className="w-full bg-primary-50/50 border border-primary-200 rounded-2xl px-4 py-3 text-primary-900 placeholder-primary-300 focus:border-primary-400 focus:outline-none resize-y transition-colors text-sm"
                            />
                            <div className="flex items-center justify-between mt-3">
                              <p className="text-primary-400 text-xs">
                                {notes.find((n) => n.class_id === selectedClassId)
                                  ? `Saved ${format(parseISO(notes.find((n) => n.class_id === selectedClassId)!.updated_at), 'MMM d, h:mm a')}`
                                  : 'Not saved yet'}
                              </p>
                              <button
                                onClick={async () => {
                                  if (!profile) return;
                                  setNoteSaving(true);
                                  try {
                                    const existing = notes.find((n) => n.class_id === selectedClassId);
                                    if (existing) {
                                      await supabase.from('notes').update({ content: noteDraft, updated_at: new Date().toISOString() }).eq('id', existing.id);
                                    } else {
                                      await supabase.from('notes').insert({ class_id: selectedClassId, student_id: profile.id, content: noteDraft });
                                    }
                                    fetchDashboardData();
                                  } catch (error) {
                                    console.error('Error saving note:', error);
                                  } finally {
                                    setNoteSaving(false);
                                  }
                                }}
                                disabled={noteSaving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500 text-white rounded-xl font-semibold disabled:opacity-50 transition-all shadow-md shadow-primary-300/40 text-sm"
                              >
                                {noteSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Notes</>}
                              </button>
                            </div>
                          </div>

                          {(() => {
                            const materials = classNoteFiles.filter((f) => f.class_id === selectedClassId);
                            if (materials.length === 0) return null;
                            const getUrl = (path: string) => supabase.storage.from('class-notes').getPublicUrl(path).data.publicUrl;
                            const fmtSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                            const fIcon = (type: string) => {
                              if (type.startsWith('image/')) return <File className="w-4 h-4 text-sky-400" />;
                              if (type === 'application/pdf') return <FileText className="w-4 h-4 text-red-400" />;
                              if (type.includes('presentation') || type.includes('powerpoint')) return <FileText className="w-4 h-4 text-orange-400" />;
                              if (type.includes('word') || type.includes('document')) return <FileText className="w-4 h-4 text-blue-400" />;
                              return <File className="w-4 h-4 text-primary-400" />;
                            };
                            return (
                              <div className="mt-6 pt-6 border-t border-primary-100">
                                <h3 className="text-primary-900 font-bold mb-3">Class Materials <span className="text-sm font-normal text-primary-400">({materials.length})</span></h3>
                                <div className="space-y-2">
                                  {materials.map((file) => {
                                    const url = getUrl(file.file_path);
                                    return (
                                      <div key={file.id} className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-100 rounded-xl">
                                        {file.file_type.startsWith('image/') ? (
                                          <img src={url} alt={file.title} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                                        ) : (
                                          <div className="w-10 h-10 rounded-xl bg-white border border-primary-100 flex items-center justify-center shrink-0 shadow-sm">{fIcon(file.file_type)}</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-primary-900 text-sm font-semibold truncate">{file.title}</p>
                                          {file.description && <p className="text-primary-500 text-xs truncate">{file.description}</p>}
                                          <p className="text-primary-400 text-xs">{fmtSize(file.file_size)}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 text-primary-400 hover:text-primary-600 transition-colors" title="Open"><ExternalLink className="w-4 h-4" /></a>
                                          <a href={url} download={file.file_name} className="p-2 text-primary-400 hover:text-primary-600 transition-colors" title="Download"><Download className="w-4 h-4" /></a>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-16 text-primary-300">
                      <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p className="text-primary-500">Select a class above to view or write your notes</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Announcements ── */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <PageHeader title="Announcements" subtitle="Updates and notices from your mentors" />
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <EmptyState icon={Bell} message="No announcements yet." />
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} className={`p-6 rounded-3xl border shadow-sm ${
                      a.priority === 'high' ? 'bg-red-50 border-red-200'
                      : a.priority === 'low' ? 'bg-white/60 border-primary-50'
                      : 'bg-white/80 border-primary-100'
                    }`}>
                      <div className="flex items-start gap-4">
                        {a.priority === 'high' && <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />}
                        <div>
                          <h3 className="text-primary-900 font-bold text-lg">{a.title}</h3>
                          <p className="text-primary-600/70 mt-2 whitespace-pre-wrap">{a.content}</p>
                          <p className="text-primary-400 text-sm mt-3">{format(parseISO(a.created_at), 'MMMM d, yyyy')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Polls ── */}
          {activeTab === 'polls' && (
            <div className="space-y-6">
              <PageHeader title="Polls" subtitle="Vote on polls created by your mentors" />
              {polls.length === 0 ? (
                <EmptyState icon={BarChart2} message="No active polls right now. Check back later!" />
              ) : (
                <div className="space-y-5">
                  {polls.map((poll) => {
                    const options = pollOptions.filter((o) => o.poll_id === poll.id).sort((a, b) => a.display_order - b.display_order);
                    const myPollVotes = myVotes.filter((v) => v.poll_id === poll.id);
                    const hasVoted = myPollVotes.length > 0;
                    const myLastVote = myPollVotes[myPollVotes.length - 1];
                    const canVoteAgain = poll.allow_multiple_votes;
                    const showVotingUI = !hasVoted || canVoteAgain;
                    const isExpanding = votingPollId === poll.id;

                    return (
                      <div key={poll.id} className="p-6 bg-white/80 backdrop-blur-sm border border-primary-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start gap-3 mb-5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md shadow-primary-300/40 shrink-0">
                            <BarChart2 className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-primary-900 font-bold text-lg leading-tight">{poll.question}</h3>
                            {poll.description && <p className="text-primary-500 text-sm mt-1">{poll.description}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {!hasVoted && <span className="px-2.5 py-1 bg-amber-100 text-amber-600 rounded-full text-xs font-semibold">New</span>}
                            {canVoteAgain && <span className="px-2.5 py-1 bg-sky-100 text-sky-600 rounded-full text-xs font-semibold">Multi-vote</span>}
                          </div>
                        </div>

                        {hasVoted && canVoteAgain && (
                          <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-sky-50 border border-sky-200 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                            <p className="text-sky-700 text-sm">
                              Last vote: <span className="font-semibold text-primary-900">{options.find((o) => o.id === myLastVote?.option_id)?.option_text}</span>
                              <span className="text-sky-500 ml-2">· {myPollVotes.length} vote{myPollVotes.length !== 1 ? 's' : ''}</span>
                            </p>
                          </div>
                        )}

                        {!showVotingUI ? (
                          <div className="space-y-2">
                            {options.map((opt) => {
                              const isMyChoice = opt.id === myLastVote?.option_id;
                              return (
                                <div key={opt.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${isMyChoice ? 'border-primary-400 bg-primary-50' : 'border-primary-100 bg-primary-50/30'}`}>
                                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isMyChoice ? 'border-primary-500' : 'border-primary-200'}`}>
                                    {isMyChoice && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                                  </div>
                                  <span className={`text-sm font-medium ${isMyChoice ? 'text-primary-900' : 'text-primary-500'}`}>{opt.option_text}</span>
                                  {isMyChoice && <CheckCircle2 className="w-4 h-4 text-primary-500 ml-auto shrink-0" />}
                                </div>
                              );
                            })}
                            <p className="text-primary-400 text-xs mt-1">Your vote has been recorded.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {options.map((opt) => {
                              const isSelected = selectedOptionId === opt.id && isExpanding;
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => { setVotingPollId(poll.id); setSelectedOptionId(opt.id); }}
                                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                    isSelected
                                      ? 'border-primary-400 bg-primary-50 text-primary-900'
                                      : 'border-primary-100 bg-primary-50/30 text-primary-600 hover:border-primary-300 hover:bg-primary-50'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-primary-500' : 'border-primary-300'}`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                                  </div>
                                  <span className="font-medium text-sm">{opt.option_text}</span>
                                </button>
                              );
                            })}
                            {isExpanding && selectedOptionId && (
                              <button
                                onClick={async () => {
                                  if (!profile || !selectedOptionId) return;
                                  setPollSubmitting(true);
                                  try {
                                    const { error } = await supabase.from('poll_votes').insert({ poll_id: poll.id, option_id: selectedOptionId, student_id: profile.id });
                                    if (!error) { setSelectedOptionId(null); setVotingPollId(null); fetchDashboardData(); }
                                  } catch (err) {
                                    console.error('Error submitting vote:', err);
                                  } finally {
                                    setPollSubmitting(false);
                                  }
                                }}
                                disabled={pollSubmitting}
                                className="w-full mt-1 py-3 bg-gradient-to-r from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-primary-300/40"
                              >
                                {pollSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : canVoteAgain && hasVoted ? 'Vote Again' : 'Submit Vote'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Settings ── */}
          {activeTab === 'settings' && (
            <SettingsTab profile={profile!} onUpdate={fetchDashboardData} />
          )}
        </div>
      </main>
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <h1 className="font-display text-2xl font-bold text-primary-900">{title}</h1>
      <p className="text-primary-500 mt-1 text-sm">{subtitle}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-16 bg-white/60 rounded-3xl border border-primary-100">
      <Icon className="w-10 h-10 mx-auto mb-3 text-primary-200" />
      <p className="text-primary-400 text-sm">{message}</p>
    </div>
  );
}

function SettingsTab({ profile, onUpdate }: { profile: NonNullable<ReturnType<typeof useAuth>['profile']>; onUpdate: () => void }) {
  const [form, setForm] = useState({ full_name: profile.full_name, email: profile.email, phone: profile.phone || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setForm({ full_name: profile.full_name, email: profile.email, phone: profile.phone || '' });
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updates: Record<string, string | null> = { full_name: form.full_name.trim() };
      updates.phone = form.phone.trim() || null;
      const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (updateError) throw updateError;
      if (form.email !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: form.email.trim() });
        if (authError) throw new Error('Email update pending. Check your inbox to confirm the change.');
      }
      setSuccess(true);
      onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full bg-primary-50/50 border border-primary-200 rounded-2xl px-4 py-3 text-primary-900 placeholder-primary-300 focus:border-primary-400 focus:outline-none transition-colors text-sm';

  return (
    <div className="space-y-6">
      <PageHeader title="Account Settings" subtitle="Update your profile information and credentials." />
      <div className="bg-white/80 backdrop-blur-sm border border-primary-100 rounded-3xl p-6 max-w-xl shadow-sm">
        <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-primary-50 to-sky-50 rounded-2xl border border-primary-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md shadow-primary-300/40">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-primary-900 font-bold">{profile.full_name}</p>
            <p className="text-primary-400 text-sm">{profile.email}</p>
          </div>
        </div>

        {error && <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">{error}</div>}
        {success && (
          <div className="mb-5 p-4 bg-accent-50 border border-accent-200 rounded-2xl text-accent-700 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">Full Name</label>
            <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">Email Address</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputCls} />
            {form.email !== profile.email && (
              <p className="text-amber-500 text-xs mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> You'll need to confirm the new email before it takes effect.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">Phone Number</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" className={inputCls} />
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500 text-white rounded-2xl font-semibold disabled:opacity-50 transition-all shadow-md shadow-primary-300/40 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
