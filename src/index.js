export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return Response.json({ok:true,service:'schoolyard-buddies-client',build:'4.0.0'});
    return env.ASSETS.fetch(request);
  }
};
