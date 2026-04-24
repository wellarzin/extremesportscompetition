import { useState, useEffect } from 'react';
import { X, Lock, ArrowLeft, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { register as apiRegister } from '../lib/api';
import type { RegisterInput } from '../lib/api';

// ---- props ----

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  loginError: string | null;
  clearError: () => void;
}

// ---- constants ----

const SHIRT_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];

const EDUCATION_OPTIONS = [
  { value: 'fundamental_incompleto', label: 'Fundamental incompleto' },
  { value: 'fundamental_completo', label: 'Fundamental completo' },
  { value: 'medio_incompleto', label: 'Médio incompleto' },
  { value: 'medio_completo', label: 'Médio completo' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'superior_incompleto', label: 'Superior incompleto' },
  { value: 'superior_completo', label: 'Superior completo' },
  { value: 'pos_graduacao', label: 'Pós-graduação' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
];

const PROFESSION_OPTIONS = [
  { value: 'trabalhador_autonomo', label: 'Autônomo' },
  { value: 'educador_fisico', label: 'Educador físico' },
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'pedagogo', label: 'Pedagogo' },
  { value: 'professor', label: 'Professor' },
  { value: 'profissional_ti', label: 'Profissional de TI' },
  { value: 'medico', label: 'Médico' },
  { value: 'enfermeiro', label: 'Enfermeiro' },
  { value: 'fisioterapeuta', label: 'Fisioterapeuta' },
  { value: 'psicologo', label: 'Psicólogo' },
  { value: 'advogado', label: 'Advogado' },
  { value: 'engenheiro', label: 'Engenheiro' },
  { value: 'administrador', label: 'Administrador' },
  { value: 'estudante', label: 'Estudante' },
  { value: 'outros', label: 'Outros' },
];

const STEP_LABELS = ['Conta', 'Você', 'Endereço', 'Perfil'];

// ---- helpers ----

function maskCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskCEP(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

// ---- form state type ----

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  birthDate: string;
  documentType: 'cpf' | 'rg';
  documentNumber: string;
  zipCode: string;
  street: string;
  houseNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  stateUF: string;
  shirtSize: string;
  educationLevel: string;
  profession: string;
  weightKg: string;
  heightCm: string;
  shoeSize: string;
}

const EMPTY_FORM: FormData = {
  email: '', password: '', confirmPassword: '',
  fullName: '', birthDate: '', documentType: 'cpf', documentNumber: '',
  zipCode: '', street: '', houseNumber: '', complement: '', neighborhood: '', city: '', stateUF: '',
  shirtSize: '', educationLevel: '', profession: '',
  weightKg: '', heightCm: '', shoeSize: '',
};

// ---- style constants ----

const INPUT =
  'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1] transition-colors text-sm';
const SELECT =
  'w-full px-4 py-3 bg-[#1c1c1c] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#4169E1] transition-colors text-sm appearance-none cursor-pointer';
const LABEL =
  'block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5';

// ============================================================
// Component
// ============================================================

