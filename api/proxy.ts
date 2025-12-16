import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: VercelRequest) {
  const convexUrl = process.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    return new Response(
      JSON.stringify({
        error: 'VITE_CONVEX_URL not set. Add it to Vercel environment variables.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Construct the Convex site URL for the HTTP endpoint
  const convexSiteUrl = convexUrl.replace('.cloud', '.site');
  const url = new URL(req.url!);

  // Extract the API path after /api/
  const apiPath = url.pathname.replace(/^\/api/, '');
  const targetUrl = `${convexSiteUrl}/api${apiPath}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'API endpoint error' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.text();
    const contentType =
      response.headers.get('Content-Type') || 'application/json';

    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch from API' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
