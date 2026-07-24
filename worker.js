export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    const corsHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };


    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }


    // API
    if (url.pathname === "/api/state") {

      try {

        // GET State
        if (request.method === "GET") {

          const result = await env.DB
            .prepare(
              "SELECT data FROM app_state WHERE id = 1"
            )
            .first();


          return new Response(
            result?.data || "{}",
            {
              headers: corsHeaders
            }
          );
        }


        // SAVE State
        if (request.method === "POST") {

          const body = await request.json();

          const data = JSON.stringify(body);


          await env.DB
            .prepare(
              "INSERT OR REPLACE INTO app_state (id, data) VALUES (1, ?)"
            )
            .bind(data)
            .run();


          return new Response(
            JSON.stringify({
              success: true
            }),
            {
              headers: corsHeaders
            }
          );
        }


        return new Response(
          JSON.stringify({
            error: "Method not allowed"
          }),
          {
            status:405,
            headers:corsHeaders
          }
        );


      } catch(error){

        return new Response(
          JSON.stringify({
            error:error.message
          }),
          {
            status:500,
            headers:corsHeaders
          }
        );

      }
    }


    // Static files
    return env.ASSETS.fetch(request);
  }
};
