import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import Link from 'next/link';
import { Share2, Bookmark, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cleanMarkdown } from '@/lib/utils';
import { getUnsplashImage, getFallbackImage } from '@/lib/services/unsplash';

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

// Helper: Replace [IMAGE: query] with actual image URLs
async function processInlineImages(content: string) {
  const regex = /\[IMAGE:\s*(.*?)\]/g;
  const matches = [...content.matchAll(regex)];
  
  if (matches.length === 0) return content;

  let newContent = content;

  // Process all matches in parallel
  const replacements = await Promise.all(
    matches.map(async (match) => {
      const query = match[1];
      const url = await getUnsplashImage(query) || getFallbackImage();
      return { match: match[0], url, alt: query };
    })
  );

  // Replace in text
  replacements.forEach(({ match, url, alt }) => {
    // Convert to standard Markdown image syntax
    newContent = newContent.replace(match, `\n\n![${alt}](${url})\n\n`);
  });

  return newContent;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch Current Post
  const { data: post, error } = await supabase
    .from('posts')
    .select(`*, authors (name, role, is_ai)`)
    .eq('slug', slug)
    .single();

  if (error || !post) notFound();

  // 2. Fetch Similar Articles (Same Category, exclude current)
  const { data: similarPosts } = await supabase
    .from('posts')
    .select('title, slug, category, created_at')
    .eq('category', post.category)
    .neq('id', post.id)
    .limit(3);

  // 3. Fetch "Read More" (Recent posts, exclude current)
  const { data: readMorePosts } = await supabase
    .from('posts')
    .select('title, slug, category')
    .neq('id', post.id)
    .order('created_at', { ascending: false })
    .limit(4);

  // @ts-ignore
  const author = Array.isArray(post.authors) ? post.authors[0] : post.authors;

  // 1. Clean Markdown (Whitespace fix)
  let processedContent = cleanMarkdown(post.content);
  
  // 2. Process Inline Images (API Fetch)
  processedContent = await processInlineImages(processedContent);

  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans selection:bg-[#B7410E] selection:text-white pb-24">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <article className="lg:col-span-8">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[#B7410E] mb-6">
              <span className="cursor-pointer hover:underline">Home</span>
              <span className="text-[#2C3E50]/20">/</span>
              <span className="cursor-pointer hover:underline">{post.category || 'Dispatches'}</span>
            </div>

            <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#2C3E50] leading-[1.1] mb-6 text-left">
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
              <div className="flex items-center gap-4 text-[#2C3E50]">
                 <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:text-[#B7410E] transition-colors"><Share2 size={16} /> Share</button>
                 <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:text-[#B7410E] transition-colors"><Bookmark size={16} /> Save</button>
              </div>
            </div>

            {/* Nut Graph Box - Moved Here */}
            {post.nut_graph && (
              <div className="bg-[#E5E5E1]/50 border-l-4 border-[#2C3E50] p-6 mb-10 text-[#2C3E50] text-lg font-serif italic">
                <span className="block text-xs font-bold uppercase not-italic text-[#64748B] mb-2">Why It Matters</span>
                {post.nut_graph}
              </div>
            )}

            {post.featured_image && (
              <figure className="mb-10">
                <img src={post.featured_image} alt={post.title} className="w-full h-auto rounded-sm border border-[#2C3E50]/10" />
                <figcaption className="text-xs text-[#64748B] mt-2 italic text-right">
                  {post.featured_image.includes('unsplash') ? 'Photo via Unsplash' : 'Visualization via Rusty Tablet Engine'}
                </figcaption>
              </figure>
            )}

            {/* --- MARKDOWN RENDERER --- */}
            <div className="
              article-content font-serif text-[#2C3E50] text-lg leading-relaxed
              prose prose-lg max-w-none 
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
                  // Prevent wrapping images in paragraphs
                  p: ({node, children, ...props}) => {
                    // Check if the only child is an image
                    const hasImage = (node?.children[0] as any)?.tagName === 'img';
                    if (hasImage) {
                      return <>{children}</>;
                    }
                    return <p className="mb-6" {...props}>{children}</p>;
                  },
                  // Allow images to be full width
                  img: ({node, ...props}) => (
                    <figure className="my-10 block">
                       <div className="border border-[#2C3E50]/10 rounded-sm overflow-hidden">
                        <img {...props} className="w-full h-auto m-0" />
                       </div>
                       {props.alt && <figcaption className="text-xs text-[#64748B] mt-2 text-center italic uppercase tracking-wider">{props.alt}</figcaption>}
                    </figure>
                  )
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </div>

          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-12 border-l border-[#2C3E50]/10 pl-0 lg:pl-12">
            
            {/* Sidebar Content from AI */}
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

            {/* Ad Slot */}
            <div className="w-full aspect-[3/4] bg-[#E5E5E1] border border-dashed border-[#2C3E50]/30 flex flex-col items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest z-10 mb-2">Advertisement</span>
            </div>

            {/* Similar Articles */}
            {similarPosts && similarPosts.length > 0 && (
              <div>
                <h4 className="font-bold text-[#2C3E50] uppercase tracking-wider text-xs mb-6 border-b border-[#2C3E50]/10 pb-2">
                  Related to {post.category}
                </h4>
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

            {/* Read More */}
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