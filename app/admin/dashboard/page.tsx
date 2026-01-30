'use client';

import { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import { Ghost, Activity, Aperture, BookOpen } from 'lucide-react';
import Manifesto from '@/components/admin/Manifesto';
import ThePhantom from '@/components/admin/ThePhantom';
import ThePulse from '@/components/admin/ThePulse';
import TheLens from '@/components/admin/TheLens';

export default function AdminDashboard() {
  const [activeModule, setActiveModule] = useState<'PHANTOM' | 'PULSE' | 'LENS'>('PHANTOM');
  const [showManifesto, setShowManifesto] = useState(false);
  const [authKey, setAuthKey] = useState('');

  return (
    <main className="min-h-screen bg-[#0F172A] font-sans text-[#F5F5F1] pb-24 selection:bg-[#B7410E] selection:text-white">
      <Navbar />

      {/* --- THE PRISM HEADER --- */}
      <div className="bg-[#1E293B] border-b border-[#B7410E]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-64 bg-[#B7410E] rounded-full blur-[150px] opacity-5 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tighter text-white mb-2">
                THE PRISM
              </h1>
              <p className="text-[#64748B] font-mono text-xs uppercase tracking-[0.2em] border-l-2 border-[#B7410E] pl-3">
                Central Intelligence v3.0
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-4 w-full md:w-auto">
               <input 
                  type="password" 
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  placeholder="SECURITY CLEARANCE KEY"
                  className="bg-[#0F172A] border border-[#2C3E50] p-3 font-mono text-xs text-[#B7410E] placeholder-[#64748B] focus:outline-none focus:border-[#B7410E] w-full md:w-64 rounded-sm transition-all"
                />
               <button 
                onClick={() => setShowManifesto(true)}
                className="flex items-center gap-2 text-xs font-bold text-[#B7410E] hover:text-white transition-colors uppercase tracking-widest group"
               >
                 <BookOpen size={16} /> Read Manifesto
                 <span className="block h-px w-0 group-hover:w-full bg-[#B7410E] transition-all duration-300"></span>
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* --- MODULE SELECTOR --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {['PHANTOM', 'PULSE', 'LENS'].map((m) => (
             <button
               key={m}
               onClick={() => setActiveModule(m as any)}
               className={`group relative p-6 border rounded-sm text-left transition-all overflow-hidden ${
                 activeModule === m 
                   ? 'bg-[#B7410E] border-[#B7410E] text-white shadow-[0_0_20px_rgba(183,65,14,0.3)]' 
                   : 'bg-[#1E293B]/50 border-[#2C3E50] text-[#64748B] hover:border-[#B7410E]/50 hover:text-[#B7410E]'
               }`}
             >
                <div className="flex justify-between items-start mb-4">
                  {m === 'PHANTOM' && <Ghost size={28} className={activeModule === 'PHANTOM' ? 'animate-pulse' : ''} />}
                  {m === 'PULSE' && <Activity size={28} className={activeModule === 'PULSE' ? 'animate-pulse' : ''} />}
                  {m === 'LENS' && <Aperture size={28} />}
                  <span className="text-[10px] font-mono opacity-50">MOD_0{m === 'PHANTOM' ? '1' : m === 'PULSE' ? '2' : '3'}</span>
                </div>
                <h3 className="font-bold text-xl uppercase tracking-wider mb-1">The {m.charAt(0) + m.slice(1).toLowerCase()}</h3>
                <p className="text-xs opacity-70 font-mono">
                  {m === 'PHANTOM' ? 'Ghost Writer Engine' : m === 'PULSE' ? 'Automated Scheduler' : 'Article Manager'}
                </p>
             </button>
          ))}
        </div>

        {/* --- MODULE VIEWPORT --- */}
        <div className="border-t border-[#2C3E50] pt-12 relative min-h-[600px]">
          {activeModule === 'PHANTOM' && (
             <ThePhantom authKey={authKey} onSuccess={() => { /* Optional: refresh global stats */ }} />
          )}

          {activeModule === 'PULSE' && (
             <ThePulse authKey={authKey} />
          )}

          {activeModule === 'LENS' && (
             <TheLens authKey={authKey} />
          )}
        </div>
      </div>

      {showManifesto && <Manifesto onClose={() => setShowManifesto(false)} />}

    </main>
  );
}