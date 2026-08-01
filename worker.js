export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Common CORS Headers
    const corsHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    // 1. CORS Preflight Handling (OPTIONS request)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // -------------------------------------------------------------
    // 2. Google Sheets သို့မဟုတ် API အတွက် Users Data Endpoint (/api/users)
    // -------------------------------------------------------------
    if (url.pathname === "/api/users") {
      const authHeader = request.headers.get("Authorization");
      const SECRET_TOKEN = "MY_SECRET_API_TOKEN_214749"; // မိမိ Secret Key

      // Bearer Token စစ်ဆေးခြင်း
      if (!authHeader || authHeader !== `Bearer ${SECRET_TOKEN}`) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }), 
          { status: 401, headers: corsHeaders }
        );
      }

      try {
        // D1 Database မှ 'users' table (မိမိ table နာမည် အစားထိုးပါ) ထဲမှ Data ဆွဲထုတ်ခြင်း
        const { results } = await env.DB.prepare("SELECT id, name, email, created_at FROM users").all();

        return new Response(JSON.stringify(results), {
          status: 200,
          headers: corsHeaders
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // -------------------------------------------------------------
    // 3. သင့် မူလ App State Endpoint (/api/state)
    // -------------------------------------------------------------
    if (url.pathname === "/api/state") {
      try {
        // GET State
        if (request.method === "GET") {
          const result = await env.DB
            .prepare("SELECT data FROM app_state WHERE id = 1")
            .first();

          return new Response(
            result?.data || "{}",
            { headers: corsHeaders }
          );
        }

        // SAVE State
        if (request.method === "POST") {
          const body = await request.json();
          const data = JSON.stringify(body);

          await env.DB
            .prepare("INSERT OR REPLACE INTO app_state (id, data) VALUES (1, ?)")
            .bind(data)
            .run();

          return new Response(
            JSON.stringify({ success: true }),
            { headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: corsHeaders }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // -------------------------------------------------------------
    // 4. Static Files Handling (Frontend)
    // -------------------------------------------------------------
    return env.ASSETS.fetch(request);
  }
};
