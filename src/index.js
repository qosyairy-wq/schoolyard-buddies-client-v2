export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return Response.json({ok:true,service:'schoolyard-buddies-client',build:'3.2.0-perf2'});
    return env.ASSETS.fetch(request);
  }
};
