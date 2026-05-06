import { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { heroConfig, companiesConfig } from '../config';
import { useAuthContext } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useNavigation, type AppPage } from '../contexts/NavigationContext';
import { useFeaturedEvents } from '../hooks/useFeaturedEvents';
import { mediaUrl } from '../lib/utils';
import { UserMenu } from '../components/UserMenu';
import { ProfileModal } from '../components/ProfileModal';
import type { FeaturedEvent } from '../types/api';
import {
  Menu, X, User, ChevronLeft, ChevronRight,
  Calendar, MapPin, Tag, Check, Crown,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ---- helpers ----

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Gratuito';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function categoryLabel(raw: string): string {
  const map: Record<string, string> = {
    maratona: 'Maratona',
    trail: 'Trail',
    ultramaratona: 'Ultramaratona',
    campeonato_crossfit: 'Crossfit',
    campeonato_natacao: 'Natacao',
    campeonato_ciclismo: 'Ciclismo',
    campeonato_volei: 'Volei',
    campeonato_basquete: 'Basquete',
    beach_tennis: 'Beach Tennis',
    corrida_de_obstaculos: 'Obstaculos',
    desafio_aberto: 'Desafio',
    evento_recreativo: 'Recreativo',
    outros: 'Evento',
  };
  return map[raw] ?? raw;
}

// Slide vindo da API
interface DynamicSlide {
  kind: 'event';
  event: FeaturedEvent;
}

// Slide vindo da config estática
interface StaticSlide {
  kind: 'static';
  id: number;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
}

type Slide = DynamicSlide | StaticSlide;

