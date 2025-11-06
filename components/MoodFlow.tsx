"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { getIntensityBand, getIntensityDescriptor } from '@/lib/mood-map';
import type { MoodValence } from '@/lib/mood-map';
import Chip from '@/components/ui/Chip';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Slider from '@/components/ui/Slider';

type EmotionsConfig = {
  valence: string[];
  intensity: string[];
  emotions: {
    [key: string]: {
      alta: string[];
      media: string[];
      baja: string[];
    };
  };
  emoji: {
    [key: string]: {
      alta: string[];
      media: string[];
      baja: string[];
    };
  };
};

type ReflectionCopies = {
  dificiles: {
    alta: string[];
    media: string[];
  };
  neutras: {
    alta: string[];
    media: string[];
  };
  agradables: {
    alta: string[];
    media: string[];
  };
};

export type MoodFlowValue = {
  valence: MoodValence;
  intensity: number; // 1..5
  intensityBand: 'baja' | 'media' | 'alta';
  label: string;
  note: string;
};

type Props = {
  value: MoodFlowValue | null;
  onChange: (v: MoodFlowValue | null) => void;
};

export default function MoodFlow({ value, onChange }: Props) {
  const [config, setConfig] = useState<EmotionsConfig | null>(null);
  const [reflectionCopies, setReflectionCopies] = useState<ReflectionCopies | null>(null);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasFocused, setHasFocused] = useState(false);
  const [lastCharCount, setLastCharCount] = useState(0);

  // Estado interno del componente
  const [valence, setValence] = useState<MoodValence | null>(value?.valence || 'neutral');
  const [intensity, setIntensity] = useState<number>(value?.intensity || 3);
  const [label, setLabel] = useState<string>(value?.label || '');
  const [note, setNote] = useState<string>(value?.note || '');

  useEffect(() => {
    (async () => {
      try {
        const [emotionsRes, copiesRes] = await Promise.all([
          fetch('/config/emotions.json'),
          fetch('/config/reflection_copies.json')
        ]);
        const [emotionsData, copiesData] = await Promise.all([
          emotionsRes.json(),
          copiesRes.json()
        ]);
        setConfig(emotionsData);
        setReflectionCopies(copiesData);
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Calcular banda de intensidad
  const intensityBand = useMemo(() => {
    if (!intensity) return 'media';
    return getIntensityBand(intensity);
  }, [intensity]);

  // Función para obtener prompt contextual
  const reflectionPrompt = useMemo(() => {
    if (!reflectionCopies || !valence || !label) {
      return null;
    }
    
    const valenceKey = valence === 'dificil' ? 'dificiles' : valence === 'agradable' ? 'agradables' : 'neutras';
    // Mapear banda: alta -> alta, media/baja -> media
    const intensityKey: 'alta' | 'media' = intensityBand === 'alta' ? 'alta' : 'media';
    const copies = reflectionCopies[valenceKey]?.[intensityKey];
    
    if (!copies || copies.length === 0) return null;
    
    // Elegir uno al azar
    const randomIndex = Math.floor(Math.random() * copies.length);
    const template = copies[randomIndex];
    
    // Reemplazar {palabra} con la palabra seleccionada
    return template.replace(/{palabra}/g, label);
  }, [reflectionCopies, valence, label, intensityBand]);

  // Obtener emociones disponibles según valencia y banda
  const availableEmotions = useMemo(() => {
    if (!config || !valence) return [];
    return config.emotions[valence]?.[intensityBand] || [];
  }, [config, valence, intensityBand]);

  // Obtener emojis según valencia y banda
  const availableEmojis = useMemo(() => {
    if (!config || !valence) return [];
    return config.emoji[valence]?.[intensityBand] || [];
  }, [config, valence, intensityBand]);

  // Manejar cambio de valencia
  const handleValenceChange = (v: string) => {
    const valenceValue = v === 'Más difíciles' ? 'dificil' : v === 'Neutras' ? 'neutral' : 'agradable';
    setValence(valenceValue as MoodValence);
    setLabel(''); // Resetear label al cambiar valencia
    setNote(''); // Resetear nota
  };

  // Manejar cambio de intensidad
  const handleIntensityChange = (i: number) => {
    const newIntensity = i;
    const newBand = getIntensityBand(newIntensity);
    // Resetear label si cambió la banda
    if (intensityBand !== newBand) {
      setLabel('');
      setNote(''); // Resetear nota al cambiar banda
    }
    setIntensity(newIntensity);
  };

  // Manejar selección de label
  const handleLabelSelect = (l: string) => {
    setLabel(l);
    // Resetear nota al cambiar palabra para que aparezca nuevo prompt
    setNote('');
  };

  // Autofoco en textarea cuando se elige una palabra
  useEffect(() => {
    if (label && textareaRef.current) {
      // Pequeño delay para asegurar que el DOM esté actualizado
      setTimeout(() => {
        textareaRef.current?.focus();
        
        // Scroll suave para mantener visible en mobile
        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Telemetría: reflection_shown
        console.log('[telemetry] reflection_shown', { valence, intensity, label });
      }, 100);
    }
  }, [label, valence, intensity]);

  // Telemetría: primer focus
  const handleTextareaFocus = () => {
    if (!hasFocused) {
      setHasFocused(true);
      console.log('[telemetry] reflection_started', { valence, intensity, label });
    }
  };

  // Telemetría: conteo de caracteres
  const handleNoteChange = (text: string) => {
    setNote(text);
    
    // Telemetría cada +20 caracteres
    const currentCount = text.length;
    const previousThreshold = Math.floor(lastCharCount / 20);
    const currentThreshold = Math.floor(currentCount / 20);
    
    if (currentThreshold > previousThreshold && currentCount > 0) {
      console.log('[telemetry] reflection_chars', { 
        chars: currentCount, 
        threshold: currentThreshold * 20,
        valence, 
        intensity, 
        label 
      });
    }
    
    setLastCharCount(currentCount);
  };

  // Navegación por teclado en chips
  const handleChipKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, emotion: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLabelSelect(emotion);
    }
  };

  // Soporte Cmd/Ctrl + Enter para enviar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        // Si el textarea no tiene foco, intentar enviar
        if (document.activeElement !== textareaRef.current) {
          // Este evento será manejado por el componente padre
          e.preventDefault();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Actualizar valor cuando cambian los campos
  useEffect(() => {
    if (!valence || !label) {
      onChange(null);
      return;
    }
    onChange({
      valence,
      intensity,
      intensityBand,
      label,
      note: note.trim()
    });
  }, [valence, intensity, intensityBand, label, note, onChange]);

  // Texto de valencia para mostrar
  const valenceText = useMemo(() => {
    if (!valence) return '';
    return valence === 'dificil' ? 'difíciles' : valence === 'agradable' ? 'agradables' : 'neutras';
  }, [valence]);

  // Descriptor de intensidad actual
  const intensityDescriptor = useMemo(() => {
    return getIntensityDescriptor(intensity);
  }, [intensity]);

  // Texto del resumen dinámico
  const resumenText = useMemo(() => {
    if (!label || !valence) return null;
    return { label, intensityDescriptor, valenceText };
  }, [label, valence, intensityDescriptor, valenceText]);

  // Función para renderizar texto con negritas (**texto** -> <strong>texto</strong>)
  const renderWithBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index}>{boldText}</strong>;
      }
      return part;
    });
  };

  // Función para convertir negritas markdown a texto plano (para placeholder)
  const removeMarkdown = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '$1');
  };

  // Dividir prompt en label corto y placeholder largo
  const promptParts = useMemo(() => {
    if (!reflectionPrompt) return { label: '', placeholder: '', labelJSX: null };
    
    // Si el prompt es muy largo (>80 chars), usarlo como placeholder y label corto
    if (reflectionPrompt.length > 80) {
      return {
        label: '¿Qué más quieres compartir?',
        placeholder: removeMarkdown(reflectionPrompt),
        labelJSX: null
      };
    }
    
    // Si es corto, usarlo como label con negritas renderizadas
    return {
      label: reflectionPrompt,
      placeholder: 'Escribe aquí...',
      labelJSX: renderWithBold(reflectionPrompt)
    };
  }, [reflectionPrompt]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <div className="text-sm text-slate-600">Cargando emociones...</div>
      </div>
    );
  }

  // Mapear valencia a texto para SegmentedControl
  const valenceOption = valence === 'dificil' ? 'Más difíciles' : valence === 'neutral' ? 'Neutras' : valence === 'agradable' ? 'Más agradables' : '';

  return (
    <div className="space-y-4 px-4 sm:px-6 text-slate-900">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">¿Cómo se sienten tus emociones?</h2>
      </div>

      {/* 1️⃣ Tipo de emociones */}
      <div className="flex justify-center gap-3 my-4">
        <SegmentedControl
          options={['Más difíciles', 'Neutras', 'Más agradables']}
          value={valenceOption}
          onChange={handleValenceChange}
          aria-label="Valencia emocional"
        />
      </div>

      {/* 2️⃣ Intensidad */}
      {valence && (
        <>
          <label className="block text-sm font-medium text-gray-700">
            ¿Qué tan intensas se sienten tus emociones ahora?
          </label>
          <Slider
            value={intensity}
            onChange={handleIntensityChange}
            min={1}
            max={5}
            icons={availableEmojis.slice(0, 3)}
            valence={valence}
            intensityBand={intensityBand}
            className="mt-2"
            aria-label={`Intensidad ${intensity} de 5`}
            intensityDescriptor={intensityDescriptor}
          />
        </>
      )}

      {/* 3️⃣ Palabra (etiqueta) */}
      {valence && (
        <>
          <label className="block text-sm font-medium text-gray-700">
            Elige la palabra que más se acerque a cómo te sientes:
          </label>
                  <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Emociones disponibles">
                    {availableEmotions.map((emotion) => (
                      <Chip
                        key={emotion}
                        selected={label === emotion}
                        onClick={() => handleLabelSelect(emotion)}
                        onKeyDown={(e) => handleChipKeyDown(e, emotion)}
                        className="py-1.5 text-sm transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400"
                        aria-pressed={label === emotion}
                        aria-label={`Emoción: ${emotion}`}
                        tabIndex={0}
                      >
                        {emotion}
                      </Chip>
                    ))}
                  </div>
        </>
      )}

      {/* 4️⃣ Reflexión - aparece siempre después de elegir palabra */}
      {label && (
        <div className="space-y-2">
          {promptParts.label && (
            <label htmlFor="mood-reflection" className="block text-sm font-medium text-slate-700">
              {promptParts.labelJSX || promptParts.label}
            </label>
          )}
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="mood-reflection"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50 hover:bg-white"
              placeholder={promptParts.placeholder}
              maxLength={300}
              value={note}
              onChange={(e) => {
                const text = e.target.value.slice(0, 300);
                handleNoteChange(text);
              }}
              onFocus={handleTextareaFocus}
              rows={4}
              aria-label={promptParts.label || 'Reflexión sobre tus emociones'}
              aria-describedby="mood-privacy-help mood-note-counter"
            />
          </div>
          <div className="flex items-center justify-between">
            <span id="mood-privacy-help" className="text-xs text-slate-400 italic">
              Tu respuesta se guarda de forma anónima y se utiliza para acompañarte mejor.
            </span>
            <div className="flex items-center gap-2">
              <span 
                id="mood-note-counter" 
                className={`text-xs font-semibold transition-colors ${
                  note.length > 280 
                    ? 'text-red-600' 
                    : note.length > 200 
                    ? 'text-amber-600' 
                    : 'text-slate-600'
                }`}
              >
                {note.length}/300
              </span>
              {note.length > 0 && (
                <span className="text-xs text-slate-400">
                  {300 - note.length} restantes
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5️⃣ Resumen dinámico */}
      {resumenText && (
        <div
          aria-live="polite"
          aria-atomic="true"
          className="rounded-xl bg-emerald-50 text-emerald-800 text-sm p-4 border border-emerald-200"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="mb-2">
                Gracias por compartir cómo te sientes hoy. Registramos emociones <strong>{resumenText.valenceText}</strong> con intensidad <strong>{resumenText.intensityDescriptor}</strong> y la palabra <strong>{resumenText.label}</strong>.
              </p>
            </div>
            {!note && (
              <button
                type="button"
                onClick={() => {
                  textareaRef.current?.focus();
                  textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-900 underline underline-offset-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 rounded"
                aria-label="Agregar nota sobre tus emociones"
              >
                Agregar nota
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
