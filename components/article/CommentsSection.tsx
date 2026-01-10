'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/components/providers/AuthProvider';
import { MessageSquare, Send, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommentsSection({ postId }: { postId: string }) {
  const { user, signInWithGoogle } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select(`
          id, content, created_at,
          user_id, user_name, user_avatar
        `) 
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
      
      if (data) setComments(data);
    };
    fetchComments();

    const channel = supabase
      .channel('comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, 
        (payload) => {
          setComments((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    
    // Save user details with the comment
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      content: newComment,
      user_name: user.user_metadata?.full_name || 'Reader',
      user_avatar: user.user_metadata?.avatar_url
    });

    if (!error) {
      setNewComment('');
    } else {
      alert('Failed to post comment.');
    }
    setLoading(false);
  };

  return (
    <div className="mt-16 pt-12 border-t-2 border-[#2C3E50]">
      <h3 className="font-serif text-2xl font-bold text-[#2C3E50] mb-8 flex items-center gap-2">
        <MessageSquare className="text-[#B7410E]" />
        Discussion <span className="text-sm text-[#64748B] font-sans font-normal ml-2">({comments.length})</span>
      </h3>

      {/* Input Area */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="flex items-start gap-4 mb-4">
             {user.user_metadata?.avatar_url ? (
               <img src={user.user_metadata.avatar_url} className="w-10 h-10 rounded-full border border-[#2C3E50]/10" alt="" />
             ) : (
               <div className="w-10 h-10 bg-[#2C3E50] rounded-full text-white flex items-center justify-center font-bold">
                 {user.email?.charAt(0).toUpperCase()}
               </div>
             )}
             <div className="w-full">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Contribute to the discourse..."
                  className="w-full bg-white border border-[#2C3E50]/20 p-4 rounded-sm focus:border-[#B7410E] outline-none min-h-[100px]"
                />
             </div>
          </div>
          <div className="flex justify-end items-center">
            <button 
              type="submit" 
              disabled={loading || !newComment.trim()}
              className="bg-[#2C3E50] text-[#F5F5F1] px-6 py-2 text-sm font-bold uppercase tracking-wider hover:bg-[#B7410E] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Posting...' : <><Send size={16} /> Post Comment</>}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white p-8 rounded-sm shadow-sm border border-[#2C3E50]/10 text-center mb-12">
          <p className="text-[#64748B] mb-4">Join the Rusty Tablet community to comment.</p>
          <button 
            onClick={() => signInWithGoogle()}
            className="bg-[#4285F4] text-white px-6 py-3 rounded-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
          >
            Sign in with Google
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-8">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            {comment.user_avatar ? (
              <img src={comment.user_avatar} className="w-10 h-10 rounded-full bg-[#2C3E50]/10 border border-[#2C3E50]/10 object-cover shrink-0" alt="" />
            ) : (
              <div className="w-10 h-10 bg-[#2C3E50]/10 rounded-full flex items-center justify-center shrink-0 text-[#2C3E50] font-bold">
                {comment.user_name?.charAt(0) || 'R'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[#2C3E50] text-sm">{comment.user_name || 'Reader'}</span>
                <span className="text-xs text-[#64748B]">• {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
              </div>
              <p className="text-[#2C3E50] text-sm leading-relaxed">{comment.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-[#64748B] italic">No comments yet. Be the first to speak.</p>}
      </div>
    </div>
  );
}