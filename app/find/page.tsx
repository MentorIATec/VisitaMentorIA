"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Field from '@/components/Field';
import Skeleton from '@/components/ui/Skeleton';
import Alert from '@/components/ui/Alert';
import Chip from '@/components/ui/Chip';
import Footer from '@/components/Footer';

type Community = { id: number; code: string; name: string; color: string };
type Mentor = {
  id: string;
  email: string;
  display_name: string | null;
  campus: string | null;
  comunidad_id: string | null;
  whatsapp: string | null;
  instagram: string | null;
};

function FindPageContent() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [mRes, cRes] = await Promise.all([
          fetch('/api/mentors'),
          fetch('/api/communities')
        ]);

        if (!mRes.ok || !cRes.ok) {
          throw new Error('Error al cargar datos');
        }

        const [mData, cData] = await Promise.all([
          mRes.json(),
          cRes.json()
        ]);

        setMentors(mData);
        setCommunities(cData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('No se pudieron cargar los datos.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleWhatsApp = (phone: string) => {
    if (!phone) return;
    // Formato: 521 para México (país + código de área sin 0 inicial)
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/52${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmail = (email: string) => {
    if (!email) return;
    window.location.href = `mailto:${email}`;
  };

  // Filtrar mentores: búsqueda siempre es global, luego se puede filtrar por comunidad
  const filterMentors = (mentorList: Mentor[]) => {
    let filtered = mentorList;
    
    // Primero filtrar por búsqueda de texto (siempre global)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.display_name?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query)
      );
    }
    
    // Luego filtrar por comunidad (solo si está seleccionada)
    if (selectedCommunity) {
      filtered = filtered.filter(
        m => m.comunidad_id?.toLowerCase() === selectedCommunity.code.toLowerCase()
      );
    }
    
    // Ordenar alfabéticamente por nombre
    return filtered.sort((a, b) => {
      const nameA = a.display_name || a.email || '';
      const nameB = b.display_name || b.email || '';
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });
  };

  const filteredMentors = filterMentors(mentors);

  // Agrupar mentores por comunidad (solo si no hay búsqueda activa)
  const mentorsByCommunity = !searchQuery.trim() 
    ? communities
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
        .reduce((acc, comm) => {
          const communityMentors = mentors.filter(
            m => m.comunidad_id?.toLowerCase() === comm.code.toLowerCase()
          ).sort((a, b) => {
            const nameA = a.display_name || a.email || '';
            const nameB = b.display_name || b.email || '';
            return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
          });
          if (communityMentors.length > 0) {
            acc[comm.code] = {
              community: comm,
              mentors: communityMentors
            };
          }
          return acc;
        }, {} as Record<string, { community: Community; mentors: Mentor[] }>)
    : {};

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-2xl p-6 pb-24">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Contactar a mi mentora o mentor</h1>
              <p className="text-sm text-slate-600">
                Encuentra a tu mentora o mentor por comunidad o busca por nombre
              </p>
            </div>
            <Link href="/">
              <Button variant="secondary" className="whitespace-nowrap">
                ← Registrar sesión
              </Button>
            </Link>
          </div>
        </header>

        {error && (
          <Alert variant="error" className="mb-6" role="alert" aria-live="assertive">
            {error}
          </Alert>
        )}

        {/* Búsqueda por nombre de mentor */}
        <section className="mb-6">
          <Field label="Buscar mentora o mentor por nombre" htmlFor="mentor-search">
            <Input
              id="mentor-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe el nombre de la mentora o mentor..."
              className="w-full"
            />
          </Field>
        </section>

        {/* Filtro por comunidad */}
        {!loading && communities.length > 0 && (
          <section className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Filtrar por comunidad:
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por comunidad">
              {communities.map((comm) => (
                <Chip
                  key={comm.id}
                  onClick={() => {
                    // Si ya está seleccionada, deseleccionar; si no, seleccionar
                    if (selectedCommunity?.id === comm.id) {
                      setSelectedCommunity(null);
                    } else {
                      setSelectedCommunity(comm);
                    }
                  }}
                  color={comm.color}
                  selected={selectedCommunity?.id === comm.id}
                  variant="outline"
                  aria-label={`${selectedCommunity?.id === comm.id ? 'Deseleccionar' : 'Seleccionar'} comunidad ${comm.name}`}
                >
                  {comm.name}
                </Chip>
              ))}
            </div>
          </section>
        )}

        {/* Lista de mentores */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : searchQuery.trim() ? (
          // Búsqueda activa - siempre global, con filtro opcional de comunidad
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {selectedCommunity 
                ? `Resultados en ${selectedCommunity.name} (${filteredMentors.length} resultado${filteredMentors.length !== 1 ? 's' : ''})`
                : `Resultados de búsqueda (${filteredMentors.length} resultado${filteredMentors.length !== 1 ? 's' : ''})`
              }
            </h2>
            {filteredMentors.length > 0 ? (
              <div className="space-y-4">
                {filteredMentors.map((mentor) => {
                  const mentorCommunity = communities.find(
                    c => c.code.toLowerCase() === mentor.comunidad_id?.toLowerCase()
                  );
                  return (
                    <div
                      key={mentor.id}
                      className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {mentor.display_name || mentor.email}
                          </h3>
                          <p className="text-sm text-slate-600">{mentor.email}</p>
                          {mentorCommunity && (
                            <div className="mt-2">
                              <Chip
                                color={mentorCommunity.color}
                                selected
                                variant="outline"
                                disabled
                                className="text-xs"
                              >
                                {mentorCommunity.name}
                              </Chip>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {mentor.whatsapp && (
                          <Button
                            variant="secondary"
                            onClick={() => handleWhatsApp(mentor.whatsapp!)}
                            className="text-sm"
                            aria-label={`Contactar por WhatsApp a ${mentor.display_name || mentor.email}`}
                          >
                            📱 WhatsApp
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          onClick={() => handleEmail(mentor.email)}
                          className="text-sm"
                          aria-label={`Enviar correo a ${mentor.email}`}
                        >
                          ✉️ Correo
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center border border-slate-200 rounded-lg bg-slate-50">
                <p className="text-slate-600">
                  {selectedCommunity 
                    ? `No se encontraron mentores con "${searchQuery.trim()}" en ${selectedCommunity.name}.`
                    : `No se encontraron mentores con "${searchQuery.trim()}".`
                  }
                </p>
                {selectedCommunity && (
                  <p className="text-sm text-slate-500 mt-2">
                    Intenta deseleccionar la comunidad para buscar en todas las comunidades.
                  </p>
                )}
              </div>
            )}
          </section>
        ) : selectedCommunity ? (
          // Sin búsqueda, pero con comunidad seleccionada - mostrar todos los mentores de esa comunidad
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Mentores de {selectedCommunity.name} ({filteredMentors.length})
            </h2>
            {filteredMentors.length > 0 ? (
              <div className="space-y-4">
                {filteredMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {mentor.display_name || mentor.email}
                        </h3>
                        <p className="text-sm text-slate-600">{mentor.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {mentor.whatsapp && (
                        <Button
                          variant="secondary"
                          onClick={() => handleWhatsApp(mentor.whatsapp!)}
                          className="text-sm"
                          aria-label={`Contactar por WhatsApp a ${mentor.display_name || mentor.email}`}
                        >
                          📱 WhatsApp
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() => handleEmail(mentor.email)}
                        className="text-sm"
                        aria-label={`Enviar correo a ${mentor.email}`}
                      >
                        ✉️ Correo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-slate-200 rounded-lg bg-slate-50">
                <p className="text-slate-600">
                  No hay mentores en {selectedCommunity.name}.
                </p>
              </div>
            )}
          </section>
        ) : (
          // Sin filtros - mostrar mensaje amigable
          <section>
            <div className="p-8 text-center border border-slate-200 rounded-lg bg-slate-50">
              <p className="text-slate-700 font-medium mb-2">
                Selecciona una comunidad o busca por nombre
              </p>
              <p className="text-sm text-slate-600">
                Elige una comunidad de la lista arriba o escribe el nombre de la mentora o mentor en el campo de búsqueda.
              </p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function FindPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-600">Cargando...</div>
      </div>
    }>
      <FindPageContent />
    </Suspense>
  );
}
