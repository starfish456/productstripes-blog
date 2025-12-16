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

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent');

  // Only intercept post pages for bots
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Skip if it's the home page, static assets, or API routes
  if (
    pathParts.length === 0 ||
    pathParts[0].includes('.') ||
    pathParts[0] === 'api' ||
    pathParts[0] === 'images'
  ) {
    return;
  }

  // If not a bot, continue to the SPA
  if (!isBot(userAgent)) {
    return;
  }

  // For bots, fetch the Open Graph metadata from Convex
  const slug = pathParts[0];
  const convexUrl = process.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    return;
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
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
      });
    }

    // If meta endpoint fails, fall back to SPA
    return;
  } catch {
    return;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - static files (with extensions)
     * - images directory
     */
    '/((?!api|images|.*\\..*).*)',
  ],
};
