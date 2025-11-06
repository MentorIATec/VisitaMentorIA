export const E2E_MOCKS = process.env.E2E_MOCKS === '1';
export const E2E_SSO_MOCK = process.env.E2E_SSO_MOCK === '1';

export const mocks = {
  mentors: [
    { id: 'm1', email: 'kareng@tec.mx', display_name: 'Karen Ariadna Guzmán Vega', campus: 'MTY', comunidad_id: 'talenta' }
  ],
  communities: [
    { id: 1, code: 'ekvilibro', name: 'ekvilibro', color: '#6FD34A' },
    { id: 2, code: 'energio', name: 'energio', color: '#FD8204' },
    { id: 3, code: 'forta', name: 'forta', color: '#87004A' },
    { id: 4, code: 'krei', name: 'krei', color: '#79858B' },
    { id: 5, code: 'kresko', name: 'kresko', color: '#0DCCCC' },
    { id: 6, code: 'pasio', name: 'pasio', color: '#CC0202' },
    { id: 7, code: 'reflekto', name: 'reflekto', color: '#FFDE17' },
    { id: 8, code: 'revo', name: 'revo', color: '#C4829A' },
    { id: 9, code: 'spirita', name: 'spirita', color: '#5B0F8B' },
    { id: 10, code: 'talenta', name: 'talenta', color: '#EC008C' }
  ],
  reasons: [
    // 💭 Desarrollo personal y bienestar
    { id: 1, code: 'PROPOSITO', label: 'Propósito de vida, metas o dudas vocacionales' },
    { id: 2, code: 'HABITOS', label: 'Hábitos y equilibrio personal (sueño, descanso, salud, rutinas)' },
    { id: 3, code: 'AUTOCONOCIMIENTO', label: 'Autoconocimiento y crecimiento personal' },
    // 📘 Éxito académico y hábitos de estudio
    { id: 4, code: 'ORGANIZACION', label: 'Organización y gestión del tiempo' },
    { id: 5, code: 'MOTIVACION', label: 'Motivación o enfoque académico' },
    { id: 6, code: 'ESTUDIO', label: 'Estrategias de estudio y concentración' },
    { id: 7, code: 'EQUILIBRIO_ACA', label: 'Equilibrio académico–personal' },
    // 🤝 Integración y comunidad
    { id: 8, code: 'INTEGRACION', label: 'Adaptación, pertenencia y participación en comunidad' },
    { id: 15, code: 'PARTICIPACION', label: 'Participación en grupos o comunidades' },
    // 🌱 Oportunidades y recursos de apoyo
    { id: 9, code: 'OPORTUNIDADES', label: 'Becas, idiomas, movilidad u otras oportunidades' },
    { id: 10, code: 'CANALIZACION', label: 'Canalización o derivación a otras áreas (bienestar, salud, liderazgo, etc.)' },
    { id: 16, code: 'APOYO_PERSONAL', label: 'Apoyo en temas personales o socioeconómicos' },
    // ✳️ Otro
    { id: 11, code: 'SEGUIMIENTO', label: 'Seguimiento de compromisos o acuerdos previos' },
    // Legacy (deprecadas - solo para compatibilidad)
    { id: 12, code: 'TRAMITES', label: 'Trámites / administrativo (no se gestiona desde mentoría)' },
    { id: 13, code: 'CARGA', label: 'Planeación de carga/semestre (competencia de Dirección de Programa)' },
    { id: 14, code: 'EMOCIONAL', label: 'Acompañamiento emocional (no terapéutico en mentoría)' }
  ],
  sessions: new Map<string, Record<string, unknown> & { email?: string | null; followup_sent_at?: string | null }>(),
  followupTokens: new Map<string, { sessionId: string; usedAt: string | null; expiresAt: string | null }>(),
  // Mocks SSO
  ssoUsers: new Map<string, { sub: string; email: string; name: string; hasMatricula: boolean }>(),
  usersMap: new Map<string, { user_id: string; matricula_hash: string }>(),
  emotions: {
    valence: ["dificil", "neutral", "agradable"],
    intensity: ["baja", "media", "alta"],
    emotions: {
      agradable: {
        alta: ["entusiasmo","alegría","ilusión","euforia","gratitud","conexión","motivación","esperanza","orgullo","diversión","inspiración","satisfacción","confianza","curiosidad"],
        media: ["bienestar","calma","serenidad","contento","gratitud","interés","equilibrio","tranquilidad","alivio","armonía","fluidez"],
        baja: ["paz","sosiego","quietud","descanso","relajación","estabilidad","contemplación"]
      },
      dificil: {
        alta: ["enojo","irritación","frustración","ansiedad","inquietud","sobrecarga","presión","agobio","desesperación","tensión","angustia"],
        media: ["preocupación","frustración","tensión","incertidumbre","abrumo","nervios","inseguridad","impaciencia","decepción","culpa","vergüenza"],
        baja: ["cansancio","desánimo","tristeza","melancolía","apatía","desmotivación","vacío","nostalgia","pesadez"]
      },
      neutral: {
        alta: ["activación","impulso","alerta","dinamismo"],
        media: ["equilibrio","atención","estabilidad","enfoque"],
        baja: ["pausa","baja energía","silencio","contemplación"]
      }
    },
    emoji: {
      agradable: { 
        alta: ["✨","🤩","🎉","💫","🌟"], 
        media: ["😊","🙂","🌿","🕊️"], 
        baja: ["😌","🍃","🌙","💤"] 
      },
      dificil: { 
        alta: ["😤","😡","⚡","🧨"], 
        media: ["😟","😬","🤔","🌧️"], 
        baja: ["😞","😔","🫥","💤"] 
      },
      neutral: { 
        alta: ["⚡","🔆","🏃‍♀️"], 
        media: ["🧭","🎯","🧘"], 
        baja: ["🫧","🌫️","🛏️"] 
      }
    }
  }
};


