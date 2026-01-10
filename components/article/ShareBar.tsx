'use client';

import { Twitter, Linkedin, Facebook, Link as LinkIcon, Mail } from 'lucide-react';
import { useState } from 'react';

export default function ShareBar({ title, slug }: { title: string, slug: string }) {
  const url = `https://rustytablet.com/article/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <h4 className="font-bold text-[#2C3E50] uppercase tracking-wider text-xs border-b border-[#2C3E50]/10 pb-2">Share</h4>
      <div className="flex gap-2">
        <a 
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} 
          target="_blank" rel="noreferrer"
          className="p-2 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-sm hover:bg-[#1DA1F2] hover:text-white transition-colors"
        >
          <Twitter size={18} />
        </a>
        <a 
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} 
          target="_blank" rel="noreferrer"
          className="p-2 bg-[#0A66C2]/10 text-[#0A66C2] rounded-sm hover:bg-[#0A66C2] hover:text-white transition-colors"
        >
          <Linkedin size={18} />
        </a>
        <button 
          onClick={copyLink}
          className="p-2 bg-[#2C3E50]/10 text-[#2C3E50] rounded-sm hover:bg-[#2C3E50] hover:text-white transition-colors relative group"
        >
          <LinkIcon size={18} />
          {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded-sm whitespace-nowrap">Copied!</span>}
        </button>
      </div>
    </div>
  );
}