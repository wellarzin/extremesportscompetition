import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { eventsConfig } from '../config';
import { Calendar, MapPin, Users, CreditCard, X, Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function Events() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<typeof eventsConfig.events[0] | null>(null);
  const [showPayment, setShowPayment] = useState(false);

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
      const cards = cardsRef.current?.querySelectorAll('.event-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
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

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'online': return 'Online';
      case 'presencial': return 'Presencial';
      case 'hibrido': return 'Híbrido';
      default: return format;
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'online': return 'bg-[#4169E1]/20 text-[#4169E1]';
      case 'presencial': return 'bg-[#FF6B00]/20 text-[#FF6B00]';
      case 'hibrido': return 'bg-white/10 text-white/70';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <section
      ref={sectionRef}
      id="eventos"
      className="relative py-24 md:py-32 bg-[#0A0A0A]"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0F0F0F] to-[#0A0A0A]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-[#4169E1]/10 border border-[#4169E1]/20 text-[#4169E1] text-sm font-medium mb-6">
            {eventsConfig.subtitle}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white tracking-tight mb-6">
            {eventsConfig.titleRegular}{' '}
            <span className="font-serif italic text-[#FF6B00]">{eventsConfig.titleItalic}</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            {eventsConfig.description}
          </p>
        </div>

        {/* Events Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventsConfig.events.map((event) => (
            <div
              key={event.id}
              className="event-card group relative bg-[#141414] rounded-2xl overflow-hidden border border-white/5 hover:border-[#4169E1]/30 transition-all duration-500"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                
                {/* Format Badge */}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getFormatColor(event.format)}`}>
                  {getFormatLabel(event.format)}
                </div>
                
                {/* Category Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium">
                  {event.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-sans font-bold text-white mb-3 group-hover:text-[#4169E1] transition-colors">
                  {event.title}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Calendar className="w-4 h-4 text-[#FF6B00]" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <MapPin className="w-4 h-4 text-[#4169E1]" />
                    <span>{event.location}</span>
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <span className="text-white/40 text-sm">Inscrição</span>
                    {event.price === 0 ? (
                      <p className="text-2xl font-bold text-[#00C45A]">Gratuito</p>
                    ) : (
                      <p className="text-2xl font-bold text-white">
                        R$ {event.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="px-4 py-2 bg-[#FF6B00] hover:bg-[#FF8533] text-white font-medium rounded-lg transition-colors"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-[#141414] border border-white/10 rounded-2xl">
            {/* Header Image */}
            <div className="relative h-64 md:h-80">
              <img 
                src={selectedEvent.image} 
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFormatColor(selectedEvent.format)}`}>
                    {getFormatLabel(selectedEvent.format)}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium">
                    {selectedEvent.category}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-sans font-bold text-white">
                  {selectedEvent.title}
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Sobre o Evento</h3>
                    <p className="text-white/70 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Regras</h3>
                    <p className="text-white/70 leading-relaxed">{selectedEvent.rules}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Premiação</h3>
                    <div className="p-4 bg-gradient-to-r from-[#4169E1]/10 to-[#FF6B00]/10 rounded-xl border border-white/5">
                      <p className="text-white/80">{selectedEvent.prizes}</p>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Data</span>
                    </div>
                    <p className="text-white font-medium">{selectedEvent.date}</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>Local</span>
                    </div>
                    <p className="text-white font-medium">{selectedEvent.location}</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <Users className="w-4 h-4" />
                      <span>Formato</span>
                    </div>
                    <p className="text-white font-medium">{getFormatLabel(selectedEvent.format)}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-[#4169E1]/20 to-[#FF6B00]/20 rounded-xl border border-[#4169E1]/20">
                    <p className="text-white/60 text-sm mb-1">Valor da Inscrição</p>
                    <p className="text-3xl font-bold text-white">R$ {selectedEvent.price.toFixed(2)}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowPayment(true);
                      setSelectedEvent(null);
                    }}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Inscrever-se Agora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPayment(false)}
          />
          <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-8">
            <button 
              onClick={() => setShowPayment(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FF6B00]/20 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-[#FF6B00]" />
              </div>
              <h2 className="text-2xl font-sans font-bold text-white mb-2">Pagamento</h2>
              <p className="text-white/60">Escolha sua forma de pagamento</p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => alert('Sistema de pagamento em desenvolvimento')}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#4169E1]/30 rounded-xl flex items-center gap-4 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#4169E1]/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#4169E1]" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Cartão de Crédito</p>
                  <p className="text-white/50 text-sm">Parcelamento disponível</p>
                </div>
              </button>
              
              <button 
                onClick={() => alert('Sistema de pagamento em desenvolvimento')}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#4169E1]/30 rounded-xl flex items-center gap-4 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FF6B00]/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#FF6B00]" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">PIX</p>
                  <p className="text-white/50 text-sm">Pagamento instantâneo</p>
                </div>
              </button>
              
              <button 
                onClick={() => alert('Sistema de pagamento em desenvolvimento')}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#4169E1]/30 rounded-xl flex items-center gap-4 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Cartão de Débito</p>
                  <p className="text-white/50 text-sm">Débito em conta</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
