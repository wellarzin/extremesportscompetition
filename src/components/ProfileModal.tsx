import { useState, useEffect } from 'react';
import { X, Ticket, Calendar, MapPin, Tag, Loader2, Inbox } from 'lucide-react';
import { fetchMyTickets } from '../lib/api';
import { mediaUrl } from '../lib/utils';
import { useAuthContext } from '../contexts/AuthContext';
import type { UserTicket, ApiMeta } from '../types/api';

// ---- helpers ----

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Gratuito';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function categoryLabel(raw: string): string {
  const map: Record<string, string> = {
    maratona: 'Maratona',
    trail: 'Trail',
    ultramaratona: 'Ultramaratona',
    campeonato_crossfit: 'Crossfit',
    campeonato_natacao: 'Natação',
    campeonato_ciclismo: 'Ciclismo',
    campeonato_volei: 'Vôlei',
    campeonato_basquete: 'Basquete',
    beach_tennis: 'Beach Tennis',
    corrida_de_obstaculos: 'Obstáculos',
    desafio_aberto: 'Desafio',
    evento_recreativo: 'Recreativo',
    outros: 'Evento',
  };
  return map[raw] ?? raw;
}

const STATUS_CONFIG = {
  ativo: { label: 'Ativo', classes: 'bg-[#00FF87]/10 text-[#00FF87] border-[#00FF87]/20' },
  cancelado: { label: 'Cancelado', classes: 'bg-red-500/10 text-red-400 border-red-500/20' },
  usado: { label: 'Utilizado', classes: 'bg-white/8 text-white/40 border-white/10' },
};

// ---- component ----

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user } = useAuthContext();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open) {
      setTickets([]);
      setMeta(null);
      setPage(1);
      return;
    }
    loadTickets(1);
  }, [open]);

  async function loadTickets(p: number) {
    setIsLoading(true);
    try {
      const res = await fetchMyTickets(p, 12);
      setTickets(prev => p === 1 ? res.data : [...prev, ...res.data]);
      setMeta(res.meta);
      setPage(p);
    } catch {
      // silencia — o usuário pode tentar novamente
    } finally {
      setIsLoading(false);
    }
  }

  if (!open || !user) return null;

  const fullName = user.full_name ?? user.email ?? 'Usuário';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  const avatarSrc = user.photo_url ? mediaUrl(user.photo_url) : null;
  const hasMore = meta ? page < meta.total_pages : false;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#141414] border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-4 px-7 py-5 border-b border-white/5 flex-shrink-0">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-[#4169E1]/20 flex items-center justify-center ring-2 ring-white/10">
            {avatarSrc ? (
              <img src={avatarSrc} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#4169E1] font-bold text-base">{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{user.full_name ?? user.email}</p>
            <p className="text-white/40 text-sm truncate">{user.email}</p>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar perfil"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Section title */}
        <div className="flex items-center gap-2.5 px-7 py-4 border-b border-white/5 flex-shrink-0">
          <Ticket className="w-4 h-4 text-[#FF6B00]" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Meus Ingressos
          </h2>
          {meta && (
            <span className="ml-auto text-xs text-white/30">
              {meta.total} {meta.total === 1 ? 'inscrição' : 'inscrições'}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-7">
          {isLoading && tickets.length === 0 ? (
            /* Loading skeleton */
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/50 font-medium mb-1">Nenhuma inscrição ainda</p>
              <p className="text-white/25 text-sm">
                Explore os eventos e garanta sua vaga!
              </p>
            </div>
          ) : (
            /* Tickets list */
            <div className="space-y-4">
              {tickets.map(ticket => {
                const cover = ticket.event.cover_image_url
                  ? mediaUrl(ticket.event.cover_image_url)
                  : null;
                const status = STATUS_CONFIG[ticket.status];
                const location = ticket.event.location
                  || (ticket.event.city
                    ? `${ticket.event.city}${ticket.event.state ? `, ${ticket.event.state}` : ''}`
                    : null);

                return (
                  <div
                    key={ticket.id}
                    className="flex gap-4 p-4 rounded-xl bg-white/4 border border-white/8 hover:border-white/15 transition-colors"
                  >
                    {/* Cover */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                      {cover ? (
                        <img
                          src={cover}
                          alt={ticket.event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tag className="w-6 h-6 text-white/15" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-white font-semibold text-sm leading-snug line-clamp-2">
                          {ticket.event.title}
                        </p>
                        <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.classes}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(ticket.event.start_datetime)}
                        </span>

                        {location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[140px]">{location}</span>
                          </span>
                        )}

                        <span className="flex items-center gap-1 ml-auto">
                          <Tag className="w-3 h-3" />
                          {categoryLabel(ticket.event.category)}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-white/25">
                          Comprado em {formatDate(ticket.purchased_at)}
                        </span>
                        <span className={`text-xs font-semibold ${ticket.price_paid_cents === 0 ? 'text-[#00FF87]' : 'text-white/60'}`}>
                          {formatPrice(ticket.price_paid_cents)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load more */}
              {hasMore && (
                <button
                  onClick={() => loadTickets(page + 1)}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isLoading ? 'Carregando...' : 'Carregar mais'}
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