export function AuthModal({ open, onClose, onLogin, isLoading, loginError, clearError }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Register state
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setMode('login');
        setStep(1);
        setSuccess(false);
        setLoginEmail('');
        setLoginPassword('');
        setForm(EMPTY_FORM);
        setStepError(null);
        clearError();
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open, clearError]);

  // Clear step error on navigation
  useEffect(() => { setStepError(null); }, [step, mode]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  // CEP auto-fill via ViaCEP
  async function handleCEP(raw: string) {
    const masked = maskCEP(raw);
    set('zipCode', masked);
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json() as Record<string, string>;
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          stateUF: data.uf || prev.stateUF,
        }));
      }
    } catch {
      // silent — user pode preencher manualmente
    } finally {
      setCepLoading(false);
    }
  }

  // Step validation
  function validateStep(): string | null {
    if (step === 1) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'E-mail inválido.';
      if (form.password.length < 8) return 'Senha deve ter ao menos 8 caracteres.';
      if (!/[A-Z]/.test(form.password)) return 'Senha precisa de ao menos uma letra maiúscula.';
      if (!/[0-9]/.test(form.password)) return 'Senha precisa de ao menos um número.';
      if (form.password !== form.confirmPassword) return 'As senhas não coincidem.';
    }
    if (step === 2) {
      if (form.fullName.trim().length < 3) return 'Nome completo obrigatório (mín. 3 caracteres).';
      if (!form.birthDate) return 'Data de nascimento obrigatória.';
      const digits = form.documentNumber.replace(/\D/g, '');
      if (form.documentType === 'cpf' && digits.length !== 11) return 'CPF deve ter 11 dígitos.';
      if (form.documentType === 'rg' && digits.length < 5) return 'RG inválido.';
    }
    if (step === 3) {
      if (form.zipCode.replace(/\D/g, '').length !== 8) return 'CEP inválido.';
      if (form.street.trim().length < 3) return 'Logradouro obrigatório.';
      if (!form.houseNumber.trim()) return 'Número obrigatório.';
      if (form.city.trim().length < 2) return 'Cidade obrigatória.';
      if (form.stateUF.length !== 2) return 'UF inválido (use 2 letras).';
    }
    if (step === 4) {
      if (!form.shirtSize) return 'Selecione o tamanho de camiseta.';
      if (!form.educationLevel) return 'Selecione a escolaridade.';
      if (!form.profession) return 'Selecione a profissão.';
    }
    return null;
  }

  async function handleNext() {
    const err = validateStep();
    if (err) { setStepError(err); return; }
    if (step < 4) { setStep(s => s + 1); return; }

    // Submit registration
    setRegisterLoading(true);
    try {
      const payload: RegisterInput = {
        full_name: form.fullName.trim(),
        birth_date: form.birthDate,
        document_type: form.documentType,
        document_number: form.documentNumber,
        zip_code: form.zipCode,
        street: form.street.trim(),
        neighborhood: form.neighborhood.trim() || undefined,
        city: form.city.trim(),
        state: form.stateUF.toUpperCase(),
        number: form.houseNumber.trim(),
        complement: form.complement.trim() || undefined,
        shirt_size: form.shirtSize,
        education_level: form.educationLevel,
        profession: form.profession,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        weight_kg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        height_cm: form.heightCm ? parseInt(form.heightCm) : undefined,
        shoe_size: form.shoeSize ? parseFloat(form.shoeSize) : undefined,
        consent_version: '1.0',
      };
      await apiRegister(payload);
      setSuccess(true);
    } catch (err) {
      setStepError(err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.');
    } finally {
      setRegisterLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await onLogin(loginEmail.trim(), loginPassword);
  }

  if (!open) return null;

  const pwdRules = [
    { label: 'Mínimo 8 caracteres', ok: form.password.length >= 8 },
    { label: 'Uma letra maiúscula', ok: /[A-Z]/.test(form.password) },
    { label: 'Um número', ok: /[0-9]/.test(form.password) },
  ];

  // ---- render ----

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5 flex-shrink-0 border-b border-white/5">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setStep(1); setSuccess(false); clearError(); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? 'bg-[#4169E1] text-white shadow-lg'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-7 py-6">

          {/* ===== LOGIN ===== */}
          {mode === 'login' && (
            <>
              <div className="text-center mb-7">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#4169E1]/15 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-[#4169E1]" />
                </div>
                <h2 className="text-xl font-sans font-bold text-white mb-1">Área do Atleta</h2>
                <p className="text-white/40 text-sm">Acesse sua conta para se inscrever em eventos</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="auth-email" className={LABEL}>E-mail</label>
                  <input
                    id="auth-email"
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                    className={INPUT}
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className={LABEL}>Senha</label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showLoginPwd ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className={INPUT + ' pr-11'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div role="alert" className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !loginEmail || !loginPassword}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#4169E1] hover:bg-[#5A7FE8] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Entrando...</> : 'Entrar'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <a href="#" className="text-sm text-[#4169E1]/80 hover:text-[#4169E1] transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
            </>
          )}

          {/* ===== REGISTER SUCCESS ===== */}
          {mode === 'register' && success && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#00FF87]/10 flex items-center justify-center">
                <Check className="w-9 h-9 text-[#00FF87]" />
              </div>
              <h2 className="text-xl font-sans font-bold text-white mb-2">Conta criada!</h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto mb-2">
                Enviamos um e-mail de verificação para
              </p>
              <p className="text-white font-medium text-sm mb-7">{form.email}</p>
              <p className="text-white/35 text-xs mb-7">
                Confirme seu e-mail para ativar a conta e ter acesso completo à plataforma.
              </p>
              <button
                onClick={() => { setMode('login'); setStep(1); setSuccess(false); }}
                className="px-7 py-3 bg-[#4169E1] hover:bg-[#5A7FE8] text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Ir para o login
              </button>
            </div>
          )}

          {/* ===== REGISTER WIZARD ===== */}
          {mode === 'register' && !success && (
            <>
              {/* Step indicator */}
              <div className="flex items-start mb-7">
                {STEP_LABELS.map((label, i) => {
                  const n = i + 1;
                  const done = step > n;
                  const active = step === n;
                  return (
                    <div key={n} className="flex items-start flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          done ? 'bg-[#00FF87] text-black' :
                          active ? 'bg-[#4169E1] text-white' :
                          'bg-white/8 text-white/25'
                        }`}>
                          {done ? <Check className="w-3.5 h-3.5" /> : n}
                        </div>
                        <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-white' : 'text-white/25'}`}>
                          {label}
                        </span>
                      </div>
                      {i < STEP_LABELS.length - 1 && (
                        <div className={`flex-1 h-px mt-3.5 mx-2 transition-all duration-300 ${step > n ? 'bg-[#00FF87]/35' : 'bg-white/8'}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ---- Step 1: Conta ---- */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className={LABEL}>E-mail</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="seu@email.com"
                      autoComplete="email"
                      className={INPUT}
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Senha</label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => set('password', e.target.value)}
                        placeholder="Crie uma senha forte"
                        autoComplete="new-password"
                        className={INPUT + ' pr-11'}
                      />
                      <button type="button" onClick={() => setShowPwd(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {form.password && (
                      <div className="mt-2.5 space-y-1.5">
                        {pwdRules.map(rule => (
                          <div key={rule.label} className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${rule.ok ? 'bg-[#00FF87]/20' : 'bg-white/5'}`}>
                              {rule.ok && <Check className="w-2.5 h-2.5 text-[#00FF87]" />}
                            </div>
                            <span className={`text-xs transition-colors ${rule.ok ? 'text-[#00FF87]' : 'text-white/35'}`}>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={LABEL}>Confirmar senha</label>
                    <div className="relative">
                      <input
                        type={showConfirmPwd ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={e => set('confirmPassword', e.target.value)}
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                        className={INPUT + ' pr-11'}
                      />
                      <button type="button" onClick={() => setShowConfirmPwd(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                        {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- Step 2: Você ---- */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className={LABEL}>Nome completo</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={e => set('fullName', e.target.value)}
                      placeholder="Seu nome completo"
                      autoComplete="name"
                      className={INPUT}
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Data de nascimento</label>
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={e => set('birthDate', e.target.value)}
                      className={INPUT + ' [color-scheme:dark]'}
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Tipo de documento</label>
                    <div className="flex gap-2 mb-3">
                      {(['cpf', 'rg'] as const).map(dt => (
                        <button
                          key={dt}
                          type="button"
                          onClick={() => { set('documentType', dt); set('documentNumber', ''); }}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-bold tracking-wider transition-all border ${
                            form.documentType === dt
                              ? 'bg-[#4169E1]/15 border-[#4169E1] text-[#4169E1]'
                              : 'bg-white/5 border-white/10 text-white/35 hover:text-white/60 hover:border-white/20'
                          }`}
                        >
                          {dt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={form.documentNumber}
                      onChange={e => set(
                        'documentNumber',
                        form.documentType === 'cpf'
                          ? maskCPF(e.target.value)
                          : e.target.value.slice(0, 20),
                      )}
                      placeholder={form.documentType === 'cpf' ? '000.000.000-00' : 'Número do RG'}
                      inputMode="numeric"
                      className={INPUT}
                    />
                  </div>
                </div>
              )}

              {/* ---- Step 3: Endereço ---- */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className={LABEL}>CEP</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.zipCode}
                        onChange={e => handleCEP(e.target.value)}
                        placeholder="00000-000"
                        inputMode="numeric"
                        maxLength={9}
                        className={INPUT + ' pr-10'}
                      />
                      {cepLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Logradouro</label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={e => set('street', e.target.value)}
                      placeholder="Rua, Avenida, Travessa..."
                      className={INPUT}
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-2">
                      <label className={LABEL}>Número</label>
                      <input
                        type="text"
                        value={form.houseNumber}
                        onChange={e => set('houseNumber', e.target.value)}
                        placeholder="123"
                        className={INPUT}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className={LABEL}>Complemento <span className="normal-case text-white/20 tracking-normal font-normal">(opcional)</span></label>
                      <input
                        type="text"
                        value={form.complement}
                        onChange={e => set('complement', e.target.value)}
                        placeholder="Apto, Sala, Bloco..."
                        className={INPUT}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Bairro <span className="normal-case text-white/20 tracking-normal font-normal">(opcional)</span></label>
                    <input
                      type="text"
                      value={form.neighborhood}
                      onChange={e => set('neighborhood', e.target.value)}
                      placeholder="Seu bairro"
                      className={INPUT}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-3">
                      <label className={LABEL}>Cidade</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={e => set('city', e.target.value)}
                        placeholder="Sua cidade"
                        className={INPUT}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>UF</label>
                      <input
                        type="text"
                        value={form.stateUF}
                        onChange={e => set('stateUF', e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="SP"
                        maxLength={2}
                        className={INPUT + ' text-center'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---- Step 4: Perfil ---- */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <label className={LABEL}>Tamanho de camiseta</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SHIRT_SIZES.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => set('shirtSize', size)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wider transition-all border ${
                            form.shirtSize === size
                              ? 'bg-[#4169E1]/15 border-[#4169E1] text-[#4169E1]'
                              : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Escolaridade</label>
                    <select
                      value={form.educationLevel}
                      onChange={e => set('educationLevel', e.target.value)}
                      className={SELECT}
                    >
                      <option value="" disabled>Selecione...</option>
                      {EDUCATION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={LABEL}>Profissão</label>
                    <select
                      value={form.profession}
                      onChange={e => set('profession', e.target.value)}
                      className={SELECT}
                    >
                      <option value="" disabled>Selecione...</option>
                      {PROFESSION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-3">
                      Dados esportivos <span className="normal-case font-normal tracking-normal">(opcional)</span>
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={LABEL}>Peso (kg)</label>
                        <input
                          type="number"
                          value={form.weightKg}
                          onChange={e => set('weightKg', e.target.value)}
                          placeholder="70"
                          min={30} max={300}
                          className={INPUT}
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Altura (cm)</label>
                        <input
                          type="number"
                          value={form.heightCm}
                          onChange={e => set('heightCm', e.target.value)}
                          placeholder="175"
                          min={100} max={250}
                          className={INPUT}
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Calçado</label>
                        <input
                          type="number"
                          value={form.shoeSize}
                          onChange={e => set('shoeSize', e.target.value)}
                          placeholder="42"
                          min={28} max={50}
                          className={INPUT}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step error */}
              {stepError && (
                <div role="alert" className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {stepError}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={registerLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#4169E1] hover:bg-[#5A7FE8] text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {registerLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Criando conta...</>
                    : step < 4 ? 'Continuar' : 'Criar minha conta'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
