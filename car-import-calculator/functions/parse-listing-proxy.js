/**
 * parse-listing-proxy.js — serverless CORS proxy for car-listing extraction.
 *
 * Deployable as a Cloudflare Worker (or Deno Deploy function). It fetches a
 * used-car advert URL server-side and returns the page HTML with permissive
 * CORS headers, so the browser app can run listing-parser.js on it even when
 * the listing site (Autotrader, usedcarsni, etc.) blocks browser requests or
 * datacenter IPs.
 *
 * The static site reads it via:
 *   https://<your-worker>.workers.dev/?url=<encodeURIComponent(listingUrl)>
 * falling back to the existing r.jina.ai / allorigins proxies when it is 404.
 *
 * Why this exists: GitHub Pages is static, so the app cannot set its own
 * server-side fetcher. Autotrader/Cloudflare frequently return 403 to
 * datacenter IPs (jina, allorigins), and cross-origin reads are blocked for
 * direct fetch. A free Cloudflare Worker egress IP pool (and a proper
 * User-Agent) is significantly more reliable.
 *
 * Deploy (Cloudflare):
 *   npm i -g wrangler
 *   wrangler deploy parse-listing-proxy.js --name car-import-parser
 * (wrangler reads `export default { fetch }` — see the bottom export.)
 *
 * Deno Deploy equivalent: the same handler works as an HTTP handler.
 */

// SSRF guard — refuse non-http(s) schemes.
const DANGEROUS_PATTERNS = [/^\/\//, /^[a-z]+:\/\/(?!http)/i];

function safeTargetUrl(raw) {
  let url = String(raw || '').trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  if (DANGEROUS_PATTERNS.some((re) => re.test(url))) return null;
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

const BLOCKED_HOSTS = ['127.0.0.1', 'localhost', '169.254.169.254']; // SSRF guard

async function handleRequest(request) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const target = safeTargetUrl(url.searchParams.get('url'));
  if (!target) {
    return new Response(JSON.stringify({ error: 'Missing or invalid ?url=' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  if (BLOCKED_HOSTS.includes(target.hostname) || target.hostname.endsWith('.internal')) {
    return new Response(JSON.stringify({ error: 'Blocked host' }), {
      status: 403,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      redirect: 'follow',
    });

    const contentType = upstream.headers.get('content-type') || 'text/html';
    const body = await upstream.text();

    // Limit size (Autotrader pages are large but < 2MB typically).
    const capped = body.length > 2_500_000 ? body.slice(0, 2_500_000) : body;

    return new Response(capped, {
      status: upstream.status,
      headers: {
        ...cors,
        'Content-Type': contentType.includes('text') ? contentType : 'text/html; charset=utf-8',
        'X-Fetched-By': 'car-import-parser',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Upstream fetch failed: ' + err.message }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

// Cloudflare Worker entry point.
export default {
  fetch: handleRequest,
};

// Deno Deploy compatibility: `Deno.serve` auto-detects an exported `handler`.
export const handler = handleRequest;
