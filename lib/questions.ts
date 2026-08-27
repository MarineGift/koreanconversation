import { supabase } from './supabase';

export interface CoachQuestion {
  id: string;
  coach_id: string | null;
  booking_id: string | null;
  organization_id: string | null;
  member_name: string | null;
  member_email: string | null;
  question: string | null;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
  coach_name: string;
}

export async function getAllQuestions(): Promise<CoachQuestion[]> {
  const [questionsRes, coachesRes] = await Promise.all([
    supabase.from('coach_questions').select('*').order('created_at', { ascending: false }),
    supabase.from('coaches').select('id, name'),
  ]);

  const nameMap = new Map((coachesRes.data ?? []).map((c) => [c.id, c.name as string]));

  return ((questionsRes.data ?? []) as any[]).map((q) => ({
    ...q,
    coach_name: nameMap.get(q.coach_id) ?? '—',
  }));
}

export async function getCoachQuestions(coachId: string): Promise<CoachQuestion[]> {
  const { data } = await supabase
    .from('coach_questions')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });

  return ((data ?? []) as any[]).map((q) => ({
    ...q,
    coach_name: '',
  }));
}

export async function saveQuestionAnswer(id: string, answer: string) {
  return supabase
    .from('coach_questions')
    .update({ answer, answered_at: new Date().toISOString() })
    .eq('id', id);
}