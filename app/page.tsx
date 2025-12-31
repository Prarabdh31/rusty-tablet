import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/navigation/Navbar';
import ArticleCard from '@/components/article/ArticleCard';
import { Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();

  const { data: rawPosts, error } = await supabase
    .from('posts')
    .select(`
      id, slug, title, excerpt, created_at, category, featured_image,
      authors ( name )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching posts:', error);

  // Data Transformation
  const posts = rawPosts?.map(post => ({
    ...post,
    authors: Array.isArray(post.authors) ? post.authors[0] : post.authors
  })) || [];

  const featuredPost = posts[0];
  const secondaryPosts = posts.slice(1, 4);
  const recentPosts = posts.slice(4);

  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans selection:bg-[#B7410E] selection:text-white pb-24">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* --- SECTION 1: LEAD STORY (Newspaper Style) --- */}
        {featuredPost && (
          <section className="mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-b border-[#2C3E50]/10 pb-12">
            <div className="lg:col-span-8 group cursor-pointer">
              <Link href={`/article/${featuredPost.slug}`}>
                <div className="aspect-[16/9] bg-[#2C3E50]/5 mb-6 relative overflow-hidden rounded-sm">
                   {/* Placeholder for Featured Image */}
                   <div className="absolute inset-0 bg-[#2C3E50]/10 group-hover:bg-[#2C3E50]/5 transition-colors"></div>
                   <div className="absolute bottom-4 left-4 bg-[#B7410E] text-white text-xs font-bold px-3 py-1 uppercase tracking-wider">
                     {featuredPost.category || 'Feature'}
                   </div>
                </div>
                <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#2C3E50] leading-tight mb-4 group-hover:text-[#B7410E] transition-colors">
                  {featuredPost.title}
                </h1>
                <p className="font-serif text-lg text-[#64748B] leading-relaxed max-w-2xl">
                  {featuredPost.excerpt}
                </p>
              </Link>
            </div>
            
            {/* Top Stories Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-8 border-l border-[#2C3E50]/10 pl-0 lg:pl-8">
              <h4 className="font-bold text-[#2C3E50] uppercase tracking-wider text-xs flex items-center gap-2">
                <span className="w-2 h-2 bg-[#B7410E] rounded-full"></span>
                Top Stories
              </h4>
              {secondaryPosts.map((post) => (
                <Link key={post.id} href={`/article/${post.slug}`} className="group">
                  <h3 className="font-serif text-xl font-bold text-[#2C3E50] mb-2 group-hover:text-[#B7410E] transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <div className="text-xs text-[#64748B] font-medium uppercase tracking-wide">
                    {post.category || 'News'}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* --- SECTION 2: THE FEED --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Feed */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2C3E50]/20">
              <h3 className="font-serif text-2xl font-bold text-[#2C3E50]">Latest Dispatches</h3>
            </div>
            
            {posts.length === 0 ? (
               <div className="p-12 bg-[#E5E5E1] border border-dashed border-[#2C3E50]/30 text-center rounded-sm">
                <p className="text-[#64748B] font-serif italic">Running the presses...</p>
              </div>
            ) : (
              <div className="space-y-12">
                {recentPosts.map((post) => (
                  <ArticleCard key={post.id} post={post} />
                ))}
                {recentPosts.length === 0 && (
                   <p className="text-[#64748B] italic">No more stories to load.</p>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar (Utility) */}
          <aside className="lg:col-span-4 space-y-12">
            
            {/* Search */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search the archives..." 
                className="w-full bg-white border border-[#2C3E50]/20 px-4 py-3 pl-10 text-[#2C3E50] text-sm focus:outline-none focus:border-[#B7410E] transition-colors rounded-sm"
              />
              <Search className="absolute left-3 top-3.5 text-[#64748B]" size={16} />
            </div>

            {/* Ad Space (Square) */}
            <div className="w-full aspect-square bg-[#E5E5E1] border border-dashed border-[#2C3E50]/30 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest z-10 mb-2">Advertisement</span>
            </div>

            {/* Newsletter (Compact) */}
            <div className="bg-[#2C3E50] p-6 rounded-sm text-[#F5F5F1]">
              <h4 className="font-bold text-[#B7410E] uppercase tracking-wider text-xs mb-3">The Weekly Rust</h4>
              <p className="text-sm opacity-80 mb-4 leading-relaxed">
                Automated insights delivered to your inbox every Sunday morning.
              </p>
              <div className="flex gap-2">
                <input type="email" placeholder="Email address" className="bg-[#F5F5F1]/10 border-none text-sm px-3 py-2 w-full text-white placeholder-white/40 focus:ring-1 focus:ring-[#B7410E]" />
                <button className="bg-[#B7410E] p-2 hover:bg-white hover:text-[#B7410E] transition-colors">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </main>
  );
}