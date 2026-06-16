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
