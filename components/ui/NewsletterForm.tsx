'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowRight, Check } from 'lucide-react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');

    const { error } = await supabase.from('subscribers').insert({ email });

    if (error) {
      if (error.code === '23505') { // Unique violation
        setStatus('success'); // Pretend success if already subscribed
      } else {
        setStatus('error');
      }
    } else {
      setStatus('success');
      setEmail('');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-[#2C3E50] p-6 rounded-sm text-[#F5F5F1] text-center">
        <div className="flex justify-center mb-2"><Check className="text-[#B7410E]" /></div>
        <p className="font-bold uppercase tracking-wider text-sm">Subscribed</p>
        <p className="text-xs opacity-70 mt-1">Welcome to the machine.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#2C3E50] p-6 rounded-sm text-[#F5F5F1]">
      <h4 className="font-bold text-[#B7410E] uppercase tracking-wider text-xs mb-3">The Weekly Rust</h4>
      <p className="text-sm opacity-80 mb-4 leading-relaxed">
        Automated insights delivered to your inbox every Sunday morning.
      </p>
      <form onSubmit={handleSubscribe} className="flex gap-2">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address" 
          className="bg-[#F5F5F1]/10 border-none text-sm px-3 py-2 w-full text-white placeholder-white/40 focus:ring-1 focus:ring-[#B7410E] outline-none" 
          required
        />
        <button 
          type="submit" 
          disabled={status === 'loading'}
          className="bg-[#B7410E] p-2 hover:bg-white hover:text-[#B7410E] transition-colors disabled:opacity-50"
        >
          <ArrowRight size={16} />
        </button>
      </form>
      {status === 'error' && <p className="text-red-400 text-xs mt-2">Something went wrong.</p>}
    </div>
  );
}