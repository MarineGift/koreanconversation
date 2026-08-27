'use client';

import { useEffect, useState } from 'react';
import { getSessionRange } from '@/lib/session';
import { supabase } from '@/lib/supabase';

const JOIN_EARLY_MS = 15 * 60 * 1000;
const END_WARN_MS = 2 * 60 * 1000;

function CompletedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium whitespace-nowrap">
      <span className="w-4 h-4 flex items-center justify-center"><i className="ri-check-double-line text-sm"></i></span>
      Completed
    </span>
  );
}

export default function RoomJoinButton({
  bookingId,
  bookingDate,
  slot,
  sessionType,
  roomUrl,
  status,
  variant = 'inline',
}: {
  bookingId?: string | null;
  bookingDate: string;
  slot: string;
  sessionType: string | null;
  roomUrl: string | null;
  status?: string | null;
  variant?: 'inline' | 'button';
}) {
  const [now, setNow] = useState<number | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(roomUrl);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (roomUrl) setResolvedUrl(roomUrl);
  }, [roomUrl]);

  useEffect(() => {
    if (resolvedUrl || status !== 'confirmed' || !bookingId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke('confirm-booking', {
        body: { bookingId },
      });
      if (cancelled) return;
      if (!error && data?.room_url) setResolvedUrl(data.room_url);
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedUrl, status, bookingId]);

  async function regenerate() {
    if (!bookingId) return;
    setRegenerating(true);
    const { data, error } = await supabase.functions.invoke('confirm-booking', {
      body: { bookingId },
    });
    setRegenerating(false);
    if (!error && data?.room_url) setResolvedUrl(data.room_url);
  }

  function handleJoin() {
    if (!bookingId || status !== 'confirmed') return;
    supabase.functions.invoke('join-session', { body: { bookingId } });
  }

  if (status === 'completed') return <CompletedBadge />;

  if (!resolvedUrl) {
    if (status === 'confirmed') {
      return (
        <button
          onClick={regenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-medium hover:underline disabled:opacity-50 cursor-pointer whitespace-nowrap"
        >
          <span className="w-4 h-4 flex items-center justify-center"><i className="ri-refresh-line text-sm"></i></span>
          {regenerating ? 'Generating link...' : 'Generate link'}
        </button>
      );
    }
    return <span className="text-neutral-400">—</span>;
  }

  if (now === null) return <span className="text-neutral-400">—</span>;

  const { start, end } = getSessionRange(bookingDate, slot, sessionType);
  const joinOpenAt = start - JOIN_EARLY_MS;

  if (now < joinOpenAt) {
    return (
      <span className="inline-flex flex-col gap-0.5 text-xs leading-snug whitespace-nowrap">
        <span className="text-amber-600 font-medium">Not time yet.</span>
        <span className="text-neutral-500">The room opens 15 minutes before your session.</span>
      </span>
    );
  }

  if (now >= end) {
    return <CompletedBadge />;
  }

  const nearEnd = now >= end - END_WARN_MS;

  if (variant === 'button') {
    return (
      <span className="inline-flex flex-col gap-1.5">
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noreferrer"
          onClick={handleJoin}
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-3 rounded-full hover:opacity-90 whitespace-nowrap cursor-pointer font-medium"
        >
          <span className="w-4 h-4 flex items-center justify-center"><i className="ri-vidicon-line"></i></span>
          Join Room
        </a>
        {nearEnd && <span className="text-xs text-rose-600 font-medium">Ends in 2 minutes.</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col gap-0.5 whitespace-nowrap">
      <a
        href={resolvedUrl}
        target="_blank"
        rel="noreferrer"
        onClick={handleJoin}
        className="inline-flex items-center gap-1 text-neutral-900 font-medium underline underline-offset-4 hover:text-neutral-600 cursor-pointer"
      >
        <span className="w-4 h-4 flex items-center justify-center"><i className="ri-external-link-line text-sm"></i></span>
        Join
      </a>
      {nearEnd && <span className="text-xs text-rose-600 font-medium">Ends in 2 minutes.</span>}
    </span>
  );
}