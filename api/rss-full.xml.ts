import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: VercelRequest) {
  const convexUrl = process.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    return new Response(
      'Configuration error: VITE_CONVEX_URL not set. Add it to Vercel environment variables.',
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  // Construct the Convex site URL for the HTTP endpoint
  const convexSiteUrl = convexUrl.replace('.cloud', '.site');
  const targetUrl = `${convexSiteUrl}/rss-full.xml`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Accept: 'application/rss+xml',
      },
    });

    if (!response.ok) {
      return new Response('RSS feed not available', {
        status: response.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const xml = await response.text();
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      },
    });
  } catch {
    return new Response('Failed to fetch RSS feed', {
      status: 502,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
