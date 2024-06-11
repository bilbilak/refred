interface Headers {
  [key: string]: string;
}

export default {
  async fetch(
    request: Request,
    // @ts-ignore
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const referer = request.headers.get('Referer');

    let headers: Headers = {
      // 'Link': '<data:>; rel=icon', // it doesn't work
      'Content-Security-Policy': "default-src 'self'; img-src 'none';", // disable favicon requests
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet'
    };

    if (referer) {
      try {
        const url = new URL(request.url);
        const destination = url.pathname;

        const refererUrl = new URL(referer);
        const hostname = refererUrl.hostname;
        let path = refererUrl.pathname

        if (url.searchParams.has('base')) {
          switch (url.searchParams.get('base')) {
            case 'root':
              path = '';
              break;
            case 'path':
              path = refererUrl.pathname;
              break;
            case 'repo':
              path = refererUrl.pathname.split("/", 3).join("/");
              break;
            default:
              return new Response('Invalid base option', { status: 400 });
          }
        } else {
          switch (hostname) {
            case 'github.com':
              path = refererUrl.pathname.split("/", 3).join("/");
              break;
          }
        }

        const targetUrl = `https://${hostname}${path}${destination}`;
        headers = {
          ...headers,
          'Location': targetUrl,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Surrogate-Control': 'no-store',
          'Pragma': 'no-cache',
          'Expires': '0'
        };

        return new Response(null, { status: 302, headers });
      } catch (error) {
        return new Response('Invalid referer URL', { status: 400, headers });
      }
    } else {
      return new Response('Referer header is missing or invalid', { status: 400, headers });
    }
  }
};
