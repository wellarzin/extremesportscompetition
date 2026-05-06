import { useState, useEffect, useRef } from 'react';
import {
  X, Ticket, Calendar, MapPin, Tag, Loader2, Inbox,
  Upload, CheckCircle, AlertCircle, FileImage, ExternalLink,
  Camera, User, Mail, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Check,
} from 'lucide-react';
import {
  fetchMyTickets, fetchMe, uploadDeliveryProof,
  uploadAvatar, updateProfile, changePassword, changeEmail,
} from '../lib/api';
import { mediaUrl } from '../lib/utils';
import { useAuthContext } from '../contexts/AuthContext';
import type { UserTicket, ApiMeta, AuthUser } from '../types/api';

// ---- helpers ----

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Gratuito';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function categoryLabel(raw: string): string {
  const map: Record<string, string> = {
    maratona: 'Maratona', trail: 'Trail', ultramaratona: 'Ultramaratona',
    campeonato_crossfit: 'Crossfit', campeonato_natacao: 'Natação',
    campeonato_ciclismo: 'Ciclismo', campeonato_volei: 'Vôlei',
    campeonato_basquete: 'Basquete', beach_tennis: 'Beach Tennis',
    corrida_de_obstaculos: 'Obstáculos', desafio_aberto: 'Desafio',
    evento_recreativo: 'Recreativo', outros: 'Evento',
  };
  return map[raw] ?? raw;
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
}

const STATUS_CONFIG = {
  ativo: { label: 'Ativo', classes: 'bg-[#00FF87]/10 text-[#00FF87] border-[#00FF87]/20' },
  cancelado: { label: 'Cancelado', classes: 'bg-red-500/10 text-red-400 border-red-500/20' },
  usado: { label: 'Utilizado', classes: 'bg-white/8 text-white/40 border-white/10' },
};

// ---- AvatarSection ----

