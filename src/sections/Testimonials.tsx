import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { testimonialsConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  quote: string;
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex-shrink-0 w-[320px] p-5 bg-[#111] rounded-2xl border border-white/[0.07] hover:border-[#FF6B00]/30 transition-colors duration-300">
      {/* Author */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <img
            src={testimonial.image}
            alt={testimonial.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#FF6B00] border-2 border-[#111] flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-tight truncate">{testimonial.name}</p>
          <p className="text-white/40 text-xs truncate">{testimonial.role}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mb-4" />

      {/* Quote */}
      <p className="text-white/65 text-sm leading-relaxed">
        "{testimonial.quote}"
      </p>
    </div>
  );
}

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

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
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const base = testimonialsConfig.testimonials;

  // Três repetições por row para densidade, duplicadas para loop seamless
  const row1 = [...base, ...base, ...base, ...base, ...base, ...base];
  const row2 = [
    ...[...base].reverse(),
    ...[...base].reverse(),
    ...[...base].reverse(),
    ...[...base].reverse(),
    ...[...base].reverse(),
    ...[...base].reverse(),
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-[#0A0A0A] overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#FF6B00]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-[#4169E1]/5 rounded-full blur-[120px]" />
      </div>

      {/* Section Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 mb-16">
        <div ref={titleRef} className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] text-xs font-semibold tracking-widest uppercase mb-5">
              {testimonialsConfig.subtitle}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-extrabold text-white tracking-tight leading-none">
              {testimonialsConfig.titleRegular}{' '}
              <span className="font-serif italic text-[#FF6B00]">{testimonialsConfig.titleItalic}</span>
            </h2>
          </div>
          <p className="text-white/40 text-base md:max-w-[260px] md:text-right leading-relaxed">
            Histórias reais de quem transformou sua vida com a Extreme Sports.
          </p>
        </div>
      </div>

      {/* Edge fades */}
      <div
        className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #0A0A0A 20%, transparent)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #0A0A0A 20%, transparent)' }}
      />

      {/* Row 1 — scrolls left */}
      <div className="overflow-hidden mb-4">
        <div className="testimonial-left flex gap-4 py-1">
          {row1.map((t, i) => (
            <TestimonialCard key={`r1-${i}`} testimonial={t} />
          ))}
        </div>
      </div>

      {/* Row 2 — scrolls right */}
      <div className="overflow-hidden">
        <div className="testimonial-right flex gap-4 py-1">
          {row2.map((t, i) => (
            <TestimonialCard key={`r2-${i}`} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
