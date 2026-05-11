import { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  CreditCard,
  Shield,
  Star,
  Users,
  Zap,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import { subscribeProfessional, getMyProfessionalSubscriptionStatus, uploadSubscriptionPhoto } from '../lib/api';
import { ApiError } from '../lib/api';
import type { ProfessionalPlanType } from '../types/api';

// ---- Constantes ----

const SPECIALTY_LABELS: Record<string, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  funcional: 'Funcional',
  resistencia: 'Resistência',
  flexibilidade: 'Flexibilidade',
  reabilitacao: 'Reabilitação',
  performance: 'Performance',
  nutricao_esportiva: 'Nutrição Esportiva',
  suplementacao: 'Suplementação',
  psicologia_esportiva: 'Psicologia Esportiva',
  preparacao_fisica: 'Preparação Física',
  treinamento_de_forca: 'Treinamento de Força',
  corrida_e_endurance: 'Corrida & Endurance',
  natacao: 'Natação',
  ciclismo: 'Ciclismo',
  artes_marciais: 'Artes Marciais',
  crossfit: 'CrossFit',
  outros: 'Outros',
};

const ALL_SPECIALTIES = Object.keys(SPECIALTY_LABELS);

const REGISTRATION_TYPES = [
  { value: 'CREF', label: 'CREF — Educação Física' },
  { value: 'CRN', label: 'CRN — Nutrição' },
  { value: 'CRM', label: 'CRM — Medicina' },
  { value: 'CFP', label: 'CFP — Psicologia' },
  { value: 'CRO', label: 'CRO — Odontologia' },
  { value: 'CREFITO', label: 'CREFITO — Fisioterapia' },
  { value: 'OUTRO', label: 'Outro' },
];

const PLAN_BENEFITS = [
  { icon: Users, text: 'Visibilidade para +800 atletas e trabalhadores' },
  { icon: Star, text: 'Perfil em destaque na landing page' },
  { icon: Zap, text: 'Leads de clientes interessados na sua especialidade' },
  { icon: Shield, text: 'Selo de profissional verificado pela plataforma' },
  { icon: ShoppingBag, text: 'Desconto exclusivo na loja de produtos Extreme Competition' },
];

interface PlanConfig {
  key: ProfessionalPlanType;
  label: string;
  priceCents: number;
  period: string;
  billing: string;
  discountBadge?: string;
  highlight?: boolean;
}

const SUBSCRIPTION_PLANS: PlanConfig[] = [
  {
    key: 'mensal',
    label: 'Mensal',
    priceCents: 8599,    // R$85,99/mês
    period: '/mês',
    billing: 'Cobrado mensalmente',
  },
  {
    key: 'trimestral',
    label: 'Trimestral',
    priceCents: 8599,    // R$85,99/mês × 3 = R$257,97 total
    period: '/mês',
    billing: 'R$ 257,97 em 3 cobranças mensais',
  },
  {
    key: 'semestral',
    label: 'Semestral',
    priceCents: 8169,    // R$81,69/mês × 6 = R$490,14 total
    period: '/mês',
    billing: 'R$ 490,14 em 6 cobranças mensais',
    discountBadge: '5% off',
    highlight: true,
  },
  {
    key: 'anual',
    label: 'Anual',
    priceCents: 7739,    // R$77,39/mês × 12 = R$928,68 total
    period: '/mês',
    billing: 'R$ 928,68 em 12 cobranças mensais',
    discountBadge: '10% off',
  },
];

// ---- Tipos internos ----

interface FormData {
  full_name: string;
  birth_date: string;
  education: string;
  registration_number: string;
  registration_type: string;
  bio: string;
  specialties: string[];
  photo: File | null;
  plan_type: ProfessionalPlanType;
}

interface Props {
  onClose: () => void;
}

// ---- Componente ----

