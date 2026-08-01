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

    // 1. CORS Preflight Handling
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // -------------------------------------------------------------
    // 2. Users Data Endpoint (/api/users)
    // -------------------------------------------------------------
    if (url.pathname === "/api/users") {
      const authHeader = request.headers.get("Authorization");
      const SECRET_TOKEN = "TEST_TOKEN_003009"; // Token အသစ်ကို နှစ်ဖက်စလုံး တူညီစေရန် ပြင်ထားပါသည်

      if (!authHeader || authHeader !== `Bearer ${SECRET_TOKEN}`) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }), 
          { status: 401, headers: corsHeaders }
        );
      }

      try {
        const { results } = await env.DB.prepare("SELECT id, name, email, created_at FROM users").all();
        return new Response(JSON.stringify(results), { status: 200, headers: corsHeaders });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
    }

    // -------------------------------------------------------------
    // 3. All Data Endpoint (/api/all-data) - Google Sheet အတွက်
    // -------------------------------------------------------------
    if (url.pathname === "/api/all-data") {
      const authHeader = request.headers.get("Authorization");
      const SECRET_TOKEN = "TEST_TOKEN_003009";

      if (!authHeader || authHeader !== `Bearer ${SECRET_TOKEN}`) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }), 
          { status: 401, headers: corsHeaders }
        );
      }

      try {
        const allData = {};
        allData.AppAccounts = (await env.DB.prepare("SELECT * FROM AppAccounts").all()).results;
        allData.AppAdjustments = (await env.DB.prepare("SELECT * FROM AppAdjustments").all()).results;
        allData.AppCapital = (await env.DB.prepare("SELECT * FROM AppCapital").all()).results;
        allData.AppLoans = (await env.DB.prepare("SELECT * FROM AppLoans").all()).results;
        allData.AppLogs = (await env.DB.prepare("SELECT * FROM AppLogs").all()).results;
        allData.AppPnl = (await env.DB.prepare("SELECT * FROM AppPnl").all()).results;
        allData.AppSettings = (await env.DB.prepare("SELECT * FROM AppSettings").all()).results;
        allData.AppTransactions = (await env.DB.prepare("SELECT * FROM AppTransactions").all()).results;
        allData.AppTransfers = (await env.DB.prepare("SELECT * FROM AppTransfers").all()).results;

        return new Response(JSON.stringify(allData), { status: 200, headers: corsHeaders });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
    }

    // -------------------------------------------------------------
    // 4. App State Endpoint (/api/state) - သင့် Web App အတွက်
    // -------------------------------------------------------------
    if (url.pathname === "/api/state") {
      try {
        // GET REQUEST
        if (request.method === "GET") {
          const state = {
            accounts: ['Kpay(TZ)', 'Wave(TZ)', 'Bank(TZ)'],
            balances: { 'Kpay(TZ)': 0, 'Wave(TZ)': 0, 'Bank(TZ)': 0, 'cash': 0 },
            transactions: [], pnl: [], loans: [], transfers: [], capital: [], adjustments: [], logs: [],
            categories: { income: ['Commission', 'Salary', 'Other Income'], expense: ['Rent', 'Food', 'Transport', 'Utility', 'Other Expense'] },
            userPermissions: { canDelete: false, canAdjust: false, canLoans: false, canCapital: false, canCategories: false, canReports: true, canExport: true, canBackup: false },
            users: { admin: '0000', user: '1111' }
          };

          const settingsRes = await env.DB.prepare("SELECT key, value FROM AppSettings").all();
          if(settingsRes.results) settingsRes.results.forEach(r => { try { state[r.key] = JSON.parse(r.value); } catch(e) {} });

          const accsRes = await env.DB.prepare("SELECT name, balance FROM AppAccounts").all();
          if (accsRes.results && accsRes.results.length > 0) {
            state.accounts = []; 
            accsRes.results.forEach(a => {
              if (a.name === 'cash') {
                state.balances.cash = a.balance; 
              } else {
                state.accounts.push(a.name);
                state.balances[a.name] = a.balance;
              }
            });
          }

          const txsRes = await env.DB.prepare("SELECT * FROM AppTransactions").all();
          if(txsRes.results) state.transactions = txsRes.results.map(t => ({
            id: t.id, ts: t.ts, customerName: t.customerName, phone: t.phone, type: t.type, account: t.account, amount: t.amount, income: t.income || 0, incomeSource: t.incomeSource || 'cash'
          }));

          const pnlRes = await env.DB.prepare("SELECT * FROM AppPnl").all();
          if(pnlRes.results) state.pnl = pnlRes.results.map(p => ({ id: p.id, ts: p.ts, type: p.type, category: p.category, source: p.source, amount: p.amount, note: p.note }));

          const loansRes = await env.DB.prepare("SELECT * FROM AppLoans").all();
          if(loansRes.results) state.loans = loansRes.results.map(l => ({ ...l, payments: JSON.parse(l.payments || '[]') }));

          const transfersRes = await env.DB.prepare("SELECT * FROM AppTransfers").all();
          if(transfersRes.results) state.transfers = transfersRes.results.map(t => ({ id: t.id, ts: t.ts, from: t.from_acc, to: t.to_acc, amount: t.amount, note: t.note }));

          const capRes = await env.DB.prepare("SELECT * FROM AppCapital").all();
          if(capRes.results) state.capital = capRes.results.map(c => ({ id: c.id, ts: c.ts, date: c.date, account: c.account, amount: c.amount, note: c.note }));

          const adjRes = await env.DB.prepare("SELECT * FROM AppAdjustments").all();
          if(adjRes.results) state.adjustments = adjRes.results.map(a => ({ id: a.id, ts: a.ts, target: a.target, oldBalance: a.oldBalance, newBalance: a.newBalance, diff: a.diff, note: a.note }));

          const logsRes = await env.DB.prepare("SELECT * FROM AppLogs").all();
          if(logsRes.results) state.logs = logsRes.results.map(l => ({ id: l.id, ts: l.ts, user: l.user, action: l.action, details: l.details }));

          return new Response(JSON.stringify(state), { status: 200, headers: corsHeaders });
        }

        // POST REQUEST
        if (request.method === "POST") {
          const state = await request.json();

          await env.DB.batch([
            env.DB.prepare("DELETE FROM AppSettings"),
            env.DB.prepare("DELETE FROM AppAccounts"),
            env.DB.prepare("DELETE FROM AppTransactions"),
            env.DB.prepare("DELETE FROM AppPnl"),
            env.DB.prepare("DELETE FROM AppLoans"),
            env.DB.prepare("DELETE FROM AppTransfers"),
            env.DB.prepare("DELETE FROM AppCapital"),
            env.DB.prepare("DELETE FROM AppAdjustments"),
            env.DB.prepare("DELETE FROM AppLogs")
          ]);

          const settingsKeys = ['categories', 'userPermissions', 'users'];
          const sStmts = settingsKeys.map(k => env.DB.prepare("INSERT INTO AppSettings (key, value) VALUES (?, ?)").bind(k, JSON.stringify(state[k])));
          if(sStmts.length > 0) await env.DB.batch(sStmts);

          if (state.accounts && state.accounts.length > 0) {
            const aStmts = state.accounts.map(name => env.DB.prepare("INSERT INTO AppAccounts (name, balance) VALUES (?, ?)").bind(name, state.balances[name] || 0));
            aStmts.push(env.DB.prepare("INSERT INTO AppAccounts (name, balance) VALUES (?, ?)").bind('cash', state.balances.cash || 0));
            await env.DB.batch(aStmts);
          } else {
            await env.DB.prepare("INSERT INTO AppAccounts (name, balance) VALUES (?, ?)").bind('cash', state.balances.cash || 0).run();
          }

          if (state.transactions && state.transactions.length > 0) {
            const tStmts = state.transactions.map(t => env.DB.prepare("INSERT INTO AppTransactions (id, ts, customerName, phone, type, account, amount, income, incomeSource) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
              .bind(t.id, t.ts, t.customerName, t.phone, t.type, t.account, t.amount, t.income || 0, t.incomeSource || 'cash'));
            await env.DB.batch(tStmts);
          }

          if (state.pnl && state.pnl.length > 0) {
            const pStmts = state.pnl.map(p => env.DB.prepare("INSERT INTO AppPnl (id, ts, type, category, source, amount, note) VALUES (?, ?, ?, ?, ?, ?, ?)")
              .bind(p.id, p.ts, p.type, p.category, p.source, p.amount, p.note));
            await env.DB.batch(pStmts);
          }

          if (state.loans && state.loans.length > 0) {
            const lStmts = state.loans.map(l => env.DB.prepare("INSERT INTO AppLoans (id, txnId, borrowerName, amount, source, direction, note, repaymentDate, ts, payments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
              .bind(l.id, l.txnId, l.borrowerName, l.amount, l.source, l.direction, l.note, l.repaymentDate, l.ts, JSON.stringify(l.payments || [])));
            await env.DB.batch(lStmts);
          }

          if (state.transfers && state.transfers.length > 0) {
            const trStmts = state.transfers.map(t => env.DB.prepare("INSERT INTO AppTransfers (id, ts, from_acc, to_acc, amount, note) VALUES (?, ?, ?, ?, ?, ?)")
              .bind(t.id, t.ts, t.from, t.to, t.amount, t.note));
            await env.DB.batch(trStmts);
          }

          if (state.capital && state.capital.length > 0) {
            const cStmts = state.capital.map(c => env.DB.prepare("INSERT INTO AppCapital (id, ts, date, account, amount, note) VALUES (?, ?, ?, ?, ?, ?)")
              .bind(c.id, c.ts, c.date, c.account, c.amount, c.note));
            await env.DB.batch(cStmts);
          }

          if (state.adjustments && state.adjustments.length > 0) {
            const adjStmts = state.adjustments.map(a => env.DB.prepare("INSERT INTO AppAdjustments (id, ts, target, oldBalance, newBalance, diff, note) VALUES (?, ?, ?, ?, ?, ?, ?)")
              .bind(a.id, a.ts, a.target, a.oldBalance, a.newBalance, a.diff, a.note));
            await env.DB.batch(adjStmts);
          }

          if (state.logs && state.logs.length > 0) {
            const logStmts = state.logs.map(l => env.DB.prepare("INSERT INTO AppLogs (id, ts, user, action, details) VALUES (?, ?, ?, ?, ?)")
              .bind(l.id, l.ts, l.user, l.action, l.details));
            await env.DB.batch(logStmts);
          }

          return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        }

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
    }

    // -------------------------------------------------------------
    // 5. Static Files Handling (Frontend HTML)
    // -------------------------------------------------------------
    return env.ASSETS.fetch(request);
  },
 // =========================================================
  // Cron Job: တစ်လပြည့်ရင် Logs တွေကို အလိုလို ဖျက်ပစ်မယ်
  // =========================================================
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        try {
          // လက်ရှိ အချိန် (Milliseconds အားဖြင့်) ကို ရယူပါတယ်
          const now = Date.now();
          // ၁ လ = ၃၀ ရက် (30 * 24 * 60 * 60 * 1000 = 2,592,000,000 ms)
          const oneMonthAgo = now - 2592000000;

          // တစ်လထက်ကျော်လွန်ပြီးသော Logs များကို ဖျက်ပစ်ပါတယ်
          const result = await env.DB.prepare("DELETE FROM AppLogs WHERE ts < ?1").bind(oneMonthAgo).run();
          
          console.log(`Cleanup successful. Deleted ${result.meta.changes} old logs.`);
        } catch (error) {
          console.error("Error deleting old logs:", error.message);
        }
      })()
    );
  }
};
