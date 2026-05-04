import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createEventsConfig } from '../config';
import {
  Check,
  Building2,
  Mail,
  MapPin,
  X,
  Send,
  Briefcase,
  Calendar,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
  Zap,
  Users,
} from 'lucide-react';
import { sendPartnerContact } from '../lib/api';

gsap.registerPlugin(ScrollTrigger);

const initialFormState = {
  companyName: '',
  cnpj: '',
  contactName: '',
  contactEmail: '',
  eventType: '',
  eventDate: '',
  city: '',
  budget: '',
  services: [] as string[],
  message: '',
};

const SERVICES = [
  'Planejamento Completo',
  'Sistema de Apuração',
  'Transmissão Ao Vivo',
  'Marketing e Divulgação',
  'Equipe Técnica',
  'Infraestrutura',
];

export function CreateEvents() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        }
      );

      if (benefitsRef.current) {
        gsap.fromTo(
          benefitsRef.current.children,
          { opacity: 0, x: -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: benefitsRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const updateField = (field: keyof typeof initialFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setFeedback(null);
  };

  const closeModal = () => {
    setShowForm(false);
    if (feedback?.type === 'success') resetForm();
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.companyName.trim() || !form.contactName.trim() || !form.contactEmail.trim()) {
      setFeedback({
        type: 'error',
        message: 'Preencha os campos obrigatórios: Nome do Organizador, Nome do Responsável e Email.',
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      setFeedback({ type: 'error', message: 'Informe um email válido.' });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const result = await sendPartnerContact({
        company_name: form.companyName.trim(),
        cnpj: form.cnpj.trim(),
        contact_name: form.contactName.trim(),
        contact_email: form.contactEmail.trim(),
        event_type: form.eventType,
        event_date: form.eventDate,
        city: form.city.trim(),
        budget: form.budget,
        services: form.services,
        message: form.message.trim(),
      });

      setFeedback({ type: 'success', message: result.message });
      setForm(initialFormState);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar solicitação. Tente novamente.';
      setFeedback({ type: 'error', message });
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="crie-eventos"
      className="relative py-24 md:py-32 bg-[#0d1310]"
    >
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0d1a10] to-[#0A0A0A]" />
      {/* Subtle green glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#00FF87]/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div ref={titleRef} className="mb-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-[#00FF87]/10 border border-[#00FF87]/20 text-[#00FF87] text-sm font-medium tracking-widest mb-6">
                {createEventsConfig.subtitle}
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-extrabold text-white tracking-tight">
                {createEventsConfig.titleRegular}{' '}
                <span className="font-serif italic text-[#00FF87]">{createEventsConfig.titleItalic}</span>
              </h2>
            </div>
            <p className="text-white/55 max-w-md lg:text-right leading-relaxed">
              {createEventsConfig.description}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-6">
              O que você recebe ao criar um evento conosco
            </h3>
            <div ref={benefitsRef} className="space-y-3">
              {createEventsConfig.benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-xl border border-white/[0.06] hover:border-[#00FF87]/20 hover:bg-[#00FF87]/[0.04] transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#00FF87]/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-[#00FF87]" />
                  </div>
                  <span className="text-white/75 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Visual + CTA */}
          <div className="space-y-6">
            {/* Stats showcase */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <Users className="w-7 h-7 text-[#00FF87] mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-white tracking-tight">15k+</div>
                <div className="text-white/45 text-sm mt-1">atletas na plataforma</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <Briefcase className="w-7 h-7 text-[#00FF87] mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-white tracking-tight">50+</div>
                <div className="text-white/45 text-sm mt-1">eventos realizados</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <Zap className="w-7 h-7 text-[#00FF87] mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-white tracking-tight">8</div>
                <div className="text-white/45 text-sm mt-1">cidades atendidas</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <Check className="w-7 h-7 text-[#00FF87] mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-white tracking-tight">98%</div>
                <div className="text-white/45 text-sm mt-1">satisfação geral</div>
              </div>
            </div>

            {/* CTA */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#00FF87]/10 via-transparent to-[#00FF87]/5 border border-[#00FF87]/20">
              <h3 className="text-xl font-bold text-white mb-2">Pronto para criar seu evento?</h3>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">
                Preencha o formulário e nossa equipe elabora uma proposta personalizada para o seu evento em até 24h.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-4 bg-[#00FF87] hover:bg-[#00e07a] text-[#0A0A0A] font-bold rounded-xl flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <Zap className="w-5 h-5" />
                {createEventsConfig.ctaText}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-[#141414] border border-white/10 rounded-2xl p-8">
            <button
              onClick={closeModal}
              aria-label="Fechar formulário"
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-sans font-bold text-white mb-1">
                Proposta de Evento
              </h2>
              <p className="text-white/50 text-sm">
                Nossa equipe entrará em contato em até 24 horas com uma proposta detalhada.
              </p>
            </div>

            {feedback?.type === 'success' && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-400 font-medium">{feedback.message}</p>
                  <p className="text-green-400/60 text-sm mt-1">
                    Confirmação enviada para o email informado.
                  </p>
                </div>
              </div>
            )}

            {feedback?.type === 'error' && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400">{feedback.message}</p>
              </div>
            )}

            {feedback?.type !== 'success' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Organizer info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/55 mb-2">Nome do Organizador *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        placeholder="Empresa ou organizador"
                        value={form.companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#00FF87] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/55 mb-2">CNPJ</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={form.cnpj}
                      onChange={(e) => updateField('cnpj', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#00FF87] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/55 mb-2">Nome do Responsável *</label>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={form.contactName}
                      onChange={(e) => updateField('contactName', e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#00FF87] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/55 mb-2">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="email"
                        placeholder="email@organizador.com"
                        value={form.contactEmail}
                        onChange={(e) => updateField('contactEmail', e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#00FF87] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Event details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event-type" className="block text-sm text-white/55 mb-2">Tipo de Evento</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <select
                        id="event-type"
                        value={form.eventType}
                        onChange={(e) => updateField('eventType', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FF87] transition-colors appearance-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="corrida">Corrida / Maratona</option>
                        <option value="funcional">Treino Funcional</option>
                        <option value="ciclismo">Ciclismo</option>
                        <option value="natacao">Natação</option>
                        <option value="skate">Skate</option>
                        <option value="bmx">BMX</option>
                        <option value="surfe">Surfe</option>
                        <option value="crossfit">CrossFit</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="event-date" className="block text-sm text-white/55 mb-2">Data Prevista</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        id="event-date"
                        type="date"
                        value={form.eventDate}
                        onChange={(e) => updateField('eventDate', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FF87] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/55 mb-2">Cidade</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        placeholder="Cidade do evento"
                        value={form.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#00FF87] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="event-budget" className="block text-sm text-white/55 mb-2">Orçamento Estimado</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <select
                        id="event-budget"
                        value={form.budget}
                        onChange={(e) => updateField('budget', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FF87] transition-colors appearance-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="ate-50k">Até R$ 50.000</option>
                        <option value="50k-100k">R$ 50.000 – R$ 100.000</option>
                        <option value="100k-250k">R$ 100.000 – R$ 250.000</option>
                        <option value="250k-500k">R$ 250.000 – R$ 500.000</option>
                        <option value="acima-500k">Acima de R$ 500.000</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <label className="block text-sm text-white/55 mb-3">Serviços Necessários</label>
                  <div className="grid grid-cols-2 gap-3">
                    {SERVICES.map((service) => (
                      <label
                        key={service}
                        className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-lg cursor-pointer hover:bg-[#00FF87]/[0.06] hover:border-[#00FF87]/20 border border-white/[0.06] transition-all duration-150"
                      >
                        <input
                          type="checkbox"
                          checked={form.services.includes(service)}
                          onChange={() => toggleService(service)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#00FF87] focus:ring-[#00FF87]"
                        />
                        <span className="text-white/75 text-sm">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm text-white/55 mb-2">Mensagem (opcional)</label>
                  <textarea
                    rows={4}
                    placeholder="Descreva mais detalhes sobre o evento, público esperado, modalidade..."
                    value={form.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#00FF87] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3.5 bg-[#00FF87] hover:bg-[#00e07a] disabled:opacity-50 disabled:cursor-not-allowed text-[#0A0A0A] font-bold rounded-xl flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar Proposta de Evento
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