export function CreateProfessionalModal({ onClose }: Props) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormData>({
    full_name: '',
    birth_date: '',
    education: '',
    registration_number: '',
    registration_type: 'CREF',
    bio: '',
    specialties: [],
    photo: null,
    plan_type: 'mensal',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoPreviewRef = useRef<string | null>(null);

  // Revoga object URL ao desmontar para evitar memory leak
  useEffect(() => {
    photoPreviewRef.current = photoPreview;
  }, [photoPreview]);
  useEffect(() => {
    return () => {
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
    };
  }, []);

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Ao abrir, verifica se já há assinatura pendente
  useEffect(() => {
    getMyProfessionalSubscriptionStatus()
      .then((sub) => {
        if (sub?.status === 'pending_payment' && sub.checkout_url) {
          setPendingCheckoutUrl(sub.checkout_url);
        }
      })
      .catch(() => {})
      .finally(() => setIsCheckingStatus(false));
  }, []);

  // Fechar ao pressionar Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ---- Validação por etapa ----

  function validateStep1(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 3) {
      newErrors.full_name = 'Nome completo obrigatório (mínimo 3 caracteres).';
    }
    if (!form.birth_date) {
      newErrors.birth_date = 'Data de nascimento obrigatória.';
    }
    if (!form.education.trim() || form.education.trim().length < 3) {
      newErrors.education = 'Formação obrigatória (mínimo 3 caracteres).';
    }
    if (!form.registration_number.trim()) {
      newErrors.registration_number = 'Número de registro obrigatório.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep2(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (form.specialties.length === 0) {
      newErrors.specialties = 'Selecione ao menos uma especialidade.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    setError(null);
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    setError(null);
    setErrors({});
    setStep((s) => s - 1);
  }

  function toggleSpecialty(key: string) {
    setForm((prev) => {
      const has = prev.specialties.includes(key);
      return {
        ...prev,
        specialties: has
          ? prev.specialties.filter((s) => s !== key)
          : [...prev.specialties, key],
      };
    });
    setErrors((prev) => ({ ...prev, specialties: undefined }));
  }

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // ---- Submit — cria assinatura e redireciona ----

  async function handleSubmit() {
    if (!validateStep2()) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await subscribeProfessional({
        full_name: form.full_name.trim(),
        birth_date: form.birth_date,
        education: form.education.trim(),
        registration_number: form.registration_number.trim(),
        registration_type: form.registration_type,
        bio: form.bio.trim() || undefined,
        plan_type: form.plan_type,
        specialties: form.specialties.map((s) => ({ specialty: s })),
      });

      // Upload de foto após criação da assinatura (não bloqueia o checkout se falhar)
      if (form.photo) {
        try {
          await uploadSubscriptionPhoto(form.photo);
        } catch {
          // Foto é opcional — segue para o checkout mesmo se o upload falhar
        }
      }

      window.location.href = result.checkout_url;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Erro ao processar sua solicitação. Tente novamente.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setForm((prev) => ({ ...prev, photo: file }));
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  // ---- Render ----

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#4169E1] via-[#00FF87] to-[#FF6B00]" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#00FF87]">
              Assinatura Profissional
            </span>
            <h2 className="text-xl font-sans font-bold text-white mt-1">
              {isCheckingStatus
                ? 'Verificando...'
                : pendingCheckoutUrl
                ? 'Pagamento pendente'
                : step === 1
                ? 'Seus dados'
                : step === 2
                ? 'Seu perfil'
                : 'Plano & Pagamento'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        {!isCheckingStatus && !pendingCheckoutUrl && (
          <div className="px-6 pb-4 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s < step
                      ? 'bg-[#00FF87] text-black'
                      : s === step
                      ? 'bg-[#4169E1] text-white'
                      : 'bg-white/5 text-white/30'
                  }`}
                >
                  {s < step ? <Check className="w-3 h-3" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-px flex-1 w-8 transition-all ${
                      s < step ? 'bg-[#00FF87]' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
            <span className="ml-2 text-xs text-white/30">
              {step === 1 ? 'Dados pessoais' : step === 2 ? 'Especialidades' : 'Pagamento'}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="px-6 pb-6">
          {/* Checking status skeleton */}
          {isCheckingStatus && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#00FF87] animate-spin" />
            </div>
          )}

          {/* Pending checkout — já iniciado anteriormente */}
          {!isCheckingStatus && pendingCheckoutUrl && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#4169E1]/10 border border-[#4169E1]/20">
                <p className="text-sm text-white/70 leading-relaxed">
                  Você já iniciou uma solicitação de assinatura. Seu link de pagamento está aguardando.
                  Clique abaixo para concluir o pagamento.
                </p>
              </div>
              <button
                onClick={() => { window.location.href = pendingCheckoutUrl; }}
                className="w-full py-3.5 rounded-xl bg-[#00FF87] text-black font-bold text-sm hover:bg-[#00FF87]/90 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Continuar pagamento
              </button>
              <button
                onClick={() => setPendingCheckoutUrl(null)}
                className="w-full py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm transition-all"
              >
                Começar nova solicitação
              </button>
            </div>
          )}

          {/* Step 1: Dados pessoais */}
          {!isCheckingStatus && !pendingCheckoutUrl && step === 1 && (
            <div className="space-y-4">
              {/* Foto de perfil */}
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Prévia da foto"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-7 h-7 text-white/20" />
                    )}
                  </div>
                  <label
                    htmlFor="pro-photo-upload"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#4169E1] flex items-center justify-center cursor-pointer hover:bg-[#4169E1]/80 transition-colors"
                    aria-label="Selecionar foto"
                  >
                    <Upload className="w-3.5 h-3.5 text-white" />
                  </label>
                  <input
                    id="pro-photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="sr-only"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Foto de perfil</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    JPEG, PNG ou WebP · Máx. 5 MB
                    <span className="ml-1 text-white/20">(opcional)</span>
                  </p>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => { setPhotoPreview(null); setForm((p) => ({ ...p, photo: null })); }}
                      className="text-xs text-[#FF6B00]/70 hover:text-[#FF6B00] mt-1 transition-colors"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">
                  Nome completo <span className="text-[#FF6B00]">*</span>
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setField('full_name', e.target.value)}
                  placeholder="Ex: Dr. João Silva"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-sm placeholder-white/20 outline-none focus:ring-1 focus:ring-[#4169E1]/50 transition-all ${
                    errors.full_name ? 'border-[#FF6B00]/50' : 'border-white/10 focus:border-[#4169E1]/40'
                  }`}
                />
                {errors.full_name && (
                  <p className="mt-1 text-xs text-[#FF6B00] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.full_name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">
                    Data de nascimento <span className="text-[#FF6B00]">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => setField('birth_date', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-sm outline-none focus:ring-1 focus:ring-[#4169E1]/50 transition-all [color-scheme:dark] ${
                      errors.birth_date ? 'border-[#FF6B00]/50' : 'border-white/10 focus:border-[#4169E1]/40'
                    }`}
                  />
                  {errors.birth_date && (
                    <p className="mt-1 text-xs text-[#FF6B00]">{errors.birth_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">
                    Tipo de registro <span className="text-[#FF6B00]">*</span>
                  </label>
                  <select
                    value={form.registration_type}
                    onChange={(e) => setField('registration_type', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-white/10 text-white text-sm outline-none focus:ring-1 focus:ring-[#4169E1]/50 focus:border-[#4169E1]/40 transition-all"
                  >
                    {REGISTRATION_TYPES.map((rt) => (
                      <option key={rt.value} value={rt.value} className="bg-[#0f0f0f]">
                        {rt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">
                  Número de registro <span className="text-[#FF6B00]">*</span>
                </label>
                <input
                  type="text"
                  value={form.registration_number}
                  onChange={(e) => setField('registration_number', e.target.value)}
                  placeholder="Ex: CREF 012345-G/SP"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-sm placeholder-white/20 outline-none focus:ring-1 focus:ring-[#4169E1]/50 transition-all ${
                    errors.registration_number ? 'border-[#FF6B00]/50' : 'border-white/10 focus:border-[#4169E1]/40'
                  }`}
                />
                {errors.registration_number && (
                  <p className="mt-1 text-xs text-[#FF6B00] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.registration_number}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">
                  Formação / Graduação <span className="text-[#FF6B00]">*</span>
                </label>
                <input
                  type="text"
                  value={form.education}
                  onChange={(e) => setField('education', e.target.value)}
                  placeholder="Ex: Bacharelado em Educação Física — USP"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-sm placeholder-white/20 outline-none focus:ring-1 focus:ring-[#4169E1]/50 transition-all ${
                    errors.education ? 'border-[#FF6B00]/50' : 'border-white/10 focus:border-[#4169E1]/40'
                  }`}
                />
                {errors.education && (
                  <p className="mt-1 text-xs text-[#FF6B00] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.education}
                  </p>
                )}
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3.5 rounded-xl bg-[#4169E1] text-white font-bold text-sm hover:bg-[#4169E1]/90 transition-all flex items-center justify-center gap-2 mt-2"
              >
                Continuar
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Bio + Especialidades */}
          {!isCheckingStatus && !pendingCheckoutUrl && step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">
                  Bio profissional
                  <span className="text-white/30 ml-1 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setField('bio', e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Conte um pouco sobre sua experiência, abordagem e diferenciais..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 outline-none focus:ring-1 focus:ring-[#4169E1]/50 focus:border-[#4169E1]/40 resize-none transition-all"
                />
                <p className="text-right text-xs text-white/20 mt-1">
                  {form.bio.length}/2000
                </p>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">
                  Especialidades <span className="text-[#FF6B00]">*</span>
                  <span className="text-white/30 ml-1 font-normal">(máx. 10)</span>
                </label>
                <div className="flex flex-wrap gap-2 mt-2 max-h-48 overflow-y-auto pr-1">
                  {ALL_SPECIALTIES.map((key) => {
                    const selected = form.specialties.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleSpecialty(key)}
                        disabled={!selected && form.specialties.length >= 10}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selected
                            ? 'bg-[#4169E1]/20 border-[#4169E1]/50 text-[#4169E1]'
                            : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed'
                        }`}
                      >
                        {selected && <span className="mr-1">✓</span>}
                        {SPECIALTY_LABELS[key]}
                      </button>
                    );
                  })}
                </div>
                {errors.specialties && (
                  <p className="mt-2 text-xs text-[#FF6B00] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.specialties}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3.5 rounded-xl border border-white/10 text-white/60 font-semibold text-sm hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>
                <button
                  onClick={handleNext}
                  className="flex-[2] py-3.5 rounded-xl bg-[#4169E1] text-white font-bold text-sm hover:bg-[#4169E1]/90 transition-all flex items-center justify-center gap-2"
                >
                  Ver plano
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Plano & Pagamento */}
          {!isCheckingStatus && !pendingCheckoutUrl && step === 3 && (
            <div className="space-y-4">
              {/* Seleção de plano */}
              <div>
                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Escolha seu plano</p>
                <div className="grid grid-cols-2 gap-2">
                  {SUBSCRIPTION_PLANS.map((plan) => {
                    const selected = form.plan_type === plan.key;
                    const priceInt = Math.floor(plan.priceCents / 100);
                    const priceDec = String(plan.priceCents % 100).padStart(2, '0');
                    return (
                      <button
                        key={plan.key}
                        onClick={() => setField('plan_type', plan.key)}
                        className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                          selected
                            ? 'border-[#00FF87]/60 bg-[#00FF87]/8 ring-1 ring-[#00FF87]/30'
                            : plan.highlight
                            ? 'border-[#4169E1]/30 bg-[#4169E1]/5 hover:border-[#4169E1]/50'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        {plan.discountBadge && (
                          <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#00FF87] text-black flex items-center gap-0.5">
                            <Percent className="w-2.5 h-2.5" />
                            {plan.discountBadge}
                          </span>
                        )}
                        {plan.highlight && !plan.discountBadge && (
                          <span className="absolute -top-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#4169E1] text-white">
                            Popular
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 transition-all ${
                            selected ? 'border-[#00FF87] bg-[#00FF87]' : 'border-white/30'
                          }`}>
                            {selected && <Check className="w-3.5 h-3.5 text-black p-0.5" />}
                          </div>
                          <span className={`text-xs font-bold ${selected ? 'text-[#00FF87]' : 'text-white/70'}`}>
                            {plan.label}
                          </span>
                        </div>
                        <p className="text-white font-black text-lg leading-none">
                          R$ {priceInt}<span className="text-sm font-bold">,{priceDec}</span>
                          <span className="text-xs font-normal text-white/40 ml-0.5">{plan.period}</span>
                        </p>
                        <p className="text-[10px] text-white/30 mt-1 leading-tight">{plan.billing}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Benefícios */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Incluso em todos os planos</p>
                {PLAN_BENEFITS.map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-[#00FF87]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3 h-3 text-[#00FF87]" />
                    </div>
                    <p className="text-xs text-white/60">{text}</p>
                  </div>
                ))}
              </div>

              {/* Resumo */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1.5">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Resumo</p>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Nome</span>
                  <span className="text-white font-medium truncate ml-4 max-w-[180px]">{form.full_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Registro</span>
                  <span className="text-white font-medium">{form.registration_type} {form.registration_number}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Especialidades</span>
                  <span className="text-white font-medium">{form.specialties.length} selecionada(s)</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-white/5">
                  <span className="text-white/50">Plano</span>
                  <span className="text-[#00FF87] font-bold capitalize">{form.plan_type}</span>
                </div>
              </div>

              {/* Payment info */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <CreditCard className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/40 leading-relaxed">
                  Você será redirecionado ao checkout seguro do AbacatePay. Aceitamos cartão de crédito
                  com parcelamento em até 12x. Seu perfil é ativado automaticamente após a confirmação.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#FF6B00]">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-1 py-3.5 rounded-xl border border-white/10 text-white/60 font-semibold text-sm hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-[2] py-3.5 rounded-xl bg-[#00FF87] text-black font-bold text-sm hover:bg-[#00FF87]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Assinar — {SUBSCRIPTION_PLANS.find((p) => p.key === form.plan_type)?.label}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
