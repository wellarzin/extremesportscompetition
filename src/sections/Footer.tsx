import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { footerConfig } from '../config';
import { Instagram, Twitter, Linkedin, Mail, MapPin, Phone, ExternalLink } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        logoRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const getSocialIcon = (iconName: string) => {
    switch (iconName) {
      case 'Instagram': return <Instagram className="w-5 h-5" />;
      case 'Twitter': return <Twitter className="w-5 h-5" />;
      case 'Linkedin': return <Linkedin className="w-5 h-5" />;
      case 'Mail': return <Mail className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <footer
      ref={footerRef}
      className="relative bg-[#0A0A0A] border-t border-white/5"
    >
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <div ref={logoRef} className="mb-6">
              <img 
                src="/logo.png" 
                alt="Extreme Sports Competition" 
                className="h-16 w-auto"
              />
            </div>
            <p className="text-white/60 mb-6 leading-relaxed">
              A maior plataforma de competições de esportes extremos da América Latina. 
              Supere seus limites e faça história conosco.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {footerConfig.socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white/5 hover:bg-[#4169E1] flex items-center justify-center text-white/60 hover:text-white transition-all duration-300"
                  aria-label={link.label}
                >
                  {getSocialIcon(link.iconName)}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-6">{footerConfig.navigationLabel}</h4>
            <nav className="space-y-3">
              {footerConfig.navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-white/60 hover:text-[#4169E1] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-6">{footerConfig.contactLabel}</h4>
            <div className="space-y-4">
              <a 
                href={`mailto:${footerConfig.email}`}
                className="flex items-center gap-3 text-white/60 hover:text-[#4169E1] transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span>{footerConfig.email}</span>
              </a>
              <div className="flex items-center gap-3 text-white/60">
                <MapPin className="w-5 h-5" />
                <span>{footerConfig.locationText}</span>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <Phone className="w-5 h-5" />
                <span>+55 (11) 4000-0000</span>
              </div>
            </div>

            {/* Department Emails */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-white/40 text-sm mb-3">Departamentos</p>
              <div className="space-y-2">
                {[
                  { label: 'Projetos', email: 'projetos@extremesportscompetition.com' },
                  { label: 'SAC', email: 'sac@extremesportscompetition.com' },
                  { label: 'Financeiro', email: 'financeiro@extremesportscompetition.com' },
                  { label: 'Eventos', email: 'eventos@extremesportscompetition.com' }
                ].map((dept) => (
                  <a
                    key={dept.label}
                    href={`mailto:${dept.email}`}
                    className="flex items-center gap-2 text-white/40 hover:text-[#FF6B00] text-sm transition-colors"
                  >
                    <span>{dept.label}:</span>
                    <span className="truncate">{dept.email}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-6">Newsletter</h4>
            <p className="text-white/60 mb-4">
              Receba as últimas novidades sobre eventos e competições.
            </p>
            <form className="space-y-3" onSubmit={(e) => {
              e.preventDefault();
              alert('Inscrição realizada com sucesso!');
            }}>
              <input
                type="email"
                placeholder="Seu email"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1] transition-colors"
              />
              <button
                type="submit"
                className="w-full btn-primary"
              >
                Inscrever-se
              </button>
            </form>

            {/* Tagline */}
            <div className="mt-8 p-4 bg-gradient-to-r from-[#4169E1]/10 to-[#FF6B00]/10 rounded-xl border border-white/5">
              <p className="text-white/80 text-sm italic text-center">
                "{footerConfig.tagline.replace(/\n/g, ' ')}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm text-center md:text-left">
              {footerConfig.copyright}
            </p>
            <div className="flex items-center gap-6">
              {footerConfig.bottomLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-white/40 hover:text-white text-sm transition-colors flex items-center gap-1"
                >
                  {link.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
