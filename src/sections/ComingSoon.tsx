import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function ComingSoon() {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Initial states
      gsap.set([logoRef.current, taglineRef.current, headingRef.current, dateRef.current, dividerRef.current, subRef.current], {
        opacity: 0,
        y: 30,
      });
      gsap.set(glowRef.current, { opacity: 0, scale: 0.6 });

      tl
        .to(glowRef.current, { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0)
        .to(logoRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.3)
        .to(taglineRef.current, { opacity: 1, y: 0, duration: 0.7 }, 0.55)
        .to(dividerRef.current, { opacity: 1, y: 0, duration: 0.6, scaleX: 1 }, 0.7)
        .to(headingRef.current, { opacity: 1, y: 0, duration: 0.9 }, 0.8)
        .to(dateRef.current, { opacity: 1, y: 0, duration: 0.9 }, 1.0)
        .to(subRef.current, { opacity: 1, y: 0, duration: 0.7 }, 1.2);

      // Subtle glow pulse
      gsap.to(glowRef.current, {
        opacity: 0.55,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1.8,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#0A0A0A]"
    >
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(65,105,225,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(65,105,225,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(65,105,225,0.18) 0%, rgba(255,107,0,0.08) 45%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#4169E1] to-transparent opacity-60" />

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent opacity-40" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Logo */}
        <img
          ref={logoRef}
          src="/logo.png"
          alt="Extreme Sports Competition"
          className="mb-8 h-20 w-auto object-contain"
          style={{ filter: 'drop-shadow(0 0 20px rgba(65,105,225,0.5))' }}
        />

        {/* Eyebrow */}
        <p
          ref={taglineRef}
          className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-[#4169E1]"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Extreme Sports Competition
        </p>

        {/* Divider */}
        <div
          ref={dividerRef}
          className="mb-10 h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {/* Main heading */}
        <h1
          ref={headingRef}
          className="mb-4 text-[clamp(3rem,10vw,7rem)] font-extrabold leading-none tracking-tight text-white"
          style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.03em' }}
        >
          Voltamos em
        </h1>

        {/* Date block */}
        <div ref={dateRef} className="mb-10 flex items-center gap-4">
          {['21', '04', '2026'].map((part, i) => (
            <div key={i} className="flex items-center gap-4">
              <div
                className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm"
                style={{ minWidth: '88px' }}
              >
                <span
                  className="text-[clamp(1.8rem,5vw,3.2rem)] font-extrabold leading-none text-white"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {part}
                </span>
                <span
                  className="mt-1 text-[10px] font-medium uppercase tracking-widest text-white/40"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {i === 0 ? 'dia' : i === 1 ? 'mês' : 'ano'}
                </span>
              </div>
              {i < 2 && (
                <span className="text-2xl font-light text-[#FF6B00] opacity-60">/</span>
              )}
            </div>
          ))}
        </div>

        {/* Sub text */}
        <p
          ref={subRef}
          className="max-w-md text-sm leading-relaxed text-white/40"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Estamos preparando algo incrível para você.
          <br />
          Fique de olho — a competição está chegando.
        </p>
      </div>

      {/* Corner marks */}
      <div className="pointer-events-none absolute left-6 top-6 h-8 w-8 border-l-2 border-t-2 border-[#4169E1]/40" />
      <div className="pointer-events-none absolute right-6 top-6 h-8 w-8 border-r-2 border-t-2 border-[#4169E1]/40" />
      <div className="pointer-events-none absolute bottom-6 left-6 h-8 w-8 border-b-2 border-l-2 border-[#FF6B00]/30" />
      <div className="pointer-events-none absolute bottom-6 right-6 h-8 w-8 border-b-2 border-r-2 border-[#FF6B00]/30" />
    </div>
  );
}
