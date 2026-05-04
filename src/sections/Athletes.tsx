import { useEffect, useRef, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { athletesConfig } from '../config';
import { useLandingProfessionals } from '../hooks/useLandingProfessionals';
import type { LandingProfessional } from '../types/api';
import { Trophy, ArrowUpRight, ChevronLeft, ChevronRight, ArrowRight, RefreshCw, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { mediaUrl } from '../lib/utils';
import { useNavigation } from '../contexts/NavigationContext';
import { ProfessionalProfileModal, PLACEHOLDER_AVATAR } from '../components/ProfessionalProfileModal';
import { CreateProfessionalModal } from './CreateProfessional';
import { useAuthContext } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { getMyProfessionalSubscriptionStatus } from '../lib/api';

gsap.registerPlugin(ScrollTrigger);

function SkeletonCard() {
  return (
    <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 animate-pulse overflow-hidden h-full">
      <div className="h-[2px] bg-white/5 w-full" />
      <div className="p-6 space-y-4">
        <div className="w-20 h-20 rounded-full bg-white/5" />
        <div className="space-y-2">
          <div className="h-4 bg-white/5 rounded w-2/3" />
          <div className="h-3 bg-white/5 rounded w-1/2" />
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Athletes Section
// ============================================================

export function Athletes() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<{ pro: LandingProfessional; index: number } | null>(null);
  const [prevEnabled, setPrevEnabled] = useState(false);
  const [nextEnabled, setNextEnabled] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeSuccess] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('pro_subscribed') === '1';
  });
  const [subscribeActivated, setSubscribeActivated] = useState(false);
  const [checkingActivation, setCheckingActivation] = useState(false);

  const { professionals, isLoading, error, refetch } = useLandingProfessionals(10);
  const { navigate } = useNavigation();
  const { user } = useAuthContext();
  const { openAuthModal } = useAuthModal();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: false,
    containScroll: 'trimSnaps',
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevEnabled(emblaApi.canScrollPrev());
    setNextEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!isLoading && emblaApi) emblaApi.reInit();
  }, [isLoading, emblaApi]);

  // Remove o parâmetro pro_subscribed da URL sem recarregar a página
  useEffect(() => {
    if (subscribeSuccess) {
      const url = new URL(window.location.href);
      url.searchParams.delete('pro_subscribed');
      window.history.replaceState({}, '', url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling automático quando o usuário volta do checkout — verifica se a assinatura foi ativada
  useEffect(() => {
    if (!subscribeSuccess || !user) return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 6; // 30 segundos no total

    const check = async () => {
      try {
        const sub = await getMyProfessionalSubscriptionStatus();
        if (cancelled) return;
        if (sub?.status === 'active') {
          setSubscribeActivated(true);
          refetch(); // atualiza o carrossel com o novo profissional
          return;
        }
      } catch {
        // silencioso
      }
      attempts += 1;
      if (attempts < MAX_ATTEMPTS && !cancelled) {
        setTimeout(check, 5000);
      }
    };

    // Primeira checagem após 3s (dá tempo do backend processar)
    const timer = setTimeout(check, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubscribeCTA() {
    if (!user) {
      openAuthModal();
      return;
    }
    setShowSubscribeModal(true);
  }

  // GSAP: animate title on scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);


  return (
    <section
      ref={sectionRef}
      id="atletas"
      className="relative py-24 md:py-32 bg-[#0A0A0A]"
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-[#4169E1]/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 -right-40 w-80 h-80 bg-[#FF6B00]/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div ref={titleRef} className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          {/* Left: title block */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] text-xs font-semibold tracking-widest uppercase mb-5">
              {athletesConfig.subtitle}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-extrabold text-white tracking-tight leading-none mb-4">
              {athletesConfig.titleRegular}{' '}
              <span className="font-serif italic text-[#FF6B00]">{athletesConfig.titleItalic}</span>
            </h2>
            <p className="text-base text-white/50 max-w-md leading-relaxed">
              {athletesConfig.description}
            </p>
          </div>

          {/* Right: carousel controls + show all */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!prevEnabled}
              aria-label="Profissional anterior"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              disabled={!nextEnabled}
              aria-label="Próximo profissional"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('professionals')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/25 text-[#FF6B00] text-sm font-semibold hover:bg-[#FF6B00]/20 hover:border-[#FF6B00]/50 transition-all"
            >
              Mostrar todos
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-white/50 text-center">{error}</p>
            <button
              onClick={refetch}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Carousel */}
        {!error && (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-[0_0_90%] min-w-0 pl-4 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                    >
                      <SkeletonCard />
                    </div>
                  ))
                : professionals.map((pro: LandingProfessional, index: number) => (
                    <div
                      key={pro.id}
                      className="flex-[0_0_90%] min-w-0 pl-4 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                    >
                      <div
                        onClick={() => setSelected({ pro, index })}
                        className="group relative bg-[#0f0f0f] cursor-pointer overflow-hidden rounded-2xl border border-white/5 hover:border-[#FF6B00]/20 transition-all duration-300 h-full"
                      >
                        {/* Top accent line */}
                        <div
                          className="h-[2px] w-full"
                          style={{
                            background:
                              index % 2 === 0
                                ? 'linear-gradient(90deg, #4169E1, #FF6B00)'
                                : 'linear-gradient(90deg, #FF6B00, #4169E1)',
                          }}
                        />

                        {/* Ordinal number background */}
                        <span className="absolute top-2 right-4 font-black text-[7rem] leading-none text-white/[0.04] select-none pointer-events-none">
                          {String(index + 1).padStart(2, '0')}
                        </span>

                        <div className="relative p-6 flex flex-col gap-5">
                          {/* Photo */}
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{
                                background: 'linear-gradient(135deg, #4169E1, #FF6B00)',
                                padding: '2px',
                              }}
                            />
                            <div className="absolute inset-[2px] rounded-full overflow-hidden bg-[#1a1a1a]">
                              <img
                                src={mediaUrl(pro.photo_url) ?? PLACEHOLDER_AVATAR}
                                alt={pro.full_name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_AVATAR;
                                }}
                              />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <span className="inline-block px-2.5 py-0.5 rounded bg-[#4169E1]/15 text-[#4169E1] text-xs font-semibold tracking-wide mb-3">
                              {pro.registration_type}
                            </span>
                            <h3 className="text-lg font-sans font-bold text-white leading-tight mb-1 group-hover:text-[#FF6B00] transition-colors duration-300">
                              {pro.full_name}
                            </h3>
                            <p className="text-sm font-serif italic text-[#FF6B00]/70 mb-3">
                              {pro.education}
                            </p>
                            <p className="text-sm text-white/40 leading-relaxed line-clamp-2">
                              {pro.bio ?? 'Profissional credenciado pela Extreme Sports Competition.'}
                            </p>
                          </div>

                          {/* Footer row */}
                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <span className="flex items-center gap-1.5 text-xs text-white/30">
                              <Trophy className="w-3 h-3" />
                              {pro.specialties.length > 0
                                ? pro.specialties[0].specialty
                                : 'Especialista'}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-semibold text-[#FF6B00] opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                              Ver perfil <ArrowUpRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && professionals.length === 0 && (
          <div className="text-center py-24 text-white/40">
            Nenhum profissional cadastrado no momento.
          </div>
        )}

        {/* CTA: Quero me tornar um profissional */}
        <div className="mt-16 pt-12 border-t border-white/5">
          {subscribeSuccess ? (
            /* Banner de sucesso pós-pagamento */
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${subscribeActivated ? 'bg-[#00FF87]/20 border border-[#00FF87]/40' : 'bg-[#00FF87]/10 border border-[#00FF87]/20'}`}>
                {checkingActivation
                  ? <Loader2 className="w-7 h-7 text-[#00FF87] animate-spin" />
                  : <CheckCircle2 className={`w-7 h-7 ${subscribeActivated ? 'text-[#00FF87]' : 'text-[#00FF87]/70'}`} />
                }
              </div>
              <div>
                {subscribeActivated ? (
                  <>
                    <h3 className="text-xl font-bold text-white mb-2">Perfil ativado!</h3>
                    <p className="text-white/50 text-sm max-w-md leading-relaxed">
                      Seu perfil profissional já está visível na plataforma. Bem-vindo!
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white mb-2">Pagamento em processamento!</h3>
                    <p className="text-white/50 text-sm max-w-md leading-relaxed">
                      Seu perfil será ativado automaticamente assim que o pagamento for confirmado.
                    </p>
                    <button
                      onClick={async () => {
                        setCheckingActivation(true);
                        try {
                          const sub = await getMyProfessionalSubscriptionStatus();
                          if (sub?.status === 'active') {
                            setSubscribeActivated(true);
                            refetch();
                          }
                        } finally {
                          setCheckingActivation(false);
                        }
                      }}
                      disabled={checkingActivation}
                      className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed mx-auto"
                    >
                      {checkingActivation ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Verificar ativação
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* CTA padrão */
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
              <div>
                <h3 className="text-xl md:text-2xl font-sans font-bold text-white mb-2">
                  É profissional de saúde ou educação física?
                </h3>
                <p className="text-white/40 text-sm leading-relaxed max-w-md">
                  Cadastre-se na plataforma e tenha visibilidade para milhares de atletas e
                  trabalhadores que buscam suporte profissional especializado.
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={handleSubscribeCTA}
                  className="group relative flex items-center gap-3 px-7 py-4 rounded-xl bg-gradient-to-r from-[#4169E1] to-[#4169E1]/80 hover:from-[#4169E1] hover:to-[#00FF87]/80 text-white font-bold text-sm transition-all duration-500 shadow-lg shadow-[#4169E1]/20 hover:shadow-[#00FF87]/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Quero me tornar um profissional
                  <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
                <p className="text-center text-xs text-white/20 mt-2">
                  A partir de R$ 49,90/mês · Cancele quando quiser
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <ProfessionalProfileModal
          professional={selected.pro}
          index={selected.index}
          onClose={() => setSelected(null)}
        />
      )}

      {showSubscribeModal && (
        <CreateProfessionalModal onClose={() => setShowSubscribeModal(false)} />
      )}
    </section>
  );
}
