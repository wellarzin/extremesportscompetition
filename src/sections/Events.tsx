import { useEffect, useRef, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { eventsConfig } from '../config';
import { useLandingEvents } from '../hooks/useLandingEvents';
import { mediaUrl } from '../lib/utils';
import type { LandingEvent } from '../types/api';
import { Calendar, MapPin, ChevronLeft, ChevronRight, ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import {
  EventDetailModal,
  formatDate,
  formatPrice,
  categoryLabel,
  modalityColor,
  modalityLabel,
  statusBadge,
} from '../components/EventDetailModal';

gsap.registerPlugin(ScrollTrigger);

function SkeletonCard() {
  return (
    <div className="bg-[#141414] rounded-2xl overflow-hidden border border-white/5 animate-pulse h-full">
      <div className="h-56 bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-white/5 rounded w-3/4" />
        <div className="h-4 bg-white/5 rounded w-1/2" />
        <div className="h-4 bg-white/5 rounded w-2/3" />
        <div className="h-px bg-white/5 my-3" />
        <div className="flex justify-between items-center">
          <div className="h-7 bg-white/5 rounded w-24" />
          <div className="h-9 bg-white/5 rounded w-28" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Events Section
// ============================================================

export function Events() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [prevEnabled, setPrevEnabled] = useState(false);
  const [nextEnabled, setNextEnabled] = useState(false);

  const { events, isLoading, error, refetch } = useLandingEvents(10);
  const { navigate } = useNavigation();

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

  // Re-init embla when data loads so it recalculates scroll bounds
  useEffect(() => {
    if (!isLoading && emblaApi) emblaApi.reInit();
  }, [isLoading, emblaApi]);

  // GSAP: animate title on scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
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
      id="eventos"
      className="relative py-24 md:py-32 bg-[#0A0A0A]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0F0F0F] to-[#0A0A0A]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div ref={titleRef} className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          {/* Left: title block */}
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-[#4169E1]/10 border border-[#4169E1]/20 text-[#4169E1] text-sm font-medium mb-5">
              {eventsConfig.subtitle}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white tracking-tight mb-4">
              {eventsConfig.titleRegular}{' '}
              <span className="font-serif italic text-[#FF6B00]">{eventsConfig.titleItalic}</span>
            </h2>
            <p className="text-base text-white/60 max-w-xl">
              {eventsConfig.description}
            </p>
          </div>

          {/* Right: carousel controls + show all */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!prevEnabled}
              aria-label="Evento anterior"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              disabled={!nextEnabled}
              aria-label="Próximo evento"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('events')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4169E1]/10 border border-[#4169E1]/25 text-[#4169E1] text-sm font-semibold hover:bg-[#4169E1]/20 hover:border-[#4169E1]/50 transition-all"
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
            <div className="flex -ml-5">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-[0_0_90%] min-w-0 pl-5 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                    >
                      <SkeletonCard />
                    </div>
                  ))
                : events.map((event: LandingEvent) => {
                    const badge = statusBadge(event.status);
                    return (
                      <div
                        key={event.id}
                        className="flex-[0_0_90%] min-w-0 pl-5 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                      >
                        <div className="group relative bg-[#141414] rounded-2xl overflow-hidden border border-white/5 hover:border-[#4169E1]/30 transition-all duration-500 h-full">
                          {/* Image */}
                          <div className="relative h-56 overflow-hidden">
                            {mediaUrl(event.cover_image_url) ? (
                              <img
                                src={mediaUrl(event.cover_image_url)!}
                                alt={event.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                onError={(e) => {
                                  const el = e.currentTarget as HTMLImageElement;
                                  el.style.display = 'none';
                                  el.parentElement?.classList.add(
                                    'bg-gradient-to-br',
                                    'from-[#4169E1]/20',
                                    'to-[#FF6B00]/20',
                                  );
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#4169E1]/20 to-[#FF6B00]/20" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

                            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${modalityColor(event.modality)}`}>
                              {modalityLabel(event.modality)}
                            </div>
                            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium">
                              {categoryLabel(event.category)}
                            </div>
                            {badge && (
                              <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                                {badge.label}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-5">
                            <h3 className="text-lg font-sans font-bold text-white mb-3 group-hover:text-[#4169E1] transition-colors line-clamp-2">
                              {event.title}
                            </h3>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-white/60 text-sm">
                                <Calendar className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
                                <span>{formatDate(event.start_datetime)}</span>
                              </div>
                              {(event.city || event.location) && (
                                <div className="flex items-center gap-2 text-white/60 text-sm">
                                  <MapPin className="w-4 h-4 text-[#4169E1] flex-shrink-0" />
                                  <span className="truncate">
                                    {event.location ?? `${event.city}${event.state ? `, ${event.state}` : ''}`}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <div>
                                <span className="text-white/40 text-sm">Inscrição</span>
                                <p className={`text-2xl font-bold ${event.price_cents === 0 ? 'text-[#00C45A]' : 'text-white'}`}>
                                  {formatPrice(event.price_cents)}
                                </p>
                              </div>
                              <button
                                onClick={() => setSelectedEventId(event.id)}
                                className="px-4 py-2 bg-[#FF6B00] hover:bg-[#FF8533] text-white font-medium rounded-lg transition-colors text-sm"
                              >
                                Ver Detalhes
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && events.length === 0 && (
          <div className="text-center py-24 text-white/40">
            Nenhum evento disponível no momento.
          </div>
        )}
      </div>

      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}
    </section>
  );
}
