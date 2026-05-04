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
import { BrandsTicker } from './sections/BrandsTicker';
import { Companies } from './sections/Companies';
import { CreateEvents } from './sections/CreateEvents';
import { Testimonials } from './sections/Testimonials';
import { FAQ } from './sections/FAQ';
import { Footer } from './sections/Footer';
import { AllEventsPage } from './pages/AllEventsPage';
import { AllProfessionalsPage } from './pages/AllProfessionalsPage';
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
  return <LandingPage />;
}

function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AuthModalProvider>
          <AppContent />
          <PaymentReturnHandler />
        </AuthModalProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
