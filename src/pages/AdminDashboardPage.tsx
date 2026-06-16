import { useState, useEffect } from 'react';
import { useAuth, Profile } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Project, Announcement, Class, Message } from '../types/database';
import {
  Brain,
  LayoutDashboard,
  Users,
  FolderGit,
  MessageSquare,
  CalendarDays,
  Bell,
  LogOut,
  Plus,
  X,
  Loader2,
  Search,
  Edit,
  Trash2,
  Send,
  Eye,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

type AdminTabType = 'overview' | 'users' | 'projects' | 'messages' | 'classes' | 'announcements';

export default function AdminDashboardPage() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview');
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<(Project & { profiles: Profile })[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [messages, setMessages] = useState<(Message & { sender: Profile })[]>([]);
  const [stats, setStats] = useState({ students: 0, projects: 0, pendingMessages: 0, upcomingClasses: 0 });

  useEffect(() => {
    if (profile && profile.role === 'admin') {
      fetchAdminData();
    }
  }, [profile]);

  async function fetchAdminData() {
    try {
      const [studentsRes, projectsRes, announcementsRes, classesRes, messagesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }),
        supabase.from('projects').select('*, profiles!projects_student_id_fkey(*)').order('created_at', { ascending: false }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('classes').select('*').order('date', { ascending: true }),
        supabase.from('messages').select('*, sender:profiles!messages_sender_id_fkey(*)').eq('receiver_id', profile!.id).order('created_at', { ascending: false }),
      ]);

      setStudents(studentsRes.data || []);
      setProjects(projectsRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      setClasses(classesRes.data || []);
      setMessages(messagesRes.data || []);

      const today = new Date();
      setStats({
        students: studentsRes.data?.length || 0,
        projects: projectsRes.data?.length || 0,
        pendingMessages: messagesRes.data?.filter((m) => !m.read_at).length || 0,
        upcomingClasses: classesRes.data?.filter((c) => parseISO(c.date) >= today).length || 0,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Students', icon: Users },
    { id: 'projects', label: 'All Projects', icon: FolderGit },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'classes', label: 'Classes', icon: CalendarDays },
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

          <div className="px-4 py-2 mb-6 bg-primary-500/10 border border-primary-500/20 rounded-lg">
            <p className="text-primary-400 text-sm font-medium">Admin Panel</p>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTabType)}
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
            <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
              <span className="text-accent-400 font-semibold">{profile?.full_name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{profile?.full_name}</p>
              <p className="text-secondary-500 text-sm truncate">Administrator</p>
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
              <span className="font-display text-lg font-bold text-white">Admin</span>
            </div>
            <button onClick={signOut} className="p-2 text-secondary-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-1 p-2 overflow-x-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === item.id ? 'bg-primary-500/10 text-primary-400' : 'text-secondary-400 hover:text-white'
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
                <h1 className="font-display text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
                <p className="text-secondary-400">Manage the AI Centre platform</p>
              </div>

              {/* Stats */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-1">Total Students</div>
                  <div className="font-display text-3xl font-bold text-white">{stats.students}</div>
                </div>
                <div className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-1">Active Projects</div>
                  <div className="font-display text-3xl font-bold text-primary-400">{stats.projects}</div>
                </div>
                <div className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-1">Unread Messages</div>
                  <div className="font-display text-3xl font-bold text-accent-400">{stats.pendingMessages}</div>
                </div>
                <div className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-1">Upcoming Classes</div>
                  <div className="font-display text-3xl font-bold text-white">{stats.upcomingClasses}</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <h2 className="font-display text-lg font-semibold text-white mb-4">Recent Students</h2>
                  <div className="space-y-3">
                    {students.slice(0, 4).map((s) => (
                      <div key={s.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-medium text-sm">
                          {s.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{s.full_name}</p>
                          <p className="text-secondary-500 text-xs">{s.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <h2 className="font-display text-lg font-semibold text-white mb-4">Recent Messages</h2>
                  <div className="space-y-3">
                    {messages.slice(0, 4).map((m) => (
                      <div key={m.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-400 font-medium text-sm">
                          {m.sender?.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{m.sender?.full_name}</p>
                          <p className="text-secondary-400 text-xs truncate">{m.content}</p>
                        </div>
                        {!m.read_at && <div className="w-2 h-2 rounded-full bg-accent-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <UserManagement students={students} onUpdate={fetchAdminData} />
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <ProjectManagement projects={projects} students={students} onUpdate={fetchAdminData} />
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <MessageManagement messages={messages} profileId={profile!.id} onUpdate={fetchAdminData} />
          )}

          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <ClassManagement classes={classes} profileId={profile!.id} onUpdate={fetchAdminData} />
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <AnnouncementManagement
              announcements={announcements}
              profileId={profile!.id}
              onUpdate={fetchAdminData}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// User Management Component
function UserManagement({ students }: { students: Profile[]; onUpdate: () => void }) {
  const [search, setSearch] = useState('');

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Student Management</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="pl-10 pr-4 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-white placeholder-secondary-500"
          />
        </div>
      </div>

      <div className="bg-secondary-800/50 border border-secondary-700/50 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-secondary-700">
              <th className="text-left p-4 text-secondary-400 font-medium">Name</th>
              <th className="text-left p-4 text-secondary-400 font-medium hidden sm:table-cell">Email</th>
              <th className="text-left p-4 text-secondary-400 font-medium hidden md:table-cell">Joined</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="border-b border-secondary-700/50 last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold">
                      {student.full_name.charAt(0)}
                    </div>
                    <span className="text-white font-medium">{student.full_name}</span>
                  </div>
                </td>
                <td className="p-4 text-secondary-300 hidden sm:table-cell">{student.email}</td>
                <td className="p-4 text-secondary-300 hidden md:table-cell">
                  {format(parseISO(student.created_at), 'MMM d, yyyy')}
                </td>
                <td className="p-4">
                  <button className="text-secondary-400 hover:text-primary-400 transition-colors">
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStudents.length === 0 && (
          <div className="text-center py-8 text-secondary-400">No students found</div>
        )}
      </div>
    </div>
  );
}

// Project Management Component
function ProjectManagement({
  projects,
  students,
  onUpdate,
}: {
  projects: (Project & { profiles: Profile })[];
  students: Profile[];
  onUpdate: () => void;
}) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    student_id: '',
    due_date: '',
  });
  const [editForm, setEditForm] = useState({
    mentor_notes: '',
    status: 'not_started' as Project['status'],
  });
  const [saving, setSaving] = useState(false);

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('projects').insert({
        title: newForm.title,
        description: newForm.description,
        student_id: newForm.student_id,
        due_date: newForm.due_date || null,
        status: 'not_started',
      });
      if (error) throw error;
      setNewForm({ title: '', description: '', student_id: '', due_date: '' });
      setShowNewProject(false);
      onUpdate();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateProject() {
    if (!editingProject) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ mentor_notes: editForm.mentor_notes, status: editForm.status })
        .eq('id', editingProject.id);
      if (error) throw error;
      setEditingProject(null);
      onUpdate();
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject(projectId: string) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Project Management</h1>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          Assign Project
        </button>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary-800 border border-secondary-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-white">Assign New Project</h2>
              <button onClick={() => setShowNewProject(false)} className="text-secondary-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  required
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Description</label>
                <textarea
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Assign to Student</label>
                <select
                  value={newForm.student_id}
                  onChange={(e) => setNewForm({ ...newForm, student_id: e.target.value })}
                  required
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select a student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Due Date (optional)</label>
                <input
                  type="date"
                  value={newForm.due_date}
                  onChange={(e) => setNewForm({ ...newForm, due_date: e.target.value })}
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Assign Project'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary-800 border border-secondary-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-white">Edit Project</h2>
              <button onClick={() => setEditingProject(null)} className="text-secondary-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-secondary-700/50 rounded-lg">
                <p className="text-secondary-400 text-sm">Project:</p>
                <p className="text-white font-medium">{editingProject.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Project['status'] })}
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Under Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Mentor Notes</label>
                <textarea
                  value={editForm.mentor_notes}
                  onChange={(e) => setEditForm({ ...editForm, mentor_notes: e.target.value })}
                  rows={3}
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white resize-none"
                />
              </div>
              <button
                onClick={handleUpdateProject}
                disabled={saving}
                className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project List */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-12 text-secondary-400">No projects assigned yet. Click "Assign Project" to create one.</div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-semibold text-lg">{project.title}</h3>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-medium ${
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
                    </span>
                  </div>
                  {project.description && <p className="text-secondary-400 mb-3">{project.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-medium">
                        {project.profiles?.full_name?.charAt(0)}
                      </div>
                      <span className="text-secondary-300">{project.profiles?.full_name}</span>
                    </div>
                    {project.due_date && (
                      <span className="px-2 py-1 bg-secondary-700/50 rounded text-secondary-400">
                        Due: {format(parseISO(project.due_date), 'MMM d, yyyy')}
                      </span>
                    )}
                    {project.mentor_notes && (
                      <span className="text-secondary-500">| Has notes</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingProject(project);
                      setEditForm({
                        mentor_notes: project.mentor_notes || '',
                        status: project.status,
                      });
                    }}
                    className="p-2 text-secondary-400 hover:text-primary-400 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 text-secondary-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Message Management Component
function MessageManagement({
  messages,
  profileId,
  onUpdate,
}: {
  messages: (Message & { sender: Profile })[];
  profileId: string;
  onUpdate: () => void;
}) {
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderId: string; content: string } | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  async function handleMarkAsRead(messageId: string) {
    try {
      await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', messageId);
      onUpdate();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyingTo || !reply.trim()) return;
    setSending(true);
    try {
      await supabase.from('messages').insert({
        sender_id: profileId,
        receiver_id: replyingTo.senderId,
        content: reply.trim(),
      });
      setReplyingTo(null);
      setReply('');
      onUpdate();
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-white">Messages</h1>

      {/* Reply Modal */}
      {replyingTo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary-800 border border-secondary-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-white">Reply</h2>
              <button onClick={() => setReplyingTo(null)} className="text-secondary-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 bg-secondary-700/50 rounded-lg mb-4">
              <p className="text-secondary-400 text-sm">Original message:</p>
              <p className="text-white">{replyingTo.content}</p>
            </div>
            <form onSubmit={handleSendReply} className="space-y-4">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                placeholder="Type your reply..."
                className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white resize-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Message List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-secondary-400">No messages yet</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-6 rounded-2xl ${
                msg.read_at ? 'bg-secondary-800/30 border border-secondary-700/30' : 'bg-secondary-800/50 border border-secondary-700/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold">
                    {msg.sender?.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{msg.sender?.full_name}</p>
                      {!msg.read_at && <span className="w-2 h-2 rounded-full bg-accent-400" />}
                    </div>
                    <p className="text-secondary-300">{msg.content}</p>
                    <p className="text-secondary-500 text-sm mt-2">
                      {format(parseISO(msg.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!msg.read_at && (
                    <button
                      onClick={() => handleMarkAsRead(msg.id)}
                      className="p-2 text-secondary-400 hover:text-accent-400"
                      title="Mark as read"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setReplyingTo({ id: msg.id, senderId: msg.sender_id, content: msg.content })
                    }
                    className="p-2 text-secondary-400 hover:text-primary-400"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Class Management Component
function ClassManagement({
  classes,
  profileId,
  onUpdate,
}: {
  classes: Class[];
  profileId: string;
  onUpdate: () => void;
}) {
  const [showNewClass, setShowNewClass] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
  });
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setForm({ title: '', description: '', date: '', start_time: '', end_time: '', location: '' });
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('classes').insert({
        ...form,
        created_by: profileId,
      });
      if (error) throw error;
      setShowNewClass(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error creating class:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!editingClass) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('classes').update(form).eq('id', editingClass.id);
      if (error) throw error;
      setEditingClass(null);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error updating class:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteClass(classId: string) {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await supabase.from('classes').delete().eq('id', classId);
      onUpdate();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Class Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowNewClass(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          New Class
        </button>
      </div>

      {/* Modal */}
      {(showNewClass || editingClass) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary-800 border border-secondary-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-white">
                {editingClass ? 'Edit Class' : 'Create New Class'}
              </h2>
              <button
                onClick={() => {
                  setShowNewClass(false);
                  setEditingClass(null);
                  resetForm();
                }}
                className="text-secondary-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingClass ? handleUpdateClass : handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    required
                    className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">End Time</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    required
                    className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingClass ? 'Update Class' : 'Create Class'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Class List */}
      <div className="space-y-4">
        {classes.length === 0 ? (
          <div className="text-center py-12 text-secondary-400">No classes scheduled</div>
        ) : (
          classes.map((c) => (
            <div key={c.id} className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">{c.title}</h3>
                  {c.description && <p className="text-secondary-400 text-sm mt-1">{c.description}</p>}
                  <div className="flex flex-wrap gap-3 mt-3 text-sm">
                    <span className="px-3 py-1 bg-secondary-700/50 rounded-lg text-secondary-300">
                      {format(parseISO(c.date), 'MMM d, yyyy')}
                    </span>
                    <span className="px-3 py-1 bg-secondary-700/50 rounded-lg text-secondary-300">
                      {c.start_time} - {c.end_time}
                    </span>
                    {c.location && (
                      <span className="px-3 py-1 bg-secondary-700/50 rounded-lg text-secondary-300">
                        {c.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setForm({
                        title: c.title,
                        description: c.description || '',
                        date: c.date,
                        start_time: c.start_time,
                        end_time: c.end_time,
                        location: c.location || '',
                      });
                      setEditingClass(c);
                    }}
                    className="p-2 text-secondary-400 hover:text-primary-400"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(c.id)}
                    className="p-2 text-secondary-400 hover:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Announcement Management Component
function AnnouncementManagement({
  announcements,
  profileId,
  onUpdate,
}: {
  announcements: Announcement[];
  profileId: string;
  onUpdate: () => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal' as Announcement['priority'] });
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setForm({ title: '', content: '', priority: 'normal' });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await supabase.from('announcements').insert({ ...form, author_id: profileId });
      setShowNew(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await supabase.from('announcements').update(form).eq('id', editing.id);
      setEditing(null);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error updating announcement:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await supabase.from('announcements').delete().eq('id', id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Announcements</h1>
        <button
          onClick={() => {
            resetForm();
            setShowNew(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* Modal */}
      {(showNew || editing) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary-800 border border-secondary-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-white">
                {editing ? 'Edit Announcement' : 'Create Announcement'}
              </h2>
              <button
                onClick={() => {
                  setShowNew(false);
                  setEditing(null);
                  resetForm();
                }}
                className="text-secondary-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  required
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as Announcement['priority'] })}
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 text-secondary-400">No announcements yet</div>
        ) : (
          announcements.map((a) => (
            <div
              key={a.id}
              className={`p-6 rounded-2xl border ${
                a.priority === 'high'
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-secondary-800/50 border-secondary-700/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-semibold text-lg">{a.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        a.priority === 'high'
                          ? 'bg-red-500/30 text-red-300'
                          : a.priority === 'low'
                          ? 'bg-secondary-700 text-secondary-400'
                          : 'bg-primary-500/20 text-primary-400'
                      }`}
                    >
                      {a.priority}
                    </span>
                  </div>
                  <p className="text-secondary-300 whitespace-pre-wrap">{a.content}</p>
                  <p className="text-secondary-500 text-sm mt-3">
                    {format(parseISO(a.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setForm({ title: a.title, content: a.content, priority: a.priority });
                      setEditing(a);
                    }}
                    className="p-2 text-secondary-400 hover:text-primary-400"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-2 text-secondary-400 hover:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
