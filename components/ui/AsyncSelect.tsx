'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Loader2, X } from 'lucide-react';

interface AsyncSelectProps {
  label: string;
  type: 'CONCEPT' | 'CATEGORY' | 'LOCATION';
  value: string; // The URI
  onChange: (uri: string) => void;
  placeholder?: string;
}

export default function AsyncSelect({ label, type, value, onChange, placeholder }: AsyncSelectProps) {
  const [query, setQuery] = useState('');
  const [displayValue, setDisplayValue] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Search logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2 || !isOpen) return;
      
      setLoading(true);
      const table = type === 'CONCEPT' ? 'news_concepts' : type === 'CATEGORY' ? 'news_categories' : 'news_locations';
      
      const { data } = await supabase
        .from(table)
        .select('*')
        .ilike('label', `%${query}%`)
        .limit(10);
        
      setResults(data || []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen, type, supabase]);

  const handleSelect = (item: any) => {
    setDisplayValue(item.label); // Show human readable name
    onChange(item.uri); // Store URI
    setIsOpen(false);
  };

  const clearSelection = () => {
    setDisplayValue('');
    onChange('');
    setQuery('');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">{label}</label>
      <div className="relative">
        <input 
          type="text"
          value={isOpen ? query : displayValue} // Show query when searching, saved label when closed
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || "Search..."}
          className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none rounded-sm placeholder-[#64748B]/50 pr-8"
        />
        {value ? (
           <button onClick={clearSelection} className="absolute right-3 top-3 text-[#64748B] hover:text-[#F5F5F1]">
             <X size={14} />
           </button>
        ) : (
           <div className="absolute right-3 top-3 text-[#64748B]">
             {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
           </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1E293B] border border-[#2C3E50] shadow-xl max-h-60 overflow-y-auto rounded-sm">
          {results.map((item) => (
            <button
              key={item.uri}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-2 text-xs text-[#F5F5F1] hover:bg-[#B7410E] hover:text-white transition-colors border-b border-[#2C3E50] last:border-0"
            >
              <div className="font-bold">{item.label}</div>
              <div className="text-[10px] opacity-70 truncate">{item.uri}</div>
            </button>
          ))}
        </div>
      )}
      
      {isOpen && query.length > 1 && results.length === 0 && !loading && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1E293B] border border-[#2C3E50] p-4 text-center text-xs text-[#64748B]">
            No results in cache. Try hydrating via Knowledge Base.
          </div>
      )}
    </div>
  );
}