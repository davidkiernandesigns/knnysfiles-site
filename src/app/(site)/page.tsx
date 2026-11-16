import { Hero } from '@/components/Hero';
import { Work } from '@/components/Work';
import { About } from '@/components/About';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Hero />
      <Work />
      <About />
      <Contact />
      <Footer />
    </main>
  );
}
