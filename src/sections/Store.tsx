import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { storeConfig } from '../config';
import { mediaUrl } from '../lib/utils';
import {
  ShoppingCart, X, Plus, Minus, QrCode, CreditCard,
  Loader2, CheckCircle2, AlertCircle, Package, RefreshCw, Copy, Check,
} from 'lucide-react';
import {
  fetchLandingProducts,
  createStoreOrder,
  getStoreOrderStatus,
} from '../lib/api';
import { useAuthContext } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { ProductModal } from '../components/ProductModal';
import type { StoreProduct } from '../types/api';

gsap.registerPlugin(ScrollTrigger);

// ---- Tipos internos ----

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

type CheckoutStep =
  | { type: 'method' }
  | { type: 'pix'; orderId: string; pixCode: string; pixQrCode: string | null; expiresAt: string }
  | { type: 'card_redirect'; checkoutUrl: string }
  | { type: 'polling'; orderId: string; method: 'pix' | 'credit_card' }
  | { type: 'success' }
  | { type: 'error'; message: string };

// ---- Formatação de preço ----

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---- Componente principal ----

export function Store() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthContext();
  const { openAuthModal } = useAuthModal();

  // Produtos vindos da API
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState(false);

  // Produto selecionado para modal de detalhe
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);

  // Carrinho
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  // Checkout
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Carrega produtos do backend ----
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductError(false);
    try {
      const { data } = await fetchLandingProducts({ per_page: 20 });
      setProducts(data);
    } catch {
      setProductError(true);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // ---- Animações GSAP ----
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        },
      );

      const productCards = productsRef.current?.querySelectorAll('.product-card');
      if (productCards && productCards.length > 0) {
        gsap.fromTo(
          productCards,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: productsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          },
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [products]);

  // ---- Polling de status ----
  // Para PIX: poll em background sem sobrescrever a tela (usuário precisa ver o código)
  // Para cartão: vai para step 'polling' (usuário já foi redirecionado)
  const startPolling = useCallback((orderId: string, method: 'pix' | 'credit_card') => {
    if (method === 'credit_card') {
      setCheckoutStep({ type: 'polling', orderId, method });
    }

    pollingRef.current = setInterval(async () => {
      try {
        const { status } = await getStoreOrderStatus(orderId);
        if (status === 'paid') {
          clearInterval(pollingRef.current!);
          setCart([]);
          setCheckoutStep({ type: 'success' });
        } else if (status === 'cancelled' || status === 'refunded') {
          clearInterval(pollingRef.current!);
          setCheckoutStep({ type: 'error', message: 'Pagamento cancelado ou expirado. Tente novamente.' });
        }
      } catch {
        // Continua polling silenciosamente
      }
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // ---- Carrinho ----
  const addToCart = (product: StoreProduct) => {
    if (product.stock === 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.product.id !== productId) return i;
          const max = i.product.stock;
          const newQty = Math.min(max, Math.max(0, i.quantity + delta));
          return { ...i, quantity: newQty };
        })
        .filter(i => i.quantity > 0),
    );
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price_cents * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // ---- Checkout ----
  const handleCheckout = async (method: 'pix' | 'credit_card') => {
    if (!user) {
      openAuthModal();
      return;
    }

    setCheckoutLoading(true);
    try {
      const session = await createStoreOrder({
        items: cart.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        method,
      });

      if (method === 'pix') {
        if (session.pix_code) {
          setCheckoutStep({
            type: 'pix',
            orderId: session.order_id,
            pixCode: session.pix_code,
            pixQrCode: session.pix_qr_code ?? null,
            expiresAt: session.expires_at,
          });
          startPolling(session.order_id, 'pix');
        } else {
          setCheckoutStep({ type: 'error', message: 'O código PIX não foi gerado. Verifique se o gateway de pagamento está configurado e tente novamente.' });
        }
      } else if (method === 'credit_card') {
        if (session.checkout_url) {
          setCheckoutStep({ type: 'card_redirect', checkoutUrl: session.checkout_url });
          window.open(session.checkout_url, '_blank');
          startPolling(session.order_id, 'credit_card');
        } else {
          setCheckoutStep({ type: 'error', message: 'O link de checkout não foi gerado. Verifique se o gateway de pagamento está configurado e tente novamente.' });
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar pedido. Tente novamente.';
      setCheckoutStep({ type: 'error', message });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const closeCheckout = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setCheckoutStep(null);
  };

  // ---- Render ----
  return (
    <section
      ref={sectionRef}
      id="loja"
      className="relative py-24 md:py-32 bg-[#0A0A0A]"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF4D00]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00FF87]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div ref={titleRef} className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-[#00FF87]/10 border border-[#00FF87]/20 text-[#00FF87] text-sm font-medium mb-6 uppercase tracking-wider">
              {storeConfig.subtitle}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white tracking-tight mb-4">
              {storeConfig.titleRegular}{' '}
              <span className="font-serif italic text-[#00FF87]">{storeConfig.titleItalic}</span>
            </h2>
            <p className="text-lg text-white/60 max-w-xl">{storeConfig.description}</p>
          </div>

          {/* Botão Carrinho */}
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors self-start md:self-auto"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#00FF87] rounded-full text-xs font-bold text-[#0A0A0A] flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-white font-medium">Carrinho</span>
            {cartTotal > 0 && (
              <span className="text-[#00FF87] font-semibold">{formatPrice(cartTotal)}</span>
            )}
          </button>
        </div>

        {/* Grid de Produtos */}
        {loadingProducts ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-[#00FF87] animate-spin" />
          </div>
        ) : productError ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertCircle className="w-12 h-12 text-[#FF4D00]" />
            <p className="text-white/60">Não foi possível carregar os produtos.</p>
            <button
              onClick={loadProducts}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Package className="w-12 h-12 text-white/20" />
            <p className="text-white/40">Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          <div
            ref={productsRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
          >
            {products.map(product => {
              const inCart = cart.find(i => i.product.id === product.id);
              const outOfStock = product.stock === 0;

              return (
                <div
                  key={product.id}
                  className="product-card group bg-[#141414] rounded-2xl overflow-hidden border border-white/5 hover:border-[#00FF87]/30 transition-all duration-500 cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  {/* Imagem */}
                  <div className="relative aspect-square overflow-hidden bg-[#1a1a1a]">
                    {product.image_url ? (
                      <img
                        src={mediaUrl(product.image_url)!}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-white/10" />
                      </div>
                    )}

                    {outOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="px-3 py-1 bg-[#FF4D00]/90 rounded-full text-xs font-bold text-white uppercase tracking-wider">
                          Esgotado
                        </span>
                      </div>
                    )}

                    {!outOfStock && (
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        aria-label={`Adicionar ${product.name} ao carrinho`}
                        className="absolute bottom-3 right-3 w-10 h-10 bg-[#00FF87] hover:bg-[#00cc6a] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                      >
                        <Plus className="w-5 h-5 text-[#0A0A0A]" />
                      </button>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4">
                    <span className="text-white/40 text-xs uppercase tracking-wider">
                      {product.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-white font-semibold mt-1 mb-2 line-clamp-2 group-hover:text-[#00FF87] transition-colors text-sm">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-white/40 text-xs mb-3 line-clamp-2">{product.description}</p>
                    )}

                    <div className="text-lg font-bold text-white mb-3">
                      {formatPrice(product.price_cents)}
                    </div>

                    {inCart ? (
                      <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          aria-label="Remover um"
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5 text-white" />
                        </button>
                        <span className="text-white font-semibold text-sm">{inCart.quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          disabled={inCart.quantity >= product.stock}
                          aria-label="Adicionar um"
                          className="w-8 h-8 bg-[#00FF87]/20 hover:bg-[#00FF87]/30 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#00FF87]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        disabled={outOfStock}
                        className="w-full py-2 bg-white/5 hover:bg-[#00FF87]/10 hover:border-[#00FF87]/30 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {outOfStock ? 'Indisponível' : 'Adicionar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Modal Carrinho ---- */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          />
          <div className="relative w-full max-w-lg bg-[#141414] border border-white/10 rounded-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#00FF87]" />
                Seu Carrinho
                {cartCount > 0 && (
                  <span className="text-sm text-white/50 font-normal">({cartCount} {cartCount === 1 ? 'item' : 'itens'})</span>
                )}
              </h2>
              <button
                onClick={() => setShowCart(false)}
                aria-label="Fechar carrinho"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40">Seu carrinho está vazio.</p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="mt-4 text-[#00FF87] hover:underline text-sm"
                  >
                    Continuar comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#1a1a1a] shrink-0">
                        {item.product.image_url ? (
                          <img
                            src={mediaUrl(item.product.image_url)!}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-white/10" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm leading-snug line-clamp-2">
                          {item.product.name}
                        </h4>
                        <p className="text-[#00FF87] font-semibold mt-1 text-sm">
                          {formatPrice(item.product.price_cents)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between shrink-0">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          aria-label="Remover item"
                          className="text-white/30 hover:text-[#FF4D00] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-6 h-6 bg-white/10 rounded flex items-center justify-center hover:bg-white/20 transition-colors"
                          >
                            <Minus className="w-3 h-3 text-white" />
                          </button>
                          <span className="text-white w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="w-6 h-6 bg-white/10 rounded flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-white/60">Total</span>
                  <span className="text-2xl font-bold text-white">{formatPrice(cartTotal)}</span>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false);
                    setCheckoutStep({ type: 'method' });
                  }}
                  className="w-full py-3 bg-[#00FF87] hover:bg-[#00cc6a] text-[#0A0A0A] font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Modal Checkout ---- */}
      {checkoutStep && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={checkoutStep.type !== 'polling' ? closeCheckout : undefined}
          />
          <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-8">
            {checkoutStep.type !== 'polling' && checkoutStep.type !== 'success' && (
              <button
                onClick={closeCheckout}
                aria-label="Fechar"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            )}

            {/* Escolha do método */}
            {checkoutStep.type === 'method' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00FF87]/10 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-[#00FF87]" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">Finalizar Compra</h2>
                  <p className="text-white/50 text-sm">
                    Total:{' '}
                    <span className="text-[#00FF87] font-semibold">{formatPrice(cartTotal)}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleCheckout('pix')}
                    disabled={checkoutLoading}
                    className="w-full p-4 bg-white/5 hover:bg-[#00FF87]/10 border border-white/10 hover:border-[#00FF87]/30 rounded-xl flex items-center gap-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#00FF87]/10 flex items-center justify-center shrink-0">
                      {checkoutLoading ? (
                        <Loader2 className="w-5 h-5 text-[#00FF87] animate-spin" />
                      ) : (
                        <QrCode className="w-5 h-5 text-[#00FF87]" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">PIX</p>
                      <p className="text-white/50 text-sm">Aprovação instantânea</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCheckout('credit_card')}
                    disabled={checkoutLoading}
                    className="w-full p-4 bg-white/5 hover:bg-[#00FF87]/10 border border-white/10 hover:border-[#00FF87]/30 rounded-xl flex items-center gap-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#00FF87]/10 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-[#00FF87]" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">Cartão de Crédito</p>
                      <p className="text-white/50 text-sm">Parcelamento disponível</p>
                    </div>
                  </button>
                </div>

                {!user && (
                  <p className="mt-5 text-center text-white/40 text-xs">
                    Você será redirecionado para fazer login antes de finalizar.
                  </p>
                )}
              </>
            )}

            {/* PIX QR Code */}
            {checkoutStep.type === 'pix' && (
              <>
                <div className="text-center mb-5">
                  <h2 className="text-xl font-bold text-white mb-1">Pague via PIX</h2>
                  <p className="text-[#00FF87] font-semibold">{formatPrice(cartTotal)}</p>
                </div>

                {/* QR Code image */}
                {checkoutStep.pixQrCode && (
                  <div className="flex justify-center mb-5">
                    <div className="p-3 bg-white rounded-xl">
                      <img
                        src={
                          checkoutStep.pixQrCode.startsWith('data:')
                            ? checkoutStep.pixQrCode
                            : `data:image/png;base64,${checkoutStep.pixQrCode}`
                        }
                        alt="QR Code PIX"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5">
                  <p className="text-white/50 text-xs mb-2 uppercase tracking-wider">Código PIX Copia e Cola</p>
                  <p className="text-white/80 text-xs font-mono break-all leading-relaxed select-all">
                    {checkoutStep.pixCode}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(checkoutStep.pixCode);
                      setPixCopied(true);
                      setTimeout(() => setPixCopied(false), 2500);
                    }}
                    className="mt-3 w-full py-2 bg-[#00FF87]/10 hover:bg-[#00FF87]/20 border border-[#00FF87]/20 rounded-lg text-[#00FF87] text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {pixCopied ? 'Copiado!' : 'Copiar Código PIX'}
                  </button>
                </div>

                <div className="flex items-center gap-2 justify-center text-white/40 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>
              </>
            )}

            {/* Redirecionamento cartão */}
            {checkoutStep.type === 'card_redirect' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#00FF87]/10 flex items-center justify-center">
                    <CreditCard className="w-7 h-7 text-[#00FF87]" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Checkout Aberto</h2>
                  <p className="text-white/50 text-sm">
                    Complete o pagamento na aba que foi aberta. Esta janela detectará automaticamente quando o pagamento for confirmado.
                  </p>
                </div>
                <button
                  onClick={() => window.open(checkoutStep.checkoutUrl, '_blank')}
                  className="w-full py-3 bg-[#00FF87] hover:bg-[#00cc6a] text-[#0A0A0A] font-bold rounded-xl transition-colors text-sm"
                >
                  Reabrir Checkout
                </button>
                <div className="flex items-center gap-2 justify-center text-white/40 text-sm mt-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aguardando confirmação...
                </div>
              </>
            )}

            {/* Polling */}
            {checkoutStep.type === 'polling' && (
              <div className="text-center py-4">
                <Loader2 className="w-12 h-12 text-[#00FF87] animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Verificando pagamento</h2>
                <p className="text-white/50 text-sm">
                  {checkoutStep.method === 'pix'
                    ? 'Aguardando confirmação do PIX...'
                    : 'Aguardando confirmação do pagamento no cartão...'}
                </p>
              </div>
            )}

            {/* Sucesso */}
            {checkoutStep.type === 'success' && (
              <div className="text-center py-4">
                <CheckCircle2 className="w-16 h-16 text-[#00FF87] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Pedido Confirmado!</h2>
                <p className="text-white/60 text-sm mb-6">
                  Seu pedido foi recebido. Entraremos em contato para combinar a entrega.
                </p>
                <button
                  onClick={closeCheckout}
                  className="w-full py-3 bg-[#00FF87] hover:bg-[#00cc6a] text-[#0A0A0A] font-bold rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Erro */}
            {checkoutStep.type === 'error' && (
              <div className="text-center py-4">
                <AlertCircle className="w-14 h-14 text-[#FF4D00] mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Ops, algo deu errado</h2>
                <p className="text-white/50 text-sm mb-6">{checkoutStep.message}</p>
                <div className="flex gap-3">
                  <button
                    onClick={closeCheckout}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-colors text-sm"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => setCheckoutStep({ type: 'method' })}
                    className="flex-1 py-3 bg-[#00FF87] hover:bg-[#00cc6a] text-[#0A0A0A] font-bold rounded-xl transition-colors text-sm"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Modal detalhe do produto ---- */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          cartQuantity={cart.find(i => i.product.id === selectedProduct.id)?.quantity ?? 0}
          onClose={() => setSelectedProduct(null)}
          onAdd={() => addToCart(selectedProduct)}
          onRemove={() => updateQuantity(selectedProduct.id, -1)}
        />
      )}
    </section>
  );
}
