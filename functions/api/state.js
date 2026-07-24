export async function onRequestGet(context) {
  const { env } = context;
  try {
    const stmt = env.DB.prepare("SELECT data FROM app_state WHERE id = 1");
    const result = await stmt.first();
    if (result && result.data) {
      return new Response(result.data, { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const data = await request.text();
    const stmt = env.DB.prepare("INSERT OR REPLACE INTO app_state (id, data) VALUES (1, ?)");
    await stmt.bind(data).run();
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}