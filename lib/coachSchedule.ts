import { supabase } from './supabase';

export interface CoachSchedule {
  id: string;
  coach_id: string;
  organization_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  session_minutes: number;
  schedule_type: 'regular' | 'free';
  is_active: boolean;
}

export interface ScheduleFormData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  session_minutes: number;
  schedule_type: 'regular' | 'free';
  is_active: boolean;
  organization_id?: string | null;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function dayLabel(day: number): string {
  return DAY_LABELS[day] ?? String(day);
}

export async function getCoachSchedules(coachId: string): Promise<CoachSchedule[]> {
  const { data, error } = await supabase
    .from('coach_schedules')
    .select('*')
    .eq('coach_id', coachId)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) {
    console.error('getCoachSchedules error:', error);
    return [];
  }
  return (data ?? []) as CoachSchedule[];
}

export async function addCoachSchedule(coachId: string, schedule: ScheduleFormData): Promise<CoachSchedule | null> {
  const { data, error } = await supabase
    .from('coach_schedules')
    .insert([{ coach_id: coachId, ...schedule }])
    .select()
    .single();
  if (error) {
    console.error('addCoachSchedule error:', error);
    return null;
  }
  return data as CoachSchedule;
}

export async function updateCoachSchedule(scheduleId: string, schedule: Partial<ScheduleFormData>): Promise<CoachSchedule | null> {
  const { data, error } = await supabase
    .from('coach_schedules')
    .update(schedule)
    .eq('id', scheduleId)
    .select()
    .single();
  if (error) {
    console.error('updateCoachSchedule error:', error);
    return null;
  }
  return data as CoachSchedule;
}

export async function deleteCoachSchedule(scheduleId: string): Promise<boolean> {
  const { error } = await supabase.from('coach_schedules').delete().eq('id', scheduleId);
  if (error) {
    console.error('deleteCoachSchedule error:', error);
    return false;
  }
  return true;
}

export async function setDefaultCoachSchedule(coachId: string): Promise<void> {
  const { data: existing } = await supabase.from('coach_schedules').select('id').eq('coach_id', coachId).limit(1);
  if ((existing ?? []).length > 0) return;

  const defaults: ScheduleFormData[] = [
    { day_of_week: 1, start_time: '08:00', end_time: '12:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
    { day_of_week: 1, start_time: '20:00', end_time: '24:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
    { day_of_week: 2, start_time: '08:00', end_time: '12:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
    { day_of_week: 2, start_time: '20:00', end_time: '24:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
    { day_of_week: 3, start_time: '08:00', end_time: '12:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
    { day_of_week: 3, start_time: '20:00', end_time: '24:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
    { day_of_week: 4, start_time: '08:00', end_time: '12:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
    { day_of_week: 4, start_time: '20:00', end_time: '24:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
    { day_of_week: 5, start_time: '08:00', end_time: '12:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
    { day_of_week: 5, start_time: '20:00', end_time: '24:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
    { day_of_week: 6, start_time: '08:00', end_time: '12:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
    { day_of_week: 6, start_time: '20:00', end_time: '24:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
    { day_of_week: 1, start_time: '13:00', end_time: '18:00', interval_minutes: 15, session_minutes: 10, schedule_type: 'free', is_active: true },
    { day_of_week: 2, start_time: '13:00', end_time: '18:00', interval_minutes: 15, session_minutes: 10, schedule_type: 'free', is_active: true },
    { day_of_week: 3, start_time: '13:00', end_time: '18:00', interval_minutes: 15, session_minutes: 10, schedule_type: 'free', is_active: true },
    { day_of_week: 4, start_time: '13:00', end_time: '18:00', interval_minutes: 15, session_minutes: 10, schedule_type: 'free', is_active: true },
    { day_of_week: 5, start_time: '13:00', end_time: '18:00', interval_minutes: 15, session_minutes: 10, schedule_type: 'free', is_active: true },
    { day_of_week: 6, start_time: '13:00', end_time: '18:00', interval_minutes: 15, session_minutes: 10, schedule_type: 'free', is_active: true },
  ];

  await supabase.from('coach_schedules').insert(defaults.map((d) => ({ coach_id: coachId, ...d })));
}