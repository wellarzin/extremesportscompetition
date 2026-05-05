import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, X, Clock, Tag, ChevronRight, RefreshCw } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import { fetchLandingNews, ApiError } from '../lib/api';
import type { LandingNewsArticle, NewsCategory, ApiMeta } from '../types/api';

// ---- Constantes ----

const PER_PAGE = 12;

const CATEGORIES: { id: NewsCategory | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'atletas', label: 'Atletas' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'patrocinio', label: 'Patrocínio' },
  { id: 'plataforma', label: 'Plataforma' },
];

const CATEGORY_COLORS: Record<NewsCategory | 'todos', string> = {
  todos: '#00FF87',
  atletas: '#4169E1',
  eventos: '#FF6B00',
  patrocinio: '#FFD700',
  plataforma: '#00FF87',
};

// ---- Helpers ----

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function readTime(body: string): string {
  const words = body.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

// ---- Skeleton ----

function SkeletonFeatured() {
  return (
    <div className="animate-pulse bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
      <div className="h-[3px] bg-white/5" />
      <div className="p-7 md:p-9 space-y-5">
        <div className="flex gap-2">
          <div className="h-5 w-24 bg-white/5 rounded" />
          <div className="h-5 w-16 bg-white/5 rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-10 bg-white/5 rounded w-full" />
          <div className="h-10 bg-white/5 rounded w-3/4" />
        </div>
        <div className="h-px bg-white/5 rounded w-16" />
        <div className="space-y-2">
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white/[0.025] border border-white/5 rounded-xl p-5 space-y-3">
      <div className="h-3 w-16 bg-white/5 rounded" />
      <div className="h-5 bg-white/5 rounded w-full" />
      <div className="h-5 bg-white/5 rounded w-4/5" />
      <div className="h-3 bg-white/5 rounded w-full" />
      <div className="h-3 bg-white/5 rounded w-3/4" />
      <div className="flex justify-between pt-1">
        <div className="h-3 w-20 bg-white/5 rounded" />
        <div className="h-3 w-12 bg-white/5 rounded" />
      </div>
    </div>
  );
}

// ---- Modal de artigo ----

function ArticleModal({ article, onClose }: { article: LandingNewsArticle; onClose: () => void }) {
  const color = CATEGORY_COLORS[article.category];
  const dateStr = formatDate(article.published_at ?? article.created_at);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div className="fixed inset-0 z-[101] overflow-y-auto">
        <div className="flex min-h-full items-start justify-center px-4 py-12">
          <div className="relative w-full max-w-2xl bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl">
            <div className="h-[3px] w-full rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
            <div className="px-8 pt-7 pb-5 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-[10px] font-black tracking-[0.2em] uppercase px-2.5 py-1 rounded"
                  style={{ color, background: `${color}15` }}
                >
                  {article.category.toUpperCase()}
                </span>
                <button
                  onClick={onClose}
                  aria-label="Fechar"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
                {article.title}
              </h2>
              <p className="text-white/50 text-sm leading-relaxed font-['DM_Sans']">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-4 mt-4 text-xs text-white/30 font-['DM_Sans']">
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{dateStr}</span>
                <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" />{readTime(article.body)} de leitura</span>
              </div>
            </div>
            <div className="px-8 py-7">
              {article.body.split('\n\n').map((paragraph, i) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith('# ')) {
                  return (
                    <h2 key={i} className="font-['Playfair_Display'] text-2xl font-bold text-white mt-8 mb-4 first:mt-0">
                      {trimmed.slice(2)}
                    </h2>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h3 key={i} className="font-['Manrope'] text-base font-black tracking-wide text-white/90 uppercase mt-7 mb-3">
                      {trimmed.slice(3)}
                    </h3>
                  );
                }
                if (trimmed.startsWith('| ')) {
                  const rows = trimmed.split('\n').filter(r => !r.match(/^\|[-| ]+\|$/));
                  return (
                    <div key={i} className="overflow-x-auto my-5 rounded-lg border border-white/[0.08]">
                      <table className="w-full text-sm font-['DM_Sans']">
                        <tbody>
                          {rows.map((row, ri) => (
                            <tr key={ri} className={ri === 0 ? 'border-b border-white/10' : 'border-b border-white/5 last:border-0'}>
                              {row.split('|').filter(c => c.trim()).map((cell, ci) => (
                                ri === 0
                                  ? <th key={ci} className="px-4 py-2.5 text-left text-white/40 text-[11px] tracking-widest uppercase font-black">{cell.trim()}</th>
                                  : <td key={ci} className="px-4 py-2.5 text-white/65">{cell.trim()}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  const items = trimmed.split('\n').map(l => l.replace(/^[-*]\s/, ''));
                  return (
                    <ul key={i} className="my-4 space-y-1.5 pl-4">
                      {items.map((item, ii) => (
                        <li key={ii} className="text-white/65 text-[15px] leading-[1.8] font-['DM_Sans'] flex gap-2">
                          <span className="text-[#00FF87] mt-[0.45em] shrink-0">·</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={i} className="text-white/70 text-[15px] leading-[1.85] font-['DM_Sans'] mb-5 last:mb-0">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---- Card de artigo pequeno ----

function ArticleCard({ article, onClick }: { article: LandingNewsArticle; onClick: () => void }) {
  const color = CATEGORY_COLORS[article.category];
  return (
    <button
      onClick={onClick}
      className="group w-full text-left p-5 bg-white/[0.025] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200"
    >
      <span className="text-[9px] font-black tracking-[0.18em] uppercase mb-2.5 block" style={{ color }}>
        {article.category.toUpperCase()}
      </span>
      <h3 className="font-['Playfair_Display'] text-white text-base font-bold leading-snug mb-2 group-hover:text-white/90">
        {article.title}
      </h3>
      <p className="text-white/40 text-xs leading-relaxed font-['DM_Sans'] line-clamp-2 mb-3">
        {article.excerpt}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-white/25 text-[11px] font-['DM_Sans']">
          {formatDate(article.published_at ?? article.created_at)}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-white/30 group-hover:text-white/60 transition-colors">
          Ler <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

// ---- Card médio ----

function SecondaryCard({ article, onClick }: { article: LandingNewsArticle; onClick: () => void }) {
  const color = CATEGORY_COLORS[article.category];
  return (
    <button
      onClick={onClick}
      className="group w-full text-left p-6 bg-white/[0.02] hover:bg-white/[0.045] border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200"
    >
      <span className="text-[9px] font-black tracking-[0.18em] uppercase mb-3 block" style={{ color }}>
        {article.category.toUpperCase()}
      </span>
      <h3 className="font-['Playfair_Display'] text-white text-xl font-bold leading-snug mb-2.5 group-hover:text-white/90">
        {article.title}
      </h3>
      <p className="text-white/40 text-sm leading-relaxed font-['DM_Sans'] line-clamp-3 mb-4">
        {article.excerpt}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-white/25 text-xs font-['DM_Sans']">
          {formatDate(article.published_at ?? article.created_at)}
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-white/30 group-hover:text-white/60 transition-colors">
          Continuar lendo <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

// ---- Card destaque ----

function FeaturedCard({ article, onClick }: { article: LandingNewsArticle; onClick: () => void }) {
  const color = CATEGORY_COLORS[article.category];
  return (
    <button
      onClick={onClick}
      className="group w-full text-left relative bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/8 hover:border-white/15 rounded-2xl overflow-hidden transition-all duration-300"
    >
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${color} 0%, transparent 60%)` }} />
      <div className="p-7 md:p-9">
        <div className="flex items-center gap-3 mb-5">
          <span
            className="text-[9px] font-black tracking-[0.2em] uppercase px-2.5 py-1.5 rounded"
            style={{ color, background: `${color}18` }}
          >
            MANCHETE PRINCIPAL
          </span>
          <span
            className="text-[9px] font-black tracking-[0.2em] uppercase px-2.5 py-1.5 rounded"
            style={{ color, background: `${color}10` }}
          >
            {article.category.toUpperCase()}
          </span>
        </div>

        <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] mb-4 group-hover:text-white/90 transition-colors">
          {article.title}
        </h2>

        <div className="w-16 h-[2px] mb-5 rounded" style={{ background: color }} />

        <p className="text-white/55 text-base md:text-lg leading-relaxed font-['DM_Sans'] max-w-2xl mb-6">
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-white/30 font-['DM_Sans']">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {formatDate(article.published_at ?? article.created_at)}
            </span>
            <span>{readTime(article.body)} de leitura</span>
          </div>
          <span className="flex items-center gap-2 text-sm font-bold transition-all" style={{ color }}>
            Ler matéria completa <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </button>
  );
}

// ---- Página principal ----

export function NewsPage() {
  const { navigate } = useNavigation();
  const [activeCategory, setActiveCategory] = useState<NewsCategory | 'todos'>('todos');
  const [articles, setArticles] = useState<LandingNewsArticle[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<LandingNewsArticle | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchLandingNews({
      page,
      per_page: PER_PAGE,
      ...(activeCategory !== 'todos' ? { category: activeCategory as NewsCategory } : {}),
    })
      .then((result) => {
        if (!cancelled) {
          setArticles(result.data);
          setMeta(result.meta ?? null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Não foi possível carregar as notícias.');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [page, activeCategory]);

  useEffect(() => {
    return load();
  }, [load]);

  function handleCategoryChange(cat: NewsCategory | 'todos') {
    setActiveCategory(cat);
    setPage(1);
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const featured = articles[0] ?? null;
  const grid = articles.slice(1);
  const totalPages = meta ? meta.total_pages : 1;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('landing')}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <span className="text-white/20 text-xs font-['DM_Sans'] tracking-widest uppercase hidden sm:block">
            Extreme Times · Edição Digital
          </span>
          <span className="text-white/20 text-xs font-['DM_Sans'] hidden md:block">{dateFormatted}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

        {/* ---- Masthead ---- */}
        <div className="text-center mb-10 md:mb-14">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="h-px flex-1 max-w-[80px] bg-white/10" />
            <span className="text-[10px] text-white/25 tracking-[0.3em] uppercase font-['DM_Sans']">
              A voz do esporte de alta performance
            </span>
            <div className="h-px flex-1 max-w-[80px] bg-white/10" />
          </div>

          <h1 className="font-['Playfair_Display'] text-6xl md:text-8xl lg:text-9xl font-black text-white leading-none tracking-tight mb-3">
            EXTREME
            <span className="italic text-[#00FF87]"> TIMES</span>
          </h1>

          <div className="flex items-center justify-center gap-6 text-[10px] text-white/25 tracking-[0.2em] uppercase font-['DM_Sans'] mt-2">
            <span>{dateFormatted}</span>
            <span className="w-px h-3 bg-white/10" />
            <span>{meta ? `${meta.total} notícia${meta.total !== 1 ? 's' : ''}` : 'Edição Digital'}</span>
            <span className="w-px h-3 bg-white/10" />
            <span>extremesports.com.br</span>
          </div>

          <div className="mt-6 space-y-px">
            <div className="h-[3px] bg-white/70 rounded" />
            <div className="h-px bg-white/20 rounded" />
            <div className="h-[2px] bg-white/40 rounded" />
          </div>
        </div>

        {/* ---- Filtros ---- */}
        <div className="flex items-center gap-2 flex-wrap mb-10 border-b border-white/5 pb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id as NewsCategory | 'todos')}
              className={`px-4 py-1.5 rounded text-xs font-bold tracking-widest uppercase transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-white text-black'
                  : 'text-white/40 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ---- Estado de erro ---- */}
        {error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-white/40 text-sm font-['DM_Sans']">{error}</p>
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Tentar novamente
            </button>
          </div>
        )}

        {/* ---- Loading ---- */}
        {isLoading && !error && (
          <div className="space-y-4">
            <SkeletonFeatured />
            <div className="py-4 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/5" />
              <div className="h-3 w-28 bg-white/5 rounded" />
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {/* ---- Conteúdo ---- */}
        {!isLoading && !error && articles.length === 0 && (
          <div className="text-center py-24">
            <p className="text-white/25 text-sm font-['DM_Sans']">Nenhuma notícia nesta categoria por enquanto.</p>
          </div>
        )}

        {!isLoading && !error && articles.length > 0 && (
          <div className="space-y-4">
            {/* Manchete */}
            {featured && (
              <FeaturedCard article={featured} onClick={() => setSelectedArticle(featured)} />
            )}

            {grid.length > 0 && (
              <>
                <div className="py-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[9px] text-white/20 tracking-[0.25em] uppercase font-['DM_Sans']">Outras notícias</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grid.slice(0, 2).map((a) => (
                    <SecondaryCard key={a.id} article={a} onClick={() => setSelectedArticle(a)} />
                  ))}
                  {grid.slice(2, 4).length > 0 && (
                    <div className="space-y-4">
                      {grid.slice(2, 4).map((a) => (
                        <ArticleCard key={a.id} article={a} onClick={() => setSelectedArticle(a)} />
                      ))}
                    </div>
                  )}
                </div>

                {grid.length > 4 && (
                  <>
                    <div className="pt-4 pb-2"><div className="h-px bg-white/5" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                      {grid.slice(4).map((a) => (
                        <ArticleCard key={a.id} article={a} onClick={() => setSelectedArticle(a)} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
                >
                  Anterior
                </button>
                <span className="text-white/30 text-sm font-['DM_Sans']">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---- Rodapé ---- */}
        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <div className="space-y-px mb-4">
            <div className="h-[2px] bg-white/30 rounded" />
            <div className="h-px bg-white/10 rounded" />
          </div>
          <p className="text-white/15 text-[11px] tracking-[0.2em] uppercase font-['DM_Sans']">
            Extreme Times — O jornal oficial da Extreme Sports Competition · extremesports.com.br
          </p>
        </div>
      </main>

      {selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </div>
  );
}
