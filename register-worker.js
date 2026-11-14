// Temporary helper Worker: registers RoApp slash commands. DELETE this Worker afterwards.
// It stores and logs nothing; the token you type is used for one request to discord.com.
const DEFS = [{"name":"help","description":"How to use RoApp","contexts":[0],"integration_types":[0]},{"name":"setup","description":"Initialize RoApp for this community","contexts":[0],"integration_types":[0]},{"name":"dashboard","description":"Open the RoApp Dashboard","contexts":[0],"integration_types":[0]},{"name":"apply","description":"Choose an application form","contexts":[0],"integration_types":[0]},{"name":"myapplications","description":"View your applications","contexts":[0],"integration_types":[0]},{"name":"application","description":"Manage your application","options":[{"type":1,"name":"view","description":"View your own application","options":[{"type":3,"name":"reference","description":"Application reference","required":true}]},{"type":1,"name":"withdraw","description":"Withdraw your own application","options":[{"type":3,"name":"reference","description":"Application reference","required":true}]}],"contexts":[0],"integration_types":[0]},{"name":"review","description":"Open the private application review workspace","contexts":[0],"integration_types":[0]},{"name":"forms","description":"Community forms","options":[{"type":1,"name":"list","description":"List forms"},{"type":1,"name":"create","description":"Open the form builder"},{"type":1,"name":"publish","description":"Publish the current form draft","options":[{"type":3,"name":"id","description":"Form ID","required":true}]},{"type":1,"name":"close","description":"Close a form","options":[{"type":3,"name":"id","description":"Form ID","required":true}]}],"contexts":[0],"integration_types":[0]},{"name":"panel","description":"Persistent application panels","options":[{"type":1,"name":"publish","description":"Publish or update a panel","options":[{"type":3,"name":"id","description":"Panel ID from the dashboard","required":true}]},{"type":1,"name":"update","description":"Update a panel","options":[{"type":3,"name":"id","description":"Panel ID","required":true}]},{"type":1,"name":"remove","description":"Request panel removal","options":[{"type":3,"name":"id","description":"Panel ID","required":true}]}],"contexts":[0],"integration_types":[0]},{"name":"staff","description":"Open staff and permission settings","contexts":[0],"integration_types":[0]}];
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Register RoApp commands</title>
<style>body{font-family:sans-serif;max-width:480px;margin:20px auto;padding:0 14px;background:#111;color:#eee}input,button{width:100%;box-sizing:border-box;padding:12px;margin:6px 0 14px;font-size:16px;border-radius:8px;border:1px solid #444;background:#222;color:#eee}button{background:#5865f2;border:0}pre{white-space:pre-wrap;background:#222;padding:10px;border-radius:8px}</style></head><body>
<h2>Register RoApp commands</h2>
<label>Application ID</label><input id="a" inputmode="numeric" autocomplete="off">
<label>Bot token</label><input id="t" type="password" autocomplete="off">
<label>Server ID (optional - blank = global, slow)</label><input id="g" inputmode="numeric" autocomplete="off">
<button id="go">Register</button><pre id="out"></pre>
<script>
document.getElementById("go").onclick=async()=>{
 const out=document.getElementById("out");out.textContent="Working...";
 try{
  const r=await fetch("/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({a:document.getElementById("a").value.trim(),t:document.getElementById("t").value.trim(),g:document.getElementById("g").value.trim()})});
  out.textContent=(await r.json()).message;
 }catch(e){out.textContent="Could not reach this Worker."}
};
<\/script></body></html>`;
const json = (message, status = 200) => Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
export default {
  async fetch(request) {
    if (request.method === "GET")
      return new Response(PAGE, { headers: { "Content-Type": "text/html;charset=utf-8", "Cache-Control": "no-store" } });
    if (request.method !== "POST") return json("Method not allowed", 405);
    let b;
    try { b = await request.json(); } catch { return json("Invalid request.", 400); }
    const a = String(b.a || "").trim(), g = String(b.g || "").trim();
    const t = String(b.t || "").trim().replace(/^Bot\s+/i, "");
    if (!/^\d{17,22}$/.test(a) || !t) return json("Enter a valid application ID and the bot token.", 400);
    if (g && !/^\d{17,22}$/.test(g)) return json("Server ID must be 17-22 digits.", 400);
    const r = await fetch("https://discord.com/api/v10/applications/" + a + (g ? "/guilds/" + g : "") + "/commands", {
      method: "PUT",
      headers: { Authorization: "Bot " + t, "Content-Type": "application/json" },
      body: JSON.stringify(DEFS),
    });
    if (!r.ok) return json("Failed: HTTP " + r.status + " (401 = wrong token, 404 = wrong application or server ID, 403 = bot not in that server)", 200);
    return json("Registered " + (await r.json()).length + " commands (" + (g ? "server" : "global") + " scope). Reopen Discord and try /setup.");
  },
};
