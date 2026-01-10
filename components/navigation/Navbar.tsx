'use client'; 

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Globe } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' }, 
  { code: 'es', label: 'Español' },
  { code: 'jp', label: '日本語' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setLang] = useState('en');

  return (
    <nav className="sticky top-0 z-50 bg-[#F5F5F1]/95 backdrop-blur-sm border-b border-[#2C3E50]/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#B7410E] flex items-center justify-center rounded-sm group-hover:bg-[#2C3E50] transition-colors">
              <span className="text-[#F5F5F1] font-serif font-bold text-xl">R</span>
            </div>
            <span className="font-serif text-2xl font-bold text-[#2C3E50] tracking-tight">
              Rusty Tablet
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#" className="text-[#2C3E50] hover:text-[#B7410E] font-medium transition-colors">Politics</Link>
            <Link href="#" className="text-[#2C3E50] hover:text-[#B7410E] font-medium transition-colors">Industry</Link>
            <Link href="#" className="text-[#2C3E50] hover:text-[#B7410E] font-medium transition-colors">Culture</Link>
            
            <div className="h-6 w-px bg-[#2C3E50]/20"></div>
            
            {/* Language Switcher - Fixed Hover Bridge */}
            <div className="relative group h-12 flex items-center">
              <button className="flex items-center gap-2 text-[#2C3E50] hover:text-[#B7410E] transition-colors py-2">
                <Globe size={18} />
                <span className="uppercase font-semibold text-sm">{currentLang}</span>
              </button>
              
              {/* The Dropdown Bridge: 
                 1. 'top-full' positions it right below the button area.
                 2. 'pt-2' adds invisible padding so the mouse doesn't lose focus when moving down.
                 3. The inner div contains the visual border/bg.
              */}
              <div className="absolute right-0 top-full pt-2 w-32 hidden group-hover:block z-50">
                <div className="bg-white border border-gray-200 shadow-lg rounded-sm overflow-hidden">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className="block w-full text-left px-4 py-2 text-sm text-[#2C3E50] hover:bg-[#B7410E] hover:text-white transition-colors"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button className="bg-[#2C3E50] text-[#F5F5F1] px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#B7410E] transition-colors">
              Subscribe
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-[#2C3E50]">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#F5F5F1] border-b border-[#2C3E50]/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="#" className="block px-3 py-2 text-[#2C3E50] font-medium">Politics</Link>
            <Link href="#" className="block px-3 py-2 text-[#2C3E50] font-medium">Industry</Link>
            <div className="border-t border-[#2C3E50]/10 my-2"></div>
            <div className="flex gap-4 px-3 py-2">
              {languages.map((l) => (
                <button 
                  key={l.code} 
                  onClick={() => { setLang(l.code); setIsOpen(false); }}
                  className={`text-sm font-bold ${currentLang === l.code ? 'text-[#B7410E]' : 'text-[#2C3E50]'}`}
                >
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}