// functions/api/state.js

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    // D1 ထဲကနေ data ကို ဖတ်ပါမယ် (ဥပမာ - AppState ဆိုတဲ့ table မှာ 'state' ဆိုတဲ့ key နဲ့ သိမ်းထားတယ်ဆိုပါစို့)
    const result = await env.DB.prepare("SELECT value FROM AppState WHERE key = ?1").bind('state').first();
    
    if (result && result.value) {
      return new Response(result.value, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response('', { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const bodyText = await request.text(); // HTML ကနေ ပို့လိုက်တဲ့ JSON data အပြည့်အစုံ
    
    // D1 ထဲမှာ သိမ်းပါမယ်
    await env.DB.prepare(
      "INSERT OR REPLACE INTO AppState (key, value) VALUES (?1, ?2)"
    ).bind('state', bodyText).run();
    
    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
