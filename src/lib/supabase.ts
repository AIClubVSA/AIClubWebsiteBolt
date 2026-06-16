import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  event_type: string;
  description: string | null;
  is_featured: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  content: string;
  avatar_url: string | null;
  is_featured: boolean;
}

export async function getFeaturedEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_featured', true)
    .order('event_date', { ascending: true })
    .limit(3);

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  return data || [];
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_featured', true)
    .limit(3);

  if (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
  return data || [];
}

export async function signupNewsletter(email: string): Promise<void> {
  const { error } = await supabase
    .from('newsletter_signups')
    .insert([{ email }]);

  if (error) {
    if (error.code === '23505') {
      throw new Error('This email is already subscribed!');
    }
    throw new Error('Failed to subscribe. Please try again.');
  }
}
