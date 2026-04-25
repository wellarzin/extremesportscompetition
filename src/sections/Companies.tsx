import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { companiesConfig } from '../config';
import { Check, Building2, Mail, Phone, MapPin, X, Send, Briefcase, Calendar, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { sendPartnerContact } from '../lib/api';

gsap.registerPlugin(ScrollTrigger);

// Estado inicial do formulário
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

export function Companies() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // Atualiza campo de texto do formulário
  const updateField = (field: keyof typeof initialFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Toggle de serviços (checkbox)
  const toggleService = (service: string) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  // Reset do formulário
  const resetForm = () => {
    setForm(initialFormState);
    setFeedback(null);
  };

  // Fecha o modal
  const closeModal = () => {
    setShowForm(false);
    // Reset feedback ao fechar, mas mantém dados do formulário caso o user queira voltar
    if (feedback?.type === 'success') {
      resetForm();
    }
    setFeedback(null);
  };

  // Envia o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica no frontend
    if (!form.companyName.trim() || !form.contactName.trim() || !form.contactEmail.trim()) {
      setFeedback({
        type: 'error',
        message: 'Preencha os campos obrigatórios: Nome da Empresa, Nome do Responsável e Email.',
      });
      return;
    }

    // Validação simples de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      setFeedback({
        type: 'error',
        message: 'Informe um email válido.',
      });
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
      // Reset form após sucesso
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
      id="empresas"
      className="relative py-24 md:py-32 bg-[#0A0A0A]"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0F1A0F] to-[#0A0A0A]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-[#4169E1]/10 border border-[#4169E1]/20 text-[#4169E1] text-sm font-medium mb-6">
            {companiesConfig.subtitle}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white tracking-tight mb-6">
            {companiesConfig.titleRegular}{' '}
            <span className="font-serif italic text-[#FF6B00]">{companiesConfig.titleItalic}</span>
          </h2>
          <p className="text-lg text-white/60 max-w-3xl mx-auto">
            {companiesConfig.description}
          </p>
        </div>

        {/* Content */}
        <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Benefits */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {companiesConfig.benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#4169E1]/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-[#4169E1]" />
                  </div>
                  <span className="text-white/80">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-gradient-to-br from-[#4169E1]/20 to-[#4169E1]/5 rounded-2xl border border-[#4169E1]/20">
                <Mail className="w-8 h-8 text-[#4169E1] mb-4" />
                <h4 className="text-white font-semibold mb-2">Email Comercial</h4>
                <p className="text-white/60 text-sm">extremesportscompetition@gmail.com</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-[#FF6B00]/20 to-[#FF6B00]/5 rounded-2xl border border-[#FF6B00]/20">
                <Phone className="w-8 h-8 text-[#FF6B00] mb-4" />
                <h4 className="text-white font-semibold mb-2">Telefone</h4>
                <p className="text-white/60 text-sm">(51) 98148-4895</p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {companiesConfig.ctaText}
            </button>
          </div>

          {/* Right - Illustration */}
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-[#4169E1]/20 via-[#141414] to-[#FF6B00]/20 border border-white/5 p-8">
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4169E1] to-[#FF6B00] flex items-center justify-center mb-6">
                  <Building2 className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Seja Nosso Parceiro
                </h3>
                <p className="text-white/60 mb-6">
                  Junte-se às maiores empresas que já confiam na Extreme Sports Competition para seus eventos.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {['Red Bull', 'Nike', 'Adidas', 'Oakley'].map((brand) => (
                    <span
                      key={brand}
                      className="px-4 py-2 bg-white/5 rounded-full text-white/40 text-sm"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#4169E1]/20 rounded-full blur-xl" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-[#FF6B00]/20 rounded-full blur-xl" />
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
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
              <h2 className="text-2xl font-sans font-bold text-white mb-2">
                Solicitar Orçamento
              </h2>
              <p className="text-white/60">
                Preencha o formulário abaixo e nossa equipe entrará em contato em até 24 horas.
              </p>
            </div>

            {/* Feedback de sucesso */}
            {feedback?.type === 'success' && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-400 font-medium">{feedback.message}</p>
                  <p className="text-green-400/60 text-sm mt-1">
                    Um email de confirmação foi enviado para o endereço informado.
                  </p>
                </div>
              </div>
            )}

            {/* Feedback de erro */}
            {feedback?.type === 'error' && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400">{feedback.message}</p>
              </div>
            )}

            {feedback?.type !== 'success' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Nome da Empresa *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input
                        type="text"
                        placeholder="Sua empresa"
                        value={form.companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">CNPJ</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={form.cnpj}
                      onChange={(e) => updateField('cnpj', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1] transition-colors"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Nome do Responsável *</label>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={form.contactName}
                      onChange={(e) => updateField('contactName', e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input
                        type="email"
                        placeholder="email@empresa.com"
                        value={form.contactEmail}
                        onChange={(e) => updateField('contactEmail', e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="partner-event-type" className="block text-sm text-white/60 mb-2">Tipo de Evento</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <select
                        id="partner-event-type"
                        value={form.eventType}
                        onChange={(e) => updateField('eventType', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#4169E1] transition-colors appearance-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="skate">Skate</option>
                        <option value="bmx">BMX</option>
                        <option value="surfe">Surfe</option>
                        <option value="parkour">Parkour</option>
                        <option value="motocross">Motocross</option>
                        <option value="escalada">Escalada</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="partner-event-date" className="block text-sm text-white/60 mb-2">Data Prevista</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input
                        id="partner-event-date"
                        type="date"
                        value={form.eventDate}
                        onChange={(e) => updateField('eventDate', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#4169E1] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Cidade</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input
                        type="text"
                        placeholder="Cidade do evento"
                        value={form.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="partner-budget" className="block text-sm text-white/60 mb-2">Orçamento Estimado</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <select
                        id="partner-budget"
                        value={form.budget}
                        onChange={(e) => updateField('budget', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#4169E1] transition-colors appearance-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="ate-50k">Até R$ 50.000</option>
                        <option value="50k-100k">R$ 50.000 - R$ 100.000</option>
                        <option value="100k-250k">R$ 100.000 - R$ 250.000</option>
                        <option value="250k-500k">R$ 250.000 - R$ 500.000</option>
                        <option value="acima-500k">Acima de R$ 500.000</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <label className="block text-sm text-white/60 mb-3">Serviços Desejados</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'Planejamento Completo',
                      'Sistema de Apuração',
                      'Transmissão Ao Vivo',
                      'Marketing',
                      'Equipe Técnica',
                      'Infraestrutura'
                    ].map((service) => (
                      <label key={service} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={form.services.includes(service)}
                          onChange={() => toggleService(service)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#4169E1] focus:ring-[#4169E1]"
                        />
                        <span className="text-white/80 text-sm">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">Mensagem (opcional)</label>
                  <textarea
                    rows={4}
                    placeholder="Descreva mais detalhes sobre o evento..."
                    value={form.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1] transition-colors resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar Solicitação
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
