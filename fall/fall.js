// Falling Objects Live: a teacher-driven class activity, served under /fall/ by server.js.
// No dependencies. Sessions are kept in memory, like Data Jeopardy Live.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ACT = require('./activity.js');

const MAX_PLAYERS = 40;
const MAX_SESSIONS = 200;
const IDLE_HOURS = 6;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const STEPS = ACT.steps;

const sessions = new Map();

/* ---------- helpers ---------- */
const rid = (n = 12) => crypto.randomBytes(n).toString('hex');
function newCode() {
  for (let i = 0; i < 1000; i++) {
    let c = '';
    for (let j = 0; j < 4; j++) c += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
    if (!sessions.has(c)) return c;
  }
  throw new Error('no codes left');
}
function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise(resolve => {
    let data = '', big = false;
    req.on('data', c => { data += c; if (data.length > 20000) { big = true; req.destroy(); } });
    req.on('end', () => { if (big) return resolve(null); try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}
function cleanName(raw) {
  let s = String(raw || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  if (!s) return { error: 'Type your first name.' };
  if (s.includes(' ')) return { error: 'Use your first name only, with no spaces.' };
  if (!/^[\p{L}][\p{L}'’-]{0,14}\d?$/u.test(s)) return { error: 'Use letters only, up to 15 of them.' };
  return { name: s.charAt(0).toUpperCase() + s.slice(1) };
}
function parseNum(raw) {
  let s = String(raw == null ? '' : raw).trim().replace(/[−–—]/g, '-').replace(/,/g, '').replace(/\s+/g, '');
  if (!s) return NaN;
  const m = s.match(/^(-?)(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (m) { const d = parseFloat(m[3]); return d ? (m[1] ? -1 : 1) * parseFloat(m[2]) / d : NaN; }
  if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return parseFloat(s);
  return NaN;
}
function fieldOk(f, v) { const n = parseNum(v); return Number.isFinite(n) && Math.abs(n - f.ans) <= (f.tol != null ? f.tol : 1e-9); }
function gradable(step) { return step.kind === 'mc' || step.kind === 'num'; }
function isCorrect(step, val) {
  if (val == null) return null;
  if (step.kind === 'mc') return val === step.correct;
  if (step.kind === 'num') return step.fields.every((f, i) => fieldOk(f, val[i]));
  return null;
}
function normNum(v) {
  const n = parseNum(v);
  if (!Number.isFinite(n)) return String(v || '').trim() || '—';
  return String(Math.round(n * 1e6) / 1e6).replace('-', '−');
}
function showVal(step, val) {
  if (val == null) return '';
  if (step.kind === 'mc' || step.kind === 'poll') return (step.labels || step.options)[val] || '';
  if (step.kind === 'num') { const v = val.map(normNum); return step.show ? step.show(v) : v.join(', '); }
  return String(val);
}
function getSess(code) { return sessions.get(String(code || '').toUpperCase().trim()); }
function authPlayer(s, b) {
  if (!s || !b) return null;
  const p = s.players.get(String(b.pid || ''));
  return p && p.ptoken === b.ptoken ? p : null;
}
function stepState(s, idx) {
  if (!s.st[idx]) s.st[idx] = { revealed: false, show: false, startedAt: Date.now() };
  return s.st[idx];
}

/* ---------- views ---------- */
function publicStep(step, revealed, forHost) {
  if (!step) return null;
  const v = {
    id: step.id, part: step.part, partName: (ACT.parts.find(p => p.id === step.part) || {}).name,
    title: step.title, minutes: step.minutes, kind: step.kind, html: step.html, prompt: step.prompt,
    options: step.options || null, labels: step.labels || null, grid: !!step.grid, table: step.table || null, inline: step.inline || null,
    fields: step.fields ? step.fields.map(f => ({ label: f.label, post: f.post || '' })) : null,
  };
  if (revealed) {
    v.explain = step.explain || '';
    if (step.kind === 'mc') { v.correct = step.correct; v.answerText = (step.labels || step.options)[step.correct]; }
    if (step.kind === 'num') { v.answerText = step.answerText; v.answers = step.fields.map(f => String(f.ans).replace('-', '−')); }
  }
  return v;
}
function aggregate(s, idx) {
  const step = STEPS[idx - 1];
  if (!step || step.kind === 'info') return null;
  const ans = s.answers[step.id] || new Map();
  const list = [...ans.entries()].filter(([pid]) => s.players.has(pid));
  const out = { count: list.length };
  if (step.kind === 'mc' || step.kind === 'poll') {
    out.counts = step.options.map(() => 0);
    list.forEach(([, a]) => { if (out.counts[a.val] != null) out.counts[a.val]++; });
  } else if (step.kind === 'num' && step.table) {
    out.cells = step.fields.map((f, i) => {
      const g = new Map(); let right = 0;
      list.forEach(([, a]) => { const k = normNum(a.val[i]); g.set(k, (g.get(k) || 0) + 1); if (fieldOk(f, a.val[i])) right++; });
      const top = [...g.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([text, n]) => ({ text, n, ok: fieldOk(f, text.replace('−', '-')) }));
      return { top, right };
    });
    out.right = list.filter(([, a]) => isCorrect(step, a.val)).length;
  } else if (step.kind === 'num') {
    const g = new Map();
    list.forEach(([, a]) => {
      const text = showVal(step, a.val);
      const e = g.get(text) || { text, n: 0, ok: isCorrect(step, a.val) };
      e.n++; g.set(text, e);
    });
    out.groups = [...g.values()].sort((x, y) => y.n - x.n);
    out.right = list.filter(([, a]) => isCorrect(step, a.val)).length;
  } else if (step.kind === 'text') {
    const hidden = s.hidden[step.id] || new Set();
    out.texts = list.filter(([pid]) => !hidden.has(pid)).sort((x, y) => x[1].order - y[1].order).map(([pid, a]) => ({ id: a.rid, text: a.val }));
    out.hiddenCount = list.length - out.texts.length;
  }
  if (step.kind === 'mc') out.right = list.filter(([, a]) => a.val === step.correct).length;
  return out;
}
function hostView(s) {
  const idx = s.idx, step = STEPS[idx - 1], st = idx > 0 ? stepState(s, idx) : null;
  const curId = step && step.id;
  const players = [...s.players.values()];
  return {
    role: 'host', code: s.code, idx, total: STEPS.length, title: ACT.title,
    parts: ACT.parts, outline: STEPS.map(x => ({ title: x.title, part: x.part, minutes: x.minutes, kind: x.kind })),
    step: publicStep(step, st && st.revealed, true),
    revealed: !!(st && st.revealed), show: !!(st && st.show), startedAt: st ? st.startedAt : null, now: Date.now(),
    joined: players.length,
    responses: idx > 0 ? aggregate(s, idx) : null,
    roster: players.map(p => ({ pid: p.pid, name: p.name, online: p.online > 0, answered: !!(curId && s.answers[curId] && s.answers[curId].has(p.pid)) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
function playerView(s, p) {
  const idx = s.idx, step = STEPS[idx - 1], st = idx > 0 ? stepState(s, idx) : null;
  const revealed = !!(st && st.revealed);
  const mine = step && s.answers[step.id] ? s.answers[step.id].get(p.pid) : null;
  return {
    role: 'player', code: s.code, name: p.name, idx, total: STEPS.length, title: ACT.title,
    step: publicStep(step, revealed, false), revealed,
    mine: mine ? mine.val : null,
    result: revealed && mine && gradable(step) ? isCorrect(step, mine.val) : null,
    ended: s.ended,
  };
}
function send(c, data) { try { c.res.write(`data: ${JSON.stringify(data)}\n\n`); } catch (e) {} }
function toHosts(s) { const v = hostView(s); s.clients.forEach(c => { if (c.role === 'host') send(c, v); }); }
function toPlayer(s, pid) { const p = s.players.get(pid); if (!p) return; s.clients.forEach(c => { if (c.role === 'player' && c.pid === pid) send(c, playerView(s, p)); }); }
function toAll(s) { toHosts(s); s.players.forEach(p => toPlayer(s, p.pid)); }

/* ---------- routes ---------- */
const routes = {
  'GET /fall/api/ping': (req, res) => json(res, 200, { ok: true }),

  'POST /fall/api/create': async (req, res) => {
    if (sessions.size >= MAX_SESSIONS) return json(res, 503, { error: 'Too many sessions are running. Try again later.' });
    const code = newCode();
    const s = { code, token: rid(), idx: 0, st: {}, players: new Map(), answers: {}, hidden: {}, clients: new Set(), touched: Date.now(), ended: false, created: Date.now() };
    sessions.set(code, s);
    json(res, 200, { code, token: s.token });
  },

  'POST /fall/api/check': async (req, res) => {
    const b = await readBody(req); const s = b && getSess(b.code);
    if (!s) return json(res, 404, { error: 'Session not found.' });
    if (b.role === 'host') return s.token === b.token ? json(res, 200, { ok: true }) : json(res, 404, { error: 'Session not found.' });
    return authPlayer(s, b) ? json(res, 200, { ok: true }) : json(res, 404, { error: 'Session not found.' });
  },

  'POST /fall/api/join': async (req, res) => {
    const b = await readBody(req);
    const s = b && getSess(b.code);
    if (!s || s.ended) return json(res, 404, { error: 'No class session has that code. Check the code on the board.' });
    const n = cleanName(b.name);
    if (n.error) return json(res, 400, { error: n.error });
    const taken = [...s.players.values()].some(p => p.name.toLowerCase() === n.name.toLowerCase());
    if (taken) return json(res, 409, { error: `Someone already joined as ${n.name}. Add a number, like ${n.name}2.` });
    if (s.players.size >= MAX_PLAYERS) return json(res, 409, { error: 'This session is full.' });
    const p = { pid: rid(8), ptoken: rid(), name: n.name, online: 0 };
    s.players.set(p.pid, p);
    s.touched = Date.now();
    json(res, 200, { code: s.code, pid: p.pid, ptoken: p.ptoken, name: p.name });
    toHosts(s);
  },

  'POST /fall/api/answer': async (req, res) => {
    const b = await readBody(req);
    const s = b && getSess(b.code);
    const p = authPlayer(s, b);
    if (!p) return json(res, 403, { error: 'Join the session first.' });
    const step = STEPS[s.idx - 1];
    if (!step || step.id !== b.stepId) return json(res, 409, { error: 'Your teacher has moved to a different step.' });
    if (step.kind === 'info') return json(res, 400, { error: 'This step has no answer.' });
    if (stepState(s, s.idx).revealed) return json(res, 409, { error: 'Answers are closed for this step.' });
    let val = b.val;
    if (step.kind === 'mc' || step.kind === 'poll') {
      if (!Number.isInteger(val) || val < 0 || val >= step.options.length) return json(res, 400, { error: 'Pick one of the choices.' });
    } else if (step.kind === 'num') {
      if (!Array.isArray(val) || val.length !== step.fields.length) return json(res, 400, { error: 'Fill in every blank.' });
      val = val.map(x => String(x == null ? '' : x).trim().slice(0, 24));
      if (val.some(x => !x)) return json(res, 400, { error: 'Fill in every blank.' });
      const bad = val.findIndex(x => !Number.isFinite(parseNum(x)));
      if (bad >= 0) return json(res, 400, { error: `“${val[bad]}” isn’t a number. Use digits, a decimal point, a minus sign or a fraction like 3/4.` });
    } else if (step.kind === 'text') {
      val = String(val == null ? '' : val).replace(/\s+/g, ' ').trim().slice(0, 400);
      if (!val) return json(res, 400, { error: 'Type your answer first.' });
    }
    const map = s.answers[step.id] || (s.answers[step.id] = new Map());
    const prev = map.get(p.pid);
    map.set(p.pid, { val, at: Date.now(), order: prev ? prev.order : Math.random(), rid: prev ? prev.rid : rid(6) });
    s.touched = Date.now();
    json(res, 200, { ok: true });
    toHosts(s); toPlayer(s, p.pid);
  },

  'POST /fall/api/host': async (req, res) => {
    const b = await readBody(req);
    const s = b && getSess(b.code);
    if (!s || s.token !== b.token) return json(res, 403, { error: 'This session is not yours, or it has ended.' });
    s.touched = Date.now();
    const a = b.action;
    if (a === 'go') {
      const i = Number(b.idx);
      if (!Number.isInteger(i) || i < 0 || i > STEPS.length) return json(res, 400, { error: 'No such step.' });
      s.idx = i; if (i > 0) stepState(s, i);
    } else if (a === 'reveal') {
      if (s.idx > 0) { const st = stepState(s, s.idx); st.revealed = !st.revealed; if (st.revealed) st.show = true; }
    } else if (a === 'show') {
      if (s.idx > 0) { const st = stepState(s, s.idx); st.show = !st.show; }
    } else if (a === 'hide') {
      const step = STEPS[s.idx - 1];
      if (step && step.kind === 'text' && s.answers[step.id]) {
        for (const [pid, ans] of s.answers[step.id]) if (ans.rid === b.rid) (s.hidden[step.id] || (s.hidden[step.id] = new Set())).add(pid);
      }
    } else if (a === 'unhideAll') {
      const step = STEPS[s.idx - 1]; if (step) delete s.hidden[step.id];
    } else if (a === 'kick') {
      const p = s.players.get(String(b.pid || ''));
      if (p) {
        s.clients.forEach(c => { if (c.role === 'player' && c.pid === p.pid) send(c, { kicked: true }); });
        s.players.delete(p.pid);
      }
    } else if (a === 'end') {
      s.ended = true;
      json(res, 200, { ok: true });
      toAll(s);
      s.clients.forEach(c => { try { c.res.end(); } catch (e) {} });
      sessions.delete(s.code);
      return;
    } else return json(res, 400, { error: 'Unknown action.' });
    json(res, 200, { ok: true });
    toAll(s);
  },
};

function exportCsv(req, res, url) {
  const s = getSess(url.searchParams.get('code'));
  if (!s || s.token !== url.searchParams.get('token')) return json(res, 403, { error: 'Session not found.' });
  const q = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const asked = STEPS.filter(st => st.kind !== 'info');
  const head = ['Name', 'Score'];
  asked.forEach(st => { const n = STEPS.indexOf(st) + 1; head.push(`${n}. ${st.title}`); if (gradable(st)) head.push(`${n}. correct?`); });
  const rows = [head.map(q).join(',')];
  const gradableCount = asked.filter(gradable).length;
  [...s.players.values()].sort((a, b) => a.name.localeCompare(b.name)).forEach(p => {
    const cells = [p.name]; let score = 0; const rest = [];
    asked.forEach(st => {
      const a = s.answers[st.id] && s.answers[st.id].get(p.pid);
      rest.push(a ? showVal(st, a.val) : '');
      if (gradable(st)) { const ok = a ? isCorrect(st, a.val) : false; if (ok) score++; rest.push(a ? (ok ? 'yes' : 'no') : ''); }
    });
    cells.push(`${score}/${gradableCount}`);
    rows.push(cells.concat(rest).map(q).join(','));
  });
  const d = new Date().toISOString().slice(0, 10);
  res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="falling-objects-${s.code}-${d}.csv"`, 'Cache-Control': 'no-store' });
  res.end('﻿' + rows.join('\r\n'));
}

function events(req, res, url) {
  const s = getSess(url.searchParams.get('code'));
  const role = url.searchParams.get('role');
  let client = null, p = null;
  if (s && role === 'host' && url.searchParams.get('token') === s.token) client = { role: 'host' };
  else if (s && role === 'player') {
    p = authPlayer(s, { pid: url.searchParams.get('pid'), ptoken: url.searchParams.get('ptoken') });
    if (p) client = { role: 'player', pid: p.pid };
  }
  if (!client) return json(res, 404, { error: 'Session not found.' });
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.write('retry: 2000\n\n');
  client.res = res;
  s.clients.add(client);
  if (p) p.online++;
  if (client.role === 'host') send(client, hostView(s)); else { send(client, playerView(s, p)); toHosts(s); }
  const ka = setInterval(() => { try { res.write(': keepalive\n\n'); } catch (e) {} }, 15000);
  res.on('close', () => {
    clearInterval(ka); s.clients.delete(client);
    if (p) { p.online = Math.max(0, p.online - 1); toHosts(s); }
  });
}

let page = null;
function servePage(res) {
  const send = data => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); res.end(data); };
  if (page && process.env.NODE_ENV === 'production') return send(page);
  fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    page = data; send(data);
  });
}

// Returns true when the request belongs to this activity.
function handle(req, res, url) {
  const p = url.pathname;
  if (p !== '/fall' && !p.startsWith('/fall/')) return false;
  if (req.method === 'GET' && p === '/fall') { res.writeHead(301, { Location: '/fall/' + (url.search || '') }); res.end(); return true; }
  if (req.method === 'GET' && (p === '/fall/' || p === '/fall/index.html')) { servePage(res); return true; }
  if (req.method === 'GET' && p === '/fall/api/events') { events(req, res, url); return true; }
  if (req.method === 'GET' && p === '/fall/api/export') { exportCsv(req, res, url); return true; }
  const route = routes[`${req.method} ${p}`];
  if (route) {
    Promise.resolve(route(req, res, url)).catch(e => { console.error('[fall]', e); if (!res.headersSent) json(res, 500, { error: 'Something went wrong. Try again.' }); });
    return true;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found');
  return true;
}

setInterval(() => {
  const cutoff = Date.now() - IDLE_HOURS * 3600 * 1000;
  for (const [code, s] of sessions) if (s.touched < cutoff && s.clients.size === 0) sessions.delete(code);
}, 10 * 60 * 1000).unref();

module.exports = { handle };
