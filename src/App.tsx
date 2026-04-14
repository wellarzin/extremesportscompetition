import './App.css';
import { useLenis } from './hooks/useLenis';
import { Hero } from './sections/Hero';
import { Stats } from './sections/Stats';
import { Events } from './sections/Events';
import { Athletes } from './sections/Athletes';
import { Rankings } from './sections/Rankings';
import { BrandsTicker } from './sections/BrandsTicker';
import { Companies } from './sections/Companies';
import { Testimonials } from './sections/Testimonials';
import { FAQ } from './sections/FAQ';
import { Footer } from './sections/Footer';

function App() {
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
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}

export default App;
