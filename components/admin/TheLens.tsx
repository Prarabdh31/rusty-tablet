'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Filter, Loader2, ArrowRight, Edit2, Eye, EyeOff, Trash2, Save, X } from 'lucide-react';

interface TheLensProps {
  authKey: string;
}

export default function TheLens({ authKey }: TheLensProps) {
  const [articles, setArticles] = useState<any[]>([]);
  const [managerLoading, setManagerLoading] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchArticles = async () => {
    if (!authKey) return; 
    setManagerLoading(true);
    try {
      const response = await fetch('/api/admin/manage', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authKey}` }
      });
      if (!response.ok) throw new Error('Failed');
      const json = await response.json();
      if (json.success) setArticles(json.data);
    } catch (error) {
      console.error("Fetch Error", error);
    } finally {
      setManagerLoading(false);
    }
  };

  useEffect(() => {
    if (authKey) fetchArticles();
  }, [authKey]);

  // Handlers (Delete, Toggle, Save)
  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    if (!authKey) return alert('Security Clearance Required.');
    setArticles(prev => prev.map(a => a.id === id ? { ...a, is_published: !currentStatus } : a));
    try {
      await fetch('/api/admin/manage', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify({ id, is_published: !currentStatus }) });
    } catch (error) { alert('Update failed'); fetchArticles(); }
  };

  const deleteArticle = async (id: string) => {
    if (!authKey) return alert('Security Clearance Required.');
    if (!confirm('Delete permanently?')) return;
    try {
      await fetch(`/api/admin/manage?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authKey}` } });
      fetchArticles();
    } catch (error) { alert('Delete failed'); }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authKey) return alert('Security Clearance Required.');
    try {
      const res = await fetch('/api/admin/manage', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify({ id: editingArticle.id, title: editingArticle.title, content: editingArticle.content, category: editingArticle.category }) });
      if (!res.ok) throw new Error();
      setEditingArticle(null);
      fetchArticles();
    } catch { alert('Save failed'); }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || article.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = ['All', ...Array.from(new Set(articles.map(a => a.category))).filter(Boolean).sort()];

  return (
    <div className="space-y-6 animate-in fade-in">
        {/* Toolbar */}
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
                    {uniqueCategories.map((c: any) => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <button onClick={fetchArticles} className="px-4 py-2 bg-[#B7410E] text-white text-xs font-bold uppercase rounded-sm hover:bg-white hover:text-[#B7410E] transition-colors">
                Refresh Data
            </button>
        </div>

        {/* Grid */}
        <div className="bg-[#1E293B] border border-[#2C3E50] rounded-sm overflow-hidden shadow-2xl">
            {managerLoading ? (
                <div className="p-20 text-center text-[#64748B] font-mono"><Loader2 className="animate-spin inline mr-2" /> ACCESSING DATABASE...</div>
            ) : (
                <table className="w-full text-sm text-left">
                <thead className="bg-[#0F172A] text-[#64748B] text-[10px] uppercase font-bold tracking-wider border-b border-[#2C3E50]">
                    <tr><th className="px-6 py-4">Status</th><th className="px-6 py-4">Title</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4 text-right">Controls</th></tr>
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
                            <td className="px-6 py-4 font-bold text-[#F5F5F1] group-hover:text-[#B7410E] transition-colors max-w-md truncate">{post.title}</td>
                            <td className="px-6 py-4 text-[#64748B] font-mono text-xs uppercase">{post.category}</td>
                            <td className="px-6 py-4 text-[#64748B] font-mono text-xs" suppressHydrationWarning>{new Date(post.created_at).toLocaleDateString()}</td>
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

        {/* Modal */}
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
    </div>
  );
}