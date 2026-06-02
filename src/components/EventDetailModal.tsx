import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, RefreshCw, Calendar, MapPin, Users, Gift,
  Copy, Check, ExternalLink, Clock, Lock, Ticket, AlertCircle,
  Zap, CreditCard, FileDown, UserPlus, Trash2, ChevronRight,
} from 'lucide-react';
import { fetchLandingEventDetail, enrollFreeEvent, initiateCheckout, initiateTeamCheckout, getPaymentStatus, devSimulateCardCheckout, ApiError } from '../lib/api';
import type { PaymentMethod, ProfessionalChoice } from '../lib/api';
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
  // Escolha de profissional (precede o método de pagamento quando evento exige)
  | { phase: 'professional_choice'; flow: 'individual' | 'team'; teamEmails?: string[]; teamName?: string }
  | { phase: 'selecting_method' }
  | { phase: 'loading'; method: PaymentMethod }
  | { phase: 'awaiting_payment'; session: PaymentSession; method: PaymentMethod }
  | { phase: 'success'; isTeam?: boolean; memberCount?: number }
  | { phase: 'error'; message: string }
  // Fluxo de equipe
  | { phase: 'team_emails' }
  | { phase: 'team_selecting_method'; emails: string[]; teamName: string }
  | { phase: 'team_loading'; method: PaymentMethod; emails: string[]; teamName: string };

// ---- professional choice form ----

