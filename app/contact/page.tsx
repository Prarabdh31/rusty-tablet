'use client';

import { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import { Mail, Phone, Send, Loader2, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('LOADING');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to send');
      
      setStatus('SUCCESS');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (e) {
      setStatus('ERROR');
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans selection:bg-[#B7410E] selection:text-white pb-24">
      <Navbar />

      <section className="pt-20 pb-16 px-4 border-b border-[#2C3E50]/10">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[#B7410E] font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Get in Touch</span>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-[#2C3E50] mb-6">Contact Us</h1>
          <p className="text-xl text-[#64748B] font-serif italic max-w-2xl mx-auto">
            "The signal is always open. Whether you have a story, a correction, or a critique, we are listening."
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Info - Centered Top */}
        <div className="text-center mb-16 space-y-8">
          <div className="prose prose-lg text-[#2C3E50] mx-auto">
            <p>Rusty Tablet is an automated newsroom. While our writers are ghosts, our editors are human. Reach out for partnerships, advertising inquiries, or technical support.</p>
          </div>
          
          <div className="flex justify-center items-center gap-2">
            <div className="p-2 bg-[#2C3E50]/5 rounded-sm text-[#B7410E]"><Mail size={20} /></div>
            <div>
              <p className="text-[#64748B] font-serif text-lg">admin@rustytablet.com</p>
            </div>
          </div>
        </div>

        {/* Contact Form - Centered */}
        <div className="bg-white p-8 md:p-12 rounded-sm shadow-sm border border-[#2C3E50]/10">
          {status === 'SUCCESS' ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-[#2C3E50] mb-2">Message Sent</h3>
              <p className="text-[#64748B]">Thank you for reaching out. Our team will review your message shortly.</p>
              <button onClick={() => setStatus('IDLE')} className="mt-8 text-sm font-bold text-[#B7410E] uppercase tracking-widest hover:underline">Send Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#64748B] mb-2">Name</label>
                  <input 
                    type="text" required 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#F5F5F1] border border-[#2C3E50]/10 p-3 rounded-sm focus:border-[#B7410E] outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#64748B] mb-2">Email</label>
                  <input 
                    type="email" required 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[#F5F5F1] border border-[#2C3E50]/10 p-3 rounded-sm focus:border-[#B7410E] outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#64748B] mb-2">Subject</label>
                <input 
                  type="text" required 
                  value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-[#F5F5F1] border border-[#2C3E50]/10 p-3 rounded-sm focus:border-[#B7410E] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#64748B] mb-2">Message</label>
                <textarea 
                  required rows={6}
                  value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-[#F5F5F1] border border-[#2C3E50]/10 p-3 rounded-sm focus:border-[#B7410E] outline-none transition-colors resize-none"
                />
              </div>
              
              {status === 'ERROR' && (
                <div className="p-3 bg-red-50 text-red-600 text-sm border border-red-100 rounded-sm">
                  Something went wrong. Please try again.
                </div>
              )}

              <button 
                type="submit" 
                disabled={status === 'LOADING'}
                className="w-full bg-[#2C3E50] text-white font-bold uppercase tracking-widest py-4 rounded-sm hover:bg-[#B7410E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === 'LOADING' ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Send Message</>}
              </button>
            </form>
          )}
        </div>

      </div>
    </main>
  );
}