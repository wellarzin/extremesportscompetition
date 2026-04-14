import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { storeConfig } from '../config';
import { ShoppingCart, CreditCard, X, Plus, Minus, Tag } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function Store() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const [cart, setCart] = useState<{product: typeof storeConfig.products[0], quantity: number}[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
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
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Products stagger animation
      const products = productsRef.current?.querySelectorAll('.product-card');
      if (products) {
        gsap.fromTo(
          products,
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
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const addToCart = (product: typeof storeConfig.products[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section
      ref={sectionRef}
      id="loja"
      className="relative py-24 md:py-32 bg-[#0A0A0A]"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF6B00]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4169E1]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div ref={titleRef} className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] text-sm font-medium mb-6">
              {storeConfig.subtitle}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white tracking-tight mb-4">
              {storeConfig.titleRegular}{' '}
              <span className="font-serif italic text-[#4169E1]">{storeConfig.titleItalic}</span>
            </h2>
            <p className="text-lg text-white/60 max-w-xl">
              {storeConfig.description}
            </p>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#FF6B00] rounded-full text-xs font-bold text-white flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-white font-medium">Carrinho</span>
            {cartTotal > 0 && (
              <span className="text-[#FF6B00] font-semibold">
                R$ {cartTotal.toFixed(2)}
              </span>
            )}
          </button>
        </div>

        {/* Products Grid */}
        <div ref={productsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {storeConfig.products.map((product) => (
            <div
              key={product.id}
              className="product-card group bg-[#141414] rounded-2xl overflow-hidden border border-white/5 hover:border-[#4169E1]/30 transition-all duration-500"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Discount Badge */}
                {product.originalPrice && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-[#FF6B00] rounded-lg text-xs font-bold text-white">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </div>
                )}

                {/* Quick Add Button */}
                <button
                  onClick={() => addToCart(product)}
                  className="absolute bottom-3 right-3 w-10 h-10 bg-[#4169E1] hover:bg-[#5A7FE8] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <span className="text-white/40 text-xs uppercase tracking-wider">{product.category}</span>
                <h3 className="text-white font-semibold mt-1 mb-2 line-clamp-2 group-hover:text-[#4169E1] transition-colors">
                  {product.name}
                </h3>
                <p className="text-white/50 text-sm mb-3 line-clamp-2">{product.description}</p>
                
                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">
                    R$ {product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-white/40 line-through">
                      R$ {product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Add to Cart */}
                <button
                  onClick={() => addToCart(product)}
                  className="w-full mt-4 py-2 bg-white/5 hover:bg-[#4169E1] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          />
          <div className="relative w-full max-w-lg bg-[#141414] border border-white/10 rounded-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Seu Carrinho
              </h2>
              <button 
                onClick={() => setShowCart(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">Seu carrinho está vazio</p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="mt-4 text-[#4169E1] hover:underline"
                  >
                    Continuar comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-4 p-4 bg-white/5 rounded-xl">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{item.product.name}</h4>
                        <p className="text-white/50 text-sm">{item.product.category}</p>
                        <p className="text-[#FF6B00] font-semibold mt-1">
                          R$ {item.product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-white/40 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-6 h-6 bg-white/10 rounded flex items-center justify-center hover:bg-white/20"
                          >
                            <Minus className="w-3 h-3 text-white" />
                          </button>
                          <span className="text-white w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-6 h-6 bg-white/10 rounded flex items-center justify-center hover:bg-white/20"
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

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/60">Total</span>
                  <span className="text-2xl font-bold text-white">
                    R$ {cartTotal.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCheckout(false)}
          />
          <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-8">
            <button 
              onClick={() => setShowCheckout(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4169E1]/20 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-[#4169E1]" />
              </div>
              <h2 className="text-2xl font-sans font-bold text-white mb-2">Finalizar Compra</h2>
              <p className="text-white/60">Total: <span className="text-[#FF6B00] font-bold">R$ {cartTotal.toFixed(2)}</span></p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => alert('Sistema de pagamento em desenvolvimento')}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-4 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#4169E1]/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#4169E1]" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Cartão de Crédito</p>
                  <p className="text-white/50 text-sm">Parcelamento disponível</p>
                </div>
              </button>
              
              <button 
                onClick={() => alert('Sistema de pagamento em desenvolvimento')}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-4 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FF6B00]/20 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-[#FF6B00]" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">PIX</p>
                  <p className="text-white/50 text-sm">Pagamento instantâneo</p>
                </div>
              </button>
            </div>

            <div className="mt-6 p-4 bg-[#FF6B00]/10 rounded-xl">
              <p className="text-sm text-white/60 text-center">
                <span className="text-[#FF6B00]">Atenção:</span> Os créditos adquiridos não podem ser convertidos em dinheiro.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
