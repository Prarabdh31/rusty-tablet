'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, Pause, Save, Loader2, Calendar, List, RefreshCw, 
  Play, Edit2, X, Settings, History, Plus, Power, ChevronUp, ChevronDown 
} from 'lucide-react';
import { REGIONS, SENTIMENTS, COMPLEXITIES, RSS_FEEDS } from '@/lib/config/constants';
import AsyncSelect from '@/components/ui/AsyncSelect';

interface ThePulseProps {
  authKey: string;
}

export default function ThePulse({ authKey }: ThePulseProps) {
  const [pulseConfig, setPulseConfig] = useState<any>(null);
  const [pulseQueue, setPulseQueue] = useState<any[]>([]);
  const [pulseLogs, setPulseLogs] = useState<any[]>([]);
  const [pulseLoading, setPulseLoading] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [configCollapsed, setConfigCollapsed] = useState(false);

  // Helper for IST Time Display
  const formatIST = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
      }) + " IST";
    } catch {
      return dateString;
    }
  };

  const toLocalISOString = (dateString: string) => {
    const date = new Date(dateString);
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(date.getTime() - offsetMs);
    return localDate.toISOString().slice(0, 16);
  };

  // Handlers
  const fetchPulseData = async () => {
    if (!authKey) return;
    setPulseLoading(true);
    try {
      // 1. Config
      const resConfig = await fetch('/api/admin/pulse/config', {
         headers: { 'Authorization': `Bearer ${authKey}` }
      });
      if (resConfig.ok) {
        const json = await resConfig.json();
        const defaults = {
            "Objective": 50, "Critical": 20, "Satirical": 10, "Opinionated": 20
        };
        const loadedSentiments = json.config?.sentiment_weights || {};
        const mergedSentiments = Object.keys(loadedSentiments).length > 0 ? loadedSentiments : defaults;

        setPulseConfig(json.config || {
          is_active: false,
          articles_per_day: 12,
          source_weights: { "news_api_tailored": 40, "news_api_automatic": 20, "rss": 40 },
          image_weights: { "imagen": 25, "unsplash": 50, "news_source": 25 },
          region_weights: { "US": 50, "IN": 30, "Global": 20 },
          sentiment_weights: mergedSentiments,
          complexity_weights: { "GENERAL": 60, "EASY": 20, "TECHNICAL": 20 }, 
          word_count_weights: { "800": 60, "1200": 20, "500": 20 }
        });
      }

      // 2. Queue
      const resQueue = await fetch('/api/admin/pulse/queue', {
         headers: { 'Authorization': `Bearer ${authKey}` }
      });
      if (resQueue.ok) {
        const json = await resQueue.json();
        setPulseQueue(json.queue || []);
      }

      // 3. Logs
      const resLogs = await fetch('/api/admin/pulse/logs', {
         headers: { 'Authorization': `Bearer ${authKey}` }
      });
      if (resLogs.ok) {
        const json = await resLogs.json();
        setPulseLogs(json.logs || []);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setPulseLoading(false);
    }
  };

  useEffect(() => {
    if (authKey) fetchPulseData();
  }, [authKey]);

  const savePulseConfig = async () => {
    if (!authKey) return alert('Security Clearance Required');
    try {
      const res = await fetch('/api/admin/pulse/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
        body: JSON.stringify(pulseConfig)
      });
      if (res.ok) alert('Strategy Saved.');
      else alert('Failed to save.');
    } catch (e) {
       alert('Error saving config');
    }
  };

  const planPulseSchedule = async () => {
    if (!authKey) return alert('Security Clearance Required');
    setIsPlanning(true);
    try {
      const res = await fetch('/api/admin/pulse/plan', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authKey}` }
      });
      if (res.ok) {
        await fetchPulseData();
        setTimeout(async () => {
            const queueRes = await fetch('/api/admin/pulse/queue', { headers: { 'Authorization': `Bearer ${authKey}` } });
            const queueJson = await queueRes.json();
            const firstJob = queueJson.queue?.[0];
            if (firstJob && firstJob.status === 'PENDING') {
                runPulseJob(firstJob.id); 
                alert('Schedule Generated & First Article Triggered.');
            } else {
                alert('Schedule Generated.');
            }
        }, 1000);
      } else alert('Planning Failed.');
    } catch (e) { alert('Error generating schedule'); } finally { setIsPlanning(false); }
  };

  const deletePulseJob = async (id: string) => {
    if (!authKey || !confirm('Cancel this job?')) return;
    try {
      await fetch(`/api/admin/pulse/queue?id=${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${authKey}` }
      });
      fetchPulseData();
    } catch (e) { alert('Error deleting job'); }
  };

  const runPulseJob = async (id: string) => {
    if (!authKey) return alert('Security Clearance Required');
    try {
      setPulseQueue(prev => prev.map(job => job.id === id ? { ...job, status: 'PROCESSING' } : job));
      const res = await fetch('/api/admin/pulse/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (res.ok) { fetchPulseData(); } else { throw new Error(json.error || 'Run failed'); }
    } catch (e: any) { alert(`Failed to run job: ${e.message}`); fetchPulseData(); }
  };

  const handleJobEditSave = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!authKey) return alert('Security Clearance Required');
     try {
       const res = await fetch('/api/admin/pulse/queue', {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
         body: JSON.stringify({
            id: editingJob.id,
            scheduled_at: new Date(editingJob.scheduled_at).toISOString(),
            job_params: editingJob.job_params
         })
       });
       if (res.ok) { setEditingJob(null); fetchPulseData(); } else { alert('Update failed'); }
     } catch(e) { alert('Error updating job'); }
  };

  const handleAddSentiment = (s: string) => {
     if (!pulseConfig) return;
     const current = pulseConfig.sentiment_weights || {};
     if (current[s] === undefined) {
        setPulseConfig({...pulseConfig, sentiment_weights: { ...current, [s]: 10 } });
     }
  };
  const handleRemoveSentiment = (s: string) => {
    if (!pulseConfig) return;
    const current = { ...pulseConfig.sentiment_weights };
    delete current[s];
    setPulseConfig({...pulseConfig, sentiment_weights: current });
  };
  
  const WeightSlider = ({ category, label, weights, onChange, allowAdd = false }: any) => {
    if (!weights) return null;
    const total = Object.values(weights as Record<string, number>).reduce((a, b) => a + b, 0);
    const isTotalValid = Math.abs(total - 100) < 1; // Allow small float error

    return (
      <div className="bg-[#0F172A] rounded-lg p-5 border border-[#2C3E50] shadow-sm hover:border-[#374151] transition-colors relative overflow-hidden">
         <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8"></div>
         
         <div className="flex justify-between items-center mb-6 relative z-10">
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">{label}</span>
            <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${isTotalValid ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
               TOTAL: {total}%
            </div>
         </div>

         <div className="space-y-5 relative z-10">
            {Object.keys(weights).map((key: string) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[#E2E8F0] font-medium">{key.replace(/_/g, ' ')}</span>
                    {allowAdd && (
                        <button onClick={() => handleRemoveSentiment(key)} className="text-[#64748B] hover:text-red-400 transition-colors"><X size={10}/></button>
                    )}
                  </div>
                  <span className="text-[#B7410E] font-mono font-bold">{weights[key]}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1E293B] rounded-full overflow-hidden">
                   <div 
                      className="h-full bg-[#B7410E] rounded-full transition-all duration-300"
                      style={{ width: `${weights[key]}%` }}
                   ></div>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" step="5"
                  value={weights[key]} 
                  onChange={(e) => onChange({...weights, [key]: Number(e.target.value)})} 
                  className="w-full absolute opacity-0 cursor-pointer -mt-4 h-4" 
                  title={`Adjust ${key}`}
                />
              </div>
            ))}
         </div>
         
         {allowAdd && (
             <div className="mt-5 pt-4 border-t border-[#1E293B] relative z-10">
                 <p className="text-[10px] text-[#64748B] mb-3 font-bold uppercase">Add Metric:</p>
                 <div className="flex flex-wrap gap-2">
                     {SENTIMENTS.filter(s => !weights[s]).map(s => (
                         <button 
                            key={s} 
                            onClick={() => handleAddSentiment(s)} 
                            className="flex items-center gap-1 text-[10px] bg-[#1E293B] hover:bg-[#B7410E] hover:text-white text-[#94A3B8] px-2 py-1.5 rounded transition-all"
                         >
                             <Plus size={10} /> {s}
                         </button>
                     ))}
                 </div>
             </div>
         )}
      </div>
    );
  };

  const VolumeControl = () => {
      const val = pulseConfig.articles_per_day;
      const setVal = (v: number) => setPulseConfig({...pulseConfig, articles_per_day: Math.max(1, Math.min(48, v))});
      
      return (
        <div className="bg-[#0F172A] rounded-lg p-5 border border-[#2C3E50] flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="relative z-10">
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block mb-4">Daily Volume</span>
                <div className="flex items-center justify-between bg-[#1E293B] p-2 rounded-md border border-[#2C3E50]">
                    <button onClick={() => setVal(val - 1)} className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#2C3E50] rounded transition-colors"><ChevronDown size={16} className="rotate-90" /></button>
                    <div className="text-center">
                        <span className="text-2xl font-bold text-[#F5F5F1] font-mono">{val}</span>
                        <span className="text-[10px] text-[#64748B] block">ARTS / DAY</span>
                    </div>
                    <button onClick={() => setVal(val + 1)} className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#2C3E50] rounded transition-colors"><Plus size={16}/></button>
                </div>
            </div>
            <div className="mt-4 text-[10px] text-[#64748B] text-center relative z-10">
                ~{(1440 / val).toFixed(0)} min interval
            </div>
        </div>
      )
  }

  if (!pulseConfig) return <div className="flex h-64 items-center justify-center text-[#64748B] font-mono animate-pulse">INITIALIZING CONTROL LINK...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
        
        {/* TOP: COMMAND BAR */}
        <div className="bg-[#1E293B] border border-[#2C3E50] rounded-lg p-1 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-4 z-40 backdrop-blur-md bg-opacity-90">
           <div className="flex items-center gap-4 px-4 py-2 w-full sm:w-auto">
               <div className={`w-3 h-3 rounded-full ${pulseConfig.is_active ? 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
               <div className="flex flex-col">
                   <h2 className="text-sm font-bold text-[#F5F5F1] tracking-wide">{pulseConfig.is_active ? 'ENGINE ONLINE' : 'ENGINE OFFLINE'}</h2>
                   <span className="text-[10px] text-[#64748B] font-mono uppercase">{pulseQueue.length} PENDING OPS</span>
               </div>
           </div>
           
           <div className="flex items-center gap-2 p-1 w-full sm:w-auto">
              <button 
                onClick={() => setPulseConfig({...pulseConfig, is_active: !pulseConfig.is_active})} 
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    pulseConfig.is_active 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20' 
                    : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/20'
                }`}
              >
                <Power size={14} /> {pulseConfig.is_active ? 'STOP' : 'START'}
              </button>
              
              <button 
                onClick={savePulseConfig} 
                className="flex-1 sm:flex-none px-6 py-2.5 bg-[#F5F5F1] text-[#0F172A] hover:bg-white text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Save size={14} /> Save Config
              </button>
           </div>
        </div>

        {/* MIDDLE: STRATEGY ROOM */}
        <div className="space-y-4">
            <div 
                className="flex items-center gap-2 text-[#94A3B8] hover:text-[#F5F5F1] cursor-pointer transition-colors w-fit" 
                onClick={() => setConfigCollapsed(!configCollapsed)}
            >
                <Settings size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Configuration Matrix</span>
                {configCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </div>

            {!configCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <VolumeControl />
                    <WeightSlider category="source" label="Source Mix" weights={pulseConfig.source_weights} onChange={(w: any) => setPulseConfig({...pulseConfig, source_weights: w})} />
                    <WeightSlider category="image" label="Visual Engine" weights={pulseConfig.image_weights} onChange={(w: any) => setPulseConfig({...pulseConfig, image_weights: w})} />
                    <WeightSlider category="region" label="Regional Focus" weights={pulseConfig.region_weights} onChange={(w: any) => setPulseConfig({...pulseConfig, region_weights: w})} />
                    
                    <div className="lg:col-span-2 xl:col-span-2">
                        <WeightSlider category="sentiment" label="Sentiment Spectrum" weights={pulseConfig.sentiment_weights} onChange={(w: any) => setPulseConfig({...pulseConfig, sentiment_weights: w})} allowAdd={true} />
                    </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT: QUEUE */}
            <div className="bg-[#1E293B] border border-[#2C3E50] rounded-lg overflow-hidden shadow-sm flex flex-col h-[500px]">
                <div className="p-4 border-b border-[#2C3E50] flex justify-between items-center bg-[#0F172A]">
                   <h3 className="font-bold text-[#F5F5F1] text-xs uppercase tracking-wider flex items-center gap-2">
                       <List size={14} className="text-[#B7410E]" /> Operation Queue
                   </h3>
                   <div className="flex gap-2">
                     <button onClick={planPulseSchedule} disabled={isPlanning} className="text-[#B7410E] text-[10px] font-bold uppercase border border-[#B7410E]/30 px-3 py-1 rounded hover:bg-[#B7410E] hover:text-white transition-colors flex items-center gap-2">
                        {isPlanning ? <Loader2 className="animate-spin" size={10} /> : <Calendar size={10} />} REGENERATE
                     </button>
                     <button onClick={fetchPulseData} className="text-[#64748B] hover:text-[#B7410E] transition-colors"><RefreshCw size={14} /></button>
                   </div>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                   {pulseQueue.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-[#64748B] gap-2">
                          <List size={24} className="opacity-20" />
                          <span className="text-xs font-mono">NO PENDING OPS</span>
                      </div>
                   ) : (
                      pulseQueue.map((job) => (
                        <div key={job.id} className="bg-[#0F172A] border border-[#2C3E50] p-3 rounded-md flex justify-between items-center group hover:border-[#B7410E]/50 transition-colors">
                           <div className="flex-1">
                              <div className="flex items-center gap-2">
                                  <span className="text-[#B7410E] font-mono text-[10px] bg-[#B7410E]/10 px-1.5 py-0.5 rounded">{new Date(job.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  <span className="text-[#F5F5F1] text-xs font-bold">{job.job_params.mode.replace(/_/g, ' ')}</span>
                              </div>
                              <div className="text-[#64748B] text-[10px] flex gap-2">
                                 <span>{job.job_params.config.target_region}</span>
                                 <span>•</span>
                                 <span className="truncate max-w-[150px]">{job.job_params.config.news_topic || 'General'}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => runPulseJob(job.id)} className="p-2 text-[#64748B] hover:text-green-400 hover:bg-green-400/10 rounded" title="Force Run"><Play size={14} /></button>
                             <button onClick={() => setEditingJob(job)} className="p-2 text-[#64748B] hover:text-[#B7410E] hover:bg-[#B7410E]/10 rounded" title="Edit Params"><Edit2 size={14} /></button>
                             <button onClick={() => deletePulseJob(job.id)} className="p-2 text-[#64748B] hover:text-red-400 hover:bg-red-400/10 rounded" title="Kill Job"><X size={14} /></button>
                           </div>
                        </div>
                      ))
                   )}
                </div>
            </div>

            {/* RIGHT: HISTORY */}
            <div className="bg-[#1E293B] border border-[#2C3E50] rounded-lg overflow-hidden shadow-sm flex flex-col h-[500px]">
                <div className="p-4 border-b border-[#2C3E50] bg-[#0F172A]">
                   <h3 className="font-bold text-[#F5F5F1] text-xs uppercase tracking-wider flex items-center gap-2">
                       <History size={14} className="text-[#B7410E]" /> Mission Logs
                   </h3>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                   <table className="w-full text-xs text-left">
                      <thead className="bg-[#1E293B] text-[#64748B] font-bold uppercase tracking-wider sticky top-0">
                         <tr><th className="px-4 py-3 bg-[#1E293B]">Time</th><th className="px-4 py-3 bg-[#1E293B]">Status</th><th className="px-4 py-3 bg-[#1E293B]">Output</th></tr>
                      </thead>
                      <tbody className="divide-y divide-[#2C3E50] bg-[#0F172A]">
                         {pulseLogs.map((log) => (
                           <tr key={log.id} className="hover:bg-[#1E293B] transition-colors">
                              <td className="px-4 py-3 font-mono text-[#64748B] whitespace-nowrap" suppressHydrationWarning>{new Date(log.executed_at).toLocaleTimeString()}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                    log.status === 'SUCCESS' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-red-400 border-red-500/20 bg-red-500/5'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[#F5F5F1] truncate max-w-[200px]" title={JSON.stringify(log.result_summary)}>
                                {log.result_summary?.title || log.result_summary?.error || "Unknown"}
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
            </div>
        </div>

        {/* PULSE JOB EDIT MODAL */}
        {editingJob && (
            <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-[#1E293B] w-full max-w-2xl rounded-lg border border-[#2C3E50] shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="bg-[#0F172A] p-4 flex justify-between items-center border-b border-[#2C3E50]">
                  <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 text-[#F5F5F1]"><Settings size={16} className="text-[#B7410E]" /> Edit Mission Parameters</h3>
                  <button onClick={() => setEditingJob(null)} className="text-[#64748B] hover:text-[#B7410E]"><X size={20} /></button>
                </div>
                <form onSubmit={handleJobEditSave} className="p-6 space-y-6">
                  {/* Common Fields */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-[#94A3B8] mb-2">Scheduled Time</label>
                        <input 
                            type="datetime-local" 
                            value={toLocalISOString(editingJob.scheduled_at)}
                            onChange={e => setEditingJob({...editingJob, scheduled_at: new Date(e.target.value).toISOString()})}
                            className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded text-xs text-[#F5F5F1] focus:border-[#B7410E] outline-none font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-[#94A3B8] mb-2">Operation Mode</label>
                        <select 
                           value={editingJob.job_params.mode}
                           onChange={e => setEditingJob({...editingJob, job_params: {...editingJob.job_params, mode: e.target.value}})}
                           className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded text-xs text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                        >
                            <option value="MANUAL">MANUAL</option>
                            <option value="SPECIFIC_RSS">RSS FEED</option>
                            <option value="NEWS_API_AI">NEWS API</option>
                        </select>
                    </div>
                  </div>

                  {/* Mode Specific Inputs */}
                  <div className="p-4 bg-[#0F172A] rounded border border-[#2C3E50]">
                     {editingJob.job_params.mode === 'NEWS_API_AI' && (
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold uppercase text-[#B7410E]">Intelligence Targeting</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-[#64748B] mb-1">News Mode</label>
                                    <select 
                                        value={editingJob.job_params.config.news_v2_mode || 'TARGETED'}
                                        onChange={e => setEditingJob({...editingJob, job_params: {...editingJob.job_params, config: {...editingJob.job_params.config, news_v2_mode: e.target.value}}})}
                                        className="w-full bg-[#1E293B] border border-[#2C3E50] p-2 text-xs text-[#F5F5F1] focus:border-[#B7410E]"
                                    >
                                        <option value="TARGETED">TARGETED</option>
                                        <option value="DEEP_DIVE">DEEP DIVE</option>
                                        <option value="BREAKING">BREAKING</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-[#64748B] mb-1">Sort</label>
                                    <select 
                                        value={editingJob.job_params.config.news_sort || 'IMPORTANCE'}
                                        onChange={e => setEditingJob({...editingJob, job_params: {...editingJob.job_params, config: {...editingJob.job_params.config, news_sort: e.target.value}}})}
                                        className="w-full bg-[#1E293B] border border-[#2C3E50] p-2 text-xs text-[#F5F5F1] focus:border-[#B7410E]"
                                    >
                                        <option value="IMPORTANCE">IMPORTANCE</option>
                                        <option value="VIRALITY">VIRALITY</option>
                                        <option value="RELEVANCE">RELEVANCE</option>
                                        <option value="DATE">DATE</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-[#64748B] mb-1">Keyword</label>
                                <input 
                                    type="text"
                                    value={editingJob.job_params.config.news_keyword || ''}
                                    onChange={e => setEditingJob({...editingJob, job_params: {...editingJob.job_params, config: {...editingJob.job_params.config, news_keyword: e.target.value}}})}
                                    className="w-full bg-[#1E293B] border border-[#2C3E50] p-2 text-xs text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <AsyncSelect 
                                    label="Category URI" type="CATEGORY" 
                                    value={editingJob.job_params.config.news_category_uri || ''} 
                                    onChange={(val) => setEditingJob({...editingJob, job_params: {...editingJob.job_params, config: {...editingJob.job_params.config, news_category_uri: val}}})} 
                                    placeholder="Search..." 
                                />
                                <AsyncSelect 
                                    label="Location URI" type="LOCATION" 
                                    value={editingJob.job_params.config.news_location_uri || ''} 
                                    onChange={(val) => setEditingJob({...editingJob, job_params: {...editingJob.job_params, config: {...editingJob.job_params.config, news_location_uri: val}}})} 
                                    placeholder="Search..." 
                                />
                            </div>
                        </div>
                     )}

                     {editingJob.job_params.mode === 'SPECIFIC_RSS' && (
                        <div>
                             <label className="block text-[10px] font-bold uppercase text-[#B7410E] mb-2">RSS URL</label>
                             <div className="flex flex-col gap-2">
                                <select 
                                    value={editingJob.job_params.config.rss_url || RSS_FEEDS[0].url}
                                    onChange={e => setEditingJob({...editingJob, job_params: {...editingJob.job_params, config: {...editingJob.job_params.config, rss_url: e.target.value}}})}
                                    className="w-full bg-[#1E293B] border border-[#2C3E50] p-2 text-xs text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                                >
                                    {RSS_FEEDS.map(f => <option key={f.url} value={f.url}>{f.label}</option>)}
                                    <option value="custom">Custom URL</option>
                                </select>
                                <input 
                                    type="text"
                                    value={editingJob.job_params.config.rss_url || ''}
                                    onChange={e => setEditingJob({...editingJob, job_params: {...editingJob.job_params, config: {...editingJob.job_params.config, rss_url: e.target.value}}})}
                                    className="w-full bg-[#1E293B] border border-[#2C3E50] p-2 text-xs text-[#F5F5F1] focus:border-[#B7410E] outline-none font-mono"
                                    placeholder="https://..."
                                />
                             </div>
                        </div>
                     )}

                     {editingJob.job_params.mode === 'MANUAL' && (
                        <div>
                             <label className="block text-[10px] font-bold uppercase text-[#B7410E] mb-2">Content</label>
                             <textarea 
                                value={editingJob.job_params.config.content_input || ''}
                                onChange={e => setEditingJob({...editingJob, job_params: {...editingJob.job_params, config: {...editingJob.job_params.config, content_input: e.target.value}}})}
                                className="w-full bg-[#1E293B] border border-[#2C3E50] p-2 text-xs text-[#F5F5F1] focus:border-[#B7410E] outline-none font-mono"
                                rows={3}
                            />
                        </div>
                     )}
                  </div>

                  {/* Standard Params */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-bold uppercase text-[#94A3B8] mb-2">Region</label>
                        <select 
                            value={editingJob.job_params.config.target_region} 
                            onChange={e => setEditingJob({...editingJob, job_params: {...editingJob.job_params, config: {...editingJob.job_params.config, target_region: e.target.value}}})}
                            className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded text-xs text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                        >
                            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold uppercase text-[#94A3B8] mb-2">Complexity</label>
                        <select 
                            value={editingJob.job_params.config.complexity} 
                            onChange={e => setEditingJob({...editingJob, job_params: {...editingJob.job_params, config: {...editingJob.job_params.config, complexity: e.target.value}}})}
                            className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded text-xs text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                        >
                            {COMPLEXITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-[#94A3B8] mb-2">Sentiment (Comma Separated)</label>
                        <input 
                            type="text"
                            value={editingJob.job_params.config.article_sentiment} 
                            onChange={e => setEditingJob({...editingJob, job_params: {...editingJob.job_params, config: {...editingJob.job_params.config, article_sentiment: e.target.value}}})}
                            className="w-full bg-[#0F172A] border border-[#2C3E50] p-3 rounded text-xs text-[#F5F5F1] focus:border-[#B7410E] outline-none"
                        />
                     </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#2C3E50]">
                    <button type="button" onClick={() => setEditingJob(null)} className="px-6 py-2.5 text-xs font-bold text-[#64748B] hover:text-[#F5F5F1] hover:bg-[#2C3E50] rounded transition-colors">ABORT</button>
                    <button type="submit" className="px-8 py-2.5 bg-[#B7410E] text-white text-xs font-bold uppercase rounded hover:bg-[#8F330B] shadow-lg shadow-[#B7410E]/20 transition-all">Confirm Update</button>
                  </div>
                </form>
              </div>
            </div>
        )}
    </div>
  );
}