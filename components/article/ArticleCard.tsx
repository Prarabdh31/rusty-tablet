import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// Define the interface for the props based on our Supabase table
interface ArticleCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string | null;
    created_at: string;
    category: string | null;
    authors: {
      name: string;
    } | null; // Supabase returns single object for foreign key if configured right, or array
  };
}

export default function ArticleCard({ post }: ArticleCardProps) {
  // Handle potential array or object from Supabase join
  const authorName = Array.isArray(post.authors) 
    ? post.authors[0]?.name 
    : post.authors?.name || 'Unknown Author';

  return (
    <article className="flex flex-col border-b border-[#2C3E50]/10 pb-8 mb-8 group">
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-[#B7410E] mb-2">
        <span>{post.category || 'General'}</span>
        <span className="text-[#2C3E50]/20">•</span>
        <span className="text-[#64748B]">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </span>
      </div>

      <Link href={`/article/${post.slug}`} className="block">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2C3E50] leading-tight mb-3 group-hover:text-[#B7410E] transition-colors">
          {post.title}
        </h2>
      </Link>

      <p className="text-[#64748B] font-serif leading-relaxed mb-4 line-clamp-3">
        {post.excerpt}
      </p>

      <div className="mt-auto flex items-center gap-2 text-sm text-[#2C3E50] font-medium">
        <span>By {authorName}</span>
      </div>
    </article>
  );
}