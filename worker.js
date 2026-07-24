export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Database ကို ချိတ်ဆက်မည့် API
    if (url.pathname === '/api/state') {
      try {
        if (request.method === 'GET') {
          const result = await env.DB.prepare("SELECT data FROM app_state WHERE id = 1").first();
          return new Response(result?.data || '{}', { headers: { 'Content-Type': 'application/json' } });
        }
        if (request.method === 'POST') {
          const data = await request.text();
          await env.DB.prepare("INSERT OR REPLACE INTO app_state (id, data) VALUES (1, ?)").bind(data).run();
          return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // ကျန်တဲ့ URL တွေအတွက် HTML ဖိုင်ကို ပြပေးမည်
    return env.ASSETS.fetch(request);
  }
};