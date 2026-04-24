import { X, BookOpen, Award, Trophy } from 'lucide-react';
import type { LandingProfessional } from '../types/api';
import { mediaUrl } from '../lib/utils';

export const PLACEHOLDER_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231a1a1a"/><circle cx="50" cy="38" r="20" fill="%23333"/><ellipse cx="50" cy="85" rx="32" ry="22" fill="%23333"/></svg>';

interface ProfessionalProfileModalProps {
  professional: LandingProfessional;
  index: number;
  onClose: () => void;
}

export function ProfessionalProfileModal({ professional, index, onClose }: ProfessionalProfileModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-[#111] border border-white/10 rounded-2xl">
        {/* Hero banner */}
        <div className="relative h-56 md:h-72 overflow-hidden">
          <img
            src={mediaUrl(professional.photo_url) ?? PLACEHOLDER_AVATAR}
            alt={professional.full_name}
            className="w-full h-full object-cover object-top"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_AVATAR; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111]/60 to-transparent" />

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors border border-white/10"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="absolute bottom-6 left-6 md:left-8">
            <span className="inline-block px-3 py-1 rounded bg-[#4169E1]/20 text-[#4169E1] text-xs font-semibold tracking-wide mb-3">
              {professional.registration_type}
            </span>
            <h2 className="text-3xl md:text-4xl font-sans font-extrabold text-white leading-none">
              {professional.full_name}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 bg-white/[0.04] rounded-xl border border-white/5">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-white/40" />
              </div>
              <div>
                <p className="text-xs text-white/30 mb-0.5">Formação</p>
                <p className="text-sm text-white font-medium">{professional.education}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-white/[0.04] rounded-xl border border-white/5">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Award className="w-3.5 h-3.5 text-white/40" />
              </div>
              <div>
                <p className="text-xs text-white/30 mb-0.5">Registro</p>
                <p className="text-sm text-white font-medium">{professional.registration_type}</p>
              </div>
            </div>

            <div
              className="h-[2px] w-full rounded"
              style={{
                background:
                  index % 2 === 0
                    ? 'linear-gradient(90deg, #4169E1, #FF6B00)'
                    : 'linear-gradient(90deg, #FF6B00, #4169E1)',
              }}
            />
          </div>

          {/* Main */}
          <div className="md:col-span-2 space-y-7">
            {professional.bio && (
              <div>
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-6 h-px bg-[#FF6B00]" /> História
                </h3>
                <p className="text-white/65 leading-relaxed text-[15px]">{professional.bio}</p>
              </div>
            )}

            {professional.specialties.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-6 h-px bg-[#4169E1]" /> Especialidades
                </h3>
                <div className="space-y-2">
                  {professional.specialties.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start gap-3 p-3 bg-white/[0.04] rounded-lg border border-white/5"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#FF6B00]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Trophy className="w-3 h-3 text-[#FF6B00]" />
                      </div>
                      <div>
                        <p className="text-sm text-white/75">{s.specialty}</p>
                        {s.notes && <p className="text-xs text-white/40 mt-0.5">{s.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
