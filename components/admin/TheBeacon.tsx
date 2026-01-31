'use client';

import { useState, useEffect } from 'react';
import { Save, Globe, Share2, Search, Loader2, RefreshCw } from 'lucide-react';

interface TheBeaconProps {
  authKey: string;
}

export default function TheBeacon({ authKey }: TheBeaconProps) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Preview State
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);

  const fetchSettings = async () => {
    if (!authKey) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/beacon/settings', {
        headers: { 'Authorization': `Bearer ${authKey}` }
      });
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authKey) fetchSettings();
  }, [authKey]);

  const handleSave = async () => {
    if (!authKey) return alert('Security Clearance Required');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/beacon/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
        body: JSON.stringify(settings)
      });
      if (res.ok) alert('Beacon Settings Updated.');
      else alert('Failed to save.');
    } catch (e) {
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* Top Bar: Status & Actions */}
      <div className="bg-[#1E293B] border border-[#2C3E50] rounded-lg p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
           <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
              <Globe className="animate-pulse" />
           </div>
           <div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-[#F5F5F1]">Signal Control</h2>
              <p className="text-xs font-mono text-[#64748B]">Global Metadata & Discovery Engine</p>
           </div>
        </div>
        <div className="flex gap-4">
            <button onClick={fetchSettings} className="p-2 text-[#64748B] hover:text-[#B7410E] transition-colors"><RefreshCw size={20}/></button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-[#2C3E50] text-[#F5F5F1] hover:bg-[#B7410E] hover:text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Configuration
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: GLOBAL METADATA */}
        <div className="bg-[#1E293B] border border-[#2C3E50] rounded-sm p-6">
           <div className="flex items-center gap-2 mb-6 border-b border-[#2C3E50] pb-2">
              <Search size={18} className="text-[#B7410E]" />
              <h3 className="font-bold text-[#F5F5F1] text-xs uppercase tracking-wider">Global Metadata</h3>
           </div>
           
           <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-2">Site Name</label>
                <input 
                  type="text" 
                  value={settings.site_name || ''} 
                  onChange={(e) => updateSetting('site_name', e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-2">Default Description</label>
                <textarea 
                  rows={3}
                  value={settings.site_description || ''} 
                  onChange={(e) => updateSetting('site_description', e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-2">Keywords (Comma Separated)</label>
                <input 
                  type="text" 
                  value={settings.site_keywords || ''} 
                  onChange={(e) => updateSetting('site_keywords', e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-2">Twitter Handle</label>
                    <input 
                      type="text" 
                      value={settings.twitter_handle || ''} 
                      onChange={(e) => updateSetting('twitter_handle', e.target.value)}
                      className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-2">Language</label>
                    <input 
                      type="text" 
                      value={settings.language || 'en-US'} 
                      onChange={(e) => updateSetting('language', e.target.value)}
                      className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT: SOCIAL PREVIEW SIMULATOR */}
        <div className="bg-[#1E293B] border border-[#2C3E50] rounded-sm p-6">
           <div className="flex items-center gap-2 mb-6 border-b border-[#2C3E50] pb-2">
              <Share2 size={18} className="text-[#B7410E]" />
              <h3 className="font-bold text-[#F5F5F1] text-xs uppercase tracking-wider">Social Preview</h3>
           </div>

           <div className="mb-6">
             <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-2">Test Article Slug or URL</label>
             <div className="flex gap-2">
               <input 
                  type="text" 
                  placeholder="e.g. the-silent-renaissance-of-analog-computing"
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                />
               <button className="px-4 bg-[#2C3E50] text-[#F5F5F1] text-xs font-bold uppercase rounded hover:bg-[#B7410E] transition-colors">
                  Check
               </button>
             </div>
             <p className="text-[10px] text-[#64748B] mt-2 italic">* Live preview functionality coming in v3.1</p>
           </div>

           {/* Mock Preview Cards */}
           <div className="space-y-6 opacity-60 pointer-events-none filter grayscale">
              {/* Twitter Card Mock */}
              <div className="border border-[#2C3E50] rounded-xl overflow-hidden bg-black max-w-sm mx-auto">
                 <div className="h-32 bg-[#2C3E50] flex items-center justify-center text-[#64748B] text-xs">OG Image</div>
                 <div className="p-3">
                    <div className="text-[#F5F5F1] font-bold text-sm mb-1">Article Title Placeholder</div>
                    <div className="text-[#64748B] text-xs">rustytablet.com</div>
                 </div>
              </div>
              
              {/* Google Result Mock */}
              <div className="max-w-sm mx-auto bg-white p-3 rounded text-left">
                  <div className="text-xs text-[#202124]">rustytablet.com › article › ...</div>
                  <div className="text-lg text-[#1a0dab] hover:underline cursor-pointer">Article Title Placeholder - Rusty Tablet</div>
                  <div className="text-xs text-[#4d5156] mt-1">Oct 24, 2024 — Description placeholder text appearing in search results...</div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}