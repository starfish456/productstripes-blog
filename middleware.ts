import { NextRequest, NextResponse } from 'next/server';

// List of known social media and search engine bots
const BOTS = [
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'telegrambot',
  'whatsapp',
  'pinterest',
  'opengraph',
  'opengraphbot',
  'bot ',
  'crawler',
  'embedly',
  'vkshare',
  'quora link preview',
  'redditbot',
  'rogerbot',
  'showyoubot',
  'google',
  'bingbot',
  'baiduspider',
  'duckduckbot',
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOTS.some((bot) => ua.includes(bot));
}

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent');

  // Only intercept post pages for bots
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Skip if it's the home page, static assets, or API routes
  if (
    pathParts.length === 0 ||
    pathParts[0].includes('.') ||
    pathParts[0] === 'api' ||
    pathParts[0] === '_next'
  ) {
    return NextResponse.next();
  }

  // If not a bot, continue to the SPA
  if (!isBot(userAgent)) {
    return NextResponse.next();
  }

  // For bots, fetch the Open Graph metadata from Convex
  const slug = pathParts[0];
  const convexUrl = process.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    return NextResponse.next();
  }

  try {
    // Construct the Convex site URL for the HTTP endpoint
    const convexSiteUrl = convexUrl.replace('.cloud', '.site');
    const metaUrl = `${convexSiteUrl}/meta/post?slug=${encodeURIComponent(slug)}`;

    const response = await fetch(metaUrl, {
      headers: {
        Accept: 'text/html',
      },
    });

    if (response.ok) {
      const html = await response.text();
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
      });
    }

    // If meta endpoint fails, fall back to SPA
    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Files with extensions (images, xml, txt, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
