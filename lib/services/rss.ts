import Parser from 'rss-parser';

// Configure parser with headers to mimic a browser
const parser = new Parser({
  customFields: {
    item: ['contentSnippet', 'pubDate'],
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml; q=0.1',
  }
});

export interface RSSItem {
  title: string;
  link: string;
  contentSnippet?: string; // The short description
  pubDate?: string;
}

export async function fetchRSSFeed(url: string, limit = 5): Promise<RSSItem[]> {
  try {
    const feed = await parser.parseURL(url);
    
    // Return the top N items, cleaned up
    return feed.items.slice(0, limit).map(item => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      contentSnippet: item.contentSnippet || item.content || '',
      pubDate: item.pubDate
    }));
  } catch (error) {
    console.error(`RSS Error (${url}):`, error);
    return [];
  }
}

// Helper to get Google Trends RSS URL for a region
export function getGoogleTrendsURL(geo: 'US' | 'IN' | 'UK' | 'JP' = 'US'): string {
  // Use the atom feed which is sometimes more reliable for servers
  return `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`;
}