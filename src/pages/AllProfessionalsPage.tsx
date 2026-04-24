import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Trophy, ArrowUpRight, RefreshCw } from 'lucide-react';
import { fetchLandingProfessionals, ApiError } from '../lib/api';
import type { LandingProfessional, ApiMeta } from '../types/api';
import { mediaUrl } from '../lib/utils';
import { useNavigation } from '../contexts/NavigationContext';
import { ProfessionalProfileModal, PLACEHOLDER_AVATAR } from '../components/ProfessionalProfileModal';

const PER_PAGE = 12;

function SkeletonCard() {
  return (
    <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 animate-pulse overflow-hidden">
      <div className="h-[2px] bg-white/5 w-full" />
      <div className="p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-white/5" />
        <div className="space-y-2">
          <div className="h-4 bg-white/5 rounded w-2/3" />
          <div className="h-3 bg-white/5 rounded w-1/2" />
          <div className="h-3 bg-white/5 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

export function AllProfessionalsPage() {
  const { navigate } = useNavigation();
  const [professionals, setProfessionals] = useState<LandingProfessional[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ pro: LandingProfessional; index: number } | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchLandingProfessionals(page, PER_PAGE)
      .then((result) => {
        if (!cancelled) {
          setProfessionals(result.data);
          setMeta(result.meta ?? null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os profissionais.');
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [page]);

  useEffect(() => {
    const cancel = load();
    return cancel;
  }, [load]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const totalPages = meta?.total_pages ?? 1;
  // Offset for the global ordinal number (so card numbers continue across pages)
  const offset = (page - 1) * PER_PAGE;

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-[#4169E1]/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 -right-40 w-80 h-80 bg-[#FF6B00]/6 rounded-full blur-[100px]" />
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('landing')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-baseline gap-3">
            <h1 className="text-white font-bold text-base">Todos os Profissionais</h1>
            {meta && !isLoading && (
              <span className="text-white/30 text-sm">{meta.total} cadastrados</span>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-white/50 text-center">{error}</p>
            <button
              onClick={load}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Grid */}
        {!error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading
              ? Array.from({ length: PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)
              : professionals.map((pro: LandingProfessional, localIndex: number) => {
                  const index = offset + localIndex;
                  return (
                    <div
                      key={pro.id}
                      onClick={() => setSelected({ pro, index })}
                      className="group relative bg-[#0f0f0f] cursor-pointer overflow-hidden rounded-2xl border border-white/5 hover:border-[#FF6B00]/20 transition-all duration-300"
                    >
                      <div
                        className="h-[2px] w-full"
                        style={{
                          background:
                            index % 2 === 0
                              ? 'linear-gradient(90deg, #4169E1, #FF6B00)'
                              : 'linear-gradient(90deg, #FF6B00, #4169E1)',
                        }}
                      />

                      <span className="absolute top-2 right-4 font-black text-[7rem] leading-none text-white/[0.04] select-none pointer-events-none">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <div className="relative p-6 flex flex-col gap-5">
                        {/* Photo */}
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{ background: 'linear-gradient(135deg, #4169E1, #FF6B00)', padding: '2px' }}
                          />
                          <div className="absolute inset-[2px] rounded-full overflow-hidden bg-[#1a1a1a]">
                            <img
                              src={mediaUrl(pro.photo_url) ?? PLACEHOLDER_AVATAR}
                              alt={pro.full_name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_AVATAR; }}
                            />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <span className="inline-block px-2.5 py-0.5 rounded bg-[#4169E1]/15 text-[#4169E1] text-xs font-semibold tracking-wide mb-2">
                            {pro.registration_type}
                          </span>
                          <h3 className="text-base font-sans font-bold text-white leading-tight mb-1 group-hover:text-[#FF6B00] transition-colors duration-300">
                            {pro.full_name}
                          </h3>
                          <p className="text-sm font-serif italic text-[#FF6B00]/70 mb-2">
                            {pro.education}
                          </p>
                          <p className="text-sm text-white/40 leading-relaxed line-clamp-2">
                            {pro.bio ?? 'Profissional credenciado pela Extreme Sports Competition.'}
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <span className="flex items-center gap-1.5 text-xs text-white/30">
                            <Trophy className="w-3 h-3" />
                            {pro.specialties.length > 0 ? pro.specialties[0].specialty : 'Especialista'}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-[#4169E1] opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                            Ver perfil <ArrowUpRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && professionals.length === 0 && (
          <div className="text-center py-24 text-white/40">
            Nenhum profissional cadastrado no momento.
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-14">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="text-white/30 px-1">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                        page === item
                          ? 'bg-[#FF6B00] text-white'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
            </div>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {selected && (
        <ProfessionalProfileModal
          professional={selected.pro}
          index={selected.index}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}