function AvatarSection({ user, onUpdated }: { user: AuthUser; onUpdated: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarSrc = user.photo_url ? mediaUrl(user.photo_url) : null;
  const initials = getInitials(user.full_name ?? user.email ?? '?');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadAvatar(file);
      onUpdated(res.photo_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar foto.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 pt-2 pb-4">
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-[#4169E1]/20 ring-2 ring-white/10 flex items-center justify-center">
          {avatarSrc ? (
            <img src={avatarSrc} alt={user.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#4169E1] font-bold text-2xl">{initials}</span>
          )}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Alterar foto de perfil"
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#141414] border border-white/15 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-40"
        >
          {uploading
            ? <Loader2 className="w-3.5 h-3.5 text-white/60 animate-spin" />
            : <Camera className="w-3.5 h-3.5 text-white/60" />
          }
        </button>
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-[11px] text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
      >
        {uploading ? 'Enviando...' : 'Clique para alterar foto'}
      </button>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ---- DeliveryProofSection ----

function DeliveryProofSection({ initialUrl }: { initialUrl: string | null }) {
  const [proofUrl, setProofUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setProofUrl(initialUrl); }, [initialUrl]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setJustUploaded(false);
    try {
      const res = await uploadDeliveryProof(file);
      setProofUrl(res.delivery_proof_url);
      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar comprovante.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const proofSrc = proofUrl ? mediaUrl(proofUrl) : null;

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileImage className="w-3.5 h-3.5 text-[#00FF87]" />
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Comprovante de Viagens / Entregas
        </span>
        <span className="ml-auto text-[10px] text-white/25 uppercase tracking-wider">mín. 200</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-lg border border-white/10 bg-white/5 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {proofSrc ? (
            <img src={proofSrc} alt="Comprovante" className="w-full h-full object-cover" />
          ) : (
            <FileImage className="w-5 h-5 text-white/15" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          {proofSrc ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#00FF87]" />
              <span className="text-xs text-[#00FF87] font-medium">Comprovante enviado</span>
              <a href={proofSrc} target="_blank" rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors">
                <ExternalLink className="w-3 h-3" /> Ver
              </a>
            </div>
          ) : (
            <p className="text-xs text-white/35 leading-relaxed">
              Envie uma imagem comprovando pelo menos 200 viagens ou entregas.
            </p>
          )}

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
          {justUploaded && <p className="text-xs text-[#00FF87]">Atualizado com sucesso!</p>}

          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/8 text-xs text-white/50 hover:text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Enviando...' : proofUrl ? 'Substituir' : 'Enviar comprovante'}
          </button>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

// ---- ProfileTab ----

interface ProfileTabProps {
  user: AuthUser;
  deliveryProofUrl: string | null;
  onAvatarUpdated: (url: string) => void;
}

function ProfileTab({ user, deliveryProofUrl, onAvatarUpdated }: ProfileTabProps) {
  const { updateUser } = useAuthContext();

  // Nome
  const [nameValue, setNameValue] = useState(user.full_name ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Email
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [emailForm, setEmailForm] = useState({ new_email: '', password: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Senha
  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync nome se user mudar externamente
  useEffect(() => { setNameValue(user.full_name ?? ''); }, [user.full_name]);

  async function handleSaveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === user.full_name) return;
    setNameSaving(true);
    setNameError(null);
    setNameSuccess(false);
    try {
      const updated = await updateProfile({ full_name: trimmed });
      updateUser({ full_name: updated.full_name });
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Erro ao salvar nome.');
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(null);
    try {
      const res = await changeEmail(emailForm.new_email, emailForm.password);
      setEmailSuccess(res.message);
      setEmailForm({ new_email: '', password: '' });
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Erro ao alterar e-mail.');
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('As senhas não conferem.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      await changePassword(passwordForm.current, passwordForm.next);
      setPasswordSuccess(true);
      setPasswordForm({ current: '', next: '', confirm: '' });
      setPasswordExpanded(false);
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    } finally {
      setPasswordLoading(false);
    }
  }

  const nameChanged = nameValue.trim() !== (user.full_name ?? '') && nameValue.trim().length >= 3;

  return (
    <div className="p-7 space-y-7">
      {/* Avatar */}
      <AvatarSection user={user} onUpdated={(url) => { updateUser({ photo_url: url }); onAvatarUpdated(url); }} />

      {/* Divisor */}
      <div className="border-t border-white/5" />

      {/* Nome */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
          <User className="w-3.5 h-3.5" />
          Nome completo
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={nameValue}
            onChange={e => { setNameValue(e.target.value); setNameSuccess(false); setNameError(null); }}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); }}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
            placeholder="Seu nome completo"
          />
          <button
            onClick={handleSaveName}
            disabled={nameSaving || !nameChanged}
            className="px-4 py-2.5 rounded-xl bg-[#00FF87]/10 border border-[#00FF87]/15 text-[#00FF87] text-sm font-medium hover:bg-[#00FF87]/20 transition-all disabled:opacity-35 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
          >
            {nameSaving
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Check className="w-3.5 h-3.5" />
            }
            Salvar
          </button>
        </div>
        {nameSuccess && (
          <p className="flex items-center gap-1.5 text-xs text-[#00FF87]">
            <CheckCircle className="w-3 h-3" /> Nome atualizado com sucesso!
          </p>
        )}
        {nameError && (
          <p className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="w-3 h-3" /> {nameError}
          </p>
        )}
      </div>

      {/* E-mail */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
          <Mail className="w-3.5 h-3.5" />
          E-mail
        </label>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl">
          <span className="flex-1 text-white/70 text-sm truncate">{user.email}</span>
          <button
            onClick={() => { setEmailExpanded(v => !v); setEmailError(null); setEmailSuccess(null); }}
            className="flex items-center gap-1 text-xs text-white/35 hover:text-white/65 transition-colors flex-shrink-0"
          >
            {emailExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Alterar
          </button>
        </div>

        {emailExpanded && (
          <form onSubmit={handleChangeEmail} className="mt-1 p-4 bg-white/3 border border-white/8 rounded-xl space-y-3">
            <div>
              <label className="block text-[11px] text-white/30 mb-1.5">Novo e-mail</label>
              <input
                type="email"
                value={emailForm.new_email}
                onChange={e => setEmailForm(f => ({ ...f, new_email: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
                placeholder="novo@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/30 mb-1.5">Confirmar com senha atual</label>
              <input
                type="password"
                value={emailForm.password}
                onChange={e => setEmailForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            {emailError && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="w-3 h-3" /> {emailError}
              </p>
            )}
            {emailSuccess && (
              <p className="flex items-center gap-1.5 text-xs text-[#00FF87]">
                <CheckCircle className="w-3 h-3" /> {emailSuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={emailLoading}
              className="w-full py-2 rounded-lg bg-[#4169E1]/12 border border-[#4169E1]/15 text-[#4169E1] text-sm font-medium hover:bg-[#4169E1]/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {emailLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Solicitar alteração de e-mail
            </button>
            <p className="text-[10px] text-white/20 text-center">
              Um link de verificação será enviado ao novo endereço.
            </p>
          </form>
        )}
      </div>

      {/* Senha */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          Senha
        </label>

        {passwordSuccess && (
          <div className="flex items-center gap-2 p-3 bg-[#00FF87]/5 border border-[#00FF87]/15 rounded-xl">
            <CheckCircle className="w-4 h-4 text-[#00FF87] flex-shrink-0" />
            <span className="text-sm text-[#00FF87]">Senha alterada com sucesso!</span>
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl">
          <span className="flex-1 text-white/30 text-sm tracking-[0.25em]">••••••••</span>
          <button
            onClick={() => { setPasswordExpanded(v => !v); setPasswordError(null); }}
            className="flex items-center gap-1 text-xs text-white/35 hover:text-white/65 transition-colors flex-shrink-0"
          >
            {passwordExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Alterar
          </button>
        </div>

        {passwordExpanded && (
          <form onSubmit={handleChangePassword} className="mt-1 p-4 bg-white/3 border border-white/8 rounded-xl space-y-3">
            <div>
              <label className="block text-[11px] text-white/30 mb-1.5">Senha atual</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={passwordForm.current}
                  onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-white/30 mb-1.5">Nova senha</label>
              <div className="relative">
                <input
                  type={showNext ? 'text' : 'password'}
                  value={passwordForm.next}
                  onChange={e => setPasswordForm(f => ({ ...f, next: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNext(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showNext ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-white/20 mt-1">Mín. 8 caracteres, 1 letra maiúscula e 1 número</p>
            </div>

            <div>
              <label className="block text-[11px] text-white/30 mb-1.5">Confirmar nova senha</label>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
                placeholder="••••••••"
                required
              />
              {passwordForm.confirm.length > 0 && passwordForm.next !== passwordForm.confirm && (
                <p className="text-[10px] text-red-400 mt-1">As senhas não conferem.</p>
              )}
            </div>

            {passwordError && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="w-3 h-3" /> {passwordError}
              </p>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2 rounded-lg bg-[#FF4D00]/10 border border-[#FF4D00]/15 text-[#FF4D00] text-sm font-medium hover:bg-[#FF4D00]/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {passwordLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Lock className="w-3.5 h-3.5" />
              }
              Alterar senha
            </button>
          </form>
        )}
      </div>

      {/* Divisor */}
      <div className="border-t border-white/5" />

      {/* Comprovante */}
      <DeliveryProofSection initialUrl={deliveryProofUrl} />
    </div>
  );
}

// ---- HistoryTab ----

interface HistoryTabProps {
  tickets: UserTicket[];
  meta: ApiMeta | null;
  isLoading: boolean;
  page: number;
  onLoadMore: (p: number) => void;
}

function HistoryTab({ tickets, meta, isLoading, page, onLoadMore }: HistoryTabProps) {
  const hasMore = meta ? page < meta.total_pages : false;

  return (
    <div className="p-7">
      {/* Cabeçalho com contagem */}
      {meta && (
        <div className="flex items-center gap-2 mb-5">
          <Ticket className="w-4 h-4 text-[#FF6B00]" />
          <span className="text-sm font-semibold text-white/70">Meus Ingressos</span>
          <span className="ml-auto text-xs text-white/30">
            {meta.total} {meta.total === 1 ? 'inscrição' : 'inscrições'}
          </span>
        </div>
      )}

      {isLoading && tickets.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/50 font-medium mb-1">Nenhuma inscrição ainda</p>
          <p className="text-white/25 text-sm">Explore os eventos e garanta sua vaga!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const cover = ticket.event.cover_image_url ? mediaUrl(ticket.event.cover_image_url) : null;
            const status = STATUS_CONFIG[ticket.status];
            const location = ticket.event.location
              || (ticket.event.city
                ? `${ticket.event.city}${ticket.event.state ? `, ${ticket.event.state}` : ''}`
                : null);

            return (
              <div
                key={ticket.id}
                className="flex gap-4 p-4 rounded-xl bg-white/4 border border-white/8 hover:border-white/14 transition-colors"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                  {cover ? (
                    <img src={cover} alt={ticket.event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tag className="w-6 h-6 text-white/15" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-white font-semibold text-sm leading-snug line-clamp-2">
                      {ticket.event.title}
                    </p>
                    <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.classes}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(ticket.event.start_datetime)}
                    </span>
                    {location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[140px]">{location}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 ml-auto">
                      <Tag className="w-3 h-3" />
                      {categoryLabel(ticket.event.category)}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-white/25">
                      Comprado em {formatDate(ticket.purchased_at)}
                    </span>
                    <span className={`text-xs font-semibold ${ticket.price_paid_cents === 0 ? 'text-[#00FF87]' : 'text-white/60'}`}>
                      {formatPrice(ticket.price_paid_cents)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <button
              onClick={() => onLoadMore(page + 1)}
              disabled={isLoading}
              className="w-full py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLoading ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---- ProfileModal ----

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const [deliveryProofUrl, setDeliveryProofUrl] = useState<string | null>(null);
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsPage, setTicketsPage] = useState(1);

  useEffect(() => {
    if (!open) {
      setActiveTab('profile');
      setDeliveryProofUrl(null);
      setTickets([]);
      setMeta(null);
      setTicketsPage(1);
      return;
    }

    fetchMe().then((me) => setDeliveryProofUrl(me.delivery_proof_url)).catch(() => {});
    loadTickets(1);
  }, [open]);

  async function loadTickets(p: number) {
    setTicketsLoading(true);
    try {
      const res = await fetchMyTickets(p, 12);
      setTickets(prev => p === 1 ? res.data : [...prev, ...res.data]);
      setMeta(res.meta);
      setTicketsPage(p);
    } catch {
      // silencia
    } finally {
      setTicketsLoading(false);
    }
  }

  if (!open || !user) return null;

  const fullName = user.full_name ?? user.email ?? 'Usuário';
  const initials = getInitials(fullName);
  const avatarSrc = user.photo_url ? mediaUrl(user.photo_url) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#141414] border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-4 px-7 py-5 border-b border-white/5 flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#4169E1]/20 flex items-center justify-center ring-2 ring-white/8">
            {avatarSrc ? (
              <img src={avatarSrc} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#4169E1] font-bold text-sm">{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user.full_name ?? user.email}</p>
            <p className="text-white/35 text-xs truncate">{user.email}</p>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar perfil"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 flex-shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all ${
              activeTab === 'profile'
                ? 'text-[#00FF87] border-b-2 border-[#00FF87] -mb-px'
                : 'text-white/35 hover:text-white/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'text-[#00FF87] border-b-2 border-[#00FF87] -mb-px'
                : 'text-white/35 hover:text-white/60'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            Histórico
            {meta && meta.total > 0 && (
              <span className="bg-[#FF6B00]/15 text-[#FF6B00] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {meta.total}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              deliveryProofUrl={deliveryProofUrl}
              onAvatarUpdated={() => {}}
            />
          )}
          {activeTab === 'history' && (
            <HistoryTab
              tickets={tickets}
              meta={meta}
              isLoading={ticketsLoading}
              page={ticketsPage}
              onLoadMore={loadTickets}
            />
          )}
        </div>

      </div>
    </div>
  );
}
