import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/navigation/Navbar';
import Link from 'next/link';
import { Search, ArrowRight, Clock } from 'lucide-react';

export const revalidate = 60; // Revalidate page every 60 seconds

// --- COMPONENT: ANIMATED NEWS TICKER ---
const NewsTicker = ({ posts }: { posts: any[] }) => (
  <div className="bg-[#2C3E50] text-[#F5F5F1] text-xs font-bold py-2 overflow-hidden border-b border-[#F5F5F1]/10 relative z-40">
    <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 overflow-hidden">
      <span className="text-[#B7410E] uppercase tracking-widest shrink-0 flex items-center gap-2 bg-[#2C3E50] z-10 pr-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B7410E] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B7410E]"></span>
        </span>
        Live Wire
      </span>
      {/* Infinite Scroll Container */}
      <div className="flex-1 overflow-hidden relative h-4">
        <div className="absolute whitespace-nowrap animate-marquee pause-on-hover flex gap-8">
          {posts.map((post, i) => (
            <Link key={`${post.id}-${i}`} href={`/article/${post.slug}`} className="hover:text-[#B7410E] transition-colors">
              <span className="uppercase text-[#B7410E]/70 mr-2">[{post.category || 'News'}]</span>
              {post.title} <span className="mx-4 text-[#F5F5F1]/20">///</span>
            </Link>
          ))}
          {/* Duplicate for seamless loop */}
          {posts.map((post, i) => (
            <Link key={`${post.id}-dup-${i}`} href={`/article/${post.slug}`} className="hover:text-[#B7410E] transition-colors">
              <span className="uppercase text-[#B7410E]/70 mr-2">[{post.category || 'News'}]</span>
              {post.title} <span className="mx-4 text-[#F5F5F1]/20">///</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// --- COMPONENT: HERO CARD ---
const HeroCard = ({ post }: { post: any }) => (
  <Link href={`/article/${post.slug}`} className="group block h-full">
    <div className="flex flex-col h-full gap-4">
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-sm border border-[#2C3E50]/10 bg-[#2C3E50]/5">
        {post.featured_image ? (
          <img 
            src={post.featured_image} 
            alt={post.title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[#2C3E50]/20">No Image</div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[#B7410E]">
          <span className="bg-[#2C3E50] text-[#F5F5F1] px-2 py-1">{post.category || 'Cover Story'}</span>
          <span className="text-[#64748B]">{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2C3E50] leading-[1.1] group-hover:text-[#B7410E] transition-colors">
          {post.title}
        </h1>
        <p className="text-xl text-[#64748B] font-serif leading-relaxed line-clamp-3 border-l-2 border-[#B7410E] pl-4">
          {post.excerpt}
        </p>
      </div>
    </div>
  </Link>
);

// --- COMPONENT: COMPACT SIDE CARD ---
const CompactCard = ({ post }: { post: any }) => (
  <Link href={`/article/${post.slug}`} className="group flex gap-4 items-start border-b border-[#2C3E50]/10 pb-4 last:border-0 last:pb-0">
    <div className="w-20 h-20 shrink-0 overflow-hidden rounded-sm bg-[#2C3E50]/5 relative">
      {post.featured_image && (
        <img src={post.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
      )}
    </div>
    <div className="flex flex-col justify-between h-full py-0.5">
      <span className="text-[10px] font-bold text-[#B7410E] uppercase tracking-wider block mb-1">
        {post.category || 'News'}
      </span>
      <h3 className="font-serif text-base font-bold text-[#2C3E50] leading-snug group-hover:text-[#B7410E] transition-colors line-clamp-2">
        {post.title}
      </h3>
    </div>
  </Link>
);

// --- COMPONENT: CATEGORY SECTION ---
const CategorySection = ({ category, posts }: { category: string, posts: any[] }) => {
  if (!posts || posts.length === 0) return null;
  return (
    <section className="mb-12">
      <div className="flex items-center gap-4 mb-6 border-b-2 border-[#2C3E50] pb-2">
        <h3 className="font-serif text-xl font-bold text-[#2C3E50] uppercase tracking-tight">{category}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map(post => (
          <Link key={post.id} href={`/article/${post.slug}`} className="group block bg-white border border-[#2C3E50]/5 p-4 hover:border-[#B7410E]/30 transition-colors shadow-sm">
            <div className="aspect-[3/2] bg-[#2C3E50]/5 mb-3 overflow-hidden rounded-sm relative">
              {post.featured_image && (
                <img src={post.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              )}
            </div>
            <h4 className="font-serif text-lg font-bold text-[#2C3E50] leading-tight mb-2 group-hover:text-[#B7410E] transition-colors">
              {post.title}
            </h4>
          </Link>
        ))}
      </div>
    </section>
  );
};

// --- COMPONENT: SIDEBAR CATEGORY LIST ---
const SidebarCategoryList = ({ category, posts }: { category: string, posts: any[] }) => {
  if (!posts || posts.length === 0) return null;
  return (
    <div className="mb-8">
      <h4 className="font-bold text-[#2C3E50] uppercase tracking-wider text-xs mb-4 border-b border-[#2C3E50]/10 pb-2 flex justify-between items-center group cursor-pointer hover:text-[#B7410E] transition-colors">
        {category}
        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </h4>
      <div className="flex flex-col gap-3">
        {posts.map(post => (
          <Link key={post.id} href={`/article/${post.slug}`} className="text-sm font-serif text-[#64748B] hover:text-[#B7410E] transition-colors line-clamp-1 block">
            • {post.title}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default async function Home() {
  const supabase = await createClient();

  const { data: rawPosts, error } = await supabase
    .from('posts')
    .select(`
      id, slug, title, excerpt, created_at, category, featured_image,
      authors ( name )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50); // Increased limit to fill categories

  if (error) console.error('Error fetching posts:', error);

  // Data Transformation
  const posts = rawPosts?.map(post => ({
    ...post,
    authors: Array.isArray(post.authors) ? post.authors[0] : post.authors
  })) || [];

  // Group by Category dynamically
  const categories: Record<string, any[]> = {};
  posts.forEach(post => {
    const cat = post.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(post);
  });

  // Get Top 5 Categories by volume for Sidebar
  const topCategories = Object.keys(categories)
    .sort((a, b) => categories[b].length - categories[a].length)
    .slice(0, 5);

  const heroPost = posts[0];
  const topStories = posts.slice(1, 6);
  
  // Dynamic Category Sections (Pick 2 random populated categories excluding 'General')
  const displayCats = Object.keys(categories)
    .filter(c => c !== 'General' && categories[c].length >= 3)
    .slice(0, 2);

  const feedPosts = posts.slice(6);

  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans selection:bg-[#B7410E] selection:text-white pb-24 overflow-x-hidden">
      <Navbar />
      
      {posts.length > 0 && <NewsTicker posts={posts} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* --- HERO SECTION --- */}
        {heroPost ? (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 border-b border-[#2C3E50]/10 pb-12">
            <div className="lg:col-span-8">
              <HeroCard post={heroPost} />
            </div>
            <div className="lg:col-span-4 flex flex-col h-full">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-bold text-[#B7410E] uppercase tracking-wider text-xs">Top Stories</h4>
                <div className="h-px bg-[#B7410E]/20 flex-grow ml-4"></div>
              </div>
              <div className="flex flex-col gap-5">
                {topStories.map(post => <CompactCard key={post.id} post={post} />)}
              </div>
            </div>
          </section>
        ) : (
          <div className="p-12 text-center text-[#64748B] italic border border-dashed border-[#2C3E50]/20 rounded-sm mb-12">
            Initializing Newsroom Feed...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* --- LEFT COLUMN: MAIN FEED --- */}
          <div className="lg:col-span-9">
            
            {/* Dynamic Category Strips */}
            {displayCats.map(cat => (
              <CategorySection key={cat} category={cat} posts={categories[cat].slice(0, 3)} />
            ))}

            {/* Standard Feed */}
            <div className="flex items-center gap-4 mb-6 border-b-2 border-[#2C3E50] pb-2">
              <h3 className="font-serif text-xl font-bold text-[#2C3E50] uppercase tracking-tight">Recent Dispatches</h3>
            </div>
            <div className="flex flex-col divide-y divide-[#2C3E50]/10">
              {feedPosts.map((post) => (
                <Link key={post.id} href={`/article/${post.slug}`} className="group py-8 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-8 flex flex-col justify-start">
                    <div className="flex items-center gap-3 mb-2 text-xs font-bold uppercase tracking-wider text-[#B7410E]">
                      <span>{post.category || 'General'}</span>
                      <span className="text-[#2C3E50]/20">•</span>
                      <span className="text-[#64748B]">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-[#2C3E50] mb-3 group-hover:text-[#B7410E] transition-colors leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-[#64748B] font-serif leading-relaxed line-clamp-2 mb-4 text-base">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="md:col-span-4 aspect-[3/2] overflow-hidden rounded-sm bg-[#2C3E50]/5 border border-[#2C3E50]/5">
                    {post.featured_image && (
                      <img src={post.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="mt-12 text-center border-t border-[#2C3E50]/10 pt-12">
              <button className="bg-[#2C3E50] text-[#F5F5F1] px-8 py-3 uppercase text-xs font-bold tracking-widest hover:bg-[#B7410E] transition-colors rounded-sm shadow-sm">
                Load More Archives
              </button>
            </div>
          </div>

          {/* --- RIGHT COLUMN: SIDEBAR --- */}
          <aside className="lg:col-span-3 space-y-12">
            
            {/* Search */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-white border border-[#2C3E50]/20 px-4 py-3 pl-10 text-[#2C3E50] text-sm focus:outline-none focus:border-[#B7410E] transition-colors rounded-sm shadow-sm"
              />
              <Search className="absolute left-3 top-3.5 text-[#64748B]" size={16} />
            </div>

            {/* Categorized Article Lists (Dynamic) */}
            <div className="bg-[#E5E5E1]/30 p-4 border border-[#2C3E50]/5 rounded-sm">
              <h4 className="font-bold text-[#2C3E50] uppercase tracking-wider text-xs mb-6 border-b-2 border-[#B7410E] pb-2 inline-block">
                Explore Categories
              </h4>
              {topCategories.map(cat => (
                <SidebarCategoryList key={cat} category={cat} posts={categories[cat].slice(0, 3)} />
              ))}
            </div>

            {/* Ad Widget */}
            <div className="w-full aspect-square bg-[#E5E5E1] border border-dashed border-[#2C3E50]/30 flex flex-col items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest z-10 mb-2">Advertisement</span>
            </div>

          </aside>
        </div>
      </div>
    </main>
  );
}