'use client';

import { useState, useEffect } from 'react';
import { Share2, Bookmark, Check, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { createBrowserClient } from '@supabase/ssr';

interface ArticleActionsProps {
  postId: string;
  title: string;
  slug: string;
}

export default function ArticleActions({ postId, title, slug }: ArticleActionsProps) {
  const { user, signInWithGoogle } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check if saved
  useEffect(() => {
    if (!user) return;
    const checkSaved = async () => {
      const { data } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();
      if (data) setIsSaved(true);
    };
    checkSaved();
  }, [user, postId, supabase]);

  const handleSave = async () => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setLoading(true);

    if (isSaved) {
      // Unsave
      const { error } = await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId);
      if (!error) setIsSaved(false);
    } else {
      // Save
      const { error } = await supabase.from('saved_posts').insert({ user_id: user.id, post_id: postId });
      if (!error) setIsSaved(true);
    }
    setLoading(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/article/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-4 text-[#2C3E50]">
      <button 
        onClick={handleShare}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:text-[#B7410E] transition-colors"
      >
        {copied ? <Check size={16} /> : <Share2 size={16} />}
        {copied ? 'Copied' : 'Share'}
      </button>
      
      <button 
        onClick={handleSave}
        disabled={loading}
        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${
          isSaved ? 'text-[#B7410E]' : 'hover:text-[#B7410E]'
        }`}
      >
        {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {isSaved ? 'Saved' : 'Save'}
      </button>
    </div>
  );
}