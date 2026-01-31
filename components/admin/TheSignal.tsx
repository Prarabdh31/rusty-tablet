'use client';

import { useState, useEffect } from 'react';
import { Send, FileText, Users, Mail, Loader2, RefreshCw, CheckCircle, Plus, X, List } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TheSignalProps {
  authKey: string;
}

// Fallback image for emails (Industrial/Abstract)
const FALLBACK_IMG = "https://images.unsplash.com/photo-1486718448742-163732cd1544?w=600&q=80";

// --- EMAIL TEMPLATE GENERATOR ---
const generateEmailTemplate = (subject: string, intro: string, articles: any[]) => {
  const siteUrl = 'https://www.rustytablet.com';
  
  const articleRows = articles.map(post => {
    // Ensure we always have a visual
    const imgUrl = post.featured_image || FALLBACK_IMG;
    
    return `
    <tr>
      <td style="padding: 30px 0; border-bottom: 1px solid #e2e8f0;">
        <div style="margin-bottom: 20px; background-color: #f1f5f9; border-radius: 4px; overflow: hidden;">
           <img src="${imgUrl}" alt="${post.title}" style="width: 100%; max-width: 600px; height: auto; display: block; border: 0;" />
        </div>
        <p style="margin: 0 0 10px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #B7410E; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">
          ${post.category || 'DISPATCH'}
        </p>
        <h3 style="margin: 0 0 12px 0; font-family: 'Georgia', serif; font-size: 22px; line-height: 1.3; color: #0F172A;">
          <a href="${siteUrl}/article/${post.slug}" style="color: #0F172A; text-decoration: none;">${post.title}</a>
        </h3>
        <p style="margin: 0 0 16px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #475569;">
          ${post.excerpt || 'Click to read the full analysis on Rusty Tablet.'}
        </p>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td align="left">
              <a href="${siteUrl}/article/${post.slug}" target="_blank" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; color: #B7410E; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 2px; border-bottom: 2px solid #B7410E;">
                Read Full Story
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `}).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <!-- CONTAINER -->
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 1px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- HEADER -->
          <tr>
            <td style="padding: 40px 40px; background-color: #0F172A; text-align: center;">
              <div style="display: inline-block; width: 48px; height: 48px; background-color: #B7410E; border-radius: 2px; line-height: 48px; color: #ffffff; font-family: 'Georgia', serif; font-size: 28px; font-weight: bold; margin-bottom: 16px;">R</div>
              <div style="color: #ffffff; font-family: 'Georgia', serif; font-size: 26px; font-weight: bold; letter-spacing: -0.5px;">Rusty Tablet</div>
              <div style="color: #94A3B8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px;">Digital Industrialism</div>
            </td>
          </tr>

          <!-- INTRO -->
          <tr>
            <td style="padding: 40px 40px 10px 40px;">
              <p style="margin: 0; font-family: 'Georgia', serif; font-size: 18px; line-height: 1.6; color: #334155; font-style: italic;">
                "${intro.replace(/\n/g, '<br/>')}"
              </p>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding: 20px 40px;">
               <div style="height: 4px; background-color: #B7410E; width: 60px;"></div>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding: 10px 40px 40px 40px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                ${articleRows}
              </table>
            </td>
          </tr>

          <!-- PROMOTED CATEGORIES -->
          <tr>
            <td style="padding: 30px 40px; background-color: #F8FAFC; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 15px 0; font-family: 'Helvetica Neue', sans-serif; font-size: 10px; font-weight: bold; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">
                Explore The Spectrum
              </p>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}/category/technology" style="display: inline-block; margin: 0 10px; color: #0F172A; text-decoration: none; font-size: 12px; font-weight: bold;">Technology</a>
                    <span style="color: #cbd5e1;">/</span>
                    <a href="${siteUrl}/category/politics" style="display: inline-block; margin: 0 10px; color: #0F172A; text-decoration: none; font-size: 12px; font-weight: bold;">Politics</a>
                    <span style="color: #cbd5e1;">/</span>
                    <a href="${siteUrl}/category/industry" style="display: inline-block; margin: 0 10px; color: #0F172A; text-decoration: none; font-size: 12px; font-weight: bold;">Industry</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 40px 20px; background-color: #0F172A; text-align: center;">
              <p style="margin: 0 0 10px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #94A3B8;">
                © ${new Date().getFullYear()} Rusty Tablet Media
              </p>
              <p style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #475569;">
                <a href="${siteUrl}" style="color: #64748B; text-decoration: none; border-bottom: 1px dotted #64748B;">Read Online</a>
                &nbsp;&nbsp;&bull;&nbsp;&nbsp;
                <a href="${siteUrl}/unsubscribe" style="color: #64748B; text-decoration: none; border-bottom: 1px dotted #64748B;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export default function TheSignal({ authKey }: TheSignalProps) {
  // State
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  
  const [subject, setSubject] = useState('The Rusty Tablet: Weekly Dispatch');
  const [intro, setIntro] = useState("Here is what we've been reading this week. A curated selection of signals from the noise.");
  
  const [previewHtml, setPreviewHtml] = useState('');
  const [sending, setSending] = useState(false);
  const [testMode, setTestMode] = useState(true);

  // Fetch Articles
  const fetchArticles = async () => {
    if (!authKey) return;
    setLoadingArticles(true);
    try {
      const res = await fetch('/api/admin/manage', {
        headers: { 'Authorization': `Bearer ${authKey}` }
      });
      const json = await res.json();
      if (json.success) setArticles(json.data.slice(0, 20)); // Get top 20 recent
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    if (authKey) fetchArticles();
  }, [authKey]);

  // Toggle Article Selection
  const toggleArticle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Generate HTML
  const handleGeneratePreview = () => {
    const selectedArticles = articles.filter(a => selectedIds.includes(a.id));
    if (selectedArticles.length === 0) return alert("Select at least one article.");
    const html = generateEmailTemplate(subject, intro, selectedArticles);
    setPreviewHtml(html);
  };

  // Send Logic
  const handleSend = async () => {
    if (!authKey) return alert('Security Clearance Required');
    if (!previewHtml) return alert("Generate a preview first.");
    
    if (!confirm(testMode ? 'Send TEST email to Admin?' : 'BROADCAST to ALL subscribers? This cannot be undone.')) return;

    setSending(true);
    try {
      const res = await fetch('/api/admin/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
        body: JSON.stringify({ subject, htmlContent: previewHtml, testMode })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Signal Transmitted. Recipients: ${data.count}`);
      } else {
        alert(`Transmission Failed: ${data.error}`);
      }
    } catch (e) {
      alert('Network Error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 1. COMPOSER GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         
         {/* LEFT: CONTENT SELECTOR */}
         <div className="space-y-6">
            
            {/* Intro Config */}
            <div className="bg-[#1E293B] border border-[#2C3E50] rounded-sm p-5">
               <h3 className="font-bold text-[#F5F5F1] text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                   <FileText size={16} className="text-[#B7410E]" /> 1. Editorial Context
               </h3>
               <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">Subject Line</label>
                    <input 
                        type="text" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded-sm text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">Editorial Intro</label>
                    <textarea 
                        value={intro}
                        onChange={(e) => setIntro(e.target.value)}
                        rows={4}
                        className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded-sm text-sm text-[#F5F5F1] focus:border-[#B7410E] outline-none font-serif"
                    />
                  </div>
               </div>
            </div>

            {/* Article Picker */}
            <div className="bg-[#1E293B] border border-[#2C3E50] rounded-sm p-5 flex flex-col h-[500px]">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[#F5F5F1] text-xs uppercase tracking-wider flex items-center gap-2">
                     <List size={16} className="text-[#B7410E]" /> 2. Select Dispatches
                  </h3>
                  <button onClick={fetchArticles} className="text-[#64748B] hover:text-[#B7410E]"><RefreshCw size={14} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                  {loadingArticles ? (
                     <div className="text-center py-20 text-[#64748B] text-xs font-mono"><Loader2 className="animate-spin inline mr-2"/> LOADING ARCHIVES...</div>
                  ) : articles.map(post => (
                     <div 
                       key={post.id} 
                       onClick={() => toggleArticle(post.id)}
                       className={`p-3 rounded-sm border cursor-pointer transition-all flex justify-between items-start gap-3 ${
                          selectedIds.includes(post.id) 
                          ? 'bg-[#B7410E]/10 border-[#B7410E]' 
                          : 'bg-[#0F172A] border-[#2C3E50] hover:border-[#64748B]'
                       }`}
                     >
                        <div className="flex-1">
                           <div className="text-[9px] font-mono text-[#64748B] mb-0.5">{new Date(post.created_at).toLocaleDateString()}</div>
                           <h4 className={`text-xs font-bold leading-tight ${selectedIds.includes(post.id) ? 'text-[#B7410E]' : 'text-[#F5F5F1]'}`}>
                              {post.title}
                           </h4>
                           <span className="text-[9px] text-[#64748B] uppercase tracking-wide mt-1 block">{post.category}</span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                           selectedIds.includes(post.id) ? 'bg-[#B7410E] border-[#B7410E] text-white' : 'border-[#64748B] text-transparent'
                        }`}>
                           <CheckCircle size={10} />
                        </div>
                     </div>
                  ))}
               </div>
               <div className="pt-4 mt-2 border-t border-[#2C3E50] text-right">
                  <button 
                     onClick={handleGeneratePreview}
                     className="bg-[#F5F5F1] text-[#0F172A] hover:bg-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-sm transition-colors"
                  >
                     Generate Preview
                  </button>
               </div>
            </div>

         </div>

         {/* RIGHT: PREVIEW & SEND */}
         <div className="space-y-6">
            <div className="bg-[#1E293B] border border-[#2C3E50] rounded-sm p-5 h-[710px] flex flex-col">
               <h3 className="font-bold text-[#F5F5F1] text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Mail size={16} className="text-[#B7410E]" /> 3. Output Preview
               </h3>
               <div className="flex-1 bg-white rounded-sm overflow-hidden relative">
                  {previewHtml ? (
                     <iframe 
                        srcDoc={previewHtml} 
                        className="w-full h-full border-none" 
                        title="Email Preview"
                     />
                  ) : (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <Mail size={32} className="opacity-20" />
                        <span className="text-xs font-mono uppercase tracking-widest opacity-50">Waiting for Signal Generation</span>
                     </div>
                  )}
               </div>
            </div>

            {/* SEND CONTROLS */}
            <div className="bg-[#1E293B] border border-[#2C3E50] rounded-sm p-6">
               <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex gap-6">
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="radio" checked={testMode} onChange={() => setTestMode(true)} className="accent-[#B7410E]" />
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-[#F5F5F1] group-hover:text-[#B7410E] transition-colors">Test Fire</span>
                             <span className="text-[9px] text-[#64748B]">Admin Only</span>
                          </div>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="radio" checked={!testMode} onChange={() => setTestMode(false)} className="accent-[#B7410E]" />
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-[#F5F5F1] group-hover:text-[#B7410E] transition-colors">Live Broadcast</span>
                             <span className="text-[9px] text-[#64748B]">All Subscribers</span>
                          </div>
                       </label>
                   </div>
                   
                   <button 
                      onClick={handleSend}
                      disabled={sending || !previewHtml}
                      className={`px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${
                         sending || !previewHtml 
                         ? 'bg-[#2C3E50] text-[#64748B] cursor-not-allowed' 
                         : 'bg-[#B7410E] text-white hover:bg-[#8F330B] shadow-lg shadow-[#B7410E]/20'
                      }`}
                   >
                      {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                      {sending ? 'TRANSMITTING...' : 'INITIATE BROADCAST'}
                   </button>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}