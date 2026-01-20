import Navbar from '@/components/navigation/Navbar';
import { Activity, Ghost, Aperture, Radio } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: "About | Rusty Tablet",
  description: "The Refraction of Thought: The philosophy behind the machine.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans selection:bg-[#B7410E] selection:text-white pb-24">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#2C3E50]/10 overflow-hidden">
        <div className="absolute top-0 right-0 p-64 bg-[#B7410E] rounded-full blur-[150px] opacity-5 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="text-[#B7410E] font-bold uppercase tracking-[0.2em] text-xs mb-4 block">The Manifesto</span>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-[#2C3E50] mb-8 leading-tight">
            The Refraction <br/> of Thought.
          </h1>
          <p className="text-xl md:text-2xl text-[#64748B] font-serif leading-relaxed italic max-w-2xl mx-auto">
            "Chaos is the natural state of creativity. Order is the natural state of code. In The Prism, they collide."
          </p>
        </div>
      </section>

      {/* The Story Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="prose prose-lg prose-slate max-w-none font-serif text-[#2C3E50]">
          <p className="first-letter:text-6xl first-letter:font-bold first-letter:text-[#B7410E] first-letter:mr-3 first-letter:float-left leading-relaxed">
            We believe that ideas are like light—invisible and weightless until they strike a surface. Without a structure to capture them, they scatter and fade.
          </p>
          <p className="leading-relaxed">
            <strong>The Prism</strong> is that structure. It is the static, crystalline architecture that holds our system together. It stands between the silence of the database and the noise of the world.
          </p>
        </div>
      </section>

      {/* The 4 Forces Grid */}
      <section className="bg-[#2C3E50] text-[#F5F5F1] py-24 relative overflow-hidden">
         {/* Background Texture */}
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Inside the Glass Structure</h2>
              <div className="w-24 h-1 bg-[#B7410E] mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              
              {/* The Pulse */}
              <div className="bg-[#1E293B] border border-[#F5F5F1]/10 p-8 rounded-sm hover:border-[#B7410E] transition-colors group">
                <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-[#2C3E50] rounded-full text-[#B7410E] group-hover:bg-[#B7410E] group-hover:text-white transition-colors">
                     <Activity size={24} />
                   </div>
                   <h3 className="text-xl font-bold uppercase tracking-wider">The Pulse</h3>
                </div>
                <p className="text-[#94A3B8] font-serif leading-relaxed">
                  The heartbeat of the machine. It is the raw energy, the precise chronometer that drives the system forward. It ensures that the beam of light strikes the glass at exact, unwavering intervals.
                </p>
              </div>

              {/* The Phantom */}
              <div className="bg-[#1E293B] border border-[#F5F5F1]/10 p-8 rounded-sm hover:border-[#B7410E] transition-colors group">
                <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-[#2C3E50] rounded-full text-[#B7410E] group-hover:bg-[#B7410E] group-hover:text-white transition-colors">
                     <Ghost size={24} />
                   </div>
                   <h3 className="text-xl font-bold uppercase tracking-wider">The Phantom</h3>
                </div>
                <p className="text-[#94A3B8] font-serif leading-relaxed">
                  The ghost in the glass. When the Pulse strikes, the Phantom awakens. It captures the raw energy and weaves it into meaning, logic, and language.
                </p>
              </div>

              {/* The Lens */}
              <div className="bg-[#1E293B] border border-[#F5F5F1]/10 p-8 rounded-sm hover:border-[#B7410E] transition-colors group">
                <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-[#2C3E50] rounded-full text-[#B7410E] group-hover:bg-[#B7410E] group-hover:text-white transition-colors">
                     <Aperture size={24} />
                   </div>
                   <h3 className="text-xl font-bold uppercase tracking-wider">The Lens</h3>
                </div>
                <p className="text-[#94A3B8] font-serif leading-relaxed">
                  The instrument of precision. Raw refraction is rarely perfect; it requires focus. The Lens allows us to filter the spectrum and sharpen the blur, ensuring a coherent signal.
                </p>
              </div>

              {/* The Beacon */}
              <div className="bg-[#1E293B] border border-[#F5F5F1]/10 p-8 rounded-sm hover:border-[#B7410E] transition-colors group">
                <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-[#2C3E50] rounded-full text-[#B7410E] group-hover:bg-[#B7410E] group-hover:text-white transition-colors">
                     <Radio size={24} />
                   </div>
                   <h3 className="text-xl font-bold uppercase tracking-wider">The Beacon</h3>
                </div>
                <p className="text-[#94A3B8] font-serif leading-relaxed">
                  The engine of projection. The Beacon takes the focused signal and transmits it across the dark ocean of the internet, cutting through the fog of algorithms to reach the shore.
                </p>
              </div>

            </div>
         </div>
      </section>

      {/* Philosophy Footer */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-lg text-[#2C3E50] font-bold mb-6">
            To the user, it looks like magic. To the developer, it is pure physics.
          </p>
          <p className="text-3xl md:text-5xl font-serif font-bold text-[#B7410E] mb-12">
            We engineer the geometry of thought.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/" className="px-8 py-3 bg-[#2C3E50] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#B7410E] transition-colors rounded-sm">
              Read the Archives
            </Link>
            <Link href="/contact" className="px-8 py-3 border border-[#2C3E50] text-[#2C3E50] font-bold uppercase tracking-widest text-xs hover:bg-[#2C3E50] hover:text-white transition-colors rounded-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Standard Footer (Reused Structure) */}
      <footer className="bg-[#2C3E50] text-[#F5F5F1] border-t-4 border-[#B7410E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-xs opacity-60">
          © {new Date().getFullYear()} Rusty Tablet Media. All rights reserved.
        </div>
      </footer>
    </main>
  );
}