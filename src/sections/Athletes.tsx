import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { athletesConfig } from '../config';
import { Trophy, MapPin, Calendar, Flag, X, Upload } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function Athletes() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<typeof athletesConfig.athletes[0] | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Cards stagger animation
      const cards = cardsRef.current?.querySelectorAll('.athlete-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse'
            }
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
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#4169E1]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[#FF6B00]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] text-sm font-medium mb-6">
            {athletesConfig.subtitle}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white tracking-tight mb-6">
            {athletesConfig.titleRegular}{' '}
            <span className="font-serif italic text-[#4169E1]">{athletesConfig.titleItalic}</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            {athletesConfig.description}
          </p>
        </div>

        {/* Athletes Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {athletesConfig.athletes.map((athlete) => (
            <div
              key={athlete.id}
              onClick={() => setSelectedAthlete(athlete)}
              className="athlete-card group relative cursor-pointer"
            >
              {/* Card Container */}
              <div className="relative bg-[#141414] rounded-2xl overflow-hidden border border-white/5 hover:border-[#FF6B00]/30 transition-all duration-500">
                {/* Image */}
                <div className="relative h-80 overflow-hidden">
                  <img
                    src={athlete.image}
                    alt={athlete.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-transparent" />
                  
                  {/* Country Badge */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Flag className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {/* Nickname */}
                  <p className="text-[#FF6B00] text-sm font-medium mb-1">
                    "{athlete.nickname}"
                  </p>
                  
                  {/* Name */}
                  <h3 className="text-xl font-sans font-bold text-white mb-2 group-hover:text-[#4169E1] transition-colors">
                    {athlete.name}
                  </h3>
                  
                  {/* Modality & Country */}
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-[#4169E1]/20 text-[#4169E1] text-xs font-medium">
                      {athlete.modality}
                    </span>
                    <span className="text-white/60 text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {athlete.country}
                    </span>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#4169E1]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                  <span className="px-6 py-3 bg-white text-[#0A0A0A] font-semibold rounded-lg">
                    Ver Perfil Completo
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Athlete Profile Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedAthlete(null)}
          />
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-auto bg-[#141414] border border-white/10 rounded-2xl">
            {/* Header */}
            <div className="relative h-64 md:h-80">
              <img 
                src={selectedAthlete.image} 
                alt={selectedAthlete.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
              <button 
                onClick={() => setSelectedAthlete(null)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="absolute bottom-6 left-6 md:left-8">
                <p className="text-[#FF6B00] text-lg font-medium mb-2">
                  "{selectedAthlete.nickname}"
                </p>
                <h2 className="text-4xl md:text-5xl font-sans font-bold text-white">
                  {selectedAthlete.name}
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Info Cards */}
                <div className="md:col-span-1 space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Data de Nascimento</span>
                    </div>
                    <p className="text-white font-medium">{selectedAthlete.birthDate}</p>
                    <p className="text-white/50 text-sm">{selectedAthlete.age} anos</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>Naturalidade</span>
                    </div>
                    <p className="text-white font-medium">{selectedAthlete.birthplace}</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <Flag className="w-4 h-4" />
                      <span>Nacionalidade</span>
                    </div>
                    <p className="text-white font-medium">{selectedAthlete.nationality}</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <Trophy className="w-4 h-4" />
                      <span>Modalidade</span>
                    </div>
                    <p className="text-white font-medium">{selectedAthlete.modality}</p>
                  </div>

                  {/* Upload Button (Admin only) */}
                  <button 
                    onClick={() => alert('Sistema de upload em desenvolvimento')}
                    className="w-full p-4 bg-gradient-to-r from-[#4169E1]/20 to-[#FF6B00]/20 border border-[#4169E1]/30 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-[#4169E1]" />
                    <span className="text-white font-medium">Carregar Arquivos</span>
                  </button>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                  {/* Bio */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-8 h-[2px] bg-[#FF6B00]" />
                      História
                    </h3>
                    <p className="text-white/70 leading-relaxed">{selectedAthlete.bio}</p>
                  </div>

                  {/* Titles */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-8 h-[2px] bg-[#4169E1]" />
                      Títulos e Conquistas
                    </h3>
                    <div className="space-y-3">
                      {selectedAthlete.titles.map((title, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#FF6B00]/20 flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-4 h-4 text-[#FF6B00]" />
                          </div>
                          <span className="text-white/80">{title}</span>
                        </div>
                      ))}
                    </div>
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
