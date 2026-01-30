'use client';

import { X, Activity, Ghost, Aperture } from 'lucide-react';

interface ManifestoProps {
  onClose: () => void;
}

export default function Manifesto({ onClose }: ManifestoProps) {
  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#1E293B] border border-[#B7410E] max-w-2xl w-full p-8 rounded-sm relative shadow-[0_0_50px_rgba(183,65,14,0.2)]">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#64748B] hover:text-[#F5F5F1]"><X size={24} /></button>
        
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
  );
}