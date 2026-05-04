import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Trophy, Lock, Zap, Medal, TrendingUp, Crown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const UPCOMING_FEATURES = [
  { icon: Trophy, label: 'Top 3 em destaque com badge e pontuação animada' },
  { icon: TrendingUp, label: 'Indicadores de subida e descida no ranking' },
  { icon: Medal, label: 'Categorias por modalidade, gênero e faixa etária' },
  { icon: Zap, label: 'Atualização automática após cada evento' },
];

export function Rankings() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 50, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 78%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      if (featuresRef.current) {
        gsap.fromTo(
          featuresRef.current.children,
          { opacity: 0, x: -16 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            ease: 'power3.out',
            stagger: 0.1,
            scrollTrigger: {
              trigger: featuresRef.current,
              start: 'top 82%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="rankings"
      className="relative py-24 md:py-32 bg-[#0A0A0A]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0d0f14] to-[#0A0A0A]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div ref={titleRef} className="text-center mb-14">
          <span className="inline-block px-4 py-2 rounded-full bg-[#00FF87]/10 border border-[#00FF87]/20 text-[#00FF87] text-sm font-medium tracking-widest mb-6">
            CLASSIFICAÇÃO
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-extrabold text-white tracking-tight mb-6">
            Rankings{' '}
            <span className="font-serif italic text-[#00FF87]">Mensais</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto leading-relaxed">
            Acompanhe a classificação dos participantes nos eventos. Sistema de pontuação justo e transparente.
          </p>
        </div>

        {/* Podium preview — em breve */}
        <div ref={cardRef} className="mb-12">
          <div className="flex items-end justify-center gap-3 md:gap-5 max-w-lg mx-auto">
            {/* 2º lugar */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <Medal className="w-5 h-5 text-white/15" />
              </div>
              <div className="w-full h-28 md:h-36 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                <span className="text-white/15 font-black text-2xl">#2</span>
                <span className="text-white/10 text-xs tracking-widest">EM BREVE</span>
                <div className="absolute inset-0" style={{ backdropFilter: 'blur(1px)' }} />
              </div>
            </div>

            {/* 1º lugar — destaque */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <Crown className="w-6 h-6 text-[#00FF87]/30" />
              <div className="w-full h-44 md:h-56 rounded-xl bg-[#00FF87]/[0.04] border border-[#00FF87]/[0.12] flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                <div className="w-14 h-14 rounded-full bg-[#00FF87]/[0.08] border border-[#00FF87]/[0.15] flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-[#00FF87]/25" />
                </div>
                <span className="text-[#00FF87]/20 font-black text-2xl">#1</span>
                <span className="text-[#00FF87]/15 text-xs tracking-widest">EM BREVE</span>
                <div className="absolute inset-0" style={{ backdropFilter: 'blur(1px)' }} />
              </div>
            </div>

            {/* 3º lugar */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <Medal className="w-5 h-5 text-white/15" />
              </div>
              <div className="w-full h-20 md:h-28 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                <span className="text-white/15 font-black text-2xl">#3</span>
                <span className="text-white/10 text-xs tracking-widest">EM BREVE</span>
                <div className="absolute inset-0" style={{ backdropFilter: 'blur(1px)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Main card — status */}
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            {/* Top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-[#00FF87]/40 to-transparent" />

            <div className="px-8 py-10 flex flex-col items-center text-center">
              {/* Status badge — acima do ícone */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.05] border border-white/[0.08] mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87] animate-pulse flex-shrink-0" />
                <span className="text-white/40 text-xs font-medium tracking-widest">EM DESENVOLVIMENTO</span>
              </div>

              {/* Icon */}
              <div className="relative inline-flex mb-6">
                <div className="w-20 h-20 rounded-2xl bg-[#00FF87]/10 border border-[#00FF87]/20 flex items-center justify-center">
                  <Trophy className="w-9 h-9 text-[#00FF87]" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#0A0A0A] border border-white/[0.08] flex items-center justify-center">
                  <Lock className="w-3 h-3 text-white/40" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                Sistema de Ranking em construção
              </h3>
              <p className="text-white/50 leading-relaxed max-w-md mx-auto">
                Estamos construindo um sistema de ranking completo e justo para premiar os melhores atletas de cada evento.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mx-8" />

            {/* Features coming */}
            <div className="px-8 py-8">
              <p className="text-white/30 text-xs font-semibold tracking-widest mb-5">O QUE VEM POR AÍ</p>
              <div ref={featuresRef} className="space-y-3">
                {UPCOMING_FEATURES.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 text-sm text-white/55"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#00FF87]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-[#00FF87]/70" />
                    </div>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-[#00FF87]/20 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
