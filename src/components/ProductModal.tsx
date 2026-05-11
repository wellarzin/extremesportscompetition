import { useEffect, useRef } from 'react';
import { X, Plus, Minus, ShoppingCart, Package, Tag, Layers } from 'lucide-react';
import type { StoreProduct } from '../types/api';

interface Props {
  product: StoreProduct;
  cartQuantity: number;
  onClose: () => void;
  onAdd: () => void;
  onRemove: () => void;
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const CATEGORY_LABEL: Record<string, string> = {
  vestuario:    'Vestuário',
  acessorios:   'Acessórios',
  equipamentos: 'Equipamentos',
  nutricao:     'Nutrição',
  outros:       'Outros',
};

export function ProductModal({ product, cartQuantity, onClose, onAdd, onRemove }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const outOfStock = product.stock === 0;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      <div className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Accent top */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#00FF87]/60 via-[#00FF87] to-[#00FF87]/60" />

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Imagem */}
          <div className="relative md:w-64 md:flex-shrink-0 aspect-square md:aspect-auto bg-[#1a1a1a]">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-20 h-20 text-white/10" />
              </div>
            )}

            {outOfStock && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <span className="px-4 py-1.5 bg-[#FF4D00] rounded-full text-xs font-bold text-white uppercase tracking-widest">
                  Esgotado
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-6 flex flex-col">
            {/* Category + Stock */}
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                <Tag className="w-3 h-3" />
                {CATEGORY_LABEL[product.category] ?? product.category}
              </span>
              {!outOfStock && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-white/30">
                  <Layers className="w-3 h-3" />
                  {product.stock} em estoque
                </span>
              )}
            </div>

            {/* Name */}
            <h2 className="text-2xl font-sans font-bold text-white leading-tight mb-3">
              {product.name}
            </h2>

            {/* Description */}
            {product.description && (
              <p className="text-white/60 text-sm leading-relaxed mb-4 flex-1">
                {product.description}
              </p>
            )}

            {/* Spacer when no description */}
            {!product.description && <div className="flex-1" />}

            {/* Price */}
            <div className="mb-5">
              <p className="text-3xl font-black text-white">
                {formatPrice(product.price_cents)}
              </p>
              <p className="text-xs text-white/30 mt-0.5">Preço unitário · em estoque: {product.stock}</p>
            </div>

            {/* Cart controls */}
            {outOfStock ? (
              <div className="py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/30 text-sm font-medium text-center">
                Produto indisponível
              </div>
            ) : cartQuantity === 0 ? (
              <button
                onClick={onAdd}
                className="w-full py-3.5 rounded-xl bg-[#00FF87] hover:bg-[#00cc6a] text-[#0A0A0A] font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Adicionar ao Carrinho
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={onRemove}
                  aria-label="Remover um"
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 transition-colors"
                >
                  <Minus className="w-4 h-4 text-white" />
                </button>

                <div className="flex-1 text-center">
                  <span className="text-white font-bold text-lg">{cartQuantity}</span>
                  <p className="text-white/30 text-xs">no carrinho</p>
                </div>

                <button
                  onClick={onAdd}
                  disabled={cartQuantity >= product.stock}
                  aria-label="Adicionar um"
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#00FF87]/20 hover:bg-[#00FF87]/30 border border-[#00FF87]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 text-[#00FF87]" />
                </button>
              </div>
            )}

            {cartQuantity > 0 && (
              <p className="text-center text-xs text-[#00FF87]/60 mt-2">
                Subtotal: {formatPrice(product.price_cents * cartQuantity)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
