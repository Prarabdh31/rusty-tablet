'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ContextualSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('title, slug, category')
        .ilike('title', `%${query}%`)
        .limit(5);

      if (!error && data) {
        setResults(data);
      }
      setLoading(false);
      setShowResults(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle outside click to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) {
        // Redirect to a dedicated search page if needed, or just close if using dropdown only
        // router.push(`/search?q=${encodeURIComponent(query)}`);
        setShowResults(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Search..." 
          className="w-full bg-white border border-[#2C3E50]/20 px-4 py-3 pl-10 text-[#2C3E50] text-sm focus:outline-none focus:border-[#B7410E] transition-colors rounded-sm shadow-sm"
        />
        <div className="absolute left-3 top-3.5 text-[#64748B]">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </div>
      </form>

      {/* Contextual Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#2C3E50]/10 shadow-xl rounded-sm z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {results.map((result) => (
              <Link 
                key={result.slug} 
                href={`/article/${result.slug}`}
                onClick={() => setShowResults(false)}
                className="block px-4 py-3 hover:bg-[#F5F5F1] border-b border-[#F5F5F1] last:border-0 group transition-colors"
              >
                <div className="text-xs font-bold text-[#B7410E] uppercase mb-1">
                  {result.category || 'News'}
                </div>
                <div className="text-sm font-serif font-bold text-[#2C3E50] group-hover:text-[#B7410E] transition-colors line-clamp-2">
                  {result.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {showResults && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#2C3E50]/10 shadow-xl rounded-sm z-50 p-4 text-center text-xs text-[#64748B] italic">
          No articles found.
        </div>
      )}
    </div>
  );
}