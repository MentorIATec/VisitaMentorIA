import { describe, it, expect } from 'vitest';
import { SessionSchema } from '../../app/api/session/route';

describe('SessionSchema', () => {
  it('requiere communityId y rechaza channel', () => {
    const base = {
      matricula: 'A123',
      mentorId: '00000000-0000-0000-0000-000000000000',
      communityId: 1,
      campus: null,
      reasonId: null,
      reasonFree: null,
      durationMin: 30,
      consentFollowup: false,
      moodBefore: { valence: 0, energy: 0, label: null, quadrant: null }
    } as const;
    const ok = SessionSchema.safeParse(base);
    expect(ok.success).toBe(true);

    const missingCommunity = SessionSchema.safeParse({ ...base, communityId: undefined });
    expect(missingCommunity.success).toBe(false);

    const withChannelInput = { ...(base as Record<string, unknown>), channel: 'otro' };
    const withChannel = SessionSchema.safeParse(withChannelInput);
    expect(withChannel.success).toBe(false);
  });

  it('acepta moodFlow con estructura completa', () => {
    const withMoodFlow = {
      matricula: 'A123',
      mentorId: '00000000-0000-0000-0000-000000000000',
      communityId: 1,
      durationMin: 30,
      consentFollowup: false,
      moodFlow: {
        valence: 'agradable' as const,
        intensity: 4,
        intensityBand: 'alta' as const,
        label: 'alegría',
        note: 'Estoy contento'
      }
    };
    const ok = SessionSchema.safeParse(withMoodFlow);
    expect(ok.success).toBe(true);
  });

  it('rechaza moodFlow con intensidad inválida', () => {
    const invalidMoodFlow = {
      matricula: 'A123',
      mentorId: '00000000-0000-0000-0000-000000000000',
      communityId: 1,
      durationMin: 30,
      consentFollowup: false,
      moodFlow: {
        valence: 'agradable' as const,
        intensity: 6, // inválido: debe ser 1-5
        intensityBand: 'alta' as const,
        label: 'alegría',
        note: ''
      }
    };
    const result = SessionSchema.safeParse(invalidMoodFlow);
    expect(result.success).toBe(false);
  });

  it('acepta moodBefore como formato antiguo (compatibilidad)', () => {
    const withMoodBefore = {
      matricula: 'A123',
      mentorId: '00000000-0000-0000-0000-000000000000',
      communityId: 1,
      durationMin: 30,
      consentFollowup: false,
      moodBefore: { valence: 3, energy: 2, label: 'feliz', quadrant: 'Q1' }
    };
    const ok = SessionSchema.safeParse(withMoodBefore);
    expect(ok.success).toBe(true);
  });
});


