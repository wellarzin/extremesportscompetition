import { brandsConfig } from '../config';

export function BrandsTicker() {
  if (!brandsConfig.brands.length) return null;

  // Duplicate for seamless infinite loop
  const items = [...brandsConfig.brands, ...brandsConfig.brands];

  return (
    <div className="relative overflow-hidden bg-[#080808] border-y border-white/[0.06] py-5 select-none">
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #080808, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #080808, transparent)' }} />

      <div className="ticker-track flex items-center gap-12">
        {items.map((brand, i) => (
          <div key={i} className="flex items-center gap-12 flex-shrink-0">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-7 w-auto object-contain opacity-30 hover:opacity-60 transition-opacity duration-300 filter grayscale"
              />
            ) : (
              <span className="text-white/20 font-black text-sm tracking-[0.2em] uppercase hover:text-white/40 transition-colors duration-300">
                {brand.name}
              </span>
            )}
            {/* Separator dot */}
            <span className="w-1 h-1 rounded-full bg-white/10 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
