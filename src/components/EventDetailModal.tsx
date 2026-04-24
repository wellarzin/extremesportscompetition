import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, RefreshCw, Calendar, MapPin, Users, Trophy,
  Copy, Check, ExternalLink, Clock, Lock, Ticket, AlertCircle,
  Zap, CreditCard,
} from 'lucide-react';
import { fetchLandingEventDetail, enrollFreeEvent, initiateCheckout, getPaymentStatus, ApiError } from '../lib/api';
import type { PaymentMethod } from '../lib/api';
import type { LandingEventDetail, PaymentSession } from '../types/api';
import { mediaUrl } from '../lib/utils';
import { useAuthContext } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';

// ---- helpers ----

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatPrice(cents: number): string {
  if (cents === 0) return 'Gratuito';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function categoryLabel(raw: string): string {
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

export function modalityColor(modality: string): string {
  return modality === 'online'
    ? 'bg-[#4169E1]/20 text-[#4169E1]'
    : 'bg-[#FF6B00]/20 text-[#FF6B00]';
}

export function modalityLabel(modality: string): string {
  return modality === 'online' ? 'Online' : 'Presencial';
}

export function statusBadge(status: string): { label: string; className: string } | null {
  if (status === 'esgotado') return { label: 'Esgotado', className: 'bg-red-500/20 text-red-400' };
  if (status === 'em_breve') return { label: 'Em breve', className: 'bg-yellow-500/20 text-yellow-400' };
  if (status === 'encerrado') return { label: 'Encerrado', className: 'bg-white/10 text-white/50' };
  return null;
}

function formatCountdown(expiresAt: string): string {
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ---- checkout state machine ----

type CheckoutState =
  | { phase: 'idle' }
  | { phase: 'selecting_method' }
  | { phase: 'loading'; method: PaymentMethod }
  | { phase: 'awaiting_payment'; session: PaymentSession; method: PaymentMethod }
  | { phase: 'success' }
  | { phase: 'error'; message: string };

// ---- method selector ----

const METHOD_OPTIONS: { value: PaymentMethod; label: string; sublabel: string; Icon: React.ElementType; color: string }[] = [
  { value: 'pix',         label: 'PIX',            sublabel: 'Aprovação imediata',    Icon: Zap,        color: '#00C45A' },
  { value: 'credit_card', label: 'Cartão de crédito', sublabel: 'Parcelamento em até 12x', Icon: CreditCard, color: '#4169E1' },
];

function MethodSelector({
  amountCents,
  onSelect,
  onBack,
}: {
  amountCents: number;
  onSelect: (method: PaymentMethod) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-white/80">Escolha o pagamento</p>
        <span className="text-lg font-bold text-white">{formatPrice(amountCents)}</span>
      </div>
      {METHOD_OPTIONS.map(({ value, label, sublabel, Icon, color }) => (
        <button
          key={value}
          onClick={() => onSelect(value)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-none">{label}</p>
            <p className="text-xs text-white/40 mt-0.5">{sublabel}</p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
        </button>
      ))}
      <button
        onClick={onBack}
        className="w-full text-xs text-white/30 hover:text-white/60 py-1 transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
}

// ---- checkout panel (PIX ou cartão) ----

function CheckoutPanel({
  session,
  method,
  onExpired,
  onPaid,
}: {
  session: PaymentSession;
  method: PaymentMethod;
  onExpired: () => void;
  onPaid: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(() => formatCountdown(session.expires_at));
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPix = method === 'pix';
  const isCard = method === 'credit_card';
  const methodOption = METHOD_OPTIONS.find((m) => m.value === method)!;

  // Cartão: abre checkout em nova aba automaticamente ao montar
  useEffect(() => {
    if (isCard && session.checkout_url) {
      window.open(session.checkout_url, '_blank', 'noopener,noreferrer');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intencional: apenas na montagem

  // Countdown timer
  useEffect(() => {
    tickRef.current = setInterval(() => {
      const remaining = new Date(session.expires_at).getTime() - Date.now();
      if (remaining <= 0) {
        clearInterval(tickRef.current!);
        onExpired();
        return;
      }
      setCountdown(formatCountdown(session.expires_at));
    }, 1000);
    return () => clearInterval(tickRef.current!);
  }, [session.expires_at, onExpired]);

  // Polling de status a cada 3s
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await getPaymentStatus(session.payment_id);
        if (res.status === 'paid') {
          clearInterval(pollRef.current!);
          onPaid();
        } else if (res.status === 'expired' || res.status === 'failed') {
          clearInterval(pollRef.current!);
          onExpired();
        }
      } catch {
        // silently ignore polling errors
      }
    }, 3000);
    return () => clearInterval(pollRef.current!);
  }, [session.payment_id, onPaid, onExpired]);

  const handleCopy = () => {
    if (!session.pix_code) return;
    navigator.clipboard.writeText(session.pix_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="space-y-4">
      {/* Price + method badge */}
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center gap-2">
          <methodOption.Icon className="w-4 h-4" style={{ color: methodOption.color }} />
          <span className="text-sm text-white/60">{methodOption.label}</span>
        </div>
        <span className="text-lg font-bold text-white">{formatPrice(session.amount_cents)}</span>
      </div>

      {/* Countdown */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/20">
        <Clock className="w-3.5 h-3.5 text-[#FF6B00] flex-shrink-0" />
        <span className="text-sm text-white/70">
          Expira em{' '}
          <span className="font-mono font-bold text-[#FF6B00]">{countdown}</span>
        </span>
      </div>

      {/* PIX: QR code */}
      {isPix && session.pix_qr_code && (
        <div className="flex justify-center p-4 bg-white rounded-xl">
          <img
            src={session.pix_qr_code.startsWith('data:') ? session.pix_qr_code : `data:image/png;base64,${session.pix_qr_code}`}
            alt="QR Code PIX"
            className="w-40 h-40 object-contain"
          />
        </div>
      )}

      {/* PIX: copia e cola */}
      {isPix && session.pix_code && (
        <div className="space-y-2">
          <p className="text-xs text-white/40 font-medium uppercase tracking-wider">
            PIX Copia e Cola
          </p>
          <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/10 relative">
            <p className="text-xs text-[#4169E1] font-mono break-all leading-relaxed pr-10 select-all">
              {session.pix_code}
            </p>
            <button
              onClick={handleCopy}
              aria-label="Copiar código PIX"
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {copied
                ? <Check className="w-3.5 h-3.5 text-[#00C45A]" />
                : <Copy className="w-3.5 h-3.5 text-white/60" />
              }
            </button>
          </div>
          {copied && (
            <p className="text-xs text-[#00C45A] text-center">Código copiado!</p>
          )}
        </div>
      )}

      {/* Cartão: redirecionamento para checkout hospedado */}
      {isCard && session.checkout_url && (
        <div className="space-y-3">
          <div className="p-4 bg-[#4169E1]/10 border border-[#4169E1]/20 rounded-xl text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#4169E1]/20 flex items-center justify-center mx-auto">
              <CreditCard className="w-5 h-5 text-[#4169E1]" />
            </div>
            <p className="text-sm font-medium text-white/80">
              Uma nova aba foi aberta com a página de pagamento.
            </p>
            <p className="text-xs text-white/40">
              Conclua o pagamento lá e esta tela será atualizada automaticamente.
            </p>
          </div>
          <a
            href={session.checkout_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold border border-[#4169E1]/40 hover:bg-[#4169E1]/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir página novamente
          </a>
        </div>
      )}

      {/* Polling indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-white/30">
        <RefreshCw className="w-3 h-3 animate-spin" />
        Aguardando confirmação do pagamento...
      </div>
    </div>
  );
}

// ---- main component ----

interface EventDetailModalProps {
  eventId: string;
  onClose: () => void;
}

export function EventDetailModal({ eventId, onClose }: EventDetailModalProps) {
  const [detail, setDetail] = useState<LandingEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutState>({ phase: 'idle' });

  const { user } = useAuthContext();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    fetchLandingEventDetail(eventId)
      .then((d) => { if (!cancelled) { setDetail(d); setIsLoading(false); } })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar evento.');
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [eventId]);

  const handleEnroll = useCallback(async () => {
    if (!detail) return;
    if (!user) { openAuthModal(); return; }

    if (detail.price_cents === 0) {
      setCheckout({ phase: 'loading', method: 'pix' });
      try {
        await enrollFreeEvent(eventId);
        setCheckout({ phase: 'success' });
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Ocorreu um erro. Tente novamente.';
        setCheckout({ phase: 'error', message });
      }
    } else {
      setCheckout({ phase: 'selecting_method' });
    }
  }, [detail, user, eventId, openAuthModal]);

  const handleMethodSelected = useCallback(async (method: PaymentMethod) => {
    if (!detail) return;
    setCheckout({ phase: 'loading', method });
    try {
      const session = await initiateCheckout(eventId, method);
      setCheckout({ phase: 'awaiting_payment', session, method });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Ocorreu um erro. Tente novamente.';
      setCheckout({ phase: 'error', message });
    }
  }, [detail, eventId]);

  const handleExpired = useCallback(() => {
    setCheckout({ phase: 'error', message: 'O tempo para pagamento expirou. Tente novamente.' });
  }, []);

  const handlePaid = useCallback(() => {
    setCheckout({ phase: 'success' });
  }, []);

  const resetCheckout = useCallback(() => {
    setCheckout({ phase: 'idle' });
  }, []);

  // ---- button label / disabled ----
  const isEventOpen = detail?.status === 'aberto';
  const actionDisabled = !isEventOpen || checkout.phase === 'loading';

  function renderActionButton() {
    if (!isEventOpen) {
      return (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white/30 font-semibold rounded-xl cursor-not-allowed border border-white/10"
        >
          <Lock className="w-5 h-5" />
          Inscrições Encerradas
        </button>
      );
    }

    if (checkout.phase === 'loading') {
      return (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#FF6B00]/50 text-white/50 font-semibold rounded-xl cursor-not-allowed"
        >
          <RefreshCw className="w-5 h-5 animate-spin" />
          Processando...
        </button>
      );
    }

    if (!user) {
      return (
        <button
          onClick={openAuthModal}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#4169E1] hover:bg-[#5A7FE8] text-white font-semibold rounded-xl transition-colors"
        >
          <Lock className="w-5 h-5" />
          Faça login para se inscrever
        </button>
      );
    }

    return (
      <button
        onClick={handleEnroll}
        disabled={actionDisabled}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#FF8533] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {detail?.price_cents === 0 ? (
          <><Ticket className="w-5 h-5" /> Inscrever-se Gratuitamente</>
        ) : (
          <><Ticket className="w-5 h-5" /> Comprar Ingresso</>
        )}
      </button>
    );
  }

  function renderSidebarCheckout() {
    if (checkout.phase === 'success') {
      return (
        <div className="space-y-4">
          <div className="p-5 bg-[#00C45A]/10 border border-[#00C45A]/25 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#00C45A]/20 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-[#00C45A]" />
            </div>
            <p className="text-[#00C45A] font-bold text-lg">Inscrição confirmada!</p>
            <p className="text-white/50 text-sm">
              {detail?.price_cents === 0
                ? 'Você está inscrito neste evento.'
                : 'Pagamento recebido. Seu ingresso está garantido.'}
            </p>
          </div>
        </div>
      );
    }

    if (checkout.phase === 'error') {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm leading-relaxed">{checkout.message}</p>
            </div>
          </div>
          <button
            onClick={resetCheckout}
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm font-medium transition-all"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    if (checkout.phase === 'selecting_method') {
      return (
        <MethodSelector
          amountCents={detail?.price_cents ?? 0}
          onSelect={handleMethodSelected}
          onBack={resetCheckout}
        />
      );
    }

    if (checkout.phase === 'awaiting_payment') {
      return (
        <CheckoutPanel
          session={checkout.session}
          method={checkout.method}
          onExpired={handleExpired}
          onPaid={handlePaid}
        />
      );
    }

    // idle / loading — show price block + button
    return (
      <div className="space-y-4">
        <div className="p-4 bg-gradient-to-r from-[#4169E1]/20 to-[#FF6B00]/20 rounded-xl border border-[#4169E1]/20">
          <p className="text-white/60 text-sm mb-1">Inscrição</p>
          <p className={`text-3xl font-bold ${detail?.price_cents === 0 ? 'text-[#00C45A]' : 'text-white'}`}>
            {detail ? formatPrice(detail.price_cents) : '—'}
          </p>
          {detail?.capacity !== null && detail?.capacity !== undefined && (
            <p className="text-white/40 text-xs mt-2">
              {detail.enrolled} / {detail.capacity} inscritos
            </p>
          )}
        </div>
        {renderActionButton()}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-[#141414] border border-white/10 rounded-2xl">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-[#FF6B00] animate-spin" />
          </div>
        )}

        {loadError && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 p-8 text-center">
            <p className="text-white/60">{loadError}</p>
          </div>
        )}

        {detail && !isLoading && (
          <>
            <div className="relative h-64 md:h-80">
              {mediaUrl(detail.cover_image_url) ? (
                <img
                  src={mediaUrl(detail.cover_image_url)!}
                  alt={detail.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#4169E1]/20 to-[#FF6B00]/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-16">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${modalityColor(detail.modality)}`}>
                    {modalityLabel(detail.modality)}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium">
                    {categoryLabel(detail.category)}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-sans font-bold text-white">{detail.title}</h2>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: event details */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Sobre o Evento</h3>
                    <p className="text-white/70 leading-relaxed">{detail.description}</p>
                  </div>
                  {detail.rules && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Regras</h3>
                      <p className="text-white/70 leading-relaxed">{detail.rules}</p>
                    </div>
                  )}
                  {detail.ranking_points !== null && detail.ranking_points > 0 && (
                    <div className="p-4 bg-gradient-to-r from-[#4169E1]/10 to-[#FF6B00]/10 rounded-xl border border-white/5 flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-[#FF6B00] flex-shrink-0" />
                      <p className="text-white/80 text-sm">
                        Este evento concede{' '}
                        <span className="font-bold text-[#FF6B00]">{detail.ranking_points} pontos</span>{' '}
                        ao ranking.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: info + checkout */}
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Data de início</span>
                    </div>
                    <p className="text-white font-medium">{formatDate(detail.start_datetime)}</p>
                    {detail.end_datetime && (
                      <p className="text-white/50 text-sm mt-1">Até {formatDate(detail.end_datetime)}</p>
                    )}
                  </div>

                  {(detail.location || detail.city) && (
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>Local</span>
                      </div>
                      {detail.location && <p className="text-white font-medium">{detail.location}</p>}
                      {detail.city && (
                        <p className="text-white/60 text-sm">
                          {detail.city}{detail.state ? `, ${detail.state}` : ''}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <Users className="w-4 h-4" />
                      <span>Modalidade</span>
                    </div>
                    <p className="text-white font-medium">{modalityLabel(detail.modality)}</p>
                  </div>

                  {/* Checkout area — state-driven */}
                  {renderSidebarCheckout()}

                  <p className="text-white/30 text-xs text-center">
                    Organizador: {detail.organizer.full_name}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
