import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rustytablet.com';
  
  // 1. Static Routes
  const routes = [
    '',
    '/about',
    '/contact',
    '/category/politics',
    '/category/industry',
    '/category/culture',
    '/category/technology',
    '/category/science',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. Dynamic Article Routes (Fetch from Supabase)
  // We use a direct client here since sitemap runs on the server side
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: posts } = await supabase
    .from('posts')
    .select('slug, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(1000); // Reasonable limit for a sitemap

  const articles = posts?.map((post) => ({
    url: `${baseUrl}/article/${post.slug}`,
    lastModified: new Date(post.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  })) || [];

  return [...routes, ...articles];
}