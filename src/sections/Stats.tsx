import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { statsConfig } from '../config';
import { TrendingUp, Users, Calendar, Globe, Award, ThumbsUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function Stats() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [animatedValues, setAnimatedValues] = useState<number[]>(statsConfig.stats.map(() => 0));

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

      // Stats counter animation
      ScrollTrigger.create({
        trigger: statsRef.current,
        start: 'top 75%',
        onEnter: () => {
          statsConfig.stats.forEach((stat, index) => {
            gsap.to({}, {
              duration: 2,
              ease: 'power2.out',
              onUpdate: function() {
                const progress = this.progress();
                setAnimatedValues(prev => {
                  const newValues = [...prev];
                  newValues[index] = Math.round(stat.value * progress);
                  return newValues;
                });
              }
            });
          });
        },
        once: true
      });

      // Stats cards animation
      const cards = statsRef.current?.querySelectorAll('.stat-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const getIcon = (index: number) => {
    const icons = [Calendar, Users, Globe, Award, TrendingUp, ThumbsUp];
    const Icon = icons[index % icons.length];
    return <Icon className="w-8 h-8" />;
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(0) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-[#0A0A0A] overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#4169E1]/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6B00]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4169E1]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] text-sm font-medium mb-6">
            {statsConfig.subtitle}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white tracking-tight mb-6">
            {statsConfig.titleRegular}{' '}
            <span className="font-serif italic text-[#4169E1]">{statsConfig.titleItalic}</span>
          </h2>
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {statsConfig.stats.map((stat, index) => (
            <div
              key={index}
              className="stat-card relative group"
            >
              <div className="relative p-6 md:p-8 bg-[#141414] rounded-2xl border border-white/5 hover:border-[#4169E1]/30 transition-all duration-500 overflow-hidden">
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#4169E1]/10 via-transparent to-[#FF6B00]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4169E1]/20 to-[#FF6B00]/20 flex items-center justify-center mb-6 text-[#4169E1] group-hover:text-[#FF6B00] transition-colors duration-300">
                    {getIcon(index)}
                  </div>

                  {/* Value */}
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl md:text-5xl font-bold text-white">
                      {formatValue(animatedValues[index])}
                    </span>
                    <span className="text-2xl md:text-3xl font-bold text-[#FF6B00]">
                      {stat.suffix}
                    </span>
                  </div>

                  {/* Label */}
                  <p className="text-white/60 text-sm md:text-base">{stat.label}</p>
                </div>

                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                  <div className="absolute top-4 right-4 w-8 h-[2px] bg-white" />
                  <div className="absolute top-4 right-4 w-[2px] h-8 bg-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-white/60 mb-6">
            Faça parte dessa história de sucesso
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#eventos" className="btn-primary">
              Participar de Eventos
            </a>
            <a href="#empresas" className="px-6 py-3 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/5 transition-colors">
              Seja um Parceiro
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
