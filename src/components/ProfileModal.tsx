import { useState, useEffect, useRef } from 'react';
import {
  X, Ticket, Calendar, MapPin, Tag, Loader2, Inbox,
  Upload, CheckCircle, AlertCircle, FileImage, ExternalLink,
} from 'lucide-react';
import { fetchMyTickets, fetchMe, uploadDeliveryProof } from '../lib/api';
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

// ---- DeliveryProofSection ----

function DeliveryProofSection({ initialUrl }: { initialUrl: string | null }) {
  const [proofUrl, setProofUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setJustUploaded(false);

    try {
      const res = await uploadDeliveryProof(file);
      setProofUrl(res.delivery_proof_url);
      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar comprovante.');
    } finally {
      setUploading(false);
      // Reset input para permitir re-upload do mesmo arquivo
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const proofSrc = proofUrl ? mediaUrl(proofUrl) : null;

  return (
    <div className="px-7 py-5 border-b border-white/5">
      {/* Header da seção */}
      <div className="flex items-center gap-2.5 mb-4">
        <FileImage className="w-4 h-4 text-[#00FF87]" />
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          Comprovante de Viagens / Entregas
        </h2>
        <span className="ml-auto text-[10px] font-medium text-white/30 uppercase tracking-wider">
          mín. 200
        </span>
      </div>

      <div className="flex items-start gap-4">
        {/* Preview da imagem atual */}
        <div
          className="w-20 h-20 rounded-xl border border-white/10 bg-white/5 flex-shrink-0 overflow-hidden flex items-center justify-center"
        >
          {proofSrc ? (
            <img
              src={proofSrc}
              alt="Comprovante"
              className="w-full h-full object-cover"
            />
          ) : (
            <FileImage className="w-7 h-7 text-white/15" />
          )}
        </div>

        {/* Info + ações */}
        <div className="flex-1 min-w-0 space-y-2">
          {proofSrc ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#00FF87] flex-shrink-0" />
              <span className="text-xs text-[#00FF87] font-medium">Comprovante enviado</span>
              <a
                href={proofSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Ver
              </a>
            </div>
          ) : (
            <p className="text-xs text-white/40 leading-relaxed">
              Envie uma imagem comprovando pelo menos 200 viagens ou entregas realizadas.
            </p>
          )}

          {error && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}

          {justUploaded && (
            <p className="text-xs text-[#00FF87]">Comprovante atualizado com sucesso!</p>
          )}

          {/* Botão de upload */}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-xs text-white/60 hover:text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Upload className="w-3.5 h-3.5" />
            }
            {uploading ? 'Enviando...' : proofUrl ? 'Substituir imagem' : 'Enviar comprovante'}
          </button>

          <p className="text-[10px] text-white/20">JPEG, PNG ou WebP · máx. 10 MB</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ---- component ----

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user } = useAuthContext();
  const [deliveryProofUrl, setDeliveryProofUrl] = useState<string | null>(null);
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open) {
      setTickets([]);
      setMeta(null);
      setPage(1);
      setDeliveryProofUrl(null);
      return;
    }
    // Carrega perfil completo e ingressos em paralelo
    fetchMe()
      .then((me) => setDeliveryProofUrl(me.delivery_proof_url))
      .catch(() => {});
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

        {/* Seção de comprovante — acima dos ingressos */}
        <DeliveryProofSection initialUrl={deliveryProofUrl} />

        {/* Section title — ingressos */}
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
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
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
