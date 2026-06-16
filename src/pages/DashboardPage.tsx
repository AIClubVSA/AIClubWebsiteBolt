import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Project, Message, Announcement, Class } from '../types/database';
import {
  Brain,
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
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';

type TabType = 'overview' | 'projects' | 'messages' | 'planner' | 'announcements';

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

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  async function fetchDashboardData() {
    try {
      const [projectsRes, messagesRes, announcementsRes, classesRes, adminsRes] = await Promise.all([
        supabase.from('projects').select('*').eq('student_id', profile!.id).order('created_at', { ascending: false }),
        supabase.from('messages').select('*').or(`sender_id.eq.${profile!.id},receiver_id.eq.${profile!.id}`).order('created_at', { ascending: false }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('classes').select('*').order('date', { ascending: true }),
        supabase.from('profiles').select('id, full_name').eq('role', 'admin'),
      ]);

      setProjects(projectsRes.data || []);
      setMessages(messagesRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      setClasses(classesRes.data || []);
      setAdmins(adminsRes.data || []);
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

  const upcomingClasses = classes.filter((c) => {
    const classDate = parseISO(c.date);
    return classDate >= new Date() && isThisWeek(classDate, { weekStartsOn: 1 });
  });

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'My Projects', icon: FolderGit },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'planner', label: 'Class Planner', icon: CalendarDays },
    { id: 'announcements', label: 'Announcements', icon: Bell },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-secondary-800 border-r border-secondary-700 hidden lg:block">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Brain className="w-8 h-8 text-primary-400" />
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
                <item.icon className="w-5 h-5" />
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
        <header className="lg:hidden fixed top-0 left-0 right-0 bg-secondary-800 border-b border-secondary-700 z-40">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary-400" />
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
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="pt-28 lg:pt-8 p-4 lg:p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white mb-1">
                  Welcome back, {profile?.full_name.split(' ')[0]}!
                </h1>
                <p className="text-secondary-400">Here's what's happening with your AI journey</p>
              </div>

              {/* Quick Stats */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-1">Active Projects</div>
                  <div className="font-display text-3xl font-bold text-white">
                    {projects.filter((p) => p.status === 'in_progress').length}
                  </div>
                </div>
                <div className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-1">Completed</div>
                  <div className="font-display text-3xl font-bold text-accent-400">
                    {projects.filter((p) => p.status === 'completed').length}
                  </div>
                </div>
                <div className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-1">Unread Messages</div>
                  <div className="font-display text-3xl font-bold text-primary-400">
                    {messages.filter((m) => m.receiver_id === profile?.id && !m.read_at).length}
                  </div>
                </div>
                <div className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-1">Classes This Week</div>
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
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-secondary-400">
                    No messages yet. Start a conversation with an admin.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-xl ${
                        msg.sender_id === profile?.id
                          ? 'bg-primary-500/10 border border-primary-500/20 ml-8'
                          : 'bg-secondary-800/50 border border-secondary-700/50 mr-8'
                      }`}
                    >
                      <p className="text-white">{msg.content}</p>
                      <p className="text-secondary-500 text-xs mt-2">
                        {format(parseISO(msg.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  ))
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
        </div>
      </main>
    </div>
  );
}

