export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'review';
  student_id: string;
  mentor_notes?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  class_id: string;
  student_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance {
  id: string;
  class_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassNoteFile {
  id: string;
  class_id: string;
  title: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface Poll {
  id: string;
  question: string;
  description?: string;
  is_active: boolean;
  allow_multiple_votes: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  display_order: number;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  student_id: string;
  created_at: string;
}
