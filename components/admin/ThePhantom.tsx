'use client';

import { useState } from 'react';
import { Loader2, Send, ArrowRight, Database, CloudLightning } from 'lucide-react';
import AsyncSelect from '@/components/ui/AsyncSelect';
import { REGIONS, SENTIMENTS, COMPLEXITIES, NEWS_CATEGORIES, RSS_FEEDS } from '@/lib/config/constants';

interface ThePhantomProps {
  authKey: string;
  onSuccess: () => void;
}

export default function ThePhantom({ authKey, onSuccess }: ThePhantomProps) {
  // State
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [mode, setMode] = useState<'SPECIFIC_RSS' | 'MANUAL' | 'NEWS_API_AI'>('MANUAL');
  
  // Inputs
  const [rssUrl, setRssUrl] = useState(RSS_FEEDS[0].url);
  const [contentInput, setContentInput] = useState('');
  
  // NewsAPI V2 Inputs
  const [newsV2Mode, setNewsV2Mode] = useState<'TARGETED' | 'DEEP_DIVE' | 'BREAKING'>('TARGETED');
  const [newsKeyword, setNewsKeyword] = useState('');
  const [newsSort, setNewsSort] = useState<'RELEVANCE' | 'IMPORTANCE' | 'VIRALITY' | 'DATE'>('IMPORTANCE');
  const [newsCategoryUri, setNewsCategoryUri] = useState('');
  const [newsConceptUri, setNewsConceptUri] = useState('');
  const [newsLocationUri, setNewsLocationUri] = useState('');
  
  // Hydration State
  const [hydrating, setHydrating] = useState<string | null>(null);

  // Settings
  const [region, setRegion] = useState('Global');
  const [selectedSentiments, setSelectedSentiments] = useState<string[]>(['Objective']);
  const [complexity, setComplexity] = useState('GENERAL');
  const [wordCount, setWordCount] = useState(800);
  const [layoutInstructions, setLayoutInstructions] = useState('');
  const [thoughtDirection, setThoughtDirection] = useState('');
  const [includeSidebar, setIncludeSidebar] = useState(true);
  const [generateSocial, setGenerateSocial] = useState(true);

  // Helpers
  const toggleSentiment = (s: string) => {
    setSelectedSentiments(prev => prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]);
  };

  const handleHydrate = async (type: 'categories' | 'concepts' | 'locations') => {
    if (!authKey) return alert('Security Clearance Required');
    setHydrating(type);
    try {
      const res = await fetch(`/api/admin/news/hydrate/${type}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authKey}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Hydration Complete. Processed: ${data.processed} items.`);
      } else {
        alert(`Hydration Failed: ${data.error || data.message}`);
      }
    } catch (e) {
      alert('Error connecting to hydration service');
    } finally {
      setHydrating(null);
    }
  };

  const handleGenerate = async () => {
    setGenLoading(true);
    setGenError(null);
    setGenResult(null);

    try {
      // Scoping logic for NewsAPI params
      const getScopedNewsParams = () => {
        if (mode !== 'NEWS_API_AI') return {};
        const base = { news_v2_mode: newsV2Mode };
        if (newsV2Mode === 'TARGETED') {
          return {
            ...base,
            news_keyword: newsKeyword || undefined,
            news_category_uri: newsCategoryUri || undefined,
            news_concept_uri: newsConceptUri || undefined,
            news_location_uri: newsLocationUri || undefined,
            news_sort: newsSort
          };
        }
        if (newsV2Mode === 'DEEP_DIVE') {
          return {
            ...base,
            news_keyword: newsKeyword || undefined,
            news_concept_uri: newsConceptUri || undefined,
            news_location_uri: newsLocationUri || undefined,
            news_category_uri: newsCategoryUri || undefined
          };
        }
        if (newsV2Mode === 'BREAKING') {
          return {
            ...base,
            news_category_uri: newsCategoryUri || undefined,
            news_location_uri: newsLocationUri || undefined
          };
        }
        return base;
      };

      const payload = {
        mode,
        config: {
          rss_url: mode === 'SPECIFIC_RSS' ? rssUrl : undefined,
          content_input: mode === 'MANUAL' ? contentInput : undefined,
          ...getScopedNewsParams(),
          target_region: region,
          article_sentiment: selectedSentiments.join(', '),
          complexity,
          thought_direction: thoughtDirection || undefined,
          word_count: Number(wordCount),
          layout_instructions: layoutInstructions || undefined,
          include_sidebar: includeSidebar,
          generate_social: generateSocial
        }
      };

      const response = await fetch('/api/engine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed');

      setGenResult(data);
      onSuccess(); // Trigger refresh on parent
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-7 space-y-8">
        {/* Source Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           {['MANUAL', 'SPECIFIC_RSS', 'NEWS_API_AI'].map((m) => (
              <button key={m} onClick={() => setMode(m as any)} className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border rounded-sm transition-all ${mode === m ? 'bg-[#1E293B] text-[#B7410E] border-[#B7410E]' : 'bg-transparent text-[#64748B] border-[#2C3E50] hover:text-[#F5F5F1] hover:border-[#64748B]'}`}>{m.replace(/_/g, ' ')}</button>
           ))}
        </div>

        {/* Dynamic Inputs */}
        <div className="bg-[#1E293B] p-6 border border-[#2C3E50] rounded-sm">
           {mode === 'MANUAL' && ( <textarea value={contentInput} onChange={(e) => setContentInput(e.target.value)} rows={6} placeholder="Inject raw data stream..." className="w-full bg-[#0F172A] border border-[#2C3E50] p-4 text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none font-mono rounded-sm placeholder-[#64748B]/50" /> )}
           {mode === 'SPECIFIC_RSS' && ( 
              <div className="space-y-4">
                <select value={rssUrl} onChange={(e) => setRssUrl(e.target.value)} className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none font-mono rounded-sm">{RSS_FEEDS.map(f => <option key={f.url} value={f.url}>{f.label}</option>)}</select>
              </div> 
           )}
           {mode === 'NEWS_API_AI' && (
              <div className="space-y-4">
                 <div className="flex gap-4 mb-4">
                    <button onClick={() => setNewsV2Mode('TARGETED')} className={`text-xs font-bold uppercase ${newsV2Mode === 'TARGETED' ? 'text-[#B7410E]' : 'text-[#64748B]'}`}>Targeted</button>
                    <button onClick={() => setNewsV2Mode('DEEP_DIVE')} className={`text-xs font-bold uppercase ${newsV2Mode === 'DEEP_DIVE' ? 'text-[#B7410E]' : 'text-[#64748B]'}`}>Deep Dive</button>
                    <button onClick={() => setNewsV2Mode('BREAKING')} className={`text-xs font-bold uppercase ${newsV2Mode === 'BREAKING' ? 'text-[#B7410E]' : 'text-[#64748B]'}`}>Breaking</button>
                 </div>
                 {newsV2Mode === 'TARGETED' && (
                     <div className="grid grid-cols-2 gap-4">
                        <input type="text" value={newsKeyword} onChange={(e) => setNewsKeyword(e.target.value)} placeholder="Keyword (e.g. Nvidia)" className="col-span-2 w-full bg-[#0F172A] border border-[#2C3E50] p-3 text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none rounded-sm placeholder-[#64748B]/50" />
                        <div className="col-span-2 space-y-4">
                           <AsyncSelect label="Category" type="CATEGORY" value={newsCategoryUri} onChange={setNewsCategoryUri} placeholder="Search Categories..." />
                           <AsyncSelect label="Concept" type="CONCEPT" value={newsConceptUri} onChange={setNewsConceptUri} placeholder="Search Concepts (e.g. Elon Musk)..." />
                           <AsyncSelect label="Source Location" type="LOCATION" value={newsLocationUri} onChange={setNewsLocationUri} placeholder="Search Location..." />
                        </div>
                        <select value={newsSort} onChange={(e) => setNewsSort(e.target.value as any)} className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 text-sm text-[#F5F5F1] focus:border-[#B7410E] rounded-sm col-span-2">
                           <option value="IMPORTANCE">Sort by Importance</option>
                           <option value="VIRALITY">Sort by Virality</option>
                           <option value="RELEVANCE">Sort by Relevance</option>
                           <option value="DATE">Sort by Date</option>
                        </select>
                     </div>
                 )}
                 {newsV2Mode === 'DEEP_DIVE' && (
                     <div className="space-y-4">
                        <input type="text" value={newsKeyword} onChange={(e) => setNewsKeyword(e.target.value)} placeholder="Event Topic (e.g. Election)" className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none rounded-sm placeholder-[#64748B]/50" />
                        <AsyncSelect label="Concept (Optional)" type="CONCEPT" value={newsConceptUri} onChange={setNewsConceptUri} placeholder="Search Concepts..." />
                        <AsyncSelect label="Event Location (Optional)" type="LOCATION" value={newsLocationUri} onChange={setNewsLocationUri} placeholder="Search Event Location..." />
                     </div>
                 )}
                 {newsV2Mode === 'BREAKING' && (
                     <div className="space-y-4">
                        <AsyncSelect label="Category (Optional)" type="CATEGORY" value={newsCategoryUri} onChange={setNewsCategoryUri} placeholder="Filter by Category..." />
                        <AsyncSelect label="Source Location (Optional)" type="LOCATION" value={newsLocationUri} onChange={setNewsLocationUri} placeholder="Filter by Region..." />
                     </div>
                 )}
              </div>
           )}
        </div>

        {/* Configuration Matrix */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[#B7410E] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-[#B7410E] rounded-full"></span> Parameter Matrix</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] uppercase text-[#64748B] font-bold">Region</label><select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full bg-[#1E293B] border border-[#2C3E50] text-[#F5F5F1] p-2 text-xs rounded-sm focus:border-[#B7410E]">{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="text-[10px] uppercase text-[#64748B] font-bold">Complexity</label><select value={complexity} onChange={(e) => setComplexity(e.target.value)} className="w-full bg-[#1E293B] border border-[#2C3E50] text-[#F5F5F1] p-2 text-xs rounded-sm focus:border-[#B7410E]">{COMPLEXITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="text-[10px] uppercase text-[#64748B] font-bold">Length</label><input type="number" value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} className="w-full bg-[#1E293B] border border-[#2C3E50] text-[#F5F5F1] p-2 text-xs rounded-sm focus:border-[#B7410E]" /></div>
            <div><label className="text-[10px] uppercase text-[#64748B] font-bold">Direction</label><input type="text" value={thoughtDirection} onChange={(e) => setThoughtDirection(e.target.value)} placeholder="e.g. Hopeful" className="w-full bg-[#1E293B] border border-[#2C3E50] text-[#F5F5F1] p-2 text-xs rounded-sm focus:border-[#B7410E] placeholder-[#64748B]/50" /></div>
          </div>
        </div>

        {/* Sentiments */}
        <div className="p-4 border border-[#2C3E50] rounded-sm bg-[#1E293B]">
          <label className="text-[10px] uppercase text-[#64748B] font-bold mb-3 block">Emotional Spectrum</label>
          <div className="flex flex-wrap gap-2">
            {SENTIMENTS.map(s => (
              <button key={s} onClick={() => toggleSentiment(s)} className={`text-[10px] uppercase font-bold px-2 py-1 rounded-sm border transition-colors ${selectedSentiments.includes(s) ? 'bg-[#B7410E] text-white border-[#B7410E]' : 'bg-transparent text-[#64748B] border-[#2C3E50] hover:border-[#F5F5F1] hover:text-[#F5F5F1]'}`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Hydration Panel */}
        <div className="p-4 border border-[#2C3E50] rounded-sm bg-[#1E293B]">
           <label className="text-[10px] uppercase text-[#64748B] font-bold mb-3 block flex items-center gap-2"><Database size={12} /> Knowledge Base Hydration</label>
           <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleHydrate('categories')} disabled={!!hydrating} className="py-2 text-[10px] font-bold uppercase border border-[#2C3E50] hover:border-[#B7410E] hover:text-[#B7410E] rounded-sm transition-colors flex justify-center items-center gap-2">
                {hydrating === 'categories' ? <Loader2 size={12} className="animate-spin" /> : <CloudLightning size={12} />} Process Categories
              </button>
              <button onClick={() => handleHydrate('concepts')} disabled={!!hydrating} className="py-2 text-[10px] font-bold uppercase border border-[#2C3E50] hover:border-[#B7410E] hover:text-[#B7410E] rounded-sm transition-colors flex justify-center items-center gap-2">
                {hydrating === 'concepts' ? <Loader2 size={12} className="animate-spin" /> : <CloudLightning size={12} />} Process Concepts
              </button>
              <button onClick={() => handleHydrate('locations')} disabled={!!hydrating} className="py-2 text-[10px] font-bold uppercase border border-[#2C3E50] hover:border-[#B7410E] hover:text-[#B7410E] rounded-sm transition-colors flex justify-center items-center gap-2">
                {hydrating === 'locations' ? <Loader2 size={12} className="animate-spin" /> : <CloudLightning size={12} />} Process Locations
              </button>
           </div>
        </div>

        <div className="flex gap-6 text-xs font-mono text-[#64748B]">
          <label className="flex items-center gap-2 cursor-pointer hover:text-[#F5F5F1]"><input type="checkbox" checked={includeSidebar} onChange={e => setIncludeSidebar(e.target.checked)} className="accent-[#B7410E]" /> GEN_SIDEBAR</label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-[#F5F5F1]"><input type="checkbox" checked={generateSocial} onChange={e => setGenerateSocial(e.target.checked)} className="accent-[#B7410E]" /> GEN_SOCIAL</label>
        </div>

        <button onClick={handleGenerate} disabled={genLoading} className="w-full bg-[#F5F5F1] text-[#2C3E50] hover:bg-[#B7410E] hover:text-white transition-all font-bold uppercase tracking-[0.2em] py-5 rounded-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-[#F5F5F1] hover:border-[#B7410E]"> 
           {genLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />} {genLoading ? 'SYNTHESIZING...' : 'INITIATE SEQUENCE'} 
        </button>
      </div>
      
      {/* Output Terminal */}
      <div className="lg:col-span-5">
         <div className="bg-[#0F172A] border-2 border-[#2C3E50] rounded-sm p-6 h-full font-mono text-sm text-green-500 shadow-2xl relative overflow-hidden">
            <div className="mb-4 text-[#2C3E50] font-bold text-xs uppercase border-b border-[#2C3E50] pb-2 flex justify-between"><span>Terminal Output</span><span className={genLoading ? 'animate-pulse text-yellow-500' : 'text-green-500'}>●</span></div>
            <div className="space-y-2 h-[500px] overflow-y-auto custom-scrollbar">
               {genLoading && <div className="text-yellow-500">{'>'} Processing...</div>}
               {genError && <div className="text-red-500">{'>'} ERROR: {genError}</div>}
               {genResult && (<div className="animate-in fade-in duration-1000"><div className="text-[#F5F5F1] mb-4">{'>'} GENERATION COMPLETE.</div><div className="p-4 border border-green-900 bg-green-900/10 rounded-sm space-y-2 text-xs"><div><span className="text-gray-500">TITLE:</span> {genResult.title}</div><a href={`/article/${genResult.slug}`} target="_blank" className="text-[#B7410E] hover:underline mt-2 block flex items-center gap-1">{'>'} ACCESS FILE <ArrowRight size={10} /></a></div></div>)}
            </div>
         </div>
      </div>
    </div>
  );
}