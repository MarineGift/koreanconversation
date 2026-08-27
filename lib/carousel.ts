import { supabase } from './supabase';

export type SlideType = 'image' | 'hangul' | 'stats' | 'testimonial';
export type AnimationStyle = 'fade' | 'slide';

export interface StatItem {
  label: string;
  value: string;
}

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  badge: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  slide_type: SlideType;
  stats: StatItem[] | null;
  organization_id: string | null;
  slide_type: SlideType;
  stats: StatItem[] | null;
  organization_id: string | null;
}

function ordered(query: any) {
  return query.order('sort_order', { ascending: true }).order('created_at', { ascending: true });
}

export async function getActiveCarouselSlides(orgId?: string | null): Promise<CarouselSlide[]> {
  if (orgId) {
    const { data } = await ordered(
      supabase.from('carousel_slides').select('*').eq('is_active', true).eq('organization_id', orgId)
    );
    if (data && data.length > 0) return data as CarouselSlide[];
  }
  const { data } = await ordered(
    supabase.from('carousel_slides').select('*').eq('is_active', true).is('organization_id', null)
  );
  return (data ?? []) as CarouselSlide[];
}

export async function getAllCarouselSlides(orgId?: string | null): Promise<CarouselSlide[]> {
  let query = supabase.from('carousel_slides').select('*');
  if (orgId) {
    query = query.eq('organization_id', orgId);
  } else {
    query = query.is('organization_id', null);
  }
  const { data } = await ordered(query);
  return (data ?? []) as CarouselSlide[];
}

export async function getCarouselSettings(orgId?: string | null): Promise<AnimationStyle> {
  let query = supabase.from('carousel_settings').select('animation_style');
  if (orgId) {
    query = query.eq('organization_id', orgId);
  } else {
    query = query.is('organization_id', null);
  }
  const { data } = await query.maybeSingle();
  if (data) return data.animation_style === 'slide' ? 'slide' : 'fade';

  if (orgId) {
    const { data: global } = await supabase
      .from('carousel_settings')
      .select('animation_style')
      .is('organization_id', null)
      .maybeSingle();
    return global?.animation_style === 'slide' ? 'slide' : 'fade';
  }
  return 'fade';
}

export async function updateCarouselSettings(orgId: string | null, animationStyle: AnimationStyle) {
  const { data: existing } = await supabase
    .from('carousel_settings')
    .select('id')
    .eq('organization_id', orgId)
    .maybeSingle();

  const payload = {
    animation_style: animationStyle,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    return supabase.from('carousel_settings').update(payload).eq('id', existing.id);
  }
  return supabase.from('carousel_settings').insert({
    id: orgId ? `org-${orgId}` : 'default',
    organization_id: orgId,
    animation_style: animationStyle,
  });
}

export interface CarouselSlideInput {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  badge?: string | null;
  image_url?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  sort_order?: number;
  is_active?: boolean;
  slide_type?: SlideType;
  stats?: StatItem[] | null;
  organization_id?: string | null;
}

export async function addCarouselSlide(input: CarouselSlideInput) {
  return supabase.from('carousel_slides').insert(input);
}

export async function updateCarouselSlide(id: string, input: CarouselSlideInput) {
  return supabase.from('carousel_slides').update(input).eq('id', id);
}

export async function deleteCarouselSlide(id: string) {
  return supabase.from('carousel_slides').delete().eq('id', id);
}
