import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { heroConfig } from '../config';
import { Menu, X, User, Lock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroConfig.slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Animate slide change
  useEffect(() => {
    slideRefs.current.forEach((slide, index) => {
      if (slide) {
        gsap.to(slide, {
          opacity: index === currentSlide ? 1 : 0,
          duration: 1,
          ease: 'power2.inOut'
        });
      }
    });
  }, [currentSlide]);

  // Parallax effect
  useEffect(() => {
    const ctx = gsap.context(() => {
      const triggers: ScrollTrigger[] = [];
      
      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          slideRefs.current.forEach((slide) => {
            if (slide) {
              gsap.set(slide.querySelector('.slide-content'), {
                yPercent: self.progress * 30,
                opacity: 1 - self.progress
              });
            }
          });
        }
      });
      triggers.push(trigger);
      
      return () => {
        triggers.forEach((t) => t.kill());
      };
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);

  if (heroConfig.slides.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen w-full overflow-hidden bg-[#0A0A0A]"
    >
      {/* Carousel Slides */}
      {heroConfig.slides.map((slide, index) => (
        <div
          key={slide.id}
          ref={(el) => { slideRefs.current[index] = el; }}
          className={`absolute inset-0 ${index === 0 ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
        </div>
      ))}

      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Menu Button & Logo */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Extreme Sports" 
                className="h-10 md:h-12 w-auto"
              />
            </div>
          </div>

          {/* Right Side - Online Users & Login */}
          <div className="flex items-center gap-4">
            {/* Online Users Badge */}
            <div className="online-badge hidden md:flex">
              <span className="online-dot" />
              <span className="text-white/80">{heroConfig.onlineUsers.toLocaleString()} online</span>
            </div>
            
            {/* Login Button */}
            <button 
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4169E1] hover:bg-[#5A7FE8] transition-colors"
            >
              <User className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium hidden sm:inline">Entrar</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Slide Content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="slide-content w-full px-4 md:px-8 lg:px-16 pt-24">
          <div className="max-w-3xl">
            {/* Category Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/30 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
              <span className="text-[#FF6B00] text-sm font-medium">Competição Oficial</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-sans font-extrabold text-white tracking-tight leading-tight mb-4">
              {heroConfig.slides[currentSlide].title}
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/80 font-body mb-8 max-w-xl">
              {heroConfig.slides[currentSlide].subtitle}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <a 
                href={heroConfig.slides[currentSlide].ctaHref}
                className="btn-secondary flex items-center gap-2"
              >
                {heroConfig.slides[currentSlide].ctaText}
              </a>
              <a 
                href="#eventos"
                className="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
              >
                Explorar Eventos
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {heroConfig.slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'w-8 bg-[#FF6B00]' 
                : 'w-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Side Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100]">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-[#0A0A0A] border-r border-white/10 p-6">
            <div className="flex items-center justify-between mb-8">
              <img src="/logo.png" alt="Logo" className="h-10" />
              <button 
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <nav className="space-y-2">
              {heroConfig.navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="online-badge justify-center mb-4">
                <span className="online-dot" />
                <span className="text-white/80">{heroConfig.onlineUsers.toLocaleString()} usuários online</span>
              </div>
              <div className="text-xs text-white/40 text-center">
                © 2026 Extreme Sports Competition
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowLogin(false)}
          />
          <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-8">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4169E1]/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-[#4169E1]" />
              </div>
              <h2 className="text-2xl font-sans font-bold text-white mb-2">Área do Atleta</h2>
              <p className="text-white/60">Login exclusivo para atletas cadastrados</p>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Email</label>
                <input 
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Senha</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1] transition-colors"
                />
              </div>
              <button 
                type="submit"
                className="w-full btn-primary py-3"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Sistema de login em desenvolvimento');
                }}
              >
                Entrar
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <a href="#" className="text-sm text-[#4169E1] hover:underline">Esqueceu a senha?</a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
