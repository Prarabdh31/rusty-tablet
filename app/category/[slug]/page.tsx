import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import Link from 'next/link';
import { Search, ArrowRight, Clock, Hash, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

// --- HELPERS ---
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
};

const calculateReadTime = (content: string) => {
  if (!content) return '1 min read';
  const words = content.trim().split(/\s+/).length;
  const time = Math.ceil(words / 200);
  return `${time} min read`;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoryName = decodeURIComponent(slug);
  const supabase = await createClient();

  // 1. Fetch posts for this category (Case Insensitive)
  const { data: rawPosts, error } = await supabase
    .from('posts')
    .select(`
      id, slug, title, excerpt, created_at, category, featured_image, content,
      authors ( name )
    `)
    .ilike('category', categoryName) // Match 'politics' to 'Politics'
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) console.error('Category Fetch Error:', error);

  if (!rawPosts || rawPosts.length === 0) {
    // Ideally show an empty state, but for now 404 if category genuinely has no content
    // Or we can return a "No posts found" UI. Let's return UI.
  }

  // Transform Data
  const posts = rawPosts?.map(post => ({
    ...post,
    authors: Array.isArray(post.authors) ? post.authors[0] : post.authors
  })) || [];

  const heroPost = posts[0];
  const briefingPosts = posts.slice(1, 4);
  const feedPosts = posts.slice(4);

  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans selection:bg-[#B7410E] selection:text-white pb-24">
      <Navbar />

      {/* --- CATEGORY MASTHEAD --- */}
      <header className="bg-[#2C3E50] text-[#F5F5F1] py-12 md:py-16 border-b-4 border-[#B7410E] relative overflow-hidden">
        {/* Background Noise/Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[#B7410E] text-xs font-bold uppercase tracking-widest mb-3">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <ChevronRight size={12} />
                <span>Section</span>
              </div>
              <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight uppercase leading-none">
                {categoryName}
              </h1>
            </div>
            <div className="md:text-right">
              <span className="block text-sm font-mono opacity-60 uppercase tracking-widest">
                {posts.length} {posts.length === 1 ? 'Dispatch' : 'Dispatches'}
              </span>
              <span className="block text-xs font-bold text-[#B7410E] uppercase tracking-widest mt-1">
                Rusty Tablet Archive
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {posts.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-[#2C3E50]/20 rounded-sm">
            <h2 className="font-serif text-2xl text-[#2C3E50] mb-2">No Ink Yet</h2>
            <p className="text-[#64748B]">Our automated presses haven't printed anything for "{categoryName}" yet.</p>
            <Link href="/" className="inline-block mt-6 text-[#B7410E] font-bold hover:underline">Return to Home</Link>
          </div>
        ) : (
          <>
            {/* --- SECTION HERO --- */}
            {heroPost && (
              <section className="mb-16">
                <Link href={`/article/${heroPost.slug}`} className="group grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 bg-white border border-[#2C3E50]/10 rounded-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="lg:col-span-8 relative min-h-[400px]">
                    {heroPost.featured_image ? (
                      <img 
                        src={heroPost.featured_image} 
                        alt={heroPost.title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[#2C3E50]/5 flex items-center justify-center text-[#2C3E50]/20 font-serif text-lg">No Visual</div>
                    )}
                    <div className="absolute top-4 left-4 bg-[#B7410E] text-white text-xs font-bold px-3 py-1 uppercase tracking-wider">
                      Latest in {capitalize(categoryName)}
                    </div>
                  </div>
                  
                  <div className="lg:col-span-4 p-8 flex flex-col justify-center bg-white relative z-10">
                    <div className="flex items-center gap-3 mb-4 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      <span>{formatDate(heroPost.created_at)}</span>
                      <span className="text-[#2C3E50]/20">•</span>
                      <span>{calculateReadTime(heroPost.content)}</span>
                    </div>
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2C3E50] leading-tight mb-4 group-hover:text-[#B7410E] transition-colors">
                      {heroPost.title}
                    </h2>
                    <p className="text-[#64748B] font-serif leading-relaxed line-clamp-4 mb-6">
                      {heroPost.excerpt}
                    </p>
                    <span className="flex items-center gap-2 text-sm font-bold text-[#2C3E50] group-hover:translate-x-1 transition-transform">
                      Read Full Story <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* --- LEFT COLUMN: FEED --- */}
              <div className="lg:col-span-9">
                
                {/* Briefing Strip */}
                {briefingPosts.length > 0 && (
                  <div className="mb-12 border-b border-[#2C3E50]/10 pb-12">
                    <h3 className="font-bold text-[#2C3E50] uppercase tracking-wider text-xs mb-6 flex items-center gap-2">
                      <Clock size={14} /> The Briefing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {briefingPosts.map(post => (
                        <Link key={post.id} href={`/article/${post.slug}`} className="group block">
                          <div className="aspect-[3/2] bg-[#2C3E50]/5 mb-3 overflow-hidden rounded-sm relative">
                            {post.featured_image && (
                              <img src={post.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            )}
                          </div>
                          <h4 className="font-serif text-lg font-bold text-[#2C3E50] leading-snug mb-2 group-hover:text-[#B7410E] transition-colors">
                            {post.title}
                          </h4>
                          <span className="text-[10px] text-[#64748B] uppercase tracking-wider">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vertical Feed */}
                <div className="space-y-0 divide-y divide-[#2C3E50]/10">
                  <div className="pb-6">
                    <h3 className="font-serif text-2xl font-bold text-[#2C3E50]">Archive</h3>
                  </div>
                  
                  {feedPosts.map((post) => (
                    <Link key={post.id} href={`/article/${post.slug}`} className="group py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      <div className="md:col-span-8">
                        <div className="flex items-center gap-3 mb-2 text-xs font-bold uppercase tracking-wider text-[#B7410E]">
                          <span className="text-[#64748B]">{formatDate(post.created_at)}</span>
                          <span className="text-[#2C3E50]/20">•</span>
                          <span>{calculateReadTime(post.content)}</span>
                        </div>
                        <h3 className="font-serif text-xl md:text-2xl font-bold text-[#2C3E50] mb-3 group-hover:text-[#B7410E] transition-colors leading-tight">
                          {post.title}
                        </h3>
                        <p className="text-[#64748B] font-serif leading-relaxed line-clamp-2 text-base">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="md:col-span-4 aspect-[3/2] overflow-hidden rounded-sm bg-[#2C3E50]/5">
                        {post.featured_image && (
                          <img src={post.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        )}
                      </div>
                    </Link>
                  ))}
                  
                  {feedPosts.length === 0 && briefingPosts.length === 0 && !heroPost && (
                    <p className="py-8 text-[#64748B] italic">End of the line.</p>
                  )}
                </div>

                {feedPosts.length > 0 && (
                  <div className="mt-12 text-center">
                    <button className="border border-[#2C3E50] text-[#2C3E50] px-8 py-3 uppercase text-xs font-bold tracking-widest hover:bg-[#2C3E50] hover:text-[#F5F5F1] transition-colors rounded-sm">
                      Load More From {capitalize(categoryName)}
                    </button>
                  </div>
                )}
              </div>

              {/* --- RIGHT COLUMN: SIDEBAR --- */}
              <aside className="lg:col-span-3 space-y-12">
                
                {/* Search */}
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={`Search ${categoryName}...`} 
                    className="w-full bg-white border border-[#2C3E50]/20 px-4 py-3 pl-10 text-[#2C3E50] text-sm focus:outline-none focus:border-[#B7410E] transition-colors rounded-sm shadow-sm"
                  />
                  <Search className="absolute left-3 top-3.5 text-[#64748B]" size={16} />
                </div>

                {/* Category specific widget */}
                <div className="bg-[#2C3E50] text-[#F5F5F1] p-6 rounded-sm">
                  <h4 className="font-bold text-[#B7410E] uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                    <Hash size={14} /> Trending in {capitalize(categoryName)}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['Analysis', 'Future', 'Crisis', 'Report', 'Deep Dive'].map(tag => (
                      <span key={tag} className="text-xs bg-[#F5F5F1]/10 hover:bg-[#B7410E] px-2 py-1 cursor-pointer transition-colors">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Ad Widget */}
                <div className="w-full aspect-[3/4] bg-[#E5E5E1] border border-dashed border-[#2C3E50]/30 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest z-10 mb-2">Advertisement</span>
                </div>

              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}