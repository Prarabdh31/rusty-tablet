import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import Link from 'next/link';
import { Share2, Bookmark, ArrowRight, Info, AlertCircle, Camera } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cleanMarkdown } from '@/lib/utils';
import { getUnsplashImage, getFallbackImage } from '@/lib/services/unsplash';
import { formatDistanceToNow } from 'date-fns';
import CommentsSection from '@/components/article/CommentsSection';
import ShareBar from '@/components/article/ShareBar';
import NewsletterForm from '@/components/ui/NewsletterForm';
import ArticleActions from '@/components/article/ArticleActions';
import ChartWidget from '@/components/article/ChartWidget';
import AdUnit from '@/components/ads/AdUnit';
import ArticleSchema from '@/components/seo/ArticleSchema';

export const dynamic = 'force-dynamic';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  };
  
  const formattedDate = date.toLocaleDateString('en-US', options);
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });

  return `${formattedDate} (${relativeTime})`;
};

const calculateReadTime = (content: string) => {
  const wordsPerMinute = 200; 
  const words = content.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return `${time} min read`;
};

// --- IMAGE RENDERER ---
const ImageRenderer = ({ src, alt, title }: any) => {
    // Determine if AI Generated based on metadata or URL pattern
    // Updated check to be more inclusive of different credit formats
    const isAI = title?.includes('Rusty Tablet') || title?.includes('AI') || title?.includes('Imagen');
    const metaString = title || alt || '';
    const [caption, credit] = metaString.includes('|') ? metaString.split('|') : [metaString, ''];

    return (
        <figure className="my-10 block relative group">
            <div className="border border-[#2C3E50]/10 rounded-sm overflow-hidden bg-white shadow-sm relative">
            <img src={src} alt={alt} className="w-full h-auto m-0 block" />
            
            {/* Disclaimer / Info Badge */}
            <div className="absolute top-3 right-3 flex gap-2">
                {isAI && (
                    <div className="group/ai relative">
                        <div className="bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-sm cursor-help hover:bg-[#B7410E] transition-colors">
                            <AlertCircle size={14} />
                        </div>
                        <div className="absolute top-full right-0 mt-2 w-48 bg-black text-white text-[10px] p-3 rounded-sm opacity-0 group-hover/ai:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 font-sans">
                            <strong>AI Generated Visual:</strong> This image was synthesized by an AI model for illustrative purposes and may not depict actual events.
                        </div>
                    </div>
                )}
            </div>

            <figcaption className="p-4 border-t border-[#2C3E50]/5 bg-[#F9F9F7]">
                <div className="flex flex-col gap-1">
                    {caption && (
                        <span className="font-serif text-sm text-[#2C3E50] leading-snug md:block hidden">
                        {caption.trim()}
                        </span>
                    )}
                    {credit && (
                        <div className="flex items-center gap-2">
                        <Camera size={12} className="text-[#B7410E]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                            {credit.trim()}
                        </span>
                        </div>
                    )}
                </div>
            </figcaption>
            </div>
        </figure>
    );
};

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *, 
      authors (name, role, is_ai),
      article_images (
        public_url, caption, credit, usage_type, source
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !post) notFound();

  const { data: similarPosts } = await supabase
    .from('posts')
    .select('title, slug, category, created_at')
    .eq('category', post.category)
    .neq('id', post.id)
    .limit(3);

  const { data: readMorePosts } = await supabase
    .from('posts')
    .select('title, slug, category')
    .neq('id', post.id)
    .order('created_at', { ascending: false })
    .limit(4);

  // @ts-ignore
  const author = Array.isArray(post.authors) ? post.authors[0] : post.authors;
  let processedContent = cleanMarkdown(post.content);
  
  // We handle inline images via ReactMarkdown components now, but we strip old [IMAGE] tags if any exist
  processedContent = processedContent.replace(/\[IMAGE:.*?\]/g, ''); 
  
  const readTime = calculateReadTime(post.content);

  // Find Featured Image Metadata
  // @ts-ignore
  const featuredImageMeta = post.article_images?.find((img: any) => img.usage_type === 'FEATURED');
  const featuredCaption = featuredImageMeta?.caption || post.title;
  const featuredCredit = featuredImageMeta?.credit || (post.featured_image?.includes('unsplash') ? 'Photo via Unsplash' : 'Visualization via Rusty Tablet Engine');
  
  // Determine if featured is AI
  const isFeaturedAI = featuredImageMeta?.source === 'GEMINI_IMAGEN' || (!featuredImageMeta && !post.featured_image?.includes('unsplash'));

  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans selection:bg-[#B7410E] selection:text-white pb-24">
      {/* Inject Structured Data for SEO */}
      <ArticleSchema post={post} />
      
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <article className="lg:col-span-8">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[#B7410E] mb-6">
              <Link href="/" className="cursor-pointer hover:underline">Home</Link>
              <span className="text-[#2C3E50]/20">/</span>
              <Link href={`/category/${post.category || 'General'}`} className="cursor-pointer hover:underline">
                {post.category || 'Dispatches'}
              </Link>
              <span className="text-[#2C3E50]/20">•</span>
              <span className="text-[#64748B]">{readTime}</span>
            </div>

            <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#2C3E50] leading-tight md:leading-[1.1] mb-6 text-left">
              {post.title}
            </h1>

            <p className="text-xl text-[#64748B] font-serif leading-relaxed italic mb-8 border-l-2 border-[#B7410E] pl-4 text-left">
              {post.excerpt}
            </p>

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
              
              <ArticleActions postId={post.id} title={post.title} slug={post.slug} />
            </div>

            {post.nut_graph && (
              <div className="bg-[#E5E5E1]/50 border-l-4 border-[#2C3E50] p-6 mb-10 text-[#2C3E50] text-lg font-serif italic">
                <span className="block text-xs font-bold uppercase not-italic text-[#64748B] mb-2">Why It Matters</span>
                {post.nut_graph}
              </div>
            )}

            {/* CHART WIDGET */}
            {post.chart_data && <ChartWidget chart={post.chart_data} />}

            {/* FEATURED IMAGE */}
            {post.featured_image && (
              <figure className="mb-12 relative group block">
                <div className="relative overflow-hidden rounded-sm border border-[#2C3E50]/10">
                  <img 
                    src={post.featured_image} 
                    alt={post.title} 
                    className="w-full h-auto object-cover"
                  />
                  
                  {/* AI Warning (Featured) */}
                  {isFeaturedAI && (
                    <div className="absolute top-3 left-3 group/ai">
                        <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 cursor-help">
                            <AlertCircle size={10} className="text-[#B7410E]" /> AI Generated
                        </div>
                        <div className="absolute top-full left-0 mt-2 w-56 bg-black text-white text-[10px] p-3 rounded-sm opacity-0 group-hover/ai:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 font-sans leading-relaxed">
                            This image was created by generative AI. It is an artistic representation and may not depict real events.
                        </div>
                    </div>
                  )}

                  {/* Desktop Hover Caption */}
                  <div className="hidden md:flex absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col justify-end text-white pointer-events-none group-hover:pointer-events-auto">
                    <p className="font-serif text-lg leading-snug mb-1 text-shadow-sm">{featuredCaption}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#B7410E] flex items-center gap-2">
                       <span className="w-1 h-1 bg-[#B7410E] rounded-full"></span> {featuredCredit}
                    </p>
                  </div>

                  {/* Mobile Caption */}
                  <div className="md:hidden bg-[#2C3E50] text-white p-4">
                     <p className="font-serif text-sm leading-snug mb-1">{featuredCaption}</p>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-[#B7410E]">{featuredCredit}</p>
                  </div>
                </div>
              </figure>
            )}

            <div className="
              article-content font-serif text-[#2C3E50] text-lg leading-relaxed
              prose prose-base md:prose-lg max-w-none 
              prose-headings:font-bold prose-headings:text-[#2C3E50] 
              prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-[#B7410E] prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-4 prose-blockquote:border-[#B7410E] prose-blockquote:bg-[#E5E5E1]/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:text-[#2C3E50]
              prose-li:marker:text-[#B7410E]
              prose-strong:text-[#2C3E50] prose-strong:font-bold
            ">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // FIX: Custom paragraph renderer to unwrap images from <p> tags
                  p: ({node, children, ...props}) => {
                    const hasImage = node?.children?.some((child: any) => child.type === 'element' && child.tagName === 'img');
                    if (hasImage) {
                       return <>{children}</>;
                    }
                    return <p className="mb-6" {...props}>{children}</p>;
                  },
                  // Use Custom Image Renderer
                  img: (props) => <ImageRenderer {...props} />
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </div>

            <CommentsSection postId={post.id} />

          </article>

          <aside className="lg:col-span-4 space-y-12 border-l border-[#2C3E50]/10 pl-0 lg:pl-12">
            
            <NewsletterForm />
            
            <ShareBar title={post.title} slug={post.slug} />

            {post.sidebar_content && (
              <div className="bg-[#2C3E50] text-[#F5F5F1] p-8 rounded-sm shadow-lg">
                <h3 className="font-serif font-bold text-xl mb-4 text-[#B7410E]">
                  {post.sidebar_content.title || 'Fast Facts'}
                </h3>
                <ul className="space-y-3">
                  {post.sidebar_content.items?.map((item: string, i: number) => (
                    <li key={i} className="text-sm leading-relaxed opacity-90 border-b border-[#F5F5F1]/10 pb-2 last:border-0 font-sans">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AD SLOT */}
            <AdUnit 
              slotId="1234567890" 
              format="rectangle"
              className="w-full aspect-[3/4] bg-[#E5E5E1] border border-dashed border-[#2C3E50]/30"
              label="Advertisement"
            />

            {similarPosts && similarPosts.length > 0 && (
              <div>
                <Link href={`/category/${post.category}`} className="font-bold text-[#2C3E50] uppercase tracking-wider text-xs mb-6 border-b border-[#2C3E50]/10 pb-2 block hover:text-[#B7410E] transition-colors">
                  Related to {post.category}
                </Link>
                <div className="flex flex-col gap-6">
                  {similarPosts.map((similarPost) => (
                    <Link key={similarPost.slug} href={`/article/${similarPost.slug}`} className="group block">
                      <h5 className="font-serif text-lg font-bold text-[#2C3E50] leading-snug mb-1 group-hover:text-[#B7410E] transition-colors">
                        {similarPost.title}
                      </h5>
                      <div className="text-xs text-[#64748B] uppercase tracking-wide">
                        {formatDate(similarPost.created_at)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {readMorePosts && readMorePosts.length > 0 && (
              <div>
                <h4 className="font-bold text-[#2C3E50] uppercase tracking-wider text-xs mb-6 border-b border-[#2C3E50]/10 pb-2">
                  Read More
                </h4>
                <div className="flex flex-col gap-4">
                  {readMorePosts.map((readMorePost) => (
                    <Link key={readMorePost.slug} href={`/article/${readMorePost.slug}`} className="group flex items-start gap-3">
                      <ArrowRight size={16} className="mt-1 text-[#B7410E] shrink-0 group-hover:translate-x-1 transition-transform" />
                      <div>
                        <h5 className="font-medium text-[#2C3E50] text-sm leading-snug group-hover:text-[#B7410E] transition-colors">
                          {readMorePost.title}
                        </h5>
                        <span className="text-[10px] text-[#64748B] uppercase tracking-wider">{readMorePost.category || 'General'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

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
                {['Politics', 'Technology', 'Industry', 'Culture'].map(cat => (
                  <li key={cat}>
                    <Link href={`/category/${cat.toLowerCase()}`} className="hover:text-[#B7410E] transition-colors">{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold text-[#B7410E] uppercase tracking-wider text-xs mb-6">Company</h5>
              <ul className="space-y-3 text-sm text-[#F5F5F1]/80">
                <li><Link href="/about" className="hover:text-[#B7410E] transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[#B7410E] transition-colors">Contact Us</Link></li>
                <li><Link href="/disclaimer" className="hover:text-[#B7410E] transition-colors">Disclaimer</Link></li>
                <li><Link href="/privacy" className="hover:text-[#B7410E] transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-[#B7410E] transition-colors">Advertise</Link></li>
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