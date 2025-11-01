import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

type MoodConfig = {
  quadrants: Array<{
    id: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    range: { valence: [number, number]; energy: [number, number] };
    labels: string[];
  }>;
};

function quadrantFrom(cfg: MoodConfig, valence: number, energy: number): 'Q1'|'Q2'|'Q3'|'Q4' {
  for (const q of cfg.quadrants) {
    const [vMin, vMax] = q.range.valence;
    const [eMin, eMax] = q.range.energy;
    if (valence >= vMin && valence <= vMax && energy >= eMin && energy <= eMax) return q.id;
  }
  return 'Q1';
}

describe('quadrantFrom', () => {
  const cfg: MoodConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/config/mood.json'), 'utf-8'));

  it('mapea a Q1', () => {
    expect(quadrantFrom(cfg, 3, 4)).toBe('Q1');
  });
  it('mapea a Q2', () => {
    expect(quadrantFrom(cfg, -2, 3)).toBe('Q2');
  });
  it('mapea a Q3', () => {
    expect(quadrantFrom(cfg, -3, -3)).toBe('Q3');
  });
  it('mapea a Q4', () => {
    expect(quadrantFrom(cfg, 2, -2)).toBe('Q4');
  });
});


