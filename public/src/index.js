export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return Response.json({ ok: true, service: 'schoolyard-buddies-client', build: 'mobile-compatibility-2.1.4' }, {
        headers: { 'cache-control': 'no-store' }
      });
    }
    if (url.pathname === '/mobile') {
      return Response.redirect(new URL('/mobile.html' + url.search, url), 302);
    }
    if (url.pathname === '/desktop') {
      return Response.redirect(new URL('/desktop.html' + url.search, url), 302);
    }
    return env.ASSETS.fetch(request);
  }
};
