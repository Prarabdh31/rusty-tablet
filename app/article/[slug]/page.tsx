import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import Link from 'next/link';
import { Share2, Bookmark, ArrowRight, Info, Camera } from 'lucide-react';
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

async function processInlineImages(content: string) {
  const regex = /\[IMAGE:\s*(.*?)\]/g;
  const matches = [...content.matchAll(regex)];
  if (matches.length === 0) return content;
  let newContent = content;
  const replacements = await Promise.all(
    matches.map(async (match) => {
      const query = match[1];
      const url = await getUnsplashImage(query) || getFallbackImage();
      return { match: match[0], url, alt: query };
    })
  );
  replacements.forEach(({ match, url, alt }) => {
    // We pass the caption/credit in the title attribute for ReactMarkdown to pick up
    newContent = newContent.replace(match, `\n\n![${alt}](${url} "${alt} | Photo via Unsplash")\n\n`);
  });
  return newContent;
}

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
  processedContent = await processInlineImages(processedContent);
  const readTime = calculateReadTime(post.content);

  // Find Featured Image Metadata
  // @ts-ignore
  const featuredImageMeta = post.article_images?.find((img: any) => img.usage_type === 'FEATURED');
  const featuredCaption = featuredImageMeta?.caption || post.title;
  const featuredCredit = featuredImageMeta?.credit || (post.featured_image?.includes('unsplash') ? 'Photo via Unsplash' : 'Visualization via Rusty Tablet Engine');

  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans selection:bg-[#B7410E] selection:text-white pb-24">
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

            <h1 className="font-serif text-2xl md:text-5xl font-bold text-[#2C3E50] leading-tight md:leading-[1.1] mb-6 text-left">
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

            {/* FEATURED IMAGE with HOVER CAPTION */}
            {post.featured_image && (
              <figure className="mb-12 relative group block">
                <div className="relative overflow-hidden rounded-sm border border-[#2C3E50]/10">
                  <img 
                    src={post.featured_image} 
                    alt={post.title} 
                    className="w-full h-auto object-cover"
                  />
                  {/* Overlay Info Icon */}
                  <div className="absolute bottom-3 right-3 z-10">
                     <div className="bg-[#2C3E50]/80 backdrop-blur-sm text-white p-2 rounded-full cursor-help hover:bg-[#B7410E] transition-colors shadow-sm">
                       <Camera size={16} />
                     </div>
                  </div>
                  {/* Hover Caption Panel */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end text-white pointer-events-none group-hover:pointer-events-auto">
                    <p className="font-serif text-lg leading-snug mb-1 text-shadow-sm">{featuredCaption}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#B7410E] flex items-center gap-2">
                       <span className="w-1 h-1 bg-[#B7410E] rounded-full"></span> {featuredCredit}
                    </p>
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
                  p: ({node, children, ...props}) => {
                    const hasImage = (node?.children[0] as any)?.tagName === 'img';
                    if (hasImage) return <>{children}</>;
                    return <p className="mb-6" {...props}>{children}</p>;
                  },
                  img: ({node, ...props}) => {
                    // Metadata from title attribute
                    const metaString = props.title || props.alt || '';
                    const [caption, credit] = metaString.includes('|') ? metaString.split('|') : [metaString, ''];

                    return (
                      <figure className="my-10 block relative group">
                         <div className="border border-[#2C3E50]/10 rounded-sm overflow-hidden relative">
                          <img {...props} title={undefined} className="w-full h-auto m-0" />
                          
                          {/* Inline Image Overlay */}
                          <div className="absolute bottom-2 right-2 z-10">
                             <div className="bg-white/90 text-[#2C3E50] p-1.5 rounded-sm shadow-sm cursor-help hover:bg-[#B7410E] hover:text-white transition-colors">
                               <Info size={14} />
                             </div>
                          </div>

                          {/* Inline Image Hover Panel */}
                          <div className="absolute inset-x-0 bottom-0 bg-[#2C3E50]/95 text-white p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                            {caption && <p className="font-sans text-sm mb-1 leading-snug">{caption.trim()}</p>}
                            {credit && <p className="text-[10px] uppercase tracking-wider text-[#B7410E] font-bold">{credit.trim()}</p>}
                          </div>
                         </div>
                      </figure>
                    );
                  }
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

            <div className="w-full aspect-[3/4] bg-[#E5E5E1] border border-dashed border-[#2C3E50]/30 flex flex-col items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest z-10 mb-2">Advertisement</span>
            </div>

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
    </main>
  );
}