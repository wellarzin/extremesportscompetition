import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { companiesConfig } from '../config';
import {
  Check,
  Building2,
  Mail,
  X,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Crown,
  Gem,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { sendSponsorContact } from '../lib/api';

gsap.registerPlugin(ScrollTrigger);

// ---- planos ----

const PLAN_ICONS: Record<string, React.ElementType> = {
  Bronze: Check,
  Prata: Check,
  Ouro: Crown,
  Master: Crown,
};

// ---- state inicial ----

const initialForm = {
  companyName: '',
  cnpj: '',
  contactName: '',
  contactEmail: '',
  message: '',
};

// ---- componente principal ----

export function Companies() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef   = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [showModal,        setShowModal]        = useState(false);
  const [step,             setStep]             = useState<1 | 2>(1);
  const [selectedPackage,  setSelectedPackage]  = useState('');
  const [form,             setForm]             = useState(initialForm);
  const [stepError,        setStepError]        = useState<string | null>(null);
  const [sending,          setSending]          = useState(false);
  const [feedback,         setFeedback]         = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ---- animações ----
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: titleRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } },
      );
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: contentRef.current, start: 'top 75%', toggleActions: 'play none none reverse' } },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // ---- helpers ----
  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setStepError(null);
  };

  const openModal = () => {
    setShowModal(true);
    setStep(1);
    setSelectedPackage('');
    setForm(initialForm);
    setStepError(null);
    setFeedback(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setFeedback(null);
  };

  // Valida etapa 1 e avança
  const handleNext = () => {
    if (!form.companyName.trim() || !form.contactName.trim() || !form.contactEmail.trim()) {
      setStepError('Preencha Nome da Empresa, Nome do Responsável e Email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      setStepError('Informe um email válido.');
      return;
    }
    setStepError(null);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setStepError(null);
  };

  // Envia proposta (etapa 2)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) {
      setStepError('Selecione um plano para continuar.');
      return;
    }
    setSending(true);
    setStepError(null);
    try {
      const result = await sendSponsorContact({
        company_name:         form.companyName.trim(),
        cnpj:                 form.cnpj.trim(),
        contact_name:         form.contactName.trim(),
        contact_email:        form.contactEmail.trim(),
        sponsorship_package:  selectedPackage,
        message:              form.message.trim(),
      });
      setFeedback({ type: 'success', message: result.message });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao enviar proposta. Tente novamente.',
      });
    } finally {
      setSending(false);
    }
  };

  // ---- render ----
  return (
    <section ref={sectionRef} id="empresas" className="relative py-24 md:py-32 bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0F1219] to-[#0A0A0A]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">

        {/* Header */}
        <div ref={titleRef} className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-[#4169E1]/10 border border-[#4169E1]/20 text-[#4169E1] text-sm font-medium tracking-widest mb-6">
            {companiesConfig.subtitle}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-extrabold text-white tracking-tight mb-6">
            {companiesConfig.titleRegular}{' '}
            <span className="font-serif italic text-[#4169E1]">{companiesConfig.titleItalic}</span>
          </h2>
          <p className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed">
            {companiesConfig.description}
          </p>
        </div>

        {/* Benefits + metrics */}
        <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-20">
          {/* Left — benefícios */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Por que patrocinar?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {companiesConfig.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white/[0.04] rounded-xl border border-white/[0.06] hover:bg-white/[0.07] transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-[#4169E1]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#4169E1]" />
                  </div>
                  <span className="text-white/75 text-sm leading-snug">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="p-6 bg-gradient-to-br from-[#4169E1]/15 to-[#4169E1]/5 rounded-2xl border border-[#4169E1]/20">
              <Mail className="w-7 h-7 text-[#4169E1] mb-3" />
              <h4 className="text-white font-semibold mb-1">Email Comercial</h4>
              <p className="text-white/55 text-sm">extremesportscompetition@gmail.com</p>
            </div>
          </div>

          {/* Right — métricas */}
          <div className="space-y-4">
            {[
              { value: '15k+', label: 'Atletas alcançados por evento',    detail: 'Trabalhadores ativos na plataforma' },
              { value: '8',    label: 'Cidades com presença ativa',       detail: 'Cobertura em expansão' },
              { value: '98%',  label: 'Satisfação dos participantes',     detail: 'Avaliações pós-evento' },
              { value: '50+',  label: 'Eventos realizados com sucesso',   detail: 'Histórico comprovado de execução' },
            ].map(metric => (
              <div key={metric.value} className="flex items-center gap-6 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#4169E1]/20 hover:bg-[#4169E1]/[0.04] transition-all duration-200 group">
                <div className="flex-shrink-0 w-20 text-right">
                  <span className="text-3xl font-extrabold text-white tracking-tight group-hover:text-[#4169E1] transition-colors duration-200">
                    {metric.value}
                  </span>
                </div>
                <div className="h-10 w-px bg-white/[0.08] flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">{metric.label}</p>
                  <p className="text-white/35 text-xs mt-0.5">{metric.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pirâmide de patrocinadores */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] text-xs font-bold tracking-widest mb-4">
              PATROCINADORES OFICIAIS
            </span>
            <p className="text-white/35 text-sm">Empresas que acreditam no poder do esporte</p>
          </div>

          {/* Master */}
          <div className="relative group mb-6">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#FF6B00]/0 via-[#FF6B00]/30 to-[#FF6B00]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
            <div className="relative p-10 md:p-14 rounded-2xl bg-gradient-to-br from-[#1a0a00] via-[#110800] to-[#0A0A0A] border border-[#FF6B00]/25 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `repeating-linear-gradient(45deg, #FF6B00 0px, #FF6B00 1px, transparent 1px, transparent 20px)` }} />
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div className="flex items-center gap-2.5">
                    <Crown className="w-5 h-5 text-[#FF6B00]" />
                    <span className="text-[#FF6B00] text-xs font-bold tracking-[0.2em] uppercase">Patrocinador Master</span>
                  </div>
                  <div>
                    <h3 className="text-5xl md:text-7xl font-sans font-extrabold tracking-tight leading-none"
                      style={{ background: 'linear-gradient(135deg, #ffffff 40%, #FF6B00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {companiesConfig.sponsors.master.logoText}
                    </h3>
                    <p className="text-white/40 text-sm mt-2">{companiesConfig.sponsors.master.tagline}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 relative">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-[#FF6B00]/30 flex items-center justify-center relative">
                    <div className="absolute inset-2 rounded-full border border-[#FF6B00]/15" />
                    <div className="absolute inset-4 rounded-full bg-[#FF6B00]/10" />
                    <Crown className="w-10 h-10 md:w-14 md:h-14 text-[#FF6B00] relative z-10" />
                  </div>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#FF6B00]/60" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#FF6B00]/40" />
                  <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 rounded-full bg-[#FF6B00]/50" />
                  <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 rounded-full bg-[#FF6B00]/30" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF6B00]/40 to-transparent" />
            </div>
          </div>

          {/* Ouro */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#F59E0B]/30" />
            <div className="flex items-center gap-2">
              <Gem className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-[#F59E0B] text-xs font-bold tracking-[0.2em] uppercase">Patrocinadores Ouro</span>
              <Gem className="w-3.5 h-3.5 text-[#F59E0B]" />
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#F59E0B]/30" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {companiesConfig.sponsors.gold.map(sponsor => (
              <div key={sponsor.name} className="group relative p-6 rounded-xl bg-white/[0.03] border border-[#F59E0B]/15 hover:border-[#F59E0B]/35 hover:bg-[#F59E0B]/[0.05] transition-all duration-300 overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/50 to-transparent" />
                <p className="text-xl md:text-2xl font-sans font-extrabold tracking-tight mb-1"
                  style={{ background: 'linear-gradient(135deg, #ffffff 30%, #F59E0B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {sponsor.logoText}
                </p>
                <p className="text-white/30 text-xs leading-snug group-hover:text-white/50 transition-colors">{sponsor.tagline}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA — único botão, sem cards de planos */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <button
              onClick={openModal}
              className="group inline-flex items-center gap-3 px-10 py-5 bg-[#4169E1] hover:bg-[#3557c0] text-white font-bold text-lg rounded-2xl transition-all duration-200 shadow-lg shadow-[#4169E1]/20 hover:shadow-[#4169E1]/40 hover:-translate-y-0.5"
            >
              <Building2 className="w-5 h-5" />
              {companiesConfig.ctaText}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-white/30 text-sm">
              Nossa equipe comercial responde em até 24h úteis.
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal multi-etapa ── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-[#141414] border border-white/10 rounded-2xl shadow-2xl">

            {/* Barra de progresso */}
            <div className="h-0.5 w-full bg-white/5">
              <div
                className="h-full bg-[#4169E1] transition-all duration-500"
                style={{ width: feedback?.type === 'success' ? '100%' : step === 1 ? '50%' : '85%' }}
              />
            </div>

            <div className="p-8">
              {/* Fechar */}
              <button
                onClick={closeModal}
                aria-label="Fechar"
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>

              {/* ── Sucesso ── */}
              {feedback?.type === 'success' ? (
                <div className="py-8 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#00FF87]/10 border border-[#00FF87]/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-[#00FF87]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Proposta enviada!</h2>
                    <p className="text-white/50 text-sm max-w-sm">{feedback.message}</p>
                    <p className="text-white/30 text-xs mt-2">
                      Plano <span className="text-white/60 font-semibold">{selectedPackage}</span> · Nossa equipe entrará em contato em até 24h.
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="mt-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-all"
                  >
                    Fechar
                  </button>
                </div>

              ) : (
                <form onSubmit={handleSubmit}>

                  {/* ── Etapa 1 — Dados da empresa ── */}
                  {step === 1 && (
                    <div>
                      <div className="mb-7">
                        <p className="text-[#4169E1] text-xs font-bold tracking-widest uppercase mb-1">Etapa 1 de 2</p>
                        <h2 className="text-2xl font-bold text-white">Dados da empresa</h2>
                        <p className="text-white/40 text-sm mt-1">Preencha as informações de contato para avançar.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-white/50 mb-1.5 font-medium">Nome da Empresa *</label>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                              <input
                                type="text"
                                placeholder="Sua empresa"
                                value={form.companyName}
                                onChange={e => updateField('companyName', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#4169E1]/60 transition-colors"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-white/50 mb-1.5 font-medium">CNPJ</label>
                            <input
                              type="text"
                              placeholder="00.000.000/0000-00"
                              value={form.cnpj}
                              onChange={e => updateField('cnpj', e.target.value)}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#4169E1]/60 transition-colors"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-white/50 mb-1.5 font-medium">Nome do Responsável *</label>
                            <input
                              type="text"
                              placeholder="Nome completo"
                              value={form.contactName}
                              onChange={e => updateField('contactName', e.target.value)}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#4169E1]/60 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/50 mb-1.5 font-medium">Email *</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                              <input
                                type="email"
                                placeholder="email@empresa.com"
                                value={form.contactEmail}
                                onChange={e => updateField('contactEmail', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#4169E1]/60 transition-colors"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-white/50 mb-1.5 font-medium">Mensagem (opcional)</label>
                          <textarea
                            rows={3}
                            placeholder="Conte sobre sua empresa e o que espera do patrocínio..."
                            value={form.message}
                            onChange={e => updateField('message', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#4169E1]/60 transition-colors resize-none"
                          />
                        </div>

                        {stepError && (
                          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <p className="text-red-400 text-sm">{stepError}</p>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleNext}
                          className="w-full py-3.5 bg-[#4169E1] hover:bg-[#3557c0] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          Próximo: Escolher Plano
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Etapa 2 — Escolha o plano ── */}
                  {step === 2 && (
                    <div>
                      <div className="mb-7">
                        <p className="text-[#4169E1] text-xs font-bold tracking-widest uppercase mb-1">Etapa 2 de 2</p>
                        <h2 className="text-2xl font-bold text-white">Escolha o plano</h2>
                        <p className="text-white/40 text-sm mt-1">Selecione o pacote que melhor atende à sua empresa.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        {companiesConfig.packages.map(pkg => {
                          const isSelected = selectedPackage === pkg.name;
                          const Icon = PLAN_ICONS[pkg.name] ?? Check;
                          return (
                            <button
                              key={pkg.name}
                              type="button"
                              onClick={() => { setSelectedPackage(pkg.name); setStepError(null); }}
                              className="relative text-left p-5 rounded-xl border transition-all duration-200 group"
                              style={{
                                borderColor: isSelected ? pkg.color + '80' : 'rgba(255,255,255,0.08)',
                                background:  isSelected ? pkg.color + '14' : 'rgba(255,255,255,0.03)',
                              }}
                            >
                              {/* Barra top */}
                              <div
                                className="absolute top-0 left-4 right-4 h-px rounded-full transition-opacity duration-200"
                                style={{ background: `linear-gradient(90deg, transparent, ${pkg.color}, transparent)`, opacity: isSelected ? 1 : 0 }}
                              />

                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: pkg.color + '20' }}>
                                    <Icon className="w-3.5 h-3.5" style={{ color: pkg.color }} />
                                  </div>
                                  <span className="font-bold text-white text-sm">{pkg.name}</span>
                                </div>
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: pkg.color }}>
                                    <Check className="w-3 h-3 text-black" />
                                  </div>
                                )}
                              </div>

                              <ul className="space-y-1.5">
                                {pkg.perks.map((perk, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-xs text-white/50 group-hover:text-white/65 transition-colors">
                                    <Check className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: pkg.color + 'aa' }} />
                                    {perk}
                                  </li>
                                ))}
                              </ul>
                            </button>
                          );
                        })}
                      </div>

                      {stepError && (
                        <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <p className="text-red-400 text-sm">{stepError}</p>
                        </div>
                      )}

                      {feedback?.type === 'error' && (
                        <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <p className="text-red-400 text-sm">{feedback.message}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleBack}
                          disabled={sending}
                          className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm font-medium transition-all disabled:opacity-40"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Voltar
                        </button>
                        <button
                          type="submit"
                          disabled={sending || !selectedPackage}
                          className="flex-1 py-3.5 bg-[#4169E1] hover:bg-[#3557c0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          {sending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                          ) : (
                            <><Send className="w-4 h-4" /> Enviar Proposta</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
