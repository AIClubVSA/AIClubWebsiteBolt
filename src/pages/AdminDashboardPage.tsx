import { useState, useEffect } from 'react';
import { useAuth, Profile } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Project, Announcement, Class, Message, Attendance, AttendanceStatus, ClassNoteFile, Poll, PollOption, PollVote } from '../types/database';
import {
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
  ClipboardCheck,
  Check,
  XCircle,
  Clock,
  MinusCircle,
  StickyNote,
  Upload,
  FileText,
  Image,
  File,
  Download,
  ExternalLink,
  BarChart2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

type AdminTabType = 'overview' | 'users' | 'projects' | 'messages' | 'classes' | 'attendance' | 'notes' | 'announcements' | 'polls';

export default function AdminDashboardPage() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview');
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<(Project & { profiles: Profile })[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [messages, setMessages] = useState<(Message & { sender?: Profile; receiver?: Profile })[]>([]);
  const [stats, setStats] = useState({ students: 0, projects: 0, pendingMessages: 0, upcomingClasses: 0 });
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [classNoteFiles, setClassNoteFiles] = useState<ClassNoteFile[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [pollVotes, setPollVotes] = useState<PollVote[]>([]);

  useEffect(() => {
    if (profile && profile.role === 'admin') {
      fetchAdminData();
    }
  }, [profile]);

  async function fetchAdminData() {
    try {
      const [studentsRes, projectsRes, announcementsRes, classesRes, messagesRes, attendanceRes, classNoteFilesRes, pollsRes, pollOptionsRes, pollVotesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }),
        supabase.from('projects').select('*, profiles!projects_student_id_fkey(*)').order('created_at', { ascending: false }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('classes').select('*').order('date', { ascending: true }),
        supabase.from('messages').select('*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*)').or(`sender_id.eq.${profile!.id},receiver_id.eq.${profile!.id}`).order('created_at', { ascending: false }),
        supabase.from('attendance').select('*').order('updated_at', { ascending: false }),
        supabase.from('class_notes_files').select('*').order('created_at', { ascending: false }),
        supabase.from('polls').select('*').order('created_at', { ascending: false }),
        supabase.from('poll_options').select('*').order('display_order', { ascending: true }),
        supabase.from('poll_votes').select('*'),
      ]);

      setStudents(studentsRes.data || []);
      setProjects(projectsRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      setClasses(classesRes.data || []);
      setMessages(messagesRes.data || []);
      setAttendance(attendanceRes.data || []);
      setClassNoteFiles(classNoteFilesRes.data || []);
      setPolls(pollsRes.data || []);
      setPollOptions(pollOptionsRes.data || []);
      setPollVotes(pollVotesRes.data || []);

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
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'notes', label: 'Class Notes', icon: StickyNote },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'polls', label: 'Polls', icon: BarChart2 },
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
        <header className="lg:hidden fixed top-0 left-0 right-0 bg-secondary-900 border-b border-secondary-700/60 z-40">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <img src="/images/WhatsApp_Image_2026-06-03_at_5.22.16_PM.jpeg" className="w-6 h-6 object-contain rounded" alt="AI Club" />
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

        <div className="pt-28 lg:pt-8 p-5 lg:p-10">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="font-display text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-secondary-400">Manage the AI Centre platform</p>
              </div>

              {/* Stats */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-7 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-2">Total Students</div>
                  <div className="font-display text-3xl font-bold text-white">{stats.students}</div>
                </div>
                <div className="p-7 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-2">Active Projects</div>
                  <div className="font-display text-3xl font-bold text-primary-400">{stats.projects}</div>
                </div>
                <div className="p-7 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-2">Unread Messages</div>
                  <div className="font-display text-3xl font-bold text-accent-400">{stats.pendingMessages}</div>
                </div>
                <div className="p-7 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                  <div className="text-secondary-400 text-sm mb-2">Upcoming Classes</div>
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

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <AttendanceManagement classes={classes} students={students} attendance={attendance} profileId={profile!.id} onUpdate={fetchAdminData} />
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <ClassNotesManagement classes={classes} classNoteFiles={classNoteFiles} profileId={profile!.id} onUpdate={fetchAdminData} />
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <AnnouncementManagement
              announcements={announcements}
              profileId={profile!.id}
              onUpdate={fetchAdminData}
            />
          )}

          {/* Polls Tab */}
          {activeTab === 'polls' && (
            <PollManagement
              polls={polls}
              pollOptions={pollOptions}
              pollVotes={pollVotes}
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
function UserManagement({ students, onUpdate }: { students: Profile[]; onUpdate: () => void }) {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', full_name: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingStudent, setEditingStudent] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    setAddError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-manage-students', {
        body: { action: 'create', email: addForm.email, full_name: addForm.full_name },
      });
      if (fnError || data?.error) {
        setAddError(data?.error || fnError?.message || 'Failed to add student');
        return;
      }
      setShowAddModal(false);
      setAddForm({ email: '', full_name: '' });
      onUpdate();
    } catch {
      setAddError('An unexpected error occurred');
    } finally {
      setAddSaving(false);
    }
  }

  function openEdit(student: Profile) {
    setEditingStudent(student);
    setEditForm({ full_name: student.full_name, email: student.email });
    setEditError(null);
  }

  async function handleEditStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-manage-students', {
        body: {
          action: 'update',
          userId: editingStudent.id,
          full_name: editForm.full_name,
          email: editForm.email !== editingStudent.email ? editForm.email : undefined,
        },
      });
      if (fnError || data?.error) {
        setEditError(data?.error || fnError?.message || 'Failed to update student');
        return;
      }
      setEditingStudent(null);
      onUpdate();
    } catch {
      setEditError('An unexpected error occurred');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeleteStudent(student: Profile) {
    if (!confirm(`Remove ${student.full_name}? This will also delete all their messages and projects.`)) return;
    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-manage-students', {
        body: { action: 'delete', userId: student.id },
      });
      if (fnError || data?.error) {
        alert(data?.error || fnError?.message || 'Failed to remove student');
        return;
      }
      onUpdate();
    } catch {
      alert('An unexpected error occurred');
    }
  }

  const inputCls = 'w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2.5 text-white placeholder-secondary-500 focus:border-primary-500 focus:outline-none transition-colors';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-bold text-white">Student Management</h1>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => { setShowAddModal(true); setAddError(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium whitespace-nowrap transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary-800 border border-secondary-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-white">Add New Student</h2>
              <button
                onClick={() => { setShowAddModal(false); setAddError(null); setAddForm({ email: '', full_name: '' }); }}
                className="text-secondary-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {addError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{addError}</div>
            )}
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Full Name</label>
                <input type="text" value={addForm.full_name} onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} required autoFocus placeholder="Student's full name" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Email Address</label>
                <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required placeholder="student@example.com" className={inputCls} />
              </div>
              <p className="text-secondary-500 text-xs">The student can sign in via OTP on the login page once their account is created.</p>
              <button type="submit" disabled={addSaving} className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {addSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Add Student'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary-800 border border-secondary-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-white">Edit Student</h2>
              <button onClick={() => setEditingStudent(null)} className="text-secondary-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {editError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{editError}</div>
            )}
            <form onSubmit={handleEditStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Full Name</label>
                <input type="text" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} required placeholder="Full name" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Email Address</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required placeholder="Email address" className={inputCls} />
                {editForm.email !== editingStudent.email && (
                  <p className="text-yellow-400 text-xs mt-1">Email will be updated — the student will need to use the new address to sign in.</p>
                )}
              </div>
              <button type="submit" disabled={editSaving} className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-secondary-800/50 border border-secondary-700/50 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-secondary-700">
              <th className="text-left p-4 text-secondary-400 font-medium">Name</th>
              <th className="text-left p-4 text-secondary-400 font-medium hidden sm:table-cell">Email</th>
              <th className="text-left p-4 text-secondary-400 font-medium hidden md:table-cell">Joined</th>
              <th className="p-4 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="border-b border-secondary-700/50 last:border-0 hover:bg-secondary-700/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold">
                      {student.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{student.full_name}</span>
                  </div>
                </td>
                <td className="p-4 text-secondary-300 hidden sm:table-cell">{student.email}</td>
                <td className="p-4 text-secondary-300 hidden md:table-cell">
                  {format(parseISO(student.created_at), 'MMM d, yyyy')}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(student)}
                      className="p-2 text-secondary-500 hover:text-primary-400 transition-colors rounded-lg hover:bg-primary-400/10"
                      title="Edit student"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student)}
                      className="p-2 text-secondary-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                      title="Remove student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStudents.length === 0 && (
          <div className="text-center py-10 text-secondary-400">
            {search ? 'No students match your search' : 'No students yet. Click "Add Student" to get started.'}
          </div>
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
  messages: (Message & { sender?: Profile; receiver?: Profile })[];
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

  async function handleDeleteMessage(messageId: string) {
    try {
      await supabase.from('messages').delete().eq('id', messageId);
      onUpdate();
    } catch (error) {
      console.error('Error deleting message:', error);
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
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold text-white">Messages</h1>

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
          messages.map((msg) => {
            const isOwn = msg.sender_id === profileId;
            const otherParty = isOwn ? msg.receiver : msg.sender;
            return (
              <div
                key={msg.id}
                className={`group p-6 rounded-2xl ${
                  isOwn
                    ? 'bg-primary-500/10 border border-primary-500/20'
                    : msg.read_at
                    ? 'bg-secondary-800/30 border border-secondary-700/30'
                    : 'bg-secondary-800/50 border border-secondary-700/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-semibold ${
                      isOwn ? 'bg-primary-500/20 text-primary-400' : 'bg-accent-500/20 text-accent-400'
                    }`}>
                      {isOwn ? 'Y' : otherParty?.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">
                          {isOwn ? 'You' : otherParty?.full_name}
                        </p>
                        {!isOwn && !msg.read_at && <span className="w-2 h-2 rounded-full bg-accent-400 shrink-0" />}
                        {isOwn && <span className="text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">Sent</span>}
                      </div>
                      <p className="text-secondary-300">{msg.content}</p>
                      <p className="text-secondary-500 text-sm mt-2">
                        {format(parseISO(msg.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isOwn && !msg.read_at && (
                      <button
                        onClick={() => handleMarkAsRead(msg.id)}
                        className="p-2 text-secondary-400 hover:text-accent-400 transition-colors"
                        title="Mark as read"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                    {!isOwn && (
                      <button
                        onClick={() =>
                          setReplyingTo({ id: msg.id, senderId: msg.sender_id, content: msg.content })
                        }
                        className="p-2 text-secondary-400 hover:text-primary-400 transition-colors"
                        title="Reply"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-2 text-secondary-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete message"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
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

// Attendance Management Component
function AttendanceManagement({
  classes,
  students,
  attendance,
  profileId,
  onUpdate,
}: {
  classes: Class[];
  students: Profile[];
  attendance: Attendance[];
  profileId: string;
  onUpdate: () => void;
}) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const setStatus = async (studentId: string, status: AttendanceStatus) => {
    if (!selectedClassId) return;
    setSavingIds((prev) => new Set(prev).add(studentId));
    try {
      const existing = attendance.find(
        (a) => a.class_id === selectedClassId && a.student_id === studentId
      );
      if (existing) {
        if (existing.status === status) return;
        const { error } = await supabase
          .from('attendance')
          .update({ status, marked_by: profileId })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('attendance').insert({
          class_id: selectedClassId,
          student_id: studentId,
          status,
          marked_by: profileId,
        });
        if (error) throw error;
      }
      onUpdate();
    } catch (error) {
      console.error('Error saving attendance:', error);
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  const markAll = async (status: AttendanceStatus) => {
    if (!selectedClassId || students.length === 0) return;
    for (const s of students) {
      await setStatus(s.id, status);
    }
  };

  const clearAttendance = async () => {
    if (!selectedClassId) return;
    if (!confirm('Clear all attendance records for this class?')) return;
    const { error } = await supabase.from('attendance').delete().eq('class_id', selectedClassId);
    if (error) {
      console.error('Error clearing attendance:', error);
      return;
    }
    onUpdate();
  };

  const statusBtnCls = (isActive: boolean, color: string) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? `${color}` : 'bg-secondary-900/50 text-secondary-400 hover:text-white hover:bg-secondary-800'
    }`;

  const presentCount = selectedClassId
    ? attendance.filter((a) => a.class_id === selectedClassId && a.status === 'present').length
    : 0;
  const absentCount = selectedClassId
    ? attendance.filter((a) => a.class_id === selectedClassId && a.status === 'absent').length
    : 0;
  const lateCount = selectedClassId
    ? attendance.filter((a) => a.class_id === selectedClassId && a.status === 'late').length
    : 0;
  const excusedCount = selectedClassId
    ? attendance.filter((a) => a.class_id === selectedClassId && a.status === 'excused').length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Attendance Management</h1>
          <p className="text-secondary-400 mt-1">Track and manage student attendance for each class.</p>
        </div>
        {selectedClassId && students.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAll('present')}
              className="px-3 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors"
            >
              Mark All Present
            </button>
            <button
              onClick={clearAttendance}
              className="px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12 text-secondary-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No classes available. Create a class first to take attendance.</p>
        </div>
      ) : (
        <>
          {/* Class selector */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {classes.map((c) => {
              const isSelected = selectedClassId === c.id;
              const classAttCount = attendance.filter((a) => a.class_id === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`flex-shrink-0 px-5 py-3 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'bg-primary-500/10 border-primary-500'
                      : 'bg-secondary-800/50 border-secondary-700/50 hover:border-secondary-600'
                  }`}
                >
                  <div className="text-white font-medium whitespace-nowrap">{c.title}</div>
                  <div className="text-secondary-400 text-xs mt-0.5">
                    {format(parseISO(c.date), 'MMM d, yyyy')}
                    {classAttCount > 0 && (
                      <span className="ml-2 text-primary-400">{classAttCount} marked</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Attendance grid */}
          {selectedClassId ? (
            students.length === 0 ? (
              <div className="text-center py-12 text-secondary-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No students enrolled yet.</p>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-secondary-800/50 border border-secondary-700/50 rounded-xl p-4">
                    <div className="text-green-400 text-2xl font-bold">{presentCount}</div>
                    <div className="text-secondary-400 text-sm">Present</div>
                  </div>
                  <div className="bg-secondary-800/50 border border-secondary-700/50 rounded-xl p-4">
                    <div className="text-red-400 text-2xl font-bold">{absentCount}</div>
                    <div className="text-secondary-400 text-sm">Absent</div>
                  </div>
                  <div className="bg-secondary-800/50 border border-secondary-700/50 rounded-xl p-4">
                    <div className="text-yellow-400 text-2xl font-bold">{lateCount}</div>
                    <div className="text-secondary-400 text-sm">Late</div>
                  </div>
                  <div className="bg-secondary-800/50 border border-secondary-700/50 rounded-xl p-4">
                    <div className="text-blue-400 text-2xl font-bold">{excusedCount}</div>
                    <div className="text-secondary-400 text-sm">Excused</div>
                  </div>
                </div>

                {/* Student list */}
                <div className="space-y-3">
                  {students.map((student) => {
                    const record = attendance.find(
                      (a) => a.class_id === selectedClassId && a.student_id === student.id
                    );
                    const currentStatus = record?.status;
                    const isSaving = savingIds.has(student.id);
                    return (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
                          currentStatus === 'absent'
                            ? 'bg-red-500/5 border-red-500/30'
                            : currentStatus === 'present'
                            ? 'bg-green-500/5 border-green-500/30'
                            : currentStatus === 'late'
                            ? 'bg-yellow-500/5 border-yellow-500/30'
                            : 'bg-secondary-800/50 border-secondary-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-secondary-700 flex items-center justify-center text-secondary-300 font-medium shrink-0">
                            {student.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-medium truncate">{student.full_name}</div>
                            <div className="text-secondary-400 text-sm truncate">{student.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin text-secondary-400" />
                          ) : (
                            <>
                              <button
                                onClick={() => setStatus(student.id, 'present')}
                                className={statusBtnCls(
                                  currentStatus === 'present',
                                  'bg-green-500/20 text-green-400'
                                )}
                              >
                                <Check className="w-4 h-4" /> Present
                              </button>
                              <button
                                onClick={() => setStatus(student.id, 'absent')}
                                className={statusBtnCls(
                                  currentStatus === 'absent',
                                  'bg-red-500/20 text-red-400'
                                )}
                              >
                                <XCircle className="w-4 h-4" /> Absent
                              </button>
                              <button
                                onClick={() => setStatus(student.id, 'late')}
                                className={statusBtnCls(
                                  currentStatus === 'late',
                                  'bg-yellow-500/20 text-yellow-400'
                                )}
                              >
                                <Clock className="w-4 h-4" /> Late
                              </button>
                              <button
                                onClick={() => setStatus(student.id, 'excused')}
                                className={statusBtnCls(
                                  currentStatus === 'excused',
                                  'bg-blue-500/20 text-blue-400'
                                )}
                              >
                                <MinusCircle className="w-4 h-4" /> Excused
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          ) : (
            <div className="text-center py-16 text-secondary-400">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Select a class above to take attendance</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Class Notes Management Component (admin only)
function ClassNotesManagement({
  classes,
  classNoteFiles,
  profileId,
  onUpdate,
}: {
  classes: Class[];
  classNoteFiles: ClassNoteFile[];
  profileId: string;
  onUpdate: () => void;
}) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const inputCls =
    'w-full bg-secondary-900 border border-secondary-700/50 rounded-lg px-4 py-2.5 text-white placeholder-secondary-500 focus:outline-none focus:border-primary-500 transition-colors';

  const filesForClass = classNoteFiles.filter((f) => f.class_id === selectedClassId);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-400" />;
    if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-400" />;
    if (type.includes('presentation') || type.includes('powerpoint'))
      return <FileText className="w-5 h-5 text-orange-400" />;
    if (type.includes('word') || type.includes('document'))
      return <FileText className="w-5 h-5 text-blue-300" />;
    return <File className="w-5 h-5 text-secondary-400" />;
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('class-notes').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setPendingFile(file);
      setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
      setShowUploadForm(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
      setShowUploadForm(true);
    }
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!pendingFile || !selectedClassId || !uploadTitle.trim()) return;
    setUploading(true);
    try {
      const ext = pendingFile.name.split('.').pop();
      const uniqueName = `${selectedClassId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: storageErr } = await supabase.storage
        .from('class-notes')
        .upload(uniqueName, pendingFile, { upsert: false });
      if (storageErr) throw storageErr;

      const { error: dbErr } = await supabase.from('class_notes_files').insert({
        class_id: selectedClassId,
        title: uploadTitle.trim(),
        description: uploadDesc.trim() || null,
        file_path: uniqueName,
        file_name: pendingFile.name,
        file_size: pendingFile.size,
        file_type: pendingFile.type,
        uploaded_by: profileId,
      });
      if (dbErr) throw dbErr;

      setUploadTitle('');
      setUploadDesc('');
      setPendingFile(null);
      setShowUploadForm(false);
      onUpdate();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: ClassNoteFile) => {
    if (!confirm(`Delete "${file.title}"? This cannot be undone.`)) return;
    setDeletingId(file.id);
    try {
      await supabase.storage.from('class-notes').remove([file.file_path]);
      await supabase.from('class_notes_files').delete().eq('id', file.id);
      onUpdate();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelUpload = () => {
    setPendingFile(null);
    setUploadTitle('');
    setUploadDesc('');
    setShowUploadForm(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Class Notes</h1>
        <p className="text-secondary-400 mt-1">Upload and manage notes, slides, and documents for each class.</p>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12 text-secondary-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No classes available. Create a class first before adding notes.</p>
        </div>
      ) : (
        <>
          {/* Class selector */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {classes.map((c) => {
              const isSelected = selectedClassId === c.id;
              const fileCount = classNoteFiles.filter((f) => f.class_id === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedClassId(c.id); setShowUploadForm(false); }}
                  className={`flex-shrink-0 px-5 py-3 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'bg-primary-500/10 border-primary-500'
                      : 'bg-secondary-800/50 border-secondary-700/50 hover:border-secondary-600'
                  }`}
                >
                  <div className="text-white font-medium whitespace-nowrap">{c.title}</div>
                  <div className="text-secondary-400 text-xs mt-0.5">
                    {format(parseISO(c.date), 'MMM d, yyyy')}
                    {fileCount > 0 && (
                      <span className="ml-2 text-primary-400">{fileCount} file{fileCount > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedClassId ? (
            <div className="space-y-5">
              {/* Upload form */}
              {showUploadForm && pendingFile ? (
                <div className="bg-secondary-800/60 border border-secondary-700/50 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Upload File</h3>
                    <button onClick={cancelUpload} className="p-1.5 text-secondary-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* File preview */}
                  <div className="flex items-center gap-4 p-4 bg-secondary-900/60 rounded-xl border border-secondary-700/40">
                    {pendingFile.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(pendingFile)}
                        alt="preview"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-secondary-700 flex items-center justify-center">
                        {fileIcon(pendingFile.type)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{pendingFile.name}</p>
                      <p className="text-secondary-400 text-sm">{formatFileSize(pendingFile.size)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-1.5">Title *</label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g. Week 3 Slides"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-1.5">Description <span className="text-secondary-500">(optional)</span></label>
                    <textarea
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                      rows={2}
                      placeholder="Short description of this file..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleUpload}
                      disabled={uploading || !uploadTitle.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                    >
                      {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload</>}
                    </button>
                    <button onClick={cancelUpload} className="px-5 py-2.5 bg-secondary-700 hover:bg-secondary-600 text-white rounded-lg font-medium transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Drop zone */
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                    dragOver
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-secondary-700/50 hover:border-secondary-600 bg-secondary-800/30'
                  }`}
                >
                  <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-primary-400' : 'text-secondary-500'}`} />
                  <p className="text-white font-medium mb-1">Drag & drop a file here</p>
                  <p className="text-secondary-400 text-sm mb-4">Images, PDFs, PowerPoint, Word docs supported — up to 50 MB</p>
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium cursor-pointer transition-colors">
                    <Plus className="w-4 h-4" /> Choose File
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*,.pdf,.ppt,.pptx,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              )}

              {/* Uploaded files list */}
              {filesForClass.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-white font-semibold">
                    Uploaded Files
                    <span className="ml-2 text-sm font-normal text-secondary-400">({filesForClass.length})</span>
                  </h3>
                  {filesForClass.map((file) => {
                    const url = getPublicUrl(file.file_path);
                    const isImage = file.file_type.startsWith('image/');
                    return (
                      <div
                        key={file.id}
                        className="flex items-start gap-4 p-4 bg-secondary-800/50 border border-secondary-700/50 rounded-xl hover:border-secondary-600 transition-colors"
                      >
                        {/* Thumbnail / icon */}
                        {isImage ? (
                          <img
                            src={url}
                            alt={file.title}
                            className="w-14 h-14 object-cover rounded-lg shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-secondary-700 flex items-center justify-center shrink-0">
                            {fileIcon(file.file_type)}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{file.title}</p>
                          {file.description && (
                            <p className="text-secondary-400 text-sm mt-0.5 line-clamp-2">{file.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-secondary-500">
                            <span>{file.file_name}</span>
                            <span>{formatFileSize(file.file_size)}</span>
                            <span>{format(parseISO(file.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-secondary-400 hover:text-primary-400 transition-colors"
                            title="Open"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <a
                            href={url}
                            download={file.file_name}
                            className="p-2 text-secondary-400 hover:text-primary-400 transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(file)}
                            disabled={deletingId === file.id}
                            className="p-2 text-secondary-400 hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !showUploadForm && (
                  <p className="text-center text-secondary-500 py-4">No files uploaded for this class yet.</p>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-secondary-400">
              <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Select a class above to manage its notes and files</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Poll Management Component
function PollManagement({
  polls,
  pollOptions,
  pollVotes,
  profileId,
  onUpdate,
}: {
  polls: Poll[];
  pollOptions: PollOption[];
  pollVotes: PollVote[];
  profileId: string;
  onUpdate: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Poll | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ question: '', description: '', is_active: true, allow_multiple_votes: false });
  const [optionInputs, setOptionInputs] = useState<string[]>(['', '']);

  function resetForm() {
    setForm({ question: '', description: '', is_active: true, allow_multiple_votes: false });
    setOptionInputs(['', '']);
  }

  function openCreate() {
    resetForm();
    setEditing(null);
    setShowModal(true);
  }

  function openEdit(poll: Poll) {
    setForm({ question: poll.question, description: poll.description || '', is_active: poll.is_active, allow_multiple_votes: poll.allow_multiple_votes });
    const opts = pollOptions.filter((o) => o.poll_id === poll.id).sort((a, b) => a.display_order - b.display_order);
    setOptionInputs(opts.length >= 2 ? opts.map((o) => o.option_text) : ['', '']);
    setEditing(poll);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const validOptions = optionInputs.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) return;
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from('polls').update({
          question: form.question,
          description: form.description || null,
          is_active: form.is_active,
          allow_multiple_votes: form.allow_multiple_votes,
          updated_at: new Date().toISOString(),
        }).eq('id', editing.id);
        if (error) throw error;
        await supabase.from('poll_options').delete().eq('poll_id', editing.id);
        await supabase.from('poll_options').insert(
          validOptions.map((text, i) => ({ poll_id: editing.id, option_text: text, display_order: i }))
        );
      } else {
        const { data: newPoll, error } = await supabase.from('polls').insert({
          question: form.question,
          description: form.description || null,
          is_active: form.is_active,
          allow_multiple_votes: form.allow_multiple_votes,
          created_by: profileId,
        }).select().single();
        if (error) throw error;
        await supabase.from('poll_options').insert(
          validOptions.map((text, i) => ({ poll_id: newPoll.id, option_text: text, display_order: i }))
        );
      }
      setShowModal(false);
      resetForm();
      onUpdate();
    } catch (err) {
      console.error('Error saving poll:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(poll: Poll) {
    await supabase.from('polls').update({ is_active: !poll.is_active, updated_at: new Date().toISOString() }).eq('id', poll.id);
    onUpdate();
  }

  async function handleDelete(poll: Poll) {
    if (!confirm(`Delete poll "${poll.question}"? All votes will be lost.`)) return;
    await supabase.from('polls').delete().eq('id', poll.id);
    onUpdate();
  }

  const inputCls = 'w-full bg-secondary-900 border border-secondary-700 rounded-lg px-4 py-2.5 text-white placeholder-secondary-500 focus:border-primary-500 focus:outline-none transition-colors';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Polls</h1>
          <p className="text-secondary-400 mt-1">Create polls for students to vote on.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Poll
        </button>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary-800 border border-secondary-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-white">{editing ? 'Edit Poll' : 'New Poll'}</h2>
              <button onClick={() => setShowModal(false)} className="text-secondary-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-1.5">Question *</label>
                <input type="text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required placeholder="What do you want to ask?" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-1.5">Description <span className="text-secondary-500">(optional)</span></label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Add context..." className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">Options * <span className="text-secondary-500">(minimum 2)</span></label>
                <div className="space-y-2">
                  {optionInputs.map((val, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => {
                          const next = [...optionInputs];
                          next[i] = e.target.value;
                          setOptionInputs(next);
                        }}
                        placeholder={`Option ${i + 1}`}
                        className={inputCls}
                      />
                      {optionInputs.length > 2 && (
                        <button type="button" onClick={() => setOptionInputs(optionInputs.filter((_, j) => j !== i))} className="p-2.5 text-secondary-400 hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setOptionInputs([...optionInputs, ''])} className="mt-2 flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 transition-colors">
                  <Plus className="w-4 h-4" /> Add option
                </button>
              </div>
              <div className="flex items-center gap-3 py-1 border-t border-secondary-700/50 pt-4">
                <div>
                  <p className="text-sm font-medium text-secondary-300">Active (visible to students)</p>
                </div>
                <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })} className="ml-auto">
                  {form.is_active
                    ? <ToggleRight className="w-8 h-8 text-primary-400" />
                    : <ToggleLeft className="w-8 h-8 text-secondary-500" />}
                </button>
              </div>
              <div className="flex items-center gap-3 py-1">
                <div>
                  <p className="text-sm font-medium text-secondary-300">Allow multiple votes</p>
                  <p className="text-xs text-secondary-500 mt-0.5">Students can vote more than once</p>
                </div>
                <button type="button" onClick={() => setForm({ ...form, allow_multiple_votes: !form.allow_multiple_votes })} className="ml-auto">
                  {form.allow_multiple_votes
                    ? <ToggleRight className="w-8 h-8 text-primary-400" />
                    : <ToggleLeft className="w-8 h-8 text-secondary-500" />}
                </button>
              </div>
              <button type="submit" disabled={saving || optionInputs.filter((o) => o.trim()).length < 2} className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editing ? 'Update Poll' : 'Create Poll'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Poll List */}
      {polls.length === 0 ? (
        <div className="text-center py-12 text-secondary-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No polls yet. Click "New Poll" to create one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const options = pollOptions.filter((o) => o.poll_id === poll.id).sort((a, b) => a.display_order - b.display_order);
            const votes = pollVotes.filter((v) => v.poll_id === poll.id);
            const totalVotes = votes.length;
            return (
              <div key={poll.id} className="p-6 bg-secondary-800/50 border border-secondary-700/50 rounded-2xl">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-white font-semibold text-lg">{poll.question}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${poll.is_active ? 'bg-green-500/20 text-green-400' : 'bg-secondary-700 text-secondary-400'}`}>
                        {poll.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {poll.allow_multiple_votes && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                          Multi-vote
                        </span>
                      )}
                    </div>
                    {poll.description && <p className="text-secondary-400 text-sm">{poll.description}</p>}
                    <p className="text-secondary-500 text-xs mt-1">{totalVotes} vote{totalVotes !== 1 ? 's' : ''} · Created {format(parseISO(poll.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleToggleActive(poll)} className="p-2 text-secondary-400 hover:text-primary-400 transition-colors" title={poll.is_active ? 'Deactivate' : 'Activate'}>
                      {poll.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => openEdit(poll)} className="p-2 text-secondary-400 hover:text-primary-400 transition-colors"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(poll)} className="p-2 text-secondary-400 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
                {/* Vote bars */}
                <div className="space-y-2.5">
                  {options.map((opt) => {
                    const count = votes.filter((v) => v.option_id === opt.id).length;
                    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-secondary-300 text-sm">{opt.option_text}</span>
                          <span className="text-secondary-400 text-xs">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-secondary-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
