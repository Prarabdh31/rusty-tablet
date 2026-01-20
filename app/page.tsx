import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/navigation/Navbar';
import Link from 'next/link';
import { Search, ArrowRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ContextualSearch from '@/components/navigation/ContextualSearch';
import NewsletterForm from '@/components/ui/NewsletterForm';

export const revalidate = 60; // Revalidate page every 60 seconds

// --- HELPER FUNCTIONS ---
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  };
  
  const formattedDate = date.toLocaleDateString('en-US', options);
  // Remove relative time from server render to avoid hydration mismatch
  // const relativeTime = formatDistanceToNow(date, { addSuffix: true });

  return formattedDate; // Return stable date for server render
};

// Client component wrapper for relative time could be better, but suppressing warning is easier for now
const RelativeTime = ({ dateString }: { dateString: string }) => {
  const date = new Date(dateString);
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });
  return <span suppressHydrationWarning>{relativeTime}</span>;
}

const calculateReadTime = (content: string) => {
  if (!content) return '1 min read';
  const words = content.trim().split(/\s+/).length;
  const time = Math.ceil(words / 200);
  return `${time} min read`;
};

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
            <div key={`${post.id}-${i}`} className="flex items-center">
              <Link href={`/category/${post.category || 'General'}`} className="uppercase text-[#B7410E]/70 mr-2 hover:underline">
                [{post.category || 'News'}]
              </Link>
              <Link href={`/article/${post.slug}`} className="hover:text-[#B7410E] transition-colors">
                {post.title} 
              </Link>
              <span className="mx-4 text-[#F5F5F1]/20">///</span>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {posts.map((post, i) => (
            <div key={`${post.id}-dup-${i}`} className="flex items-center">
              <Link href={`/category/${post.category || 'General'}`} className="uppercase text-[#B7410E]/70 mr-2 hover:underline">
                [{post.category || 'News'}]
              </Link>
              <Link href={`/article/${post.slug}`} className="hover:text-[#B7410E] transition-colors">
                {post.title} 
              </Link>
              <span className="mx-4 text-[#F5F5F1]/20">///</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// --- COMPONENT: HERO CARD ---
