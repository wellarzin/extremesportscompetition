import './App.css';
import { useLenis } from './hooks/useLenis';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { Hero } from './sections/Hero';
import { Stats } from './sections/Stats';
import { Events } from './sections/Events';
import { Athletes } from './sections/Athletes';
import { Rankings } from './sections/Rankings';
import { Store } from './sections/Store';
import { BrandsTicker } from './sections/BrandsTicker';
import { Companies } from './sections/Companies';
import { CreateEvents } from './sections/CreateEvents';
import { Testimonials } from './sections/Testimonials';
import { FAQ } from './sections/FAQ';
import { Footer } from './sections/Footer';
import { AllEventsPage } from './pages/AllEventsPage';
import { AllProfessionalsPage } from './pages/AllProfessionalsPage';
import { NewsPage } from './pages/NewsPage';
import { PaymentReturnHandler } from './components/PaymentReturnHandler';

function LandingPage() {
  useLenis();
  return (
    <main className="bg-[#0A0A0A]">
      <Hero />
      <Stats />
      <Events />
      <Athletes />
      <Rankings />
      <Store />
      <BrandsTicker />
      <Companies />
      <CreateEvents />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}

function AppContent() {
  const { page } = useNavigation();
  if (page === 'events') return <AllEventsPage />;
  if (page === 'professionals') return <AllProfessionalsPage />;
  if (page === 'news') return <NewsPage />;
  return <LandingPage />;
}

function MaintenanceOverlay() {
  return (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#0A0A0A]/95 backdrop-blur-md select-none pointer-events-auto">
      <div className="relative flex flex-col items-center max-w-md p-8 text-center bg-[#111111]/80 border border-[#222222] rounded-2xl shadow-[0_0_50px_rgba(0,255,135,0.15)] animate-pulse">
        {/* Ambient glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00FF87]/10 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Glow Icon Container */}
        <div className="relative flex items-center justify-center w-20 h-20 mb-6 bg-[#1A1A1A] border border-[#00FF87]/30 rounded-2xl shadow-[0_0_20px_rgba(0,255,135,0.2)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 text-[#00FF87]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">
          Estamos em <span className="text-[#00FF87]">Manutenção</span>
        </h1>

        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Estamos preparando novidades e melhorando a plataforma para você. Agradecemos a sua compreensão. Voltamos em breve!
        </p>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] border border-[#222222] rounded-full text-xs font-semibold text-gray-400">
          <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-ping" />
          <span>Servidores em atualização</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AuthModalProvider>
          <AppContent />
          <PaymentReturnHandler />
          <MaintenanceOverlay />
        </AuthModalProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
