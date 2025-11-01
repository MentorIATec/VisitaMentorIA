"use client";

import { useState } from 'react';
import MoodMeter from '@/components/MoodMeter';
import type { MoodValue } from '@/components/MoodMeter';

type Props = { params: { token: string } };

export default function AfterPage({ params }: Props) {
  const { token } = params;
  const [moodAfter, setMoodAfter] = useState<MoodValue>({ valence: 0, energy: 0, label: null, quadrant: null });
  const [likert, setLikert] = useState<number>(3);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const res = await fetch('/api/after', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, moodAfter })
    });
    if (!res.ok) {
      setError('Token inválido o ya utilizado');
      return;
    }
    setDone(true);
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Seguimiento</h1>
      {done ? (
        <div className="rounded border p-4">¡Gracias! Tu seguimiento se registró.</div>
      ) : (
        <div className="space-y-4">
          <div>
            <MoodMeter value={moodAfter} onChange={setMoodAfter} />
          </div>
          <div>
            <label className="block text-sm mb-1">¿Qué tanto te ayudó la sesión? (1–5)</label>
            <input type="range" min={1} max={5} value={likert} onChange={(e) => setLikert(Number(e.target.value))} />
            <div className="text-sm">{likert}</div>
          </div>
          {error && <div className="text-sm text-red-600" role="alert">{error}</div>}
          <button className="px-4 py-2 rounded bg-black text-white" onClick={submit}>Enviar</button>
        </div>
      )}
    </main>
  );
}