const HeroCard = ({ post }: { post: any }) => (
  <div className="group block h-full">
    <div className="flex flex-col h-full gap-4">
      <Link href={`/article/${post.slug}`} className="relative w-full aspect-[16/9] overflow-hidden rounded-sm border border-[#2C3E50]/10 bg-[#2C3E50]/5 block">
        {post.featured_image ? (
          <img 
            src={post.featured_image} 
            alt={post.title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[#2C3E50]/20">No Image</div>
        )}
      </Link>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[#B7410E]">
          <Link href={`/category/${post.category || 'General'}`} className="bg-[#2C3E50] text-[#F5F5F1] px-2 py-1 hover:bg-[#B7410E] transition-colors">
            {post.category || 'Cover Story'}
          </Link>
          <span className="text-[#64748B]" suppressHydrationWarning>{formatDate(post.created_at)}</span>
          <span className="text-[#2C3E50]/20">•</span>
          <span className="text-[#64748B]">{calculateReadTime(post.content)}</span>
        </div>
        <Link href={`/article/${post.slug}`}>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2C3E50] leading-[1.1] hover:text-[#B7410E] transition-colors">
            {post.title}
          </h1>
        </Link>
        <p className="text-xl text-[#64748B] font-serif leading-relaxed line-clamp-3 border-l-2 border-[#B7410E] pl-4">
          {post.excerpt}
        </p>
      </div>
    </div>
  </div>
);

// --- COMPONENT: COMPACT SIDE CARD ---
const CompactCard = ({ post }: { post: any }) => (
  <div className="group flex gap-4 items-start border-b border-[#2C3E50]/10 pb-4 last:border-0 last:pb-0">
    <Link href={`/article/${post.slug}`} className="w-20 h-20 shrink-0 overflow-hidden rounded-sm bg-[#2C3E50]/5 relative block">
      {post.featured_image && (
        <img src={post.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
      )}
    </Link>
    <div className="flex flex-col justify-between h-full py-0.5 w-full">
      <div className="flex justify-between items-start mb-1">
        <Link href={`/category/${post.category || 'General'}`} className="text-[10px] font-bold text-[#B7410E] uppercase tracking-wider block hover:underline">
          {post.category || 'News'}
        </Link>
        <span className="text-[10px] text-[#64748B] whitespace-nowrap ml-2" suppressHydrationWarning>
          <RelativeTime dateString={post.created_at} />
        </span>
      </div>
      <Link href={`/article/${post.slug}`}>
        <h3 className="font-serif text-base font-bold text-[#2C3E50] leading-snug hover:text-[#B7410E] transition-colors line-clamp-2">
          {post.title}
        </h3>
      </Link>
    </div>
  </div>
);

// --- COMPONENT: CATEGORY SECTION ---
const CategorySection = ({ category, posts }: { category: string, posts: any[] }) => {
  if (!posts || posts.length === 0) return null;
  return (
    <section className="mb-12">
      <div className="flex items-center gap-4 mb-6 border-b-2 border-[#2C3E50] pb-2">
        <Link href={`/category/${category}`} className="font-serif text-xl font-bold text-[#2C3E50] uppercase tracking-tight hover:text-[#B7410E] transition-colors">
          {category}
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} className="group block bg-white border border-[#2C3E50]/5 p-4 hover:border-[#B7410E]/30 transition-colors shadow-sm">
            <Link href={`/article/${post.slug}`} className="aspect-[3/2] bg-[#2C3E50]/5 mb-3 overflow-hidden rounded-sm relative block">
              {post.featured_image && (
                <img src={post.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              )}
            </Link>
            <div className="flex justify-between items-center mb-2 text-[10px] text-[#64748B]">
               <span suppressHydrationWarning><RelativeTime dateString={post.created_at} /></span>
               <span>{calculateReadTime(post.content)}</span>
            </div>
            <Link href={`/article/${post.slug}`}>
              <h4 className="font-serif text-lg font-bold text-[#2C3E50] leading-tight mb-2 hover:text-[#B7410E] transition-colors">
                {post.title}
              </h4>
            </Link>
          </div>
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
      <Link href={`/category/${category}`} className="font-bold text-[#2C3E50] uppercase tracking-wider text-xs mb-4 border-b border-[#2C3E50]/10 pb-2 flex justify-between items-center group cursor-pointer hover:text-[#B7410E] transition-colors">
        {category}
        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
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

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const supabase = await createClient();
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const itemsPerPage = 8;

  // Fetch ALL posts first to categorize and feature
  const { data: rawPosts, error } = await supabase
    .from('posts')
    .select(`
      id, slug, title, excerpt, created_at, category, featured_image, content,
      authors ( name )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(100); 

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

  // Pagination Logic for "Recent Dispatches"
  const feedStartIndex = 6;
  const allFeedPosts = posts.slice(feedStartIndex);
  const totalFeedPages = Math.ceil(allFeedPosts.length / itemsPerPage);
  
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const currentFeedPosts = allFeedPosts.slice(start, end);

  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans selection:bg-[#B7410E] selection:text-white flex flex-col">
      <Navbar />
      
      {posts.length > 0 && <NewsTicker posts={posts.slice(0, 10)} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-grow w-full">
        
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
            
            {/* Dynamic Category Strips (Only show on page 1) */}
            {currentPage === 1 && displayCats.map(cat => (
              <CategorySection key={cat} category={cat} posts={categories[cat].slice(0, 3)} />
            ))}

            {/* Standard Feed */}
            <div className="flex items-center gap-4 mb-6 border-b-2 border-[#2C3E50] pb-2">
              <h3 className="font-serif text-xl font-bold text-[#2C3E50] uppercase tracking-tight">Recent Dispatches</h3>
            </div>
            <div className="flex flex-col divide-y divide-[#2C3E50]/10">
              {currentFeedPosts.map((post) => (
                <div key={post.id} className="group py-8 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-8 flex flex-col justify-start">
                    <div className="flex items-center gap-3 mb-2 text-xs font-bold uppercase tracking-wider text-[#B7410E]">
                      <Link href={`/category/${post.category || 'General'}`} className="hover:underline">
                        {post.category || 'General'}
                      </Link>
                      <span className="text-[#2C3E50]/20">•</span>
                      <span className="text-[#64748B]" suppressHydrationWarning>{formatDate(post.created_at)}</span>
                      <span className="text-[#2C3E50]/20">•</span>
                      <span className="text-[#64748B]">{calculateReadTime(post.content)}</span>
                    </div>
                    <Link href={`/article/${post.slug}`}>
                      <h3 className="font-serif text-2xl font-bold text-[#2C3E50] mb-3 hover:text-[#B7410E] transition-colors leading-tight">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-[#64748B] font-serif leading-relaxed line-clamp-2 mb-4 text-base">
                      {post.excerpt}
                    </p>
                  </div>
                  <Link href={`/article/${post.slug}`} className="md:col-span-4 aspect-[3/2] overflow-hidden rounded-sm bg-[#2C3E50]/5 border border-[#2C3E50]/5 block">
                    {post.featured_image && (
                      <img src={post.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    )}
                  </Link>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            <div className="mt-12 pt-12 border-t border-[#2C3E50]/10 flex justify-center gap-4">
              {currentPage > 1 && (
                <Link href={`/?page=${currentPage - 1}`} className="bg-white border border-[#2C3E50]/20 text-[#2C3E50] px-6 py-2 uppercase text-xs font-bold tracking-widest hover:bg-[#2C3E50] hover:text-[#F5F5F1] transition-colors rounded-sm shadow-sm">
                  Previous
                </Link>
              )}
              {currentPage < totalFeedPages && (
                <Link href={`/?page=${currentPage + 1}`} className="bg-[#2C3E50] text-[#F5F5F1] px-6 py-2 uppercase text-xs font-bold tracking-widest hover:bg-[#B7410E] transition-colors rounded-sm shadow-sm">
                  Next Page
                </Link>
              )}
            </div>
          </div>

          {/* --- RIGHT COLUMN: SIDEBAR --- */}
          <aside className="lg:col-span-3 space-y-12">
            
            {/* Contextual Search */}
            <ContextualSearch />

            {/* Newsletter */}
            <NewsletterForm />
            
            {/* About Widget (Manifesto) - Updated Link */}
            <div className="bg-[#2C3E50] text-[#F5F5F1] p-8 rounded-sm shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-32 bg-[#B7410E] rounded-full blur-3xl opacity-20 -mr-16 -mt-16 transition-opacity group-hover:opacity-30"></div>
              <h3 className="font-serif font-bold text-xl mb-4 text-[#B7410E] relative z-10">
                <Link href="/about" className="hover:underline decoration-[#B7410E] underline-offset-4">Manifesto</Link>
              </h3>
              <p className="text-sm leading-relaxed opacity-80 font-sans relative z-10">
                We believe in the weight of words. In an era of ephemeral feeds, Rusty Tablet is an automated monument to the permanent. 
                <br/><br/>
                Powered by Gemini AI, curated by algorithm, read by humans.
              </p>
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

      {/* --- FOOTER --- */}
      <footer className="bg-[#2C3E50] text-[#F5F5F1] border-t-4 border-[#B7410E] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#B7410E] flex items-center justify-center rounded-sm text-[#F5F5F1] font-serif font-bold text-xl">R</div>
                <span className="font-serif text-2xl font-bold tracking-tight">Rusty Tablet</span>
              </div>
              <p className="text-[#F5F5F1]/60 max-w-sm leading-relaxed mb-6 font-serif">
                Reporting from the intersection of rust, iron, and silicon. Digital Industrialism for the modern thinker.
              </p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                {['Twitter', 'LinkedIn', 'RSS'].map(social => (
                  <span key={social} className="text-xs font-bold uppercase tracking-widest text-[#B7410E] cursor-pointer hover:text-white transition-colors">{social}</span>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="font-bold text-[#B7410E] uppercase tracking-wider text-xs mb-6">Sections</h5>
              <ul className="space-y-3 text-sm text-[#F5F5F1]/80">
                {topCategories.slice(0, 5).map(cat => (
                  <li key={cat}>
                    <Link href={`/category/${cat}`} className="hover:text-[#B7410E] transition-colors">{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold text-[#B7410E] uppercase tracking-wider text-xs mb-6">Company</h5>
              <ul className="space-y-3 text-sm text-[#F5F5F1]/80">
                <li><Link href="/about" className="hover:text-[#B7410E] transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[#B7410E] transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-[#B7410E] transition-colors">Ghost Writers</Link></li>
                <li><Link href="#" className="hover:text-[#B7410E] transition-colors">Advertise</Link></li>
                <li><Link href="#" className="hover:text-[#B7410E] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#F5F5F1]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#F5F5F1]/40">
            <span>© {new Date().getFullYear()} Rusty Tablet Media. All rights reserved.</span>
            <span>Powered by Vercel & Supabase.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}