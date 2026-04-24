import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { fetchLandingEvents, ApiError } from '../lib/api';
import type { LandingEvent, ApiMeta } from '../types/api';
import { mediaUrl } from '../lib/utils';
import { useNavigation } from '../contexts/NavigationContext';
import { EventDetailModal, formatDate, formatPrice, categoryLabel, modalityColor, modalityLabel, statusBadge } from '../components/EventDetailModal';

const PER_PAGE = 12;

function SkeletonCard() {
  return (
    <div className="bg-[#141414] rounded-2xl overflow-hidden border border-white/5 animate-pulse">
      <div className="h-52 bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-white/5 rounded w-3/4" />
        <div className="h-4 bg-white/5 rounded w-1/2" />
        <div className="h-px bg-white/5 my-3" />
        <div className="flex justify-between items-center">
          <div className="h-6 bg-white/5 rounded w-20" />
          <div className="h-9 bg-white/5 rounded w-28" />
        </div>
      </div>
    </div>
  );
}

export function AllEventsPage() {
  const { navigate } = useNavigation();
  const [events, setEvents] = useState<LandingEvent[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchLandingEvents({ page, per_page: PER_PAGE })
      .then((result) => {
        if (!cancelled) {
          setEvents(result.data);
          setMeta(result.meta ?? null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os eventos.');
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [page]);

  useEffect(() => {
    const cancel = load();
    return cancel;
  }, [load]);

  // Scroll to top of content when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const totalPages = meta?.total_pages ?? 1;

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('landing')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-baseline gap-3">
            <h1 className="text-white font-bold text-base">Todos os Eventos</h1>
            {meta && !isLoading && (
              <span className="text-white/30 text-sm">{meta.total} encontrados</span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-white/50 text-center">{error}</p>
            <button
              onClick={load}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Grid */}
        {!error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)
              : events.map((event: LandingEvent) => {
                  const badge = statusBadge(event.status);
                  return (
                    <div
                      key={event.id}
                      className="group relative bg-[#141414] rounded-2xl overflow-hidden border border-white/5 hover:border-[#4169E1]/30 transition-all duration-500"
                    >
                      {/* Image */}
                      <div className="relative h-52 overflow-hidden">
                        {mediaUrl(event.cover_image_url) ? (
                          <img
                            src={mediaUrl(event.cover_image_url)!}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => {
                              const el = e.currentTarget as HTMLImageElement;
                              el.style.display = 'none';
                              el.parentElement?.classList.add('bg-gradient-to-br', 'from-[#4169E1]/20', 'to-[#FF6B00]/20');
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#4169E1]/20 to-[#FF6B00]/20" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

                        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${modalityColor(event.modality)}`}>
                          {modalityLabel(event.modality)}
                        </div>
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium">
                          {categoryLabel(event.category)}
                        </div>
                        {badge && (
                          <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-sans font-bold text-white mb-2 group-hover:text-[#4169E1] transition-colors line-clamp-2">
                          {event.title}
                        </h3>

                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <Calendar className="w-3.5 h-3.5 text-[#FF6B00] flex-shrink-0" />
                            <span>{formatDate(event.start_datetime)}</span>
                          </div>
                          {(event.city || event.location) && (
                            <div className="flex items-center gap-2 text-white/60 text-sm">
                              <MapPin className="w-3.5 h-3.5 text-[#4169E1] flex-shrink-0" />
                              <span className="truncate">
                                {event.location ?? `${event.city}${event.state ? `, ${event.state}` : ''}`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div>
                            <span className="text-white/40 text-xs">Inscrição</span>
                            <p className={`text-xl font-bold ${event.price_cents === 0 ? 'text-[#00C45A]' : 'text-white'}`}>
                              {formatPrice(event.price_cents)}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedEventId(event.id)}
                            className="px-4 py-2 bg-[#FF6B00] hover:bg-[#FF8533] text-white font-medium rounded-lg transition-colors text-sm"
                          >
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && events.length === 0 && (
          <div className="text-center py-24 text-white/40">
            Nenhum evento disponível no momento.
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-14">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="text-white/30 px-1">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                        page === item
                          ? 'bg-[#4169E1] text-white'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
            </div>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {selectedEventId && (
        <EventDetailModal eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />
      )}
    </main>
  );
}
