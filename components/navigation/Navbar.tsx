'use client'; 

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Globe, User, LogOut, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { createBrowserClient } from '@supabase/ssr';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' }, 
  { code: 'es', label: 'Español' },
  { code: 'ja', label: '日本語' }, 
];

export default function Navbar() {
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setLang] = useState('en');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
    if (match) {
      const lang = match[2].split('/')[2]; 
      if (lang) setLang(lang);
    }
  }, []);

  const handleLanguageChange = (langCode: string) => {
    document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=/auto/${langCode}; path=/;`;
    setLang(langCode);
    window.location.reload();
  };

  const handleSubscribe = async () => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setSubscribing(true);
    const { error } = await supabase.from('subscribers').insert({ email: user.email });
    if (!error || error.code === '23505') { 
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
    }
    setSubscribing(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#F5F5F1]/95 backdrop-blur-sm border-b border-[#2C3E50]/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#B7410E] flex items-center justify-center rounded-sm group-hover:bg-[#2C3E50] transition-colors">
              <span className="text-[#F5F5F1] font-serif font-bold text-xl">R</span>
            </div>
            <span className="font-serif text-2xl font-bold text-[#2C3E50] tracking-tight notranslate">
              Rusty Tablet
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/category/politics" className="text-[#2C3E50] hover:text-[#B7410E] font-medium transition-colors">Politics</Link>
            <Link href="/category/industry" className="text-[#2C3E50] hover:text-[#B7410E] font-medium transition-colors">Industry</Link>
            <Link href="/category/culture" className="text-[#2C3E50] hover:text-[#B7410E] font-medium transition-colors">Culture</Link>
            
            <div className="h-6 w-px bg-[#2C3E50]/20"></div>
            
            <div className="relative group h-12 flex items-center">
              <button className="flex items-center gap-2 text-[#2C3E50] hover:text-[#B7410E] transition-colors py-2">
                <Globe size={18} />
                <span className="uppercase font-semibold text-sm">{currentLang === 'ja' ? 'JP' : currentLang}</span>
              </button>
              <div className="absolute right-0 top-full pt-2 w-32 hidden group-hover:block z-50">
                <div className="bg-white border border-gray-200 shadow-lg rounded-sm overflow-hidden">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => handleLanguageChange(l.code)}
                      className="block w-full text-left px-4 py-2 text-sm text-[#2C3E50] hover:bg-[#B7410E] hover:text-white transition-colors"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleSubscribe}
              disabled={subscribing || subscribed}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-all w-28 flex justify-center items-center ${
                subscribed ? 'bg-green-600 text-white' : 'bg-[#2C3E50] text-[#F5F5F1] hover:bg-[#B7410E]'
              }`}
            >
              {subscribing ? <Loader2 size={16} className="animate-spin" /> : subscribed ? <Check size={16} /> : 'Subscribe'}
            </button>

            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-[#2C3E50]/10 animate-pulse"></div>
            ) : user ? (
              <div className="relative group h-12 flex items-center">
                <button className="flex items-center gap-2 focus:outline-none">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full border border-[#2C3E50]/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#2C3E50] text-white flex items-center justify-center font-bold text-xs">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-50">
                  <div className="bg-white border border-gray-200 shadow-lg rounded-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-bold text-[#2C3E50] truncate">{user.user_metadata?.full_name || 'Reader'}</p>
                      <p className="text-[10px] text-[#64748B] truncate">{user.email}</p>
                    </div>
                    <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => signInWithGoogle()} className="flex items-center gap-2 text-sm font-bold text-[#2C3E50] hover:text-[#B7410E] transition-colors">
                <User size={18} /> Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={() => setIsOpen(!isOpen)} className="text-[#2C3E50]">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#F5F5F1] border-b border-[#2C3E50]/10 max-h-[90vh] overflow-y-auto">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/category/politics" className="block px-3 py-2 text-[#2C3E50] font-medium" onClick={() => setIsOpen(false)}>Politics</Link>
            <Link href="/category/industry" className="block px-3 py-2 text-[#2C3E50] font-medium" onClick={() => setIsOpen(false)}>Industry</Link>
            <Link href="/category/culture" className="block px-3 py-2 text-[#2C3E50] font-medium" onClick={() => setIsOpen(false)}>Culture</Link>
            
            <div className="border-t border-[#2C3E50]/10 my-2"></div>
            
            {/* Mobile Language Switcher */}
            <div className="px-3 py-2">
              <span className="text-xs font-bold text-[#B7410E] uppercase tracking-wider mb-2 block">Language</span>
              <div className="flex flex-wrap gap-2">
                {languages.map((l) => (
                  <button 
                    key={l.code} 
                    onClick={() => { handleLanguageChange(l.code); setIsOpen(false); }}
                    className={`text-sm px-3 py-1 rounded-sm border ${
                      currentLang === l.code 
                        ? 'bg-[#2C3E50] text-white border-[#2C3E50]' 
                        : 'bg-white text-[#2C3E50] border-[#2C3E50]/20'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#2C3E50]/10 my-2"></div>

            {/* Mobile Auth */}
            {!user ? (
              <button onClick={() => { signInWithGoogle(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 font-bold text-[#2C3E50] flex items-center gap-2">
                <User size={18} /> Login
              </button>
            ) : (
              <>
                <div className="px-3 py-2 flex items-center gap-3">
                  {user.user_metadata?.avatar_url && (
                    <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-[#2C3E50]">{user.user_metadata?.full_name}</div>
                    <div className="text-xs text-[#64748B]">{user.email}</div>
                  </div>
                </div>
                <button onClick={() => { signOut(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 font-bold text-red-600 flex items-center gap-2">
                  <LogOut size={18} /> Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}