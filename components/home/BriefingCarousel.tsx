'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

const getPostImage = (post: any) => {
  if (post.featured_image) return post.featured_image;
  if (post.article_images && post.article_images.length > 0) {
     const validImg = post.article_images.find((img: any) => img.public_url);
     if (validImg) return validImg.public_url;
  }
  return null;
};

const BriefingCard = ({ post }: { post: any }) => {
    const image = getPostImage(post);
    return (
      <Link href={`/article/${post.slug}`} className="group block bg-white border border-[#2C3E50]/10 rounded-sm overflow-hidden hover:shadow-md transition-all h-full">
         <div className="grid grid-cols-12 gap-0 h-full">
            <div className="col-span-5 relative bg-[#2C3E50]/5 min-h-[120px]">
                {image && <img src={image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />}
            </div>
            <div className="col-span-7 p-4 flex flex-col justify-center">
                <span className="text-[9px] font-bold text-[#B7410E] uppercase tracking-wider mb-1 block">{post.category}</span>
                <h4 className="font-serif text-sm font-bold text-[#2C3E50] leading-snug group-hover:text-[#B7410E] transition-colors line-clamp-3">
                    {post.title}
                </h4>
            </div>
         </div>
      </Link>
    );
};

export default function BriefingCarousel({ posts }: { posts: any[] }) {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 3;

  const nextSlide = () => {
    if (startIndex + itemsPerPage < posts.length) {
      setStartIndex(startIndex + itemsPerPage);
    } else {
      setStartIndex(0); // Loop back to start
    }
  };

  const prevSlide = () => {
    if (startIndex - itemsPerPage >= 0) {
      setStartIndex(startIndex - itemsPerPage);
    } else {
      // Go to last page
      setStartIndex(Math.floor((posts.length - 1) / itemsPerPage) * itemsPerPage);
    }
  };

  const visiblePosts = posts.slice(startIndex, startIndex + itemsPerPage);

  // If we don't have enough posts for pagination, just show what we have without arrows
  if (posts.length <= itemsPerPage) {
      return (
        <section className="mb-16">
            <div className="flex items-center gap-4 mb-6">
                <h2 className="font-serif text-xl font-bold text-[#2C3E50] uppercase tracking-tight flex items-center gap-2">
                    <BarChart3 size={20} className="text-[#64748B]" /> The Briefing
                </h2>
                <div className="h-px flex-grow bg-[#2C3E50]/10"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {posts.map(post => <BriefingCard key={post.id} post={post} />)}
            </div>
        </section>
      )
  }

  return (
    <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-grow">
                <h2 className="font-serif text-xl font-bold text-[#2C3E50] uppercase tracking-tight flex items-center gap-2">
                    <BarChart3 size={20} className="text-[#64748B]" /> The Briefing
                </h2>
                <div className="h-px flex-grow bg-[#2C3E50]/10 mr-4"></div>
            </div>
            
            <div className="flex gap-2">
                <button onClick={prevSlide} className="p-1.5 border border-[#2C3E50]/20 rounded-sm text-[#2C3E50] hover:bg-[#2C3E50] hover:text-white transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <button onClick={nextSlide} className="p-1.5 border border-[#2C3E50]/20 rounded-sm text-[#2C3E50] hover:bg-[#2C3E50] hover:text-white transition-colors">
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[120px]">
            {visiblePosts.map(post => <BriefingCard key={post.id} post={post} />)}
        </div>
    </section>
  );
}