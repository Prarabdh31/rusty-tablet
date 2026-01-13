'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import { 
  Loader2, Terminal, CheckCircle, AlertCircle, FileText, Rss, Settings, 
  Send, ArrowRight, List, Edit2, Eye, EyeOff, Trash2, X, Save, Newspaper, 
  Search, Filter, Ghost, Activity, Aperture, BookOpen 
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// --- CONFIGURATION OPTIONS ---
const REGIONS = ['US', 'IN', 'UK', 'JP', 'Global', 'EU', 'Mars Colony'];
const SENTIMENTS = [
  'Objective', 'Critical', 'Supportive', 'Satirical', 'Investigative', 'Opinionated',
  'Psychological', 'Curiosity', 'Skeptic', 'Contemplation', 'Frustration', 'Humor', 'Irony'
];
const COMPLEXITIES = ['EASY', 'GENERAL', 'TECHNICAL'];
const NEWS_CATEGORIES = [
  'Business', 'Technology', 'Science', 'Health', 'Politics', 'Entertainment', 'Sports',
  'History', 'Finance', 'Gaming', 'Literature'
];

const RSS_FEEDS = [
  { label: 'The Verge (Tech)', url: 'https://www.theverge.com/rss/index.xml' },
  { label: 'Hackaday (Hardware)', url: 'https://hackaday.com/blog/feed/' },
  { label: 'TechCrunch (Startups)', url: 'https://techcrunch.com/feed/' },
  { label: 'Reuters (Business)', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best' },
  { label: 'BBC (World)', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { label: 'NDTV (Top Stories)', url: 'https://feeds.feedburner.com/ndtvnews-top-stories' },
  { label: 'NDTV (Latest)', url: 'https://feeds.feedburner.com/ndtvnews-latest' },
  { label: 'NDTV (Trending)', url: 'https://feeds.feedburner.com/ndtvnews-trending-news' },
  { label: 'NDTV (Movies)', url: 'https://feeds.feedburner.com/ndtvmovies-latest' },
  { label: 'NDTV (India)', url: 'https://feeds.feedburner.com/ndtvnews-india-news' },
  { label: 'TOI (Top Stories)', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms' },
  { label: 'TOI (Most Recent)', url: 'https://timesofindia.indiatimes.com/rssfeedmostrecent.cms' },
  { label: 'TOI (India)', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms' },
  { label: 'TOI (Sports)', url: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms' },
  { label: 'TOI (Business)', url: 'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms' },
];

export default function AdminDashboard() {
  // Navigation State
  const [activeModule, setActiveModule] = useState<'PHANTOM' | 'PULSE' | 'LENS'>('PHANTOM');
  const [showManifesto, setShowManifesto] = useState(false);
  const [authKey, setAuthKey] = useState('');

  // --- GENERATOR STATE (THE PHANTOM) ---
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [mode, setMode] = useState<'SPECIFIC_RSS' | 'MANUAL' | 'NEWS_API_AI'>('MANUAL');
  
  // Inputs
  const [rssUrl, setRssUrl] = useState(RSS_FEEDS[0].url);
  const [contentInput, setContentInput] = useState('');
  const [newsMode, setNewsMode] = useState<'AUTOMATIC' | 'TAILORED'>('AUTOMATIC');
  const [newsCategory, setNewsCategory] = useState('Technology');
  const [newsTopic, setNewsTopic] = useState('');

  // Settings
  const [region, setRegion] = useState('Global');
  const [selectedSentiments, setSelectedSentiments] = useState<string[]>(['Objective']);
  const [complexity, setComplexity] = useState('GENERAL');
  const [wordCount, setWordCount] = useState(800);
  const [layoutInstructions, setLayoutInstructions] = useState('');
  const [thoughtDirection, setThoughtDirection] = useState('');
  
  const [includeSidebar, setIncludeSidebar] = useState(true);
  const [generateSocial, setGenerateSocial] = useState(true);

  // --- MANAGER STATE (THE LENS) ---
  const [articles, setArticles] = useState<any[]>([]);
  const [managerLoading, setManagerLoading] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- HANDLERS ---
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenLoading(true);
    setGenError(null);
    setGenResult(null);

    try {
      const payload = {
        mode,
        config: {
          rss_url: mode === 'SPECIFIC_RSS' ? rssUrl : undefined,
          content_input: mode === 'MANUAL' ? contentInput : undefined,
          news_mode: mode === 'NEWS_API_AI' ? newsMode : undefined,
          news_category: mode === 'NEWS_API_AI' ? newsCategory : undefined,
          news_topic: mode === 'NEWS_API_AI' ? newsTopic : undefined,
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
      // If needed, refresh list silently
      if (authKey) fetchArticles(); 
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenLoading(false);
    }
  };

  const fetchArticles = async () => {
    if (!authKey) return; 
    setManagerLoading(true);
    try {
      const response = await fetch('/api/admin/manage', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authKey}` }
      });
      if (!response.ok) throw new Error('Failed to fetch articles');
      const json = await response.json();
      if (json.success) setArticles(json.data);
    } catch (error) {
      console.error("Fetch Error", error);
    } finally {
      setManagerLoading(false);
    }
  };

  useEffect(() => {
    if (activeModule === 'LENS' && authKey) {
      fetchArticles();
    }
  }, [activeModule, authKey]);

  // Manager Actions
  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    if (!authKey) return alert('Security Clearance Required.');
    setArticles(prev => prev.map(a => a.id === id ? { ...a, is_published: !currentStatus } : a));
    try {
      await fetch('/api/admin/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
        body: JSON.stringify({ id, is_published: !currentStatus })
      });
    } catch (error) {
      alert('Update failed');
      fetchArticles();
    }
  };

  const deleteArticle = async (id: string) => {
    if (!authKey) return alert('Security Clearance Required.');
    if (!confirm('Delete this record permanently?')) return;
    try {
      await fetch(`/api/admin/manage?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authKey}` }
      });
      fetchArticles();
    } catch (error) {
      alert('Delete failed');
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authKey) return alert('Security Clearance Required.');
    try {
      const res = await fetch('/api/admin/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
        body: JSON.stringify({
          id: editingArticle.id,
          title: editingArticle.title,
          content: editingArticle.content,
          category: editingArticle.category
        })
      });
      if (!res.ok) throw new Error();
      setEditingArticle(null);
      fetchArticles();
    } catch {
      alert('Save failed');
    }
  };

  const toggleSentiment = (s: string) => {
    setSelectedSentiments(prev => prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]);
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || article.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = ['All', ...Array.from(new Set(articles.map(a => a.category))).filter(Boolean).sort()];

  return (
    <main className="min-h-screen bg-[#0F172A] font-sans text-[#F5F5F1] pb-24 selection:bg-[#B7410E] selection:text-white">
      <Navbar />

      {/* --- THE PRISM: HEADER & MANIFESTO --- */}
      <div className="bg-[#1E293B] border-b border-[#B7410E]/20 relative overflow-hidden">
        {/* Abstract Geometry */}
        <div className="absolute top-0 right-0 p-64 bg-[#B7410E] rounded-full blur-[150px] opacity-5 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tighter text-white mb-2">
                THE PRISM
              </h1>
              <p className="text-[#64748B] font-mono text-xs uppercase tracking-[0.2em] border-l-2 border-[#B7410E] pl-3">
                Central Intelligence Architecture v3.0
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
          {/* PHANTOM */}
          <button
            onClick={() => setActiveModule('PHANTOM')}
            className={`group relative p-6 border rounded-sm text-left transition-all overflow-hidden ${
              activeModule === 'PHANTOM' 
                ? 'bg-[#B7410E] border-[#B7410E] text-white shadow-[0_0_20px_rgba(183,65,14,0.3)]' 
                : 'bg-[#1E293B]/50 border-[#2C3E50] text-[#64748B] hover:border-[#B7410E]/50 hover:text-[#B7410E]'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <Ghost size={28} className={activeModule === 'PHANTOM' ? 'animate-pulse' : ''} />
              <span className="text-[10px] font-mono opacity-50">MOD_01</span>
            </div>
            <h3 className="font-bold text-xl uppercase tracking-wider mb-1">The Phantom</h3>
            <p className="text-xs opacity-70 font-mono">Ghost Writer Engine</p>
          </button>

          {/* PULSE */}
          <button
            onClick={() => setActiveModule('PULSE')}
            className={`group relative p-6 border rounded-sm text-left transition-all overflow-hidden ${
              activeModule === 'PULSE' 
                ? 'bg-[#B7410E] border-[#B7410E] text-white shadow-[0_0_20px_rgba(183,65,14,0.3)]' 
                : 'bg-[#1E293B]/50 border-[#2C3E50] text-[#64748B] hover:border-[#B7410E]/50 hover:text-[#B7410E]'
            }`}
          >
             <div className="flex justify-between items-start mb-4">
              <Activity size={28} />
              <span className="text-[10px] font-mono opacity-50">MOD_02</span>
            </div>
            <h3 className="font-bold text-xl uppercase tracking-wider mb-1">The Pulse</h3>
            <p className="text-xs opacity-70 font-mono">Automated Scheduler</p>
          </button>

          {/* LENS */}
          <button
            onClick={() => setActiveModule('LENS')}
            className={`group relative p-6 border rounded-sm text-left transition-all overflow-hidden ${
              activeModule === 'LENS' 
                ? 'bg-[#B7410E] border-[#B7410E] text-white shadow-[0_0_20px_rgba(183,65,14,0.3)]' 
                : 'bg-[#1E293B]/50 border-[#2C3E50] text-[#64748B] hover:border-[#B7410E]/50 hover:text-[#B7410E]'
            }`}
          >
             <div className="flex justify-between items-start mb-4">
              <Aperture size={28} />
              <span className="text-[10px] font-mono opacity-50">MOD_03</span>
            </div>
            <h3 className="font-bold text-xl uppercase tracking-wider mb-1">The Lens</h3>
            <p className="text-xs opacity-70 font-mono">Article Manager</p>
          </button>
        </div>

        {/* --- MODULE VIEWPORT --- */}
        <div className="border-t border-[#2C3E50] pt-12 relative min-h-[600px]">
          
          {/* 1. THE PHANTOM (GENERATOR) */}
          {activeModule === 'PHANTOM' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Form Controls */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* Source Selection */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#B7410E] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#B7410E] rounded-full"></span> Signal Source
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['MANUAL', 'SPECIFIC_RSS', 'NEWS_API_AI'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m as any)}
                        className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border rounded-sm transition-all ${
                          mode === m 
                            ? 'bg-[#1E293B] text-[#B7410E] border-[#B7410E]' 
                            : 'bg-transparent text-[#64748B] border-[#2C3E50] hover:text-[#F5F5F1] hover:border-[#64748B]'
                        }`}
                      >
                        {m.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Inputs */}
                  <div className="bg-[#1E293B] p-6 border border-[#2C3E50] rounded-sm">
                    {mode === 'MANUAL' && (
                      <textarea 
                        value={contentInput} onChange={(e) => setContentInput(e.target.value)}
                        rows={6} placeholder="Inject raw data stream..."
                        className="w-full bg-[#0F172A] border border-[#2C3E50] p-4 text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none font-mono rounded-sm placeholder-[#64748B]/50"
                      />
                    )}
                    {mode === 'SPECIFIC_RSS' && (
                      <div className="space-y-4">
                         <select value={rssUrl} onChange={(e) => setRssUrl(e.target.value)} className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none font-mono rounded-sm">
                            {RSS_FEEDS.map(f => <option key={f.url} value={f.url}>{f.label}</option>)}
                         </select>
                         <input type="text" value={newsTopic} onChange={(e) => setNewsTopic(e.target.value)} placeholder="Optional Keyword Filter..." className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none font-mono rounded-sm placeholder-[#64748B]/50" />
                      </div>
                    )}
                    {mode === 'NEWS_API_AI' && (
                      <div className="space-y-4">
                         <div className="flex gap-4 mb-4">
                            <button onClick={() => setNewsMode('AUTOMATIC')} className={`text-xs font-bold uppercase ${newsMode === 'AUTOMATIC' ? 'text-[#B7410E]' : 'text-[#64748B]'}`}>Automatic</button>
                            <button onClick={() => setNewsMode('TAILORED')} className={`text-xs font-bold uppercase ${newsMode === 'TAILORED' ? 'text-[#B7410E]' : 'text-[#64748B]'}`}>Tailored</button>
                         </div>
                         {newsMode === 'AUTOMATIC' ? (
                            <select value={newsCategory} onChange={(e) => setNewsCategory(e.target.value)} className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 text-sm text-[#F5F5F1] focus:border-[#B7410E] rounded-sm">
                              {NEWS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                         ) : (
                            <input type="text" value={newsTopic} onChange={(e) => setNewsTopic(e.target.value)} placeholder="Target Topic..." className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 text-sm text-[#F5F5F1] focus:border-[#B7410E] rounded-sm placeholder-[#64748B]/50" />
                         )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuration Matrix */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#B7410E] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#B7410E] rounded-full"></span> Parameter Matrix
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-[#64748B] font-bold">Region</label>
                      <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full bg-[#1E293B] border border-[#2C3E50] text-[#F5F5F1] p-2 text-xs rounded-sm focus:border-[#B7410E]">
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[#64748B] font-bold">Complexity</label>
                      <select value={complexity} onChange={(e) => setComplexity(e.target.value)} className="w-full bg-[#1E293B] border border-[#2C3E50] text-[#F5F5F1] p-2 text-xs rounded-sm focus:border-[#B7410E]">
                        {COMPLEXITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[#64748B] font-bold">Length</label>
                      <input type="number" value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} className="w-full bg-[#1E293B] border border-[#2C3E50] text-[#F5F5F1] p-2 text-xs rounded-sm focus:border-[#B7410E]" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[#64748B] font-bold">Direction</label>
                      <input type="text" value={thoughtDirection} onChange={(e) => setThoughtDirection(e.target.value)} placeholder="e.g. Hopeful" className="w-full bg-[#1E293B] border border-[#2C3E50] text-[#F5F5F1] p-2 text-xs rounded-sm focus:border-[#B7410E] placeholder-[#64748B]/50" />
                    </div>
                  </div>
                </div>

                {/* Sentiments */}
                <div className="p-4 border border-[#2C3E50] rounded-sm bg-[#1E293B]">
                  <label className="text-[10px] uppercase text-[#64748B] font-bold mb-3 block">Emotional Spectrum</label>
                  <div className="flex flex-wrap gap-2">
                    {SENTIMENTS.map(s => (
                      <button 
                        key={s} onClick={() => toggleSentiment(s)}
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded-sm border transition-colors ${
                          selectedSentiments.includes(s) 
                            ? 'bg-[#B7410E] text-white border-[#B7410E]' 
                            : 'bg-transparent text-[#64748B] border-[#2C3E50] hover:border-[#F5F5F1] hover:text-[#F5F5F1]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-6 text-xs font-mono text-[#64748B]">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#F5F5F1]">
                    <input type="checkbox" checked={includeSidebar} onChange={e => setIncludeSidebar(e.target.checked)} className="accent-[#B7410E]" />
                    GEN_SIDEBAR
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#F5F5F1]">
                    <input type="checkbox" checked={generateSocial} onChange={e => setGenerateSocial(e.target.checked)} className="accent-[#B7410E]" />
                    GEN_SOCIAL
                  </label>
                </div>

                <button 
                  onClick={handleGenerate} 
                  disabled={genLoading}
                  className="w-full bg-[#F5F5F1] text-[#2C3E50] hover:bg-[#B7410E] hover:text-white transition-all font-bold uppercase tracking-[0.2em] py-5 rounded-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-[#F5F5F1] hover:border-[#B7410E]"
                >
                   {genLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                   {genLoading ? 'SYNTHESIZING...' : 'INITIATE SEQUENCE'}
                </button>
              </div>

              {/* Output Terminal */}
              <div className="lg:col-span-5">
                 <div className="bg-[#0F172A] border-2 border-[#2C3E50] rounded-sm p-6 h-full font-mono text-sm text-green-500 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20"></div>
                    <div className="mb-4 text-[#2C3E50] font-bold text-xs uppercase border-b border-[#2C3E50] pb-2 flex justify-between">
                       <span>Terminal Output</span>
                       <span className={genLoading ? 'animate-pulse text-yellow-500' : 'text-green-500'}>●</span>
                    </div>
                    
                    <div className="space-y-2 h-[500px] overflow-y-auto custom-scrollbar">
                       <div className="text-gray-500">{'>'} System Ready.</div>
                       {genLoading && (
                         <>
                           <div className="text-yellow-500">{'>'} Connecting to Engine...</div>
                           <div className="text-yellow-500">{'>'} Analyzing Context...</div>
                           <div className="text-yellow-500">{'>'} Constructing Narrative...</div>
                         </>
                       )}
                       {genError && <div className="text-red-500">{'>'} ERROR: {genError}</div>}
                       {genResult && (
                         <div className="animate-in fade-in duration-1000">
                            <div className="text-[#F5F5F1] mb-4">{'>'} GENERATION COMPLETE.</div>
                            <div className="p-4 border border-green-900 bg-green-900/10 rounded-sm space-y-2 text-xs">
                               <div><span className="text-gray-500">TITLE:</span> {genResult.title}</div>
                               <div><span className="text-gray-500">AUTHOR:</span> {genResult.author}</div>
                               <div><span className="text-gray-500">IMG:</span> {genResult.image_source}</div>
                               <a href={`/article/${genResult.slug}`} target="_blank" className="text-[#B7410E] hover:underline mt-2 block flex items-center gap-1">
                                 {'>'} ACCESS FILE <ArrowRight size={10} />
                               </a>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* 2. THE PULSE (PLACEHOLDER) */}
          {activeModule === 'PULSE' && (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in">
               <Activity size={64} className="text-[#2C3E50] mb-6 animate-pulse" />
               <h2 className="text-3xl font-bold text-[#F5F5F1] uppercase tracking-widest mb-2">System Offline</h2>
               <p className="text-[#64748B] font-mono max-w-md">
                 The Pulse Engine is currently under construction. 
                 Automated chronometer scheduling will be available in v4.0.
               </p>
            </div>
          )}

          {/* 3. THE LENS (MANAGER) */}
          {activeModule === 'LENS' && (
             <div className="space-y-6 animate-in fade-in">
                {/* Manager Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 bg-[#1E293B] p-4 border border-[#2C3E50] rounded-sm">
                   <div className="relative flex-grow">
                      <Search className="absolute left-3 top-2.5 text-[#64748B]" size={16} />
                      <input 
                        type="text" placeholder="Search Archives..." 
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0F172A] border border-[#2C3E50] pl-10 pr-4 py-2 text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none rounded-sm placeholder-[#64748B]/50"
                      />
                   </div>
                   <div className="relative min-w-[200px]">
                      <Filter className="absolute left-3 top-2.5 text-[#64748B]" size={16} />
                      <select 
                        value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full bg-[#0F172A] border border-[#2C3E50] pl-10 pr-4 py-2 text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none rounded-sm appearance-none"
                      >
                         {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <button onClick={fetchArticles} className="px-4 py-2 bg-[#B7410E] text-white text-xs font-bold uppercase rounded-sm hover:bg-white hover:text-[#B7410E] transition-colors">
                     Refresh Data
                   </button>
                </div>

                {/* Data Grid */}
                <div className="bg-[#1E293B] border border-[#2C3E50] rounded-sm overflow-hidden shadow-2xl">
                   {managerLoading ? (
                      <div className="p-20 text-center text-[#64748B] font-mono"><Loader2 className="animate-spin inline mr-2" /> ACCESSING DATABASE...</div>
                   ) : (
                     <table className="w-full text-sm text-left">
                        <thead className="bg-[#0F172A] text-[#64748B] text-[10px] uppercase font-bold tracking-wider border-b border-[#2C3E50]">
                           <tr>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Title</th>
                              <th className="px-6 py-4">Category</th>
                              <th className="px-6 py-4">Timestamp</th>
                              <th className="px-6 py-4 text-right">Controls</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2C3E50]">
                           {filteredArticles.map(post => (
                              <tr key={post.id} className="hover:bg-[#2C3E50]/30 transition-colors group">
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${
                                       post.is_published ? 'border-green-900 text-green-500 bg-green-900/10' : 'border-yellow-900 text-yellow-500 bg-yellow-900/10'
                                    }`}>
                                       {post.is_published ? 'LIVE' : 'OFFLINE'}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 font-bold text-[#F5F5F1] group-hover:text-[#B7410E] transition-colors max-w-md truncate">
                                    {post.title}
                                 </td>
                                 <td className="px-6 py-4 text-[#64748B] font-mono text-xs uppercase">{post.category}</td>
                                 <td className="px-6 py-4 text-[#64748B] font-mono text-xs" suppressHydrationWarning>
                                    {new Date(post.created_at).toLocaleDateString()}
                                 </td>
                                 <td className="px-6 py-4 text-right flex justify-end gap-3">
                                    <button onClick={() => window.open(`/article/${post.slug}`, '_blank')} className="text-[#64748B] hover:text-[#F5F5F1]"><ArrowRight size={16} /></button>
                                    <button onClick={() => setEditingArticle(post)} className="text-[#64748B] hover:text-[#B7410E]"><Edit2 size={16} /></button>
                                    <button onClick={() => toggleVisibility(post.id, post.is_published)} className="text-[#64748B] hover:text-[#F5F5F1]">{post.is_published ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                                    <button onClick={() => deleteArticle(post.id)} className="text-[#64748B] hover:text-red-500"><Trash2 size={16} /></button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   )}
                </div>
             </div>
          )}

      </div>
      </div>

      {/* --- MANIFESTO MODAL --- */}
      {showManifesto && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-[#1E293B] border border-[#B7410E] max-w-2xl w-full p-8 rounded-sm relative shadow-[0_0_50px_rgba(183,65,14,0.2)]">
              <button onClick={() => setShowManifesto(false)} className="absolute top-4 right-4 text-[#64748B] hover:text-[#F5F5F1]"><X size={24} /></button>
              
              <div className="text-center mb-8">
                 <h2 className="font-serif text-3xl font-bold text-[#F5F5F1] mb-2">The Refraction of Thought</h2>
                 <div className="w-16 h-1 bg-[#B7410E] mx-auto"></div>
              </div>

              <div className="prose prose-invert prose-sm font-mono leading-relaxed text-[#94A3B8]">
                 <p className="text-lg italic text-[#F5F5F1] mb-6">"Chaos is the natural state of creativity. Order is the natural state of code."</p>
                 <p>Inside <strong>The Prism</strong>, these forces collide.</p>
                 <p>Ideas are like light—invisible until they strike a surface. Without structure, they fade. The Prism is that structure. It stands between the silence of the database and the noise of the world.</p>
                 <ul className="list-none space-y-4 my-6 pl-0">
                    <li className="flex gap-4">
                       <Activity className="text-[#B7410E] shrink-0" />
                       <span><strong>The Pulse:</strong> The heartbeat. The raw energy and chronometer that drives the system forward.</span>
                    </li>
                    <li className="flex gap-4">
                       <Ghost className="text-[#B7410E] shrink-0" />
                       <span><strong>The Phantom:</strong> The ghost in the glass. It weaves light into meaning, logic, and language.</span>
                    </li>
                    <li className="flex gap-4">
                       <Aperture className="text-[#B7410E] shrink-0" />
                       <span><strong>The Lens:</strong> The instrument of precision. It filters, corrects, and sharpens the signal.</span>
                    </li>
                 </ul>
                 <p>To the user, it is magic. To us, it is pure physics: the engineered geometry of thought.</p>
              </div>
           </div>
        </div>
      )}

      {/* --- EDIT MODAL (Dark Mode) --- */}
      {editingArticle && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-[#1E293B] w-full max-w-3xl rounded-sm border border-[#2C3E50] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-[#0F172A] p-4 flex justify-between items-center sticky top-0 border-b border-[#2C3E50]">
                <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 text-[#F5F5F1]">
                  <Edit2 size={16} /> Edit Record
                </h3>
                <button onClick={() => setEditingArticle(null)} className="text-[#64748B] hover:text-[#B7410E]"><X size={20} /></button>
              </div>
              <form onSubmit={handleEditSave} className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#64748B] mb-1">Headline</label>
                  <input 
                    type="text" 
                    value={editingArticle.title} 
                    onChange={e => setEditingArticle({...editingArticle, title: e.target.value})}
                    className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded-sm font-serif text-lg text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#64748B] mb-1">Category</label>
                  <input 
                    type="text" 
                    value={editingArticle.category} 
                    onChange={e => setEditingArticle({...editingArticle, category: e.target.value})}
                    className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded-sm text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#64748B] mb-1">Content (Markdown)</label>
                  <textarea 
                    value={editingArticle.content} 
                    onChange={e => setEditingArticle({...editingArticle, content: e.target.value})}
                    rows={12}
                    className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded-sm font-mono text-xs text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                  />
                </div>
                <div className="flex justify-end gap-4 border-t border-[#2C3E50] pt-4">
                  <button 
                    type="button" 
                    onClick={() => setEditingArticle(null)}
                    className="px-6 py-2 text-sm font-bold text-[#64748B] hover:bg-[#2C3E50] rounded-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 text-sm font-bold bg-[#B7410E] text-white hover:bg-[#8F330B] rounded-sm flex items-center gap-2"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

    </main>
  );
}