import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { rankingsConfig } from '../config';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function Rankings() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(0);

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

      // Content animation
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);


  return (
    <section
      ref={sectionRef}
      id="rankings"
      className="relative py-24 md:py-32 bg-[#0A0A0A]"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0D0D1A] to-[#0A0A0A]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-[#4169E1]/10 border border-[#4169E1]/20 text-[#4169E1] text-sm font-medium mb-6">
            {rankingsConfig.subtitle}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white tracking-tight mb-6">
            {rankingsConfig.titleRegular}{' '}
            <span className="font-serif italic text-[#FF6B00]">{rankingsConfig.titleItalic}</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            {rankingsConfig.description}
          </p>
        </div>

        {/* Scoring System */}
        <div ref={contentRef} className="space-y-8">
          {/* Ranking Categories Tabs */}
          <div className="flex flex-wrap gap-2 justify-center">
            {rankingsConfig.categories.map((category, index) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTab === index
                    ? 'bg-[#FF6B00] text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Rankings Table */}
          <div className="bg-[#141414] rounded-2xl border border-white/5 overflow-hidden">
            {/* Table Header */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {rankingsConfig.categories[activeTab].name}
                  </h3>
                  <p className="text-white/50 text-sm mt-1">
                    {rankingsConfig.categories[activeTab].modality} • {' '}
                    {rankingsConfig.categories[activeTab].gender === 'masculino' ? 'Masculino' : 'Feminino'} • {' '}
                    {rankingsConfig.categories[activeTab].ageRange} anos
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[#4169E1]">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">Ao vivo</span>
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="divide-y divide-white/5">
              {rankingsConfig.categories[activeTab].leaders.map((leader, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 md:p-6 hover:bg-white/5 transition-colors"
                >
                  {/* Position */}
                  <div className="flex-shrink-0">
                    {leader.position === 1 ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                    ) : leader.position === 2 ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                        <Medal className="w-5 h-5 text-white" />
                      </div>
                    ) : leader.position === 3 ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-white font-bold">{leader.position}</span>
                      </div>
                    )}
                  </div>

                  {/* Athlete Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={leader.image}
                      alt={leader.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                    />
                  </div>

                  {/* Athlete Info */}
                  <div className="flex-grow min-w-0">
                    <h4 className="text-white font-semibold truncate">{leader.name}</h4>
                    <p className="text-white/50 text-sm">{leader.country}</p>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-2xl font-bold text-[#FF6B00]">{leader.score.toLocaleString()}</p>
                    <p className="text-white/50 text-sm">pontos</p>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            <div className="p-4 border-t border-white/5">
              <button 
                onClick={() => alert('Ranking completo em desenvolvimento')}
                className="w-full py-3 text-[#4169E1] font-medium hover:text-[#5A7FE8] transition-colors"
              >
                Ver Ranking Completo
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Atletas Classificados', value: '1,247' },
              { label: 'Eventos no Ranking', value: '48' },
              { label: 'Países', value: '25' },
              { label: 'Atualização', value: 'Tempo real' }
            ].map((stat, index) => (
              <div
                key={index}
                className="p-4 bg-white/5 rounded-xl text-center"
              >
                <p className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-white/50 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
