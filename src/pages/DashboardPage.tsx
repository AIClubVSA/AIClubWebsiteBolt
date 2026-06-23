import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  async function fetchDashboardData() {
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
  }

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
      <div className="min-h-screen bg-[#162132] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#162132]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-secondary-900 border-r border-secondary-700/60 hidden lg:block">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <img src="/images/WhatsApp_Image_2026-06-03_at_5.22.16_PM.jpeg" className="w-8 h-8 object-contain rounded" alt="AI Club" />
            <span className="font-display text-xl font-bold text-white">AI Centre</span>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                    : 'text-secondary-400 hover:text-white hover:bg-secondary-700/50'
                }`}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border border-secondary-900 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold leading-none">{item.badge > 9 ? '9+' : item.badge}</span>
                    </span>
                  )}
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-secondary-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-primary-400 font-semibold">
                {profile?.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{profile?.full_name}</p>
              <p className="text-secondary-500 text-sm truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-secondary-400 hover:text-white hover:bg-secondary-700/50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 bg-secondary-900 border-b border-secondary-700/60 z-40">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <img src="/images/WhatsApp_Image_2026-06-03_at_5.22.16_PM.jpeg" className="w-6 h-6 object-contain rounded" alt="AI Club" />
              <span className="font-display text-lg font-bold text-white">AI Centre</span>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-secondary-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-1 p-2 overflow-x-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-secondary-400 hover:text-white'
                }`}
              >
                <div className="relative">
                  <item.icon className="w-4 h-4" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-secondary-900" />
                  )}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="pt-28 lg:pt-8 p-5 lg:p-10">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="font-display text-3xl font-bold text-white mb-2">
                  Welcome back, {profile?.full_name.split(' ')[0]}!
                </h1>
                <p className="text-secondary-400">Here's what's happening with your AI journey</p>
              </div>

              {/* Quick Stats */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-7 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-2">Active Projects</div>
                  <div className="font-display text-3xl font-bold text-white">
                    {projects.filter((p) => p.status === 'in_progress').length}
                  </div>
                </div>
                <div className="p-7 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-2">Completed</div>
                  <div className="font-display text-3xl font-bold text-accent-400">
                    {projects.filter((p) => p.status === 'completed').length}
                  </div>
                </div>
                <div className="p-7 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-2">Unread Messages</div>
                  <div className="font-display text-3xl font-bold text-primary-400">
                    {messages.filter((m) => m.receiver_id === profile?.id && !m.read_at).length}
                  </div>
                </div>
                <div className="p-7 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-2">Classes This Week</div>
                  <div className="font-display text-3xl font-bold text-white">
                    {upcomingClasses.length}
                  </div>
                </div>
              </div>

              {/* Upcoming Classes */}
              {upcomingClasses.length > 0 && (
                <div>
                  <h2 className="font-display text-lg font-semibold text-white mb-4">Upcoming Classes</h2>
                  <div className="space-y-3">
                    {upcomingClasses.slice(0, 3).map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-4 p-4 bg-secondary-800/50 border border-secondary-700/50 rounded-xl"
                      >
                        <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center">
                          <CalendarDays className="w-6 h-6 text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{c.title}</p>
                          <p className="text-secondary-400 text-sm">
                            {format(parseISO(c.date), 'EEEE, MMM d')} at {c.start_time}
                          </p>
                        </div>
                        {c.location && (
                          <div className="flex items-center gap-1 text-secondary-500 text-sm">
                            <MapPin className="w-4 h-4" />
                            {c.location}
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
                  <h2 className="font-display text-lg font-semibold text-white mb-4">Recent Announcements</h2>
                  <div className="space-y-3">
                    {announcements.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className={`p-4 rounded-xl border ${
                          a.priority === 'high'
                            ? 'bg-red-500/10 border-red-500/20'
                            : 'bg-secondary-800/50 border-secondary-700/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {a.priority === 'high' && (
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="text-white font-medium">{a.title}</p>
                            <p className="text-secondary-400 text-sm mt-1 line-clamp-2">{a.content}</p>
                            <p className="text-secondary-500 text-xs mt-2">
                              {format(parseISO(a.created_at), 'MMM d, yyyy')}
                            </p>
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
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="font-display text-lg font-semibold text-white">Polls Awaiting Your Vote</h2>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">{unvotedPollCount}</span>
                  </div>
                  <div className="space-y-3">
                    {polls.filter((p) => !myVotes.some((v) => v.poll_id === p.id)).slice(0, 2).map((poll) => (
                      <div key={poll.id} className="p-4 bg-secondary-800/50 border border-amber-500/20 rounded-xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <BarChart2 className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{poll.question}</p>
                          <p className="text-secondary-400 text-xs mt-0.5">Your vote is needed</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('polls')}
                          className="shrink-0 px-3 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg text-sm font-medium transition-colors"
                        >
                          Vote Now
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-white">My Projects</h1>

              <div className="space-y-4">
                {projects.length === 0 ? (
                  <div className="text-center py-12 text-secondary-400">
                    No projects assigned yet. Your mentor will assign projects to you.
                  </div>
                ) : (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {project.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-accent-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-secondary-500" />
                            )}
                            <h3 className="text-white font-semibold text-lg">{project.title}</h3>
                          </div>
                          {project.description && (
                            <p className="text-secondary-400 mt-1">{project.description}</p>
                          )}
                          {project.mentor_notes && (
                            <div className="mt-3 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                              <p className="text-primary-300 text-sm">
                                <span className="font-medium">Mentor Notes:</span> {project.mentor_notes}
                              </p>
                            </div>
                          )}
                          {project.due_date && (
                            <p className="text-secondary-500 text-sm mt-3">
                              Due: {format(parseISO(project.due_date), 'MMMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            project.status === 'completed'
                              ? 'bg-accent-500/20 text-accent-400'
                              : project.status === 'in_progress'
                              ? 'bg-primary-500/20 text-primary-400'
                              : project.status === 'review'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-secondary-700 text-secondary-400'
                          }`}
                        >
                          {project.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-white">Messages</h1>

              {/* Admin Selection */}
              <div className="bg-secondary-800/50 border border-secondary-700/50 rounded-xl p-4">
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Send message to admin
                </label>
                <select
                  value={selectedAdmin || ''}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select an admin</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message List */}
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-secondary-400">
                    No messages yet. Start a conversation with an admin.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === profile?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`group relative p-4 rounded-xl ${
                          isOwn
                            ? 'bg-primary-500/10 border border-primary-500/20 ml-8'
                            : 'bg-secondary-800/50 border border-secondary-700/50 mr-8'
                        }`}
                      >
                        <p className="text-white pr-7">{msg.content}</p>
                        <p className="text-secondary-500 text-xs mt-2">
                          {isOwn ? 'You' : 'Admin'} · {format(parseISO(msg.created_at), 'MMM d, h:mm a')}
                        </p>
                        {isOwn && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-secondary-500 hover:text-red-400 transition-all"
                            title="Delete message"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Send Message */}
              {selectedAdmin && (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-secondary-800 border border-secondary-700 rounded-xl px-4 py-3 text-white placeholder-secondary-500 focus:border-primary-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Planner Tab */}
          {activeTab === 'planner' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-white">Class Planner</h1>

              <div className="space-y-4">
                {classes.length === 0 ? (
                  <div className="text-center py-12 text-secondary-400">
                    No upcoming classes scheduled yet.
                  </div>
                ) : (
                  classes
                    .filter((c) => parseISO(c.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                    .map((c) => {
                      const classDate = parseISO(c.date);
                      let dateLabel = format(classDate, 'MMMM d, yyyy');
                      if (isToday(classDate)) dateLabel = 'Today';
                      else if (isTomorrow(classDate)) dateLabel = 'Tomorrow';

                      return (
                        <div
                          key={c.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-14 h-14 rounded-xl bg-primary-500/10 flex items-center justify-center">
                              <CalendarDays className="w-7 h-7 text-primary-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-semibold text-lg">{c.title}</h3>
                              {c.description && (
                                <p className="text-secondary-400 text-sm mt-1">{c.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary-700/50 rounded-lg">
                              <Clock className="w-4 h-4 text-secondary-400" />
                              <span className="text-white">
                                {dateLabel} | {c.start_time} - {c.end_time}
                              </span>
                            </div>
                            {c.location && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary-700/50 rounded-lg">
                                <MapPin className="w-4 h-4 text-secondary-400" />
                                <span className="text-white">{c.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Class Notes</h1>
                <p className="text-secondary-400 mt-1">Select a class to view or write your notes.</p>
              </div>

              {classes.length === 0 ? (
                <div className="text-center py-12 text-secondary-400">
                  No classes available yet. Notes will appear here once classes are scheduled.
                </div>
              ) : (
                <>
                  {/* Class selector */}
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
                          className={`flex-shrink-0 px-5 py-3 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? wasAbsent
                                ? 'bg-red-500/10 border-red-500'
                                : 'bg-primary-500/10 border-primary-500'
                              : wasAbsent
                              ? 'bg-secondary-800/50 border-red-500/40'
                              : 'bg-secondary-800/50 border-secondary-700/50 hover:border-secondary-600'
                          }`}
                        >
                          <div className="text-white font-medium whitespace-nowrap">{c.title}</div>
                          <div className="text-secondary-400 text-xs mt-0.5">
                            {format(parseISO(c.date), 'MMM d, yyyy')}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected class notes panel */}
                  {selectedClassId ? (
                    (() => {
                      const selectedClass = classes.find((c) => c.id === selectedClassId)!;
                      const att = attendance.find((a) => a.class_id === selectedClassId);
                      const wasAbsent = att?.status === 'absent';
                      return (
                        <div
                          className={`p-6 rounded-2xl border-2 ${
                            wasAbsent ? 'bg-red-500/5 border-red-500/60' : 'bg-secondary-800/50 border-secondary-700/50'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                              <h2 className="font-display text-xl font-bold text-white">{selectedClass.title}</h2>
                              <div className="flex items-center gap-3 mt-1 text-sm text-secondary-400">
                                <span>{format(parseISO(selectedClass.date), 'EEEE, MMM d, yyyy')}</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {selectedClass.start_time} - {selectedClass.end_time}
                                </span>
                                {selectedClass.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {selectedClass.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Absence warning */}
                          {wasAbsent && (
                            <div className="mb-4 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                              </div>
                              <div>
                                <p className="text-red-300 font-medium">You missed this class</p>
                                <p className="text-red-400/70 text-sm">
                                  You were marked absent. Review the class materials and catch up on what you missed.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Attendance status badge (non-absent) */}
                          {att && !wasAbsent && (
                            <div
                              className={`mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                                att.status === 'present'
                                  ? 'bg-green-500/10 text-green-400'
                                  : att.status === 'late'
                                  ? 'bg-yellow-500/10 text-yellow-400'
                                  : 'bg-blue-500/10 text-blue-400'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {att.status === 'present'
                                ? 'You attended this class'
                                : att.status === 'late'
                                ? 'You were late to this class'
                                : 'Your absence was excused'}
                            </div>
                          )}

                          {/* Notes textarea */}
                          <div>
                            <label className="block text-sm font-medium text-secondary-300 mb-2">Your Notes</label>
                            <textarea
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              rows={10}
                              placeholder="Write your notes for this class here..."
                              className="w-full bg-secondary-900 border border-secondary-700 rounded-xl px-4 py-3 text-white placeholder-secondary-500 focus:border-primary-500 focus:outline-none resize-y"
                            />
                            <div className="flex items-center justify-between mt-3">
                              <p className="text-secondary-500 text-xs">
                                {notes.find((n) => n.class_id === selectedClassId)
                                  ? `Last updated ${format(parseISO(notes.find((n) => n.class_id === selectedClassId)!.updated_at), 'MMM d, yyyy h:mm a')}`
                                  : 'Not saved yet'}
                              </p>
                              <button
                                onClick={async () => {
                                  if (!profile) return;
                                  setNoteSaving(true);
                                  try {
                                    const existing = notes.find((n) => n.class_id === selectedClassId);
                                    if (existing) {
                                      await supabase
                                        .from('notes')
                                        .update({ content: noteDraft, updated_at: new Date().toISOString() })
                                        .eq('id', existing.id);
                                    } else {
                                      await supabase.from('notes').insert({
                                        class_id: selectedClassId,
                                        student_id: profile.id,
                                        content: noteDraft,
                                      });
                                    }
                                    fetchDashboardData();
                                  } catch (error) {
                                    console.error('Error saving note:', error);
                                  } finally {
                                    setNoteSaving(false);
                                  }
                                }}
                                disabled={noteSaving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                              >
                                {noteSaving ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                ) : (
                                  <><Save className="w-4 h-4" /> Save Notes</>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Class materials uploaded by admin */}
                          {(() => {
                            const materials = classNoteFiles.filter((f) => f.class_id === selectedClassId);
                            if (materials.length === 0) return null;
                            const getUrl = (path: string) => {
                              const { data } = supabase.storage.from('class-notes').getPublicUrl(path);
                              return data.publicUrl;
                            };
                            const fmtSize = (bytes: number) => {
                              if (bytes < 1024) return `${bytes} B`;
                              if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                              return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                            };
                            const fIcon = (type: string) => {
                              if (type.startsWith('image/')) return <File className="w-4 h-4 text-blue-400" />;
                              if (type === 'application/pdf') return <FileText className="w-4 h-4 text-red-400" />;
                              if (type.includes('presentation') || type.includes('powerpoint')) return <FileText className="w-4 h-4 text-orange-400" />;
                              if (type.includes('word') || type.includes('document')) return <FileText className="w-4 h-4 text-blue-300" />;
                              return <File className="w-4 h-4 text-secondary-400" />;
                            };
                            return (
                              <div className="mt-6 pt-6 border-t border-secondary-700/50">
                                <h3 className="text-white font-semibold mb-3">
                                  Class Materials
                                  <span className="ml-2 text-sm font-normal text-secondary-400">({materials.length})</span>
                                </h3>
                                <div className="space-y-2.5">
                                  {materials.map((file) => {
                                    const url = getUrl(file.file_path);
                                    return (
                                      <div key={file.id} className="flex items-center gap-3 p-3 bg-secondary-900/50 border border-secondary-700/30 rounded-xl">
                                        {file.file_type.startsWith('image/') ? (
                                          <img src={url} alt={file.title} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                                        ) : (
                                          <div className="w-10 h-10 rounded-lg bg-secondary-700 flex items-center justify-center shrink-0">
                                            {fIcon(file.file_type)}
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-white text-sm font-medium truncate">{file.title}</p>
                                          {file.description && <p className="text-secondary-400 text-xs truncate">{file.description}</p>}
                                          <p className="text-secondary-500 text-xs">{fmtSize(file.file_size)}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 text-secondary-400 hover:text-primary-400 transition-colors" title="Open">
                                            <ExternalLink className="w-4 h-4" />
                                          </a>
                                          <a href={url} download={file.file_name} className="p-2 text-secondary-400 hover:text-primary-400 transition-colors" title="Download">
                                            <Download className="w-4 h-4" />
                                          </a>
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
                    <div className="text-center py-16 text-secondary-400">
                      <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>Select a class above to view or write your notes</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-white">Announcements</h1>

              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <div className="text-center py-12 text-secondary-400">No announcements yet.</div>
                ) : (
                  announcements.map((a) => (
                    <div
                      key={a.id}
                      className={`p-6 rounded-2xl border ${
                        a.priority === 'high'
                          ? 'bg-red-500/10 border-red-500/20'
                          : a.priority === 'low'
                          ? 'bg-secondary-800/30 border-secondary-700/30'
                          : 'bg-secondary-800/50 border-secondary-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {a.priority === 'high' && (
                          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                        )}
                        <div>
                          <h3 className="text-white font-semibold text-lg">{a.title}</h3>
                          <p className="text-secondary-300 mt-2 whitespace-pre-wrap">{a.content}</p>
                          <p className="text-secondary-500 text-sm mt-3">
                            {format(parseISO(a.created_at), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Polls Tab */}
          {activeTab === 'polls' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Polls</h1>
                <p className="text-secondary-400 mt-1">Vote on polls created by your mentors.</p>
              </div>

              {polls.length === 0 ? (
                <div className="text-center py-16 text-secondary-400">
                  <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No active polls right now. Check back later!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {polls.map((poll) => {
                    const options = pollOptions.filter((o) => o.poll_id === poll.id).sort((a, b) => a.display_order - b.display_order);
                    const myPollVotes = myVotes.filter((v) => v.poll_id === poll.id);
                    const hasVoted = myPollVotes.length > 0;
                    const myLastVote = myPollVotes[myPollVotes.length - 1];
                    const canVoteAgain = poll.allow_multiple_votes;
                    const showVotingUI = !hasVoted || canVoteAgain;
                    const isExpanding = votingPollId === poll.id;

                    return (
                      <div key={poll.id} className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                            <BarChart2 className="w-5 h-5 text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-lg leading-tight">{poll.question}</h3>
                            {poll.description && <p className="text-secondary-400 text-sm mt-1">{poll.description}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {!hasVoted && (
                              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">New</span>
                            )}
                            {canVoteAgain && (
                              <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">Multi-vote</span>
                            )}
                          </div>
                        </div>

                        {/* For multi-vote polls that have been voted on: show last vote status */}
                        {hasVoted && canVoteAgain && (
                          <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                            <p className="text-blue-300 text-sm">
                              Last vote: <span className="font-medium text-white">{options.find((o) => o.id === myLastVote?.option_id)?.option_text}</span>
                              <span className="text-blue-400 ml-2">· {myPollVotes.length} vote{myPollVotes.length !== 1 ? 's' : ''} cast</span>
                            </p>
                          </div>
                        )}

                        {!showVotingUI ? (
                          /* Read-only results for single-vote polls */
                          <div className="space-y-2">
                            {options.map((opt) => {
                              const isMyChoice = opt.id === myLastVote?.option_id;
                              return (
                                <div
                                  key={opt.id}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${
                                    isMyChoice
                                      ? 'border-primary-500 bg-primary-500/10'
                                      : 'border-secondary-700/30 bg-secondary-900/30'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isMyChoice ? 'border-primary-500' : 'border-secondary-600'}`}>
                                    {isMyChoice && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                                  </div>
                                  <span className={`text-sm font-medium ${isMyChoice ? 'text-white' : 'text-secondary-400'}`}>{opt.option_text}</span>
                                  {isMyChoice && <CheckCircle2 className="w-4 h-4 text-primary-400 ml-auto shrink-0" />}
                                </div>
                              );
                            })}
                            <p className="text-secondary-500 text-xs mt-1">Your vote has been recorded.</p>
                          </div>
                        ) : (
                          /* Voting UI (first-time or multi-vote re-vote) */
                          <div className="space-y-2">
                            {options.map((opt) => {
                              const isSelected = selectedOptionId === opt.id && isExpanding;
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => {
                                    setVotingPollId(poll.id);
                                    setSelectedOptionId(opt.id);
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                    isSelected
                                      ? 'border-primary-500 bg-primary-500/10 text-white'
                                      : 'border-secondary-700/50 bg-secondary-900/50 text-secondary-300 hover:border-secondary-600 hover:text-white'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-primary-500' : 'border-secondary-600'}`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                                  </div>
                                  <span className="font-medium">{opt.option_text}</span>
                                </button>
                              );
                            })}
                            {isExpanding && selectedOptionId && (
                              <button
                                onClick={async () => {
                                  if (!profile || !selectedOptionId) return;
                                  setPollSubmitting(true);
                                  try {
                                    const { error } = await supabase.from('poll_votes').insert({
                                      poll_id: poll.id,
                                      option_id: selectedOptionId,
                                      student_id: profile.id,
                                    });
                                    if (!error) {
                                      setSelectedOptionId(null);
                                      setVotingPollId(null);
                                      fetchDashboardData();
                                    }
                                  } catch (err) {
                                    console.error('Error submitting vote:', err);
                                  } finally {
                                    setPollSubmitting(false);
                                  }
                                }}
                                disabled={pollSubmitting}
                                className="w-full mt-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {pollSubmitting ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                                ) : canVoteAgain && hasVoted ? (
                                  'Vote Again'
                                ) : (
                                  'Submit Vote'
                                )}
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

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <SettingsTab profile={profile!} onUpdate={fetchDashboardData} />
          )}
        </div>
      </main>
    </div>
  );
}

// Settings Tab Component
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
      if (form.phone.trim()) updates.phone = form.phone.trim();
      else updates.phone = null;

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);
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

  const inputCls = 'w-full bg-secondary-900 border border-secondary-700 rounded-xl px-4 py-3 text-white placeholder-secondary-500 focus:border-primary-500 focus:outline-none transition-colors';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Account Settings</h1>
        <p className="text-secondary-400 mt-1">Update your profile information and credentials.</p>
      </div>

      <div className="bg-secondary-800/50 border border-secondary-700/50 rounded-2xl p-6 max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
            <User className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <p className="text-white font-semibold">{profile.full_name}</p>
            <p className="text-secondary-400 text-sm">{profile.email}</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-5 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-secondary-300 mb-2">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-300 mb-2">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className={inputCls}
            />
            {form.email !== profile.email && (
              <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                You'll need to confirm the new email address before it takes effect.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-300 mb-2">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 9876543210"
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}

