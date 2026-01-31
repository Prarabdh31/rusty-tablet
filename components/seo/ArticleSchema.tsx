import Script from 'next/script';

export default function ArticleSchema({ post }: { post: any }) {
  const siteUrl = 'https://www.rustytablet.com';
  const articleUrl = `${siteUrl}/article/${post.slug}`;
  const imageUrl = post.featured_image || `${siteUrl}/opengraph-image.png`;
  
  // Resolve Author
  const authorName = post.authors?.name || 'Rusty Tablet Staff';
  const authorUrl = `${siteUrl}/about`; // Or specific author page if we had one

  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "image": [imageUrl],
    "datePublished": new Date(post.created_at).toISOString(),
    "dateModified": new Date(post.created_at).toISOString(), // Use updated_at if available
    "author": [{
      "@type": "Person",
      "name": authorName,
      "url": authorUrl
    }],
    "publisher": {
      "@type": "Organization",
      "name": "Rusty Tablet",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/icon.png`
      }
    },
    "description": post.excerpt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    }
  };

  return (
    <Script
      id="json-ld-article"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}