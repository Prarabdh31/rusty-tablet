'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import { Loader2, Terminal, CheckCircle, AlertCircle, FileText, Rss, Settings, Send, ArrowRight, List, Edit2, Eye, EyeOff, Trash2, X, Save } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// --- CONFIGURATION OPTIONS ---
const REGIONS = ['US', 'IN', 'UK', 'JP', 'Global', 'EU', 'Mars Colony'];
const SENTIMENTS = ['Objective', 'Critical', 'Supportive', 'Satirical', 'Investigative', 'Opinionated'];
const COMPLEXITIES = ['EASY', 'GENERAL', 'TECHNICAL'];
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
  const [activeTab, setActiveTab] = useState<'GENERATOR' | 'MANAGER'>('GENERATOR');
  const [authKey, setAuthKey] = useState(''); // Cron Secret for Auth

  // --- GENERATOR STATE ---
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [mode, setMode] = useState<'SPECIFIC_RSS' | 'MANUAL'>('MANUAL');
  const [rssUrl, setRssUrl] = useState(RSS_FEEDS[0].url);
  const [contentInput, setContentInput] = useState('');
  const [region, setRegion] = useState('Global');
  const [sentiment, setSentiment] = useState('Objective');
  const [complexity, setComplexity] = useState('GENERAL');
  const [wordCount, setWordCount] = useState(800);
  const [layoutInstructions, setLayoutInstructions] = useState('');
  const [includeSidebar, setIncludeSidebar] = useState(true);
  const [generateSocial, setGenerateSocial] = useState(true);

  // --- MANAGER STATE ---
  const [articles, setArticles] = useState<any[]>([]);
  const [managerLoading, setManagerLoading] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- GENERATOR HANDLER ---
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
          target_region: region,
          article_sentiment: sentiment,
          complexity,
          word_count: Number(wordCount),
          layout_instructions: layoutInstructions || undefined,
          include_sidebar: includeSidebar,
          generate_social: generateSocial
        }
      };

      const response = await fetch('/api/engine/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setGenResult(data);
      // Refresh manager list if success
      fetchArticles(); 
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenLoading(false);
    }
  };

  // --- MANAGER HANDLERS ---
  const fetchArticles = async () => {
    if (!authKey) return; 
    setManagerLoading(true);
    
    try {
      const response = await fetch('/api/admin/manage', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authKey}`
        }
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
    if (activeTab === 'MANAGER' && authKey) {
      fetchArticles();
    }
  }, [activeTab, authKey]);

  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    if (!authKey) {
      alert('Please enter Security Clearance (CRON_SECRET) first.');
      return;
    }

    setArticles(prev => prev.map(a => a.id === id ? { ...a, is_published: !currentStatus } : a));

    try {
      const response = await fetch('/api/admin/manage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`
        },
        body: JSON.stringify({ id, is_published: !currentStatus })
      });

      if (!response.ok) {
        throw new Error('Update failed');
        fetchArticles();
      }
    } catch (error) {
      alert('Failed to update visibility. Check key.');
      fetchArticles();
    }
  };

  const deleteArticle = async (id: string) => {
    if (!authKey) {
      alert('Please enter Security Clearance (CRON_SECRET) first.');
      return;
    }
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await fetch(`/api/admin/manage?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authKey}`
        }
      });

      if (!response.ok) throw new Error('Delete failed');
      fetchArticles();
    } catch (error) {
      alert('Failed to delete article. Check key.');
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authKey) {
      alert('Please enter Security Clearance (CRON_SECRET) first.');
      return;
    }

    try {
      const response = await fetch('/api/admin/manage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`
        },
        body: JSON.stringify({
          id: editingArticle.id,
          title: editingArticle.title,
          content: editingArticle.content,
          category: editingArticle.category
        })
      });

      if (!response.ok) throw new Error('Save failed');
      
      setEditingArticle(null);
      fetchArticles();
    } catch (error) {
      alert('Failed to save changes. Check key.');
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans text-[#2C3E50] pb-24">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b-4 border-[#2C3E50] pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#2C3E50] p-3 rounded-sm text-[#F5F5F1]">
              <Terminal size={24} />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold uppercase tracking-wide">Ghost Writer</h1>
              <p className="text-[#64748B] font-mono text-xs md:text-sm">Control Room v3.0</p>
            </div>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-white border border-[#2C3E50]/20 rounded-sm p-1 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('GENERATOR')}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                activeTab === 'GENERATOR' ? 'bg-[#2C3E50] text-white' : 'text-[#64748B] hover:bg-[#F5F5F1]'
              }`}
            >
              Generator
            </button>
            <button
              onClick={() => setActiveTab('MANAGER')}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                activeTab === 'MANAGER' ? 'bg-[#2C3E50] text-white' : 'text-[#64748B] hover:bg-[#F5F5F1]'
              }`}
            >
              Manager
            </button>
          </div>
        </div>

        {/* --- VIEW: GENERATOR --- */}
        {activeTab === 'GENERATOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Control Panel */}
            <div className="lg:col-span-7">
              <form onSubmit={handleGenerate} className="space-y-6 md:space-y-8 bg-white p-4 md:p-8 border border-[#2C3E50]/10 rounded-sm shadow-sm">
                
                {/* AUTH */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#B7410E] mb-2">
                    Security Clearance
                  </label>
                  <input 
                    type="password" 
                    value={authKey}
                    onChange={(e) => setAuthKey(e.target.value)}
                    placeholder="Enter CRON_SECRET"
                    className="w-full bg-[#F5F5F1] border border-[#2C3E50]/20 p-3 font-mono text-sm rounded-sm focus:border-[#B7410E] outline-none"
                    required
                  />
                </div>

                {/* MODE */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#B7410E] mb-4">
                    Input Source
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setMode('MANUAL')}
                      className={`flex items-center justify-center gap-2 p-4 border rounded-sm transition-all text-sm font-medium ${
                        mode === 'MANUAL' ? 'bg-[#2C3E50] text-white' : 'bg-white text-[#64748B] border-[#2C3E50]/20'
                      }`}
                    >
                      <FileText size={16} /> Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('SPECIFIC_RSS')}
                      className={`flex items-center justify-center gap-2 p-4 border rounded-sm transition-all text-sm font-medium ${
                        mode === 'SPECIFIC_RSS' ? 'bg-[#2C3E50] text-white' : 'bg-white text-[#64748B] border-[#2C3E50]/20'
                      }`}
                    >
                      <Rss size={16} /> RSS Feed
                    </button>
                  </div>
                </div>

                {/* INPUT */}
                <div className="bg-[#F5F5F1]/50 p-4 md:p-6 border border-[#2C3E50]/10 rounded-sm">
                  {mode === 'MANUAL' ? (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#2C3E50] mb-2">Source Material</label>
                      <textarea 
                        value={contentInput}
                        onChange={(e) => setContentInput(e.target.value)}
                        rows={8}
                        placeholder="Paste article text here..."
                        className="w-full bg-white border border-[#2C3E50]/20 p-4 text-sm rounded-sm focus:border-[#B7410E] outline-none font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#2C3E50] mb-2">Target RSS Feed</label>
                      <select 
                        value={rssUrl} 
                        onChange={(e) => setRssUrl(e.target.value)}
                        className="w-full bg-white border border-[#2C3E50]/20 p-3 text-sm rounded-sm focus:border-[#B7410E] outline-none mb-3"
                      >
                        {RSS_FEEDS.map(feed => <option key={feed.url} value={feed.url}>{feed.label}</option>)}
                        <option value="custom">Custom URL...</option>
                      </select>
                      <input 
                        type="url" value={rssUrl} onChange={(e) => setRssUrl(e.target.value)} placeholder="https://..."
                        className="w-full bg-white border border-[#2C3E50]/20 p-3 text-sm rounded-sm focus:border-[#B7410E] outline-none font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* SETTINGS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">Region</span>
                    <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full bg-white border border-[#2C3E50]/20 p-2 text-sm rounded-sm">
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">Target Length</span>
                    <input type="number" value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} className="w-full bg-white border border-[#2C3E50]/20 p-2 text-sm rounded-sm" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">Sentiment</span>
                    <select value={sentiment} onChange={(e) => setSentiment(e.target.value)} className="w-full bg-white border border-[#2C3E50]/20 p-2 text-sm rounded-sm">
                      {SENTIMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">Complexity</span>
                    <select value={complexity} onChange={(e) => setComplexity(e.target.value)} className="w-full bg-white border border-[#2C3E50]/20 p-2 text-sm rounded-sm">
                      {COMPLEXITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={includeSidebar} onChange={e => setIncludeSidebar(e.target.checked)} className="accent-[#B7410E]" />
                    <span className="text-sm font-medium">Sidebar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={generateSocial} onChange={e => setGenerateSocial(e.target.checked)} className="accent-[#B7410E]" />
                    <span className="text-sm font-medium">Social Metadata</span>
                  </label>
                </div>

                <button type="submit" disabled={genLoading} className="w-full bg-[#B7410E] text-white font-bold uppercase tracking-widest py-4 rounded-sm hover:bg-[#8F330B] transition-colors disabled:opacity-50 flex items-center justify-center gap-3">
                  {genLoading ? <><Loader2 className="animate-spin" /> Processing...</> : <><Send size={18} /> Initialize Ghost Writer</>}
                </button>
              </form>
            </div>

            {/* Output Console */}
            <div className="lg:col-span-5">
              <div className="bg-[#2C3E50] text-[#F5F5F1] p-6 rounded-sm shadow-lg h-auto lg:h-full lg:min-h-[500px] font-mono text-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-[#B7410E] rounded-full blur-3xl opacity-5 pointer-events-none"></div>
                <h3 className="border-b border-[#F5F5F1]/20 pb-4 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                  System Output <div className={`w-2 h-2 rounded-full ${genLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                </h3>
                <div className="space-y-4">
                  {genLoading && <div className="text-yellow-400">{'>'} Synthesizing narrative...</div>}
                  {genError && <div className="text-red-300">Error: {genError}</div>}
                  {genResult && (
                    <div className="animate-in fade-in">
                      <div className="text-green-400 mb-4">SUCCESS: Article Published.</div>
                      <div className="space-y-2">
                        <div className="truncate"><span className="text-[#B7410E]">TITLE:</span> {genResult.title}</div>
                        <div><span className="text-[#B7410E]">AUTHOR:</span> {genResult.author}</div>
                        <div className="border-t border-[#F5F5F1]/20 pt-4 mt-4">
                          <a href={`/article/${genResult.slug || ''}`} target="_blank" className="inline-flex items-center gap-2 text-white hover:text-[#B7410E]">
                            View Live Article <ArrowRight size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  {!genLoading && !genResult && !genError && <div className="opacity-40 italic">{'>'} System Idle.</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: MANAGER --- */}
        {activeTab === 'MANAGER' && (
          <div className="bg-white border border-[#2C3E50]/10 rounded-sm shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-[#2C3E50]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#F5F5F1]/30">
              <h2 className="font-bold text-[#2C3E50] uppercase tracking-wider text-sm flex items-center gap-2">
                <List size={16} /> Article Repository
              </h2>
              <button onClick={fetchArticles} className="text-xs font-bold text-[#B7410E] hover:underline">
                Refresh List
              </button>
            </div>

            {managerLoading ? (
              <div className="p-12 text-center text-[#64748B]"><Loader2 className="animate-spin inline mr-2" /> Loading Database...</div>
            ) : !authKey ? (
              <div className="p-12 text-center text-[#64748B] italic">
                Please enter Security Clearance (CRON_SECRET) in the Generator tab to access the full repository.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#2C3E50] text-[#F5F5F1] text-xs uppercase font-bold">
                    <tr>
                      <th className="px-4 md:px-6 py-3 min-w-[200px]">Title</th>
                      <th className="px-4 md:px-6 py-3">Category</th>
                      <th className="px-4 md:px-6 py-3">Status</th>
                      <th className="px-4 md:px-6 py-3">Date</th>
                      <th className="px-4 md:px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C3E50]/10">
                    {articles.map((post) => (
                      <tr key={post.id} className="hover:bg-[#F5F5F1]/50 transition-colors">
                        <td className="px-4 md:px-6 py-4 font-bold text-[#2C3E50] max-w-xs truncate">{post.title}</td>
                        <td className="px-4 md:px-6 py-4 text-[#64748B]">{post.category}</td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wide ${
                            post.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {post.is_published ? 'Published' : 'Archived'}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-[#64748B] whitespace-nowrap" suppressHydrationWarning>
                          {new Date(post.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => window.open(`/article/${post.slug}`, '_blank')}
                            className="p-2 text-[#64748B] hover:text-[#2C3E50] hover:bg-[#2C3E50]/5 rounded-sm" 
                            title="View"
                          >
                            <ArrowRight size={16} />
                          </button>
                          <button 
                            onClick={() => setEditingArticle(post)}
                            className="p-2 text-[#64748B] hover:text-[#B7410E] hover:bg-[#B7410E]/10 rounded-sm" 
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => toggleVisibility(post.id, post.is_published)}
                            className={`p-2 rounded-sm ${post.is_published ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} 
                            title="Toggle Visibility"
                          >
                            {post.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button 
                            onClick={() => deleteArticle(post.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-sm" 
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- EDIT MODAL --- */}
        {editingArticle && (
          <div className="fixed inset-0 bg-[#2C3E50]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-sm shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="bg-[#2C3E50] text-[#F5F5F1] p-4 flex justify-between items-center sticky top-0">
                <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <Edit2 size={16} /> Edit Article
                </h3>
                <button onClick={() => setEditingArticle(null)} className="hover:text-[#B7410E]"><X size={20} /></button>
              </div>
              <form onSubmit={handleEditSave} className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#64748B] mb-1">Headline</label>
                  <input 
                    type="text" 
                    value={editingArticle.title} 
                    onChange={e => setEditingArticle({...editingArticle, title: e.target.value})}
                    className="w-full border border-[#2C3E50]/20 p-3 rounded-sm font-serif text-lg font-bold text-[#2C3E50] focus:border-[#B7410E] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#64748B] mb-1">Category</label>
                  <input 
                    type="text" 
                    value={editingArticle.category} 
                    onChange={e => setEditingArticle({...editingArticle, category: e.target.value})}
                    className="w-full border border-[#2C3E50]/20 p-2 rounded-sm text-sm focus:border-[#B7410E] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#64748B] mb-1">Content (Markdown)</label>
                  <textarea 
                    value={editingArticle.content} 
                    onChange={e => setEditingArticle({...editingArticle, content: e.target.value})}
                    rows={12}
                    className="w-full border border-[#2C3E50]/20 p-3 rounded-sm font-mono text-xs focus:border-[#B7410E] outline-none"
                  />
                </div>
                <div className="flex justify-end gap-4 border-t border-[#2C3E50]/10 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setEditingArticle(null)}
                    className="px-6 py-2 text-sm font-bold text-[#64748B] hover:bg-[#F5F5F1] rounded-sm"
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

      </div>
    </main>
  );
}