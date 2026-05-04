import { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle, Loader2, AlertCircle, X, RefreshCw, Ticket } from 'lucide-react';
import { getPaymentStatus, getMyProfessionalSubscriptionStatus, ApiError } from '../lib/api';
import { useAuthContext } from '../contexts/AuthContext';

// ============================================================
// PaymentReturnHandler
//
// Detecta os parâmetros de retorno do AbacatePay na URL.
//
// Params suportados:
//   ?payment_success=<paymentId>  — ingresso de evento (cartão)
//   ?pro_subscribed=1             — assinatura profissional (cartão)
//
// Fluxo de eventos (cartão):
//   A AbacatePay redireciona para ?payment_success=<id> assim que o
//   usuário confirma o pagamento, mas o status no sistema deles pode
//   levar alguns segundos para ser finalizado. Por isso usamos um
//   botão manual — igual ao padrão de assinaturas que funciona — em
//   vez de polling automático imediato.
//
// Fluxo de assinaturas:
//   O mesmo padrão de botão manual é usado para consistência.
// ============================================================

type PaymentReturnType = 'payment' | 'subscription' | null;

type Phase =
  | 'waiting_auth'   // aguardando sessão ser restaurada
  | 'ready'          // pronto para verificar — aguardando o usuário clicar
  | 'checking'       // verificando agora (após clique)
  | 'success'
  | 'not_yet'        // ainda processando — pode tentar de novo
  | 'error';

const MAX_CHECK_ATTEMPTS = 3;   // tentativas por clique
const CHECK_INTERVAL = 4000;    // 4s entre tentativas

// Lê os params UMA VEZ na montagem — não no render, para não perder após cleanUrl()
function parseReturnParams(): { type: PaymentReturnType; paymentId: string | null } {
  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get('payment_success');
  const proSubscribed = params.get('pro_subscribed');

  if (paymentId) return { type: 'payment', paymentId };
  if (proSubscribed === '1') return { type: 'subscription', paymentId: null };
  return { type: null, paymentId: null };
}

function cleanUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('payment_success');
  url.searchParams.delete('pro_subscribed');
  window.history.replaceState({}, '', url.toString());
}

export function PaymentReturnHandler() {
  // Estado capturado na montagem — não relê a URL nos re-renders (cleanUrl já removeu os params)
  const [{ type, paymentId }] = useState<{ type: PaymentReturnType; paymentId: string | null }>(parseReturnParams);
  const { isRestoring } = useAuthContext();

  const [phase, setPhase] = useState<Phase>('waiting_auth');
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (type) cleanUrl();
  }, [type]);

  // Quando a sessão é restaurada, muda para 'ready' (aguarda clique do usuário)
  useEffect(() => {
    if (!type) return;
    if (isRestoring) return;
    setPhase('ready');
  }, [type, isRestoring]);

  const handleCheck = useCallback(() => {
    if (phase === 'checking' || phase === 'success') return;

    setPhase('checking');
    let attempts = 0;

    async function tryCheck() {
      attempts += 1;
      try {
        if (type === 'payment' && paymentId) {
          const res = await getPaymentStatus(paymentId);
          if (res.status === 'paid') { setPhase('success'); return; }
          if (res.status === 'failed' || res.status === 'expired') { setPhase('error'); return; }
        }

        if (type === 'subscription') {
          const res = await getMyProfessionalSubscriptionStatus();
          if (res?.status === 'active') { setPhase('success'); return; }
        }
      } catch (err) {
        if (err instanceof ApiError && err.isUnauthorized) { setPhase('not_yet'); return; }
        // Outros erros de rede — continua tentando
      }

      if (attempts >= MAX_CHECK_ATTEMPTS) {
        setPhase('not_yet');
        return;
      }

      timerRef.current = setTimeout(tryCheck, CHECK_INTERVAL);
    }

    tryCheck();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [type, paymentId, phase]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!type || dismissed) return null;

  const isSubscription = type === 'subscription';

  const accentColor =
    phase === 'success' ? 'bg-[#00FF87]'
    : phase === 'error' ? 'bg-red-500'
    : 'bg-gradient-to-r from-[#4169E1] via-[#00FF87] to-[#4169E1] animate-pulse';

  return (
    <div className="fixed bottom-6 right-6 z-[200] w-full max-w-sm">
      <div className="bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className={`h-[2px] w-full ${accentColor}`} />

        <div className="p-5">
          <div className="flex items-start gap-3">

            {/* Ícone */}
            <div className="flex-shrink-0 mt-0.5">
              {(phase === 'waiting_auth') && <Loader2 className="w-5 h-5 text-white/30 animate-spin" />}
              {(phase === 'ready') && <Ticket className="w-5 h-5 text-[#4169E1]" />}
              {(phase === 'checking') && <Loader2 className="w-5 h-5 text-[#4169E1] animate-spin" />}
              {phase === 'success' && <CheckCircle className="w-5 h-5 text-[#00FF87]" />}
              {phase === 'not_yet' && <RefreshCw className="w-5 h-5 text-[#FF6B00]" />}
              {phase === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">

              {phase === 'waiting_auth' && (
                <>
                  <p className="text-sm font-semibold text-white/60">Restaurando sessão...</p>
                  <p className="text-xs text-white/30 mt-0.5">Aguarde um instante.</p>
                </>
              )}

              {phase === 'ready' && (
                <>
                  <p className="text-sm font-semibold text-white">
                    {isSubscription ? 'Assinatura realizada!' : 'Pagamento realizado!'}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Clique abaixo para confirmar {isSubscription ? 'sua assinatura' : 'seu ingresso'}.
                  </p>
                </>
              )}

              {phase === 'checking' && (
                <>
                  <p className="text-sm font-semibold text-white">Verificando...</p>
                  <p className="text-xs text-white/40 mt-0.5">Consultando confirmação com o banco.</p>
                </>
              )}

              {phase === 'success' && (
                <>
                  <p className="text-sm font-semibold text-[#00FF87]">
                    {isSubscription ? 'Assinatura ativada!' : 'Ingresso confirmado!'}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {isSubscription
                      ? 'Seu perfil profissional está ativo na plataforma.'
                      : 'Seu ingresso foi gerado com sucesso.'}
                  </p>
                </>
              )}

              {phase === 'not_yet' && (
                <>
                  <p className="text-sm font-semibold text-[#FF6B00]">Ainda processando</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    O banco ainda está finalizando. Aguarde alguns segundos e tente novamente.
                  </p>
                </>
              )}

              {phase === 'error' && (
                <>
                  <p className="text-sm font-semibold text-red-400">Pagamento não confirmado</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    O pagamento foi recusado ou expirou. Tente novamente.
                  </p>
                </>
              )}

            </div>

            {/* Fechar */}
            {(phase === 'success' || phase === 'not_yet' || phase === 'error') && (
              <button
                onClick={() => setDismissed(true)}
                aria-label="Fechar"
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-white/30 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botão de ação */}
          {(phase === 'ready' || phase === 'not_yet') && (
            <button
              onClick={handleCheck}
              className="mt-4 w-full h-9 rounded-lg bg-[#4169E1] hover:bg-[#4169E1]/80 text-white text-sm font-semibold transition-colors"
            >
              {phase === 'not_yet'
                ? 'Tentar novamente'
                : isSubscription ? 'Confirmar assinatura' : 'Confirmar ingresso'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
