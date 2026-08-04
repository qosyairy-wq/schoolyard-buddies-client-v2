export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return Response.json({ok:true,service:'schoolyard-buddies-client',build:'3.1.1'});
    return env.ASSETS.fetch(request);
  }
};
