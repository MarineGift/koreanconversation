'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CoachCard from '@/components/booking/CoachCard';
import SlotGrid from '@/components/booking/SlotGrid';
import BookingForm from '@/components/booking/BookingForm';
import { supabase } from '@/lib/supabase';
import { getOrgId } from '@/lib/org';
import { getCoachesForOrg, getCoachSlotsAllSites, getAllBookedSlotsForCoach, todayIso, type Coach, type Slot, type BookedSlotInfo } from '@/lib/booking';
import CalendarPicker from '@/components/booking/CalendarPicker';

export default function BookPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [booked, setBooked] = useState<BookedSlotInfo[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    setDate(todayIso());
  }, []);

  useEffect(() => {
    (async () => {
      const orgId = await getOrgId();
      if (!orgId) {
        setLoading(false);
        return;
      }
      setOrgId(orgId);
      const coachList = await getCoachesForOrg(orgId);
      if (coachList.length) {
        setCoaches(coachList);
        setCoachId(coachList[0].id);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!coachId || !date) return;
    setSelectedSlot(null);
    setBooked([]);
    setSlots([]);
    (async () => {
      const [slotData, bookedData] = await Promise.all([
        getCoachSlotsAllSites(coachId, date, 'regular'),
        getAllBookedSlotsForCoach(coachId, date),
      ]);
      const uniqueSlots = slotData.reduce<Slot[]>((acc, s) => {
        if (!acc.find((x) => x.start === s.start)) acc.push(s);
        return acc;
      }, []);
      setSlots(uniqueSlots);
      setBooked(bookedData);
    })();
  }, [coachId, date]);

  const refresh = () => {
    if (!coachId || !date) return;
    getAllBookedSlotsForCoach(coachId, date).then((data) => {
      setBooked(data);
    });
  };

  useEffect(() => {
    if (!coachId || !date) return;
    const interval = setInterval(() => {
      getAllBookedSlotsForCoach(coachId, date).then((data) => {
        setBooked(data);
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [coachId, date]);

  const coach = coaches.find((c) => c.id === coachId);

  return (
    <div className="min-h-screen bg-[#FBF7F2] overflow-x-hidden">
      <Header />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="text-xs uppercase tracking-widest text-neutral-500">Book a session</div>
          <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900">Choose your coach and pick a time.</h1>
          <p className="mt-4 text-neutral-600 max-w-2xl leading-relaxed text-sm sm:text-base">
            Every slot is a private 1:1 session. Pick the coach that fits your goals, then select an available time.
          </p>

          {loading ? (
            <div className="mt-10 text-neutral-500">Loading coaches…</div>
          ) : coaches.length === 0 ? (
            <div className="mt-10 text-neutral-500">No coaches available for this site.</div>
          ) : (
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8">
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-3">Coach</div>
                <div className="space-y-3">
                  {coaches.map((c) => (
                    <CoachCard key={c.id} coach={c} selected={c.id === coachId} onClick={() => setCoachId(c.id)} />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-3">Select a date</div>
                <CalendarPicker selected={date} onSelect={setDate} />

                {coach && (
                  <div className="mt-4">
                    {slots.length === 0 ? (
                      <div className="text-sm text-neutral-500 py-6 text-center bg-white rounded-2xl border border-neutral-200">
                        No available slots for this date. Please pick another date.
                      </div>
                    ) : (
                      <SlotGrid slots={slots} booked={booked} selected={selectedSlot} onSelect={(s) => setSelectedSlot(s.start)} />
                    )}
                    {selectedSlot && coachId && date && <BookingForm coachId={coachId} coachEmail={coach?.email} coachName={coach?.name} date={date} slot={selectedSlot} sessionType="single" onDone={refresh} />}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}