'use client';

import { useState } from 'react';
import { transferCredits } from '@/lib/creditHistory';

export default function TransferCreditsModal({
  available,
  onClose,
  onDone,
}: {
  available: number;
  onClose: () => void;
  onDone: (remaining: number) => void;
}) {
  const [toEmail, setToEmail] = useState('');
  const [credits, setCredits] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  async function submit() {
    const amount = Number(credits);
    if (!toEmail.trim()) {
      setOk(false);
      setMsg('Enter the recipient email.');
      return;
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      setOk(false);
      setMsg('Enter a valid number of credits.');
      return;
    }
    if (amount > available) {
      setOk(false);
      setMsg("You can't transfer more credits than you have.");
      return;
    }
    setBusy(true);
    setMsg('');
    const result = await transferCredits(toEmail.trim(), amount);
    setBusy(false);
    if (result.error) {
      setOk(false);
      setMsg(result.error);
      return;
    }
    setOk(true);
    setMsg(`Transferred ${amount} credits.`);
    setTimeout(() => {
      onDone(available - amount);
      onClose();
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-900">Transfer Credits</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 cursor-pointer">
            <i className="ri-close-line"></i>
          </button>
        </div>
        <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
          Unused credits can be transferred to another member. Transfers cannot be undone.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Recipient email</label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Credits to transfer</label>
            <input
              type="number"
              min={1}
              max={available}
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder={`${available} credits available`}
              className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        {msg && (
          <p className={`mt-4 text-sm px-4 py-3 rounded-xl border ${ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            {msg}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-100 whitespace-nowrap cursor-pointer">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-5 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {busy ? 'Processing...' : 'Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
}