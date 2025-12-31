import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import { Share2, Bookmark, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch Post with Featured Image
  const { data: post, error } = await supabase
    .from('posts')
    .select(`*, authors (name, role, is_ai)`)
    .eq('slug', slug)
    .single();

  if (error || !post) notFound();

  // @ts-ignore
  const author = Array.isArray(post.authors) ? post.authors[0] : post.authors;
  const paragraphs = post.content ? post.content.split('\n\n').filter((p: string) => p.trim() !== '') : [];

  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans selection:bg-[#B7410E] selection:text-white pb-24">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* --- LEFT COLUMN: ARTICLE CONTENT (8 Cols) --- */}
          <article className="lg:col-span-8">
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[#B7410E] mb-6">
              <span className="cursor-pointer hover:underline">Home</span>
              <span className="text-[#2C3E50]/20">/</span>
              <span className="cursor-pointer hover:underline">{post.category || 'Dispatches'}</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#2C3E50] leading-[1.1] mb-6 text-left">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-[#64748B] font-serif leading-relaxed italic mb-8 border-l-2 border-[#B7410E] pl-4 text-left">
              {post.excerpt}
            </p>

            {/* Author Meta Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-b border-[#2C3E50]/10 py-5 mb-10 gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-[#2C3E50] rounded-sm flex items-center justify-center text-[#F5F5F1] font-serif font-bold text-sm">
                    {author?.name ? author.name.charAt(0) : 'R'}
                 </div>
                 <div>
                   <div className="text-sm font-bold text-[#2C3E50] leading-none mb-1">{author?.name || 'Staff'}</div>
                   <div className="text-xs text-[#64748B] uppercase tracking-wide">{formatDate(post.created_at)}</div>
                 </div>
              </div>
              <div className="flex items-center gap-4 text-[#2C3E50]">
                 <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:text-[#B7410E] transition-colors">
                   <Share2 size={16} /> Share
                 </button>
                 <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:text-[#B7410E] transition-colors">
                   <Bookmark size={16} /> Save
                 </button>
              </div>
            </div>

            {/* FEATURED IMAGE */}
            {post.featured_image && (
              <figure className="mb-10">
                <img 
                  src={post.featured_image} 
                  alt={post.title} 
                  className="w-full h-auto rounded-sm border border-[#2C3E50]/10"
                />
                <figcaption className="text-xs text-[#64748B] mt-2 italic text-right">
                  Image via Unsplash / Rusty Tablet Archive
                </figcaption>
              </figure>
            )}

            {/* Content Body */}
            <div className="prose prose-lg prose-slate max-w-none font-serif text-[#2C3E50] prose-headings:font-bold prose-headings:text-[#2C3E50] prose-a:text-[#B7410E]">
              {paragraphs.map((para: string, index: number) => (
                <div key={index}>
                  <p className={index === 0 ? "first-letter:text-5xl first-letter:font-bold first-letter:text-[#2C3E50] first-letter:mr-2 first-letter:float-left" : ""}>
                    {para.replace(/##/g, '')}
                  </p>
                  
                  {/* Inject a secondary image after paragraph 2 for visual break */}
                  {index === 2 && post.featured_image && (
                    <div className="my-8 relative group cursor-pointer overflow-hidden rounded-sm border border-[#2C3E50]/10">
                      <img 
                         src={`https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60`} 
                         alt="Technology Detail" 
                         className="w-full h-64 object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      />
                      <div className="absolute bottom-0 left-0 bg-[#B7410E] text-white text-xs px-2 py-1 font-bold uppercase">
                        Figure 1.A
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </article>

          {/* --- RIGHT COLUMN: SIDEBAR (4 Cols) --- */}
          <aside className="lg:col-span-4 space-y-12 border-l border-[#2C3E50]/10 pl-0 lg:pl-12">
            
            {/* Search */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-white border border-[#2C3E50]/20 px-4 py-3 pl-10 text-[#2C3E50] text-sm focus:outline-none focus:border-[#B7410E] transition-colors rounded-sm"
              />
              <Search className="absolute left-3 top-3.5 text-[#64748B]" size={16} />
            </div>

            {/* About Widget */}
            <div className="bg-[#2C3E50] text-[#F5F5F1] p-8 rounded-sm shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-32 bg-[#B7410E] rounded-full blur-3xl opacity-20 -mr-16 -mt-16 transition-opacity group-hover:opacity-30"></div>
              <h3 className="font-serif font-bold text-xl mb-4 text-[#B7410E] relative z-10">Context</h3>
              <p className="text-sm leading-relaxed opacity-80 font-sans relative z-10">
                This article was generated by the Rusty Tablet Ghost Writer engine, utilizing Gemini 2.5 Flash for analysis and synthesis.
              </p>
            </div>

            {/* Ad Slot */}
            <div className="w-full aspect-[3/4] bg-[#E5E5E1] border border-dashed border-[#2C3E50]/30 flex flex-col items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest z-10 mb-2">Advertisement</span>
               <div className="w-32 h-8 bg-[#2C3E50]/10 flex items-center justify-center">
                 <span className="text-[10px] text-[#2C3E50]/60 font-medium">300x600</span>
               </div>
            </div>

          </aside>
        </div>
      </div>
    </main>
  );
}