function ProfessionalChoiceForm({
  onConfirm,
  onBack,
}: {
  onConfirm: (choice: ProfessionalChoice) => void;
  onBack: () => void;
}) {
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null);
  const [cref, setCref] = useState('');
  const [crefTouched, setCrefTouched] = useState(false);

  const crefValid = cref.trim().length >= 5;
  const canContinue = answer === 'yes' || (answer === 'no' && crefValid);

  function handleConfirm() {
    if (!canContinue) return;
    if (answer === 'yes') {
      onConfirm({ uses_platform_professional: true });
    } else {
      onConfirm({ uses_platform_professional: false, external_cref: cref.trim() });
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white/90 leading-snug">
          Você vai utilizar os serviços de profissionais cadastrados na plataforma?
        </p>
        <p className="text-xs text-white/40">
          Educadores físicos e nutricionistas credenciados pela Extreme Competition.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setAnswer('yes')}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
            answer === 'yes'
              ? 'bg-[#00C45A]/15 border-[#00C45A]/50 text-[#00C45A]'
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:border-white/20'
          }`}
        >
          {answer === 'yes' && <Check className="w-4 h-4 flex-shrink-0" />}
          Sim
        </button>
        <button
          onClick={() => setAnswer('no')}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
            answer === 'no'
              ? 'bg-[#FF6B00]/15 border-[#FF6B00]/50 text-[#FF6B00]'
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:border-white/20'
          }`}
        >
          Não
        </button>
      </div>

      {answer === 'no' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
            CREF do profissional
          </label>
          <input
            type="text"
            placeholder="Ex: CREF 012345-G/SP"
            value={cref}
            onChange={(e) => setCref(e.target.value)}
            onBlur={() => setCrefTouched(true)}
            className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:ring-1 transition-all ${
              crefTouched && !crefValid
                ? 'border-red-500/50 focus:ring-red-500/30'
                : 'border-white/10 focus:border-white/25 focus:ring-white/10'
            }`}
          />
          {crefTouched && !crefValid && (
            <p className="text-[11px] text-red-400 pl-1">Informe o CREF completo.</p>
          )}
          <p className="text-[11px] text-white/30 pl-1">
            O profissional não precisa estar cadastrado na plataforma.
          </p>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!canContinue}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FF6B00] hover:bg-[#FF8533] text-white font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      >
        <ChevronRight className="w-4 h-4" />
        Continuar
      </button>

      <button
        onClick={onBack}
        className="w-full text-xs text-white/30 hover:text-white/60 py-1 transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
}

// ---- team emails form ----

function TeamEmailsForm({
  priceCents,
  onConfirm,
  onBack,
}: {
  priceCents: number;
  onConfirm: (teamName: string, emails: string[]) => void;
  onBack: () => void;
}) {
  const [teamName, setTeamName] = useState('');
  const [teamNameTouched, setTeamNameTouched] = useState(false);
  const [emails, setEmails] = useState<string[]>(['', '']);
  const [touched, setTouched] = useState<boolean[]>([false, false]);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const addEmail = () => {
    setEmails((prev) => [...prev, '']);
    setTouched((prev) => [...prev, false]);
  };

  const removeEmail = (i: number) => {
    setEmails((prev) => prev.filter((_, idx) => idx !== i));
    setTouched((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateEmail = (i: number, value: string) => {
    setEmails((prev) => prev.map((e, idx) => (idx === i ? value : e)));
  };

  const blurEmail = (i: number) => {
    setTouched((prev) => prev.map((t, idx) => (idx === i ? true : t)));
  };

  const filledEmails = emails.map((e) => e.trim()).filter(Boolean);
  const uniqueEmails = [...new Set(filledEmails)];
  const hasDuplicates = filledEmails.length !== uniqueEmails.length;
  const teamNameValid = teamName.trim().length >= 2;
  const allValid = teamNameValid && uniqueEmails.length >= 2 && uniqueEmails.every(isValidEmail) && !hasDuplicates;
  const totalCents = priceCents * uniqueEmails.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-white/80">Membros da equipe</p>
        {uniqueEmails.length >= 2 && (
          <span className="text-base font-bold text-white">{formatPrice(totalCents)}</span>
        )}
      </div>

      {/* Nome da equipe */}
      <div>
        <label htmlFor="team-name" className="block text-sm font-semibold text-white/80 mb-1.5">
          Nome da equipe
        </label>
        <input
          id="team-name"
          type="text"
          placeholder="Ex: Equipe Thunder, Panteras FC..."
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          onBlur={() => setTeamNameTouched(true)}
          maxLength={100}
          className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:ring-1 transition-all ${
            teamNameTouched && !teamNameValid
              ? 'border-red-500/50 focus:ring-red-500/30'
              : 'border-white/10 focus:border-white/25 focus:ring-white/10'
          }`}
        />
        {teamNameTouched && !teamNameValid && (
          <p className="text-[11px] text-red-400 mt-1 pl-1">Nome da equipe deve ter pelo menos 2 caracteres.</p>
        )}
      </div>

      {/* Aviso obrigatório */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/20">
        <AlertCircle className="w-4 h-4 text-[#FF6B00] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-white/70 leading-relaxed">
          <span className="font-semibold text-[#FF6B00]">Atenção:</span> todos os membros precisam ter uma conta cadastrada na plataforma. O ingresso será adicionado automaticamente ao perfil de cada um após o pagamento.
        </p>
      </div>

      <div className="space-y-2">
        {emails.map((email, i) => {
          const val = email.trim();
          const showError = touched[i] && val.length > 0 && !isValidEmail(val);
          const isDup = touched[i] && val.length > 0 && filledEmails.filter((e) => e === val).length > 1;
          return (
            <div key={i} className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <input
                  type="email"
                  placeholder={`E-mail do membro ${i + 1}`}
                  value={email}
                  onChange={(e) => updateEmail(i, e.target.value)}
                  onBlur={() => blurEmail(i)}
                  className={`w-full bg-white/5 border rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:ring-1 transition-all ${
                    showError || isDup
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-white/10 focus:border-white/25 focus:ring-white/10'
                  }`}
                />
                {(showError || isDup) && (
                  <p className="text-[11px] text-red-400 mt-1 pl-1">
                    {isDup ? 'E-mail duplicado' : 'E-mail inválido'}
                  </p>
                )}
              </div>
              {emails.length > 2 && (
                <button
                  onClick={() => removeEmail(i)}
                  aria-label="Remover membro"
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {emails.length < 50 && (
        <button
          onClick={addEmail}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-white/15 text-white/40 hover:text-white/70 hover:border-white/25 text-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar membro
        </button>
      )}

      {hasDuplicates && (
        <p className="text-xs text-red-400 text-center">Remova os e-mails duplicados antes de continuar.</p>
      )}

      <button
        onClick={() => onConfirm(teamName.trim(), uniqueEmails)}
        disabled={!allValid}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FF6B00] hover:bg-[#FF8533] text-white font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      >
        <ChevronRight className="w-4 h-4" />
        Continuar — {formatPrice(totalCents)}
      </button>

      <button
        onClick={onBack}
        className="w-full text-xs text-white/30 hover:text-white/60 py-1 transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
}

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

const IS_DEV = import.meta.env.DEV;

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
  const [simulating, setSimulating] = useState(false);
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

  const handleDevSimulate = async () => {
    if (!session.billing_id || simulating) return;
    setSimulating(true);
    try {
      await devSimulateCardCheckout(session.billing_id);
    } catch {
      // ignora — o polling vai confirmar em até 3s
    } finally {
      setSimulating(false);
    }
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
          {IS_DEV && (
            <button
              onClick={handleDevSimulate}
              disabled={simulating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[#FF6B00] text-xs font-bold border border-[#FF6B00]/30 hover:bg-[#FF6B00]/10 transition-colors disabled:opacity-50"
            >
              {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {simulating ? 'Simulando...' : '[DEV] Simular pagamento aprovado'}
            </button>
          )}
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
  const [professionalChoice, setProfessionalChoice] = useState<ProfessionalChoice | null>(null);

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
    } else if (detail.requires_professional_choice) {
      setProfessionalChoice(null);
      setCheckout({ phase: 'professional_choice', flow: 'individual' });
    } else {
      setCheckout({ phase: 'selecting_method' });
    }
  }, [detail, user, eventId, openAuthModal]);

  const handleTeamEnroll = useCallback(() => {
    if (!user) { openAuthModal(); return; }
    setCheckout({ phase: 'team_emails' });
  }, [user, openAuthModal]);

  const handleTeamEmailsConfirmed = useCallback((teamName: string, emails: string[]) => {
    if (detail?.requires_professional_choice) {
      setProfessionalChoice(null);
      setCheckout({ phase: 'professional_choice', flow: 'team', teamEmails: emails, teamName });
    } else {
      setCheckout({ phase: 'team_selecting_method', emails, teamName });
    }
  }, [detail]);

  const handleProfessionalChoiceConfirmed = useCallback((choice: ProfessionalChoice) => {
    setProfessionalChoice(choice);
    const co = checkout;
    if (co.phase === 'professional_choice') {
      if (co.flow === 'team' && co.teamEmails && co.teamName) {
        setCheckout({ phase: 'team_selecting_method', emails: co.teamEmails, teamName: co.teamName });
      } else {
        setCheckout({ phase: 'selecting_method' });
      }
    }
  }, [checkout]);

  const handleMethodSelected = useCallback(async (method: PaymentMethod) => {
    if (!detail) return;
    setCheckout({ phase: 'loading', method });
    try {
      const session = await initiateCheckout(eventId, method, professionalChoice ?? undefined);
      setCheckout({ phase: 'awaiting_payment', session, method });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Ocorreu um erro. Tente novamente.';
      setCheckout({ phase: 'error', message });
    }
  }, [detail, eventId, professionalChoice]);

  const handleTeamMethodSelected = useCallback(async (method: PaymentMethod, teamName: string, emails: string[]) => {
    setCheckout({ phase: 'team_loading', method, emails, teamName });
    try {
      const session = await initiateTeamCheckout(eventId, method, teamName, emails, professionalChoice ?? undefined);
      setCheckout({ phase: 'awaiting_payment', session, method });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Ocorreu um erro. Tente novamente.';
      setCheckout({ phase: 'error', message });
    }
  }, [eventId, professionalChoice]);

  const handleExpired = useCallback(() => {
    setCheckout({ phase: 'error', message: 'O tempo para pagamento expirou. Tente novamente.' });
  }, []);

  const handlePaid = useCallback(() => {
    const co = checkout;
    const isTeam = co.phase === 'awaiting_payment' && co.session.team_purchase_id !== undefined;
    const memberCount = co.phase === 'awaiting_payment' ? co.session.member_count : undefined;
    setCheckout({ phase: 'success', isTeam, memberCount });
  }, [checkout]);

  const resetCheckout = useCallback(() => {
    setCheckout({ phase: 'idle' });
  }, []);

  // ---- button label / disabled ----
  const isEventOpen = detail?.status === 'aberto';
  const actionDisabled =
    !isEventOpen ||
    checkout.phase === 'loading' ||
    checkout.phase === 'team_loading' ||
    checkout.phase === 'professional_choice';

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

    const isLoading = checkout.phase === 'loading' || checkout.phase === 'team_loading';

    if (isLoading) {
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
      <div className="space-y-2">
        <button
          onClick={handleEnroll}
          disabled={actionDisabled}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#FF8533] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {detail?.price_cents === 0 ? (
            <><Ticket className="w-5 h-5" /> Inscrever-se Gratuitamente</>
          ) : (
            <><Ticket className="w-5 h-5" /> Comprar Ingresso Individual</>
          )}
        </button>

        {detail?.allow_team_purchase && detail.price_cents > 0 && (
          <button
            onClick={handleTeamEnroll}
            disabled={actionDisabled}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-[#00FF87]/20 hover:border-[#00FF87]/40 text-[#00FF87] font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Users className="w-4 h-4" />
            Comprar para a equipe inteira
          </button>
        )}
      </div>
    );
  }

  function renderSidebarCheckout() {
    if (checkout.phase === 'success') {
      const isTeam = checkout.isTeam;
      const memberCount = checkout.memberCount;
      return (
        <div className="space-y-4">
          <div className="p-5 bg-[#00C45A]/10 border border-[#00C45A]/25 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#00C45A]/20 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-[#00C45A]" />
            </div>
            <p className="text-[#00C45A] font-bold text-lg">
              {isTeam ? 'Equipe inscrita!' : 'Inscrição confirmada!'}
            </p>
            <p className="text-white/50 text-sm">
              {isTeam
                ? `Pagamento recebido. ${memberCount ? `${memberCount} ingressos foram` : 'Os ingressos foram'} adicionados automaticamente ao perfil de cada membro.`
                : detail?.price_cents === 0
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

    // Escolha de profissional
    if (checkout.phase === 'professional_choice') {
      const isTeamFlow = checkout.flow === 'team';
      return (
        <ProfessionalChoiceForm
          onConfirm={handleProfessionalChoiceConfirmed}
          onBack={() =>
            isTeamFlow
              ? setCheckout({ phase: 'team_emails' })
              : resetCheckout()
          }
        />
      );
    }

    // Fluxo de equipe — inserir e-mails
    if (checkout.phase === 'team_emails') {
      return (
        <TeamEmailsForm
          priceCents={detail?.price_cents ?? 0}
          onConfirm={handleTeamEmailsConfirmed}
          onBack={resetCheckout}
        />
      );
    }

    // Fluxo de equipe — escolher método de pagamento
    if (checkout.phase === 'team_selecting_method') {
      const totalCents = (detail?.price_cents ?? 0) * checkout.emails.length;
      return (
        <MethodSelector
          amountCents={totalCents}
          onSelect={(method) => handleTeamMethodSelected(method, checkout.teamName, checkout.emails)}
          onBack={() => setCheckout({ phase: 'team_emails' })}
        />
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

    // idle / loading / team_loading — show price block + button
    return (
      <div className="space-y-4">
        <div className="p-4 bg-gradient-to-r from-[#4169E1]/20 to-[#FF6B00]/20 rounded-xl border border-[#4169E1]/20">
          <p className="text-white/60 text-sm mb-1">Inscrição</p>
          <p className={`text-3xl font-bold ${detail?.price_cents === 0 ? 'text-[#00C45A]' : 'text-white'}`}>
            {detail ? formatPrice(detail.price_cents) : '—'}
          </p>
          {detail?.allow_team_purchase && detail.price_cents > 0 && (
            <p className="text-[#00FF87]/60 text-xs mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Disponível para compra em equipe
            </p>
          )}
          {detail?.capacity !== null && detail?.capacity !== undefined && (
            <p className="text-white/40 text-xs mt-2">
              {detail.capacity === 999
                ? `${detail.enrolled} inscritos · vagas ilimitadas`
                : `${detail.enrolled} / ${detail.capacity} inscritos`}
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
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-auto bg-[#141414] border border-white/10 rounded-2xl">
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
                <h2 className="text-xl sm:text-3xl md:text-4xl font-sans font-bold text-white">{detail.title}</h2>
              </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Left: event details */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Sobre o Evento</h3>
                    <p className="text-white/70 leading-relaxed">{detail.description}</p>
                  </div>
                  {(detail.rules || detail.rules_file_url) && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Regras</h3>
                      {detail.rules && (
                        <p className="text-white/70 leading-relaxed mb-3">{detail.rules}</p>
                      )}
                      {detail.rules_file_url && (
                        <a
                          href={detail.rules_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00FF87]/10 hover:bg-[#00FF87]/20 border border-[#00FF87]/20 rounded-lg text-[#00FF87] text-sm font-medium transition-colors"
                        >
                          <FileDown className="w-4 h-4" />
                          Baixar Regulamento (PDF)
                        </a>
                      )}
                    </div>
                  )}
                  {/* Recompensa */}
                  <div className="p-4 bg-gradient-to-r from-[#00FF87]/10 to-[#00FF87]/5 rounded-xl border border-[#00FF87]/20 flex items-start gap-3">
                    <Gift className="w-5 h-5 text-[#00FF87] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#00FF87] uppercase tracking-wider mb-1">Recompensa</p>
                      <p className="text-white/80 text-sm leading-relaxed">{detail.reward}</p>
                    </div>
                  </div>

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

                  {/* Observação especial do evento */}
                  {detail.note && (
                    <div className="p-4 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider mb-1">Atenção</p>
                        <p className="text-white/80 text-sm leading-relaxed">{detail.note}</p>
                      </div>
                    </div>
                  )}

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
