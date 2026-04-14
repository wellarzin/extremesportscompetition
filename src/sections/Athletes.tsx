import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { athletesConfig } from '../config';
import { Trophy, MapPin, Calendar, Flag, X, ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function Athletes() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<typeof athletesConfig.athletes[0] | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: titleRef.current, start: 'top 80%', toggleActions: 'play none none reverse' }
        }
      );

      const cards = cardsRef.current?.querySelectorAll('.pro-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out',
            scrollTrigger: { trigger: cardsRef.current, start: 'top 75%', toggleActions: 'play none none reverse' }
          }
        );
      }
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
        <div ref={titleRef} className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] text-xs font-semibold tracking-widest uppercase mb-5">
              {athletesConfig.subtitle}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-extrabold text-white tracking-tight leading-none">
              {athletesConfig.titleRegular}{' '}
              <span className="font-serif italic text-[#4169E1]">{athletesConfig.titleItalic}</span>
            </h2>
          </div>
          <p className="text-base text-white/50 max-w-sm leading-relaxed md:text-right">
            {athletesConfig.description}
          </p>
        </div>

        {/* Cards Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {athletesConfig.athletes.map((athlete, index) => (
            <div
              key={athlete.id}
              onClick={() => setSelectedAthlete(athlete)}
              className="pro-card group relative bg-[#0f0f0f] cursor-pointer overflow-hidden rounded-2xl border border-white/5"
            >
              {/* Top accent line */}
              <div
                className="h-[2px] w-full"
                style={{
                  background: index % 2 === 0
                    ? 'linear-gradient(90deg, #4169E1, #FF6B00)'
                    : 'linear-gradient(90deg, #FF6B00, #4169E1)'
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
                      src={athlete.image}
                      alt={athlete.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Modality badge */}
                  <span className="inline-block px-2.5 py-0.5 rounded bg-[#4169E1]/15 text-[#4169E1] text-xs font-semibold tracking-wide mb-3">
                    {athlete.modality}
                  </span>

                  <h3 className="text-lg font-sans font-bold text-white leading-tight mb-1 group-hover:text-[#FF6B00] transition-colors duration-300">
                    {athlete.name}
                  </h3>

                  <p className="text-sm font-serif italic text-[#FF6B00]/70 mb-3">
                    "{athlete.nickname}"
                  </p>

                  <p className="text-sm text-white/40 leading-relaxed line-clamp-2">
                    {athlete.bio}
                  </p>
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="flex items-center gap-1.5 text-xs text-white/30">
                    <MapPin className="w-3 h-3" />
                    {athlete.birthplace}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#4169E1] opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    Ver perfil <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedAthlete(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-[#111] border border-white/10 rounded-2xl">
            {/* Hero banner */}
            <div className="relative h-56 md:h-72 overflow-hidden">
              <img
                src={selectedAthlete.image}
                alt={selectedAthlete.name}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#111]/60 to-transparent" />

              <button
                onClick={() => setSelectedAthlete(null)}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors border border-white/10"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="absolute bottom-6 left-6 md:left-8">
                <span className="inline-block px-3 py-1 rounded bg-[#4169E1]/20 text-[#4169E1] text-xs font-semibold tracking-wide mb-3">
                  {selectedAthlete.modality}
                </span>
                <h2 className="text-3xl md:text-4xl font-sans font-extrabold text-white leading-none mb-1">
                  {selectedAthlete.name}
                </h2>
                <p className="text-sm font-serif italic text-[#FF6B00]/80">
                  "{selectedAthlete.nickname}"
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Sidebar */}
              <div className="space-y-3">
                {[
                  { icon: Calendar, label: 'Nascimento', value: selectedAthlete.birthDate, sub: `${selectedAthlete.age} anos` },
                  { icon: MapPin, label: 'Naturalidade', value: selectedAthlete.birthplace },
                  { icon: Flag, label: 'Nacionalidade', value: selectedAthlete.nationality },
                  { icon: Trophy, label: 'Modalidade', value: selectedAthlete.modality },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div key={label} className="flex items-start gap-3 p-3.5 bg-white/[0.04] rounded-xl border border-white/5">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <div>
                      <p className="text-xs text-white/30 mb-0.5">{label}</p>
                      <p className="text-sm text-white font-medium">{value}</p>
                      {sub && <p className="text-xs text-white/40">{sub}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="md:col-span-2 space-y-7">
                <div>
                  <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-6 h-px bg-[#FF6B00]" /> História
                  </h3>
                  <p className="text-white/65 leading-relaxed text-[15px]">{selectedAthlete.bio}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-6 h-px bg-[#4169E1]" /> Títulos e Conquistas
                  </h3>
                  <div className="space-y-2">
                    {selectedAthlete.titles.map((title, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-lg border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-[#FF6B00]/15 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-3 h-3 text-[#FF6B00]" />
                        </div>
                        <span className="text-sm text-white/75">{title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