// ============================================================
// Hero Section
// ============================================================

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; name: string }>({ visible: false, name: '' });
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { user, isRestoring } = useAuthContext();
  const { openAuthModal } = useAuthModal();
  const { navigate } = useNavigation();
  const { events: featuredEvents, isLoading: eventsLoading } = useFeaturedEvents();

  // Monta lista de slides: eventos em destaque ou fallback estático
  const slides = useMemo<Slide[]>(() => {
    if (!eventsLoading && featuredEvents.length > 0) {
      return featuredEvents.map((e) => ({ kind: 'event' as const, event: e }));
    }
    if (!eventsLoading) {
      return heroConfig.slides.map((s) => ({ kind: 'static' as const, ...s }));
    }
    return []; // Carregando — não renderiza nada ainda
  }, [featuredEvents, eventsLoading]);

  // Reset slide index quando os slides mudam
  useEffect(() => {
    setCurrentSlide(0);
  }, [slides.length]);

  // Auto-advance
  useEffect(() => {
    if (slides.length < 2) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Fade entre slides
  useEffect(() => {
    slideRefs.current.forEach((slide, index) => {
      if (slide) {
        gsap.to(slide, {
          opacity: index === currentSlide ? 1 : 0,
          duration: 1,
          ease: 'power2.inOut',
        });
      }
    });
  }, [currentSlide]);

  // Parallax
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          slideRefs.current.forEach((slide) => {
            if (slide) {
              gsap.set(slide.querySelector('.slide-content'), {
                yPercent: self.progress * 30,
                opacity: 1 - self.progress,
              });
            }
          });
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Toast de boas-vindas após login
  const prevUserRef = useRef<typeof user>(null);
  useEffect(() => {
    if (user && !prevUserRef.current) {
      const firstName = user.full_name?.split(' ')[0] ?? 'atleta';
      setToast({ visible: true, name: firstName });
    }
    prevUserRef.current = user;
  }, [user]);

  // Auto-dismissal do toast
  useEffect(() => {
    if (!toast.visible) return;
    const t = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
    return () => clearTimeout(t);
  }, [toast.visible]);

  // Slot do slide atual
  const currentDynamic = slides[currentSlide];

  // Imagem do slide atual (para o layout mobile)
  const mobileBgImage = currentDynamic
    ? (currentDynamic.kind === 'event'
        ? (mediaUrl(currentDynamic.event.cover_image_url) ?? undefined)
        : currentDynamic.image)
    : undefined;

  // Navbar compartilhada entre os dois layouts
  const navbar = (
    <nav className="absolute top-0 left-0 right-0 z-50 px-4 md:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          <img src="/logo.png" alt="Extreme Sports" className="h-16 md:h-20 w-auto" />
        </div>

        <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {heroConfig.navLinks.map((link) =>
            link.href.startsWith('page:') ? (
              <button
                key={link.label}
                onClick={() => navigate(link.href.slice(5) as AppPage)}
                className="px-4 py-2 text-white/55 hover:text-white text-sm font-medium rounded-lg hover:bg-white/8 transition-all duration-200"
              >
                {link.label}
              </button>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-white/55 hover:text-white text-sm font-medium rounded-lg hover:bg-white/8 transition-all duration-200"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        <div className="flex items-center gap-4">
          {isRestoring ? (
            <div className="w-10 h-10 rounded-lg bg-white/10 animate-pulse" />
          ) : user ? (
            <UserMenu onOpenProfile={() => setShowProfile(true)} />
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4169E1] hover:bg-[#5A7FE8] transition-colors"
            >
              <User className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium hidden sm:inline">Entrar</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );

  // Menu lateral + modais + toast (compartilhados)
  const overlays = (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-xs sm:w-80 bg-[#0A0A0A] border-r border-white/10 p-6">
            <div className="flex items-center justify-between mb-8">
              <img src="/logo.png" alt="Logo" className="h-14" />
              <button onClick={() => setMenuOpen(false)} aria-label="Fechar menu" className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <nav className="space-y-2">
              {heroConfig.navLinks.map((link) =>
                link.href.startsWith('page:') ? (
                  <button
                    key={link.label}
                    onClick={() => { navigate(link.href.slice(5) as AppPage); setMenuOpen(false); }}
                    className="w-full text-left block px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
                  >
                    {link.label}
                  </button>
                ) : (
                  <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium">
                    {link.label}
                  </a>
                )
              )}
            </nav>
            {user && (
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Logado como</p>
                  <p className="text-sm text-white font-medium truncate">{user.full_name}</p>
                  <p className="text-xs text-white/40 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); setShowProfile(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
                >
                  <Tag className="w-3.5 h-3.5 text-[#FF6B00]" />
                  Meus ingressos
                </button>
              </div>
            )}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="text-xs text-white/40 text-center">© 2026 Extreme Sports Competition</div>
            </div>
          </div>
        </div>
      )}
      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
      <div
        className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3.5 px-5 py-4 bg-[#141414] border border-[#00FF87]/25 rounded-2xl shadow-2xl transition-all duration-500 ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="w-9 h-9 rounded-full bg-[#00FF87]/15 flex items-center justify-center flex-shrink-0">
          <Check className="w-4.5 h-4.5 text-[#00FF87]" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Bem-vindo, {toast.name}!</p>
          <p className="text-white/40 text-xs">Login realizado com sucesso</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ================================================================
          MOBILE LAYOUT — imagem contida + conteúdo empilhado
          Visível apenas em telas < md
      ================================================================ */}
      <section
        id="home"
        className="md:hidden relative w-full bg-[#0A0A0A]"
      >
        {navbar}

        {/* Spacer da navbar */}
        <div className="h-24" />

        {/* Imagem contida */}
        {eventsLoading ? (
          <div className="mx-4 h-52 rounded-xl bg-white/5 animate-pulse" />
        ) : mobileBgImage ? (
          <div className="relative w-full">
            <img
              key={currentSlide}
              src={mobileBgImage}
              alt=""
              className="w-full object-contain"
            />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="h-8" />
        )}

        {/* Conteúdo do slide */}
        <div className="px-4 pt-2 pb-4">
          {eventsLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-5 w-32 rounded-full bg-white/10" />
              <div className="h-10 w-4/5 rounded bg-white/10" />
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="flex gap-3 pt-1">
                <div className="h-11 w-32 rounded-lg bg-white/10" />
                <div className="h-11 w-28 rounded-lg bg-white/5" />
              </div>
            </div>
          ) : currentDynamic?.kind === 'event' ? (
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/30 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
                <span className="text-[#FF6B00] text-xs font-medium uppercase tracking-wide">Evento em Destaque</span>
              </div>
              <h1 className="text-2xl font-sans font-extrabold text-white tracking-tight leading-tight mb-2">
                {currentDynamic.event.title}
              </h1>
              <p className="text-sm text-white/70 mb-4 line-clamp-2">{currentDynamic.event.description}</p>
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-xs">
                  <Calendar className="w-3 h-3 text-[#FF6B00]" />
                  {formatDate(currentDynamic.event.start_datetime)}
                </span>
                {(currentDynamic.event.city || currentDynamic.event.location) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-xs">
                    <MapPin className="w-3 h-3 text-[#4169E1]" />
                    {currentDynamic.event.city ?? currentDynamic.event.location}
                  </span>
                )}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  currentDynamic.event.price_cents === 0 ? 'bg-[#00FF87]/15 text-[#00FF87]' : 'bg-white/10 text-white/80'
                }`}>
                  {formatPrice(currentDynamic.event.price_cents)}
                </span>
              </div>
              <div className="flex gap-3">
                <a href="#eventos" className="btn-secondary text-sm px-5 py-2.5">Ver eventos</a>
                <a href="#eventos" className="px-5 py-2.5 border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/10 transition-all">Inscrever-se</a>
              </div>
            </div>
          ) : currentDynamic?.kind === 'static' ? (
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/30 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
                <span className="text-[#FF6B00] text-xs font-medium">Competição Oficial</span>
              </div>
              <h1 className="text-2xl font-sans font-extrabold text-white tracking-tight leading-tight mb-2">
                {currentDynamic.title}
              </h1>
              <p className="text-sm text-white/80 mb-5">{currentDynamic.subtitle}</p>
              <div className="flex gap-3">
                <a href={currentDynamic.ctaHref} className="btn-secondary text-sm px-5 py-2.5">{currentDynamic.ctaText}</a>
                <a href="#eventos" className="px-5 py-2.5 border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/10 transition-all">Explorar</a>
              </div>
            </div>
          ) : null}
        </div>

        {/* Controles de slide — mobile */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-4 py-5">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              aria-label="Slide anterior"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 border border-white/15"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-6 bg-[#FF6B00]' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              aria-label="Próximo slide"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 border border-white/15"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {overlays}
      </section>

      {/* ================================================================
          DESKTOP LAYOUT — fullscreen background, layout original intacto
          Visível apenas em telas ≥ md
      ================================================================ */}
      <section
        ref={sectionRef}
        id="home"
        className="hidden md:block relative min-h-screen w-full overflow-hidden bg-[#0A0A0A]"
      >
        {/* Background slides */}
        {slides.map((slide, index) => {
          const bgImage =
            slide.kind === 'event'
              ? mediaUrl(slide.event.cover_image_url) ?? undefined
              : slide.image;

          return (
            <div
              key={slide.kind === 'event' ? slide.event.id : slide.id}
              ref={(el) => { slideRefs.current[index] = el; }}
              className={`absolute inset-0 ${index === 0 ? 'opacity-100' : 'opacity-0'}`}
            >
              {bgImage ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${bgImage})`, backgroundPosition: 'center top' }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#0d1310] via-[#0A0A0A] to-[#0A0A0A]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/30 to-transparent" />
            </div>
          );
        })}

        {navbar}

        {/* Conteúdo */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="slide-content w-full px-8 lg:px-16 pt-24 pb-32">
            {eventsLoading ? (
              <div className="max-w-3xl space-y-5 animate-pulse">
                <div className="h-6 w-40 rounded-full bg-white/10" />
                <div className="h-16 w-3/4 rounded-lg bg-white/10" />
                <div className="h-5 w-2/3 rounded bg-white/10" />
                <div className="flex gap-4 pt-2">
                  <div className="h-12 w-36 rounded-lg bg-white/10" />
                  <div className="h-12 w-36 rounded-lg bg-white/5" />
                </div>
              </div>
            ) : currentDynamic?.kind === 'event' ? (
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/30 mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
                  <span className="text-[#FF6B00] text-sm font-medium uppercase tracking-wide">Evento em Destaque</span>
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-sans font-extrabold text-white tracking-tight leading-tight mb-4">
                  {currentDynamic.event.title}
                </h1>
                <p className="text-xl text-white/75 font-body mb-6 max-w-xl line-clamp-2">
                  {currentDynamic.event.description}
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" />
                    {formatDate(currentDynamic.event.start_datetime)}
                  </span>
                  {(currentDynamic.event.city || currentDynamic.event.location) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-[#4169E1]" />
                      {currentDynamic.event.location
                        ? currentDynamic.event.location
                        : `${currentDynamic.event.city}${currentDynamic.event.state ? `, ${currentDynamic.event.state}` : ''}`}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-sm">
                    <Tag className="w-3.5 h-3.5 text-[#00FF87]" />
                    {categoryLabel(currentDynamic.event.category)}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                    currentDynamic.event.price_cents === 0 ? 'bg-[#00FF87]/15 text-[#00FF87]' : 'bg-white/10 text-white/80'
                  }`}>
                    {formatPrice(currentDynamic.event.price_cents)}
                  </span>
                </div>
                <div className="flex gap-4">
                  <a href="#eventos" className="btn-secondary flex items-center gap-2">Ver todos os eventos</a>
                  <a href="#eventos" className="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all">Inscrever-se</a>
                </div>
              </div>
            ) : currentDynamic?.kind === 'static' ? (
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/30 mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
                  <span className="text-[#FF6B00] text-sm font-medium">Competicao Oficial</span>
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-sans font-extrabold text-white tracking-tight leading-tight mb-4">
                  {currentDynamic.title}
                </h1>
                <p className="text-xl text-white/80 font-body mb-8 max-w-xl">{currentDynamic.subtitle}</p>
                <div className="flex gap-4">
                  <a href={currentDynamic.ctaHref} className="btn-secondary flex items-center gap-2">{currentDynamic.ctaText}</a>
                  <a href="#eventos" className="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all">Explorar Eventos</a>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Master Sponsor badge */}
        <div className="absolute bottom-10 left-8 z-20 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-[#FF6B00]/20">
            <Crown className="w-3 h-3 text-[#FF6B00] flex-shrink-0" />
            <span className="text-white/35 text-[10px] font-medium tracking-widest uppercase">Master</span>
            <div className="w-px h-3 bg-white/15" />
            <span
              className="text-xs font-extrabold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #ffffff 40%, #FF6B00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {companiesConfig.sponsors.master.logoText}
            </span>
          </div>
        </div>

        {/* Controles de slide — desktop */}
        {slides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              aria-label="Slide anterior"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-[#FF6B00]' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              aria-label="Proximo slide"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {overlays}
      </section>
    </>
  );
}
