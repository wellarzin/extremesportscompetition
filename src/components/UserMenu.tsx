import { useState, useRef, useEffect } from 'react';
import { LogOut, Ticket, Loader2, ChevronDown } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { mediaUrl } from '../lib/utils';

interface UserMenuProps {
  onOpenProfile: () => void;
}

export function UserMenu({ onOpenProfile }: UserMenuProps) {
  const { user, logout, isLoading } = useAuthContext();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  if (!user) return null;

  const fullName = user.full_name ?? user.email ?? 'Usuário';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  const avatarSrc = user.photo_url ? mediaUrl(user.photo_url) : null;
  const firstName = fullName.split(' ')[0];

  return (
    <>
      <div ref={menuRef} className="relative">
        {/* Avatar button */}
        <button
          onClick={() => setOpen(p => !p)}
          aria-label="Menu do usuário"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/10 transition-colors group"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#4169E1]/25 flex items-center justify-center ring-2 ring-white/15 group-hover:ring-white/30 transition-all">
            {avatarSrc ? (
              <img src={avatarSrc} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#4169E1] font-bold text-xs">{initials}</span>
            )}
          </div>

          {/* Name (hidden on xs) */}
          <span className="hidden sm:block text-sm text-white/80 font-medium max-w-[100px] truncate">
            {firstName}
          </span>

          <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
            {/* User info */}
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-sm text-white font-semibold truncate">{user.full_name}</p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <button
                onClick={() => { setOpen(false); onOpenProfile(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/8 transition-all text-left"
              >
                <Ticket className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
                Meus ingressos
              </button>

              <div className="h-px bg-white/8 my-1" />

              <button
                onClick={() => { setOpen(false); logout(); }}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-red-400 hover:bg-red-500/8 transition-all disabled:opacity-50 text-left"
              >
                {isLoading
                  ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  : <LogOut className="w-4 h-4 flex-shrink-0" />}
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

    </>
  );
}
