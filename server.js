// Data Jeopardy Live: a small game server with no dependencies.
// Run with:  node server.js        (Node.js 18 or newer)
// The page is served at http://localhost:3000 (or the PORT your host provides).

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const BANK = require('./public/questions.js');

// Falling Objects Live (a separate class activity at /fall/). If it fails to load, Jeopardy keeps working.
let FALL = null;
try { FALL = require('./fall/fall.js'); } catch (e) { console.error('Falling Objects Live did not load:', e.message); }

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 20;
const MAX_GAMES = 300;
const CLUE_SECONDS = 30;
const FINAL_SECONDS = 60;
const IDLE_HOURS = 6;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/questions.js': ['questions.js', 'text/javascript; charset=utf-8'],
  '/fonts/KGSummerSunshine.woff': ['fonts/KGSummerSunshine.woff', 'font/woff'],
};

const games = new Map();

/* ---------- helpers ---------- */
const rid = (n = 12) => crypto.randomBytes(n).toString('hex');
function newCode() {
  for (let i = 0; i < 1000; i++) {
    let c = '';
    for (let j = 0; j < 4; j++) c += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
    if (!games.has(c)) return c;
  }
  throw new Error('no codes left');
}
function shuffle(n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function cleanName(raw) {
  let s = String(raw || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  if (!s) return { error: 'Type your first name.' };
  if (s.includes(' ')) return { error: 'Use your first name only, with no spaces.' };
  if (!/^[\p{L}][\p{L}'’-]{0,14}\d?$/u.test(s)) return { error: 'Use letters only, up to 15 of them.' };
  return { name: s.charAt(0).toUpperCase() + s.slice(1) };
}
function clueOf(game, key) {
  const set = BANK.sets.find(s => s.id === game.set);
  if (key === 'F') return { cat: set.final.cat, value: 0, clue: set.final };
  const [c, r] = key.split('-').map(Number);
  const cat = set.cats[c];
  if (!cat || !cat.clues[r]) return null;
  return { cat: cat.name, value: BANK.values[r], clue: cat.clues[r] };
}
function standings(game) {
  const list = [...game.players.values()].map(p => ({ pid: p.pid, name: p.name, score: p.score }));
  list.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  let rank = 0, prev = null;
  list.forEach((p, i) => { if (p.score !== prev) { rank = i + 1; prev = p.score; } p.rank = rank; });
  return list;
}
function top3(list) { return list.slice(0, 3).map(p => ({ name: p.name, score: p.score, rank: p.rank })); }

/* ---------- views ---------- */
function curView(game, forHost, pid) {
  const c = game.cur;
  if (!c) return null;
  const v = {
    key: c.key, cat: c.cat, value: c.value, dd: c.dd, isFinal: c.key === 'F',
    remainingMs: Math.max(0, c.deadline - Date.now()), revealed: c.revealed,
  };
  const showClue = !(c.key === 'F' && game.phase === 'fwager');
  if (showClue) { v.q = c.clue.q; v.fig = c.clue.fig || null; v.opts = c.opts; }
  if (c.revealed) { v.correct = c.correct; v.w = c.clue.w; }
  if (forHost) {
    v.answered = c.answers.size;
    if (c.key === 'F' && game.phase === 'fwager') v.wagered = [...game.players.values()].filter(p => p.wager != null).length;
    if (c.revealed) {
      v.counts = c.opts.map((_, i) => [...c.answers.values()].filter(a => a === i).length);
      v.rightNames = [...c.answers.entries()].filter(([, a]) => a === c.correct).map(([id]) => game.players.get(id)?.name).filter(Boolean);
    }
  } else {
    const p = game.players.get(pid);
    v.myChoice = c.answers.has(pid) ? c.answers.get(pid) : null;
    if (c.key === 'F') { v.maxWager = Math.max(0, p.score - (c.revealed ? (p.results.F || 0) : 0)); v.myWager = p.wager; }
    if (c.revealed) v.points = p.results[c.key] ?? 0;
  }
  return v;
}
function view(game, client) {
  const list = standings(game);
  const set = BANK.sets.find(s => s.id === game.set);
  const base = {
    code: game.code, phase: game.phase, setName: set.name,
    cats: set.cats.map(c => c.name), values: BANK.values, used: game.used,
    playerCount: game.players.size, maxPlayers: MAX_PLAYERS, top3: top3(list),
  };
  if (client.role === 'host') {
    const online = new Set([...game.clients].filter(x => x.role === 'player').map(x => x.pid));
    return { ...base, role: 'host', players: list.map(p => ({ ...p, online: online.has(p.pid) })), cur: curView(game, true) };
  }
  const p = game.players.get(client.pid);
  if (!p) return { role: 'player', kicked: true };
  const me = list.find(x => x.pid === p.pid);
  return { ...base, role: 'player', me: { name: p.name, score: p.score, rank: me.rank }, standings: game.phase === 'over' ? list.map(({ name, score, rank }) => ({ name, score, rank })) : undefined, cur: curView(game, false, p.pid) };
}
function send(client, game) {
  try { client.res.write(`data: ${JSON.stringify(view(game, client))}\n\n`); } catch (e) { /* closed */ }
}
function broadcast(game) {
  game.touched = Date.now();
  for (const c of game.clients) send(c, game);
}

/* ---------- game actions ---------- */
function openClue(game, key) {
  const info = clueOf(game, key);
  const perm = game.perms[key] || (game.perms[key] = shuffle(info.clue.c.length));
  game.cur = {
    key, cat: info.cat, value: info.value, dd: key === game.dd, clue: info.clue,
    opts: perm.map(i => info.clue.c[i]), correct: perm.indexOf(0),
    deadline: key === 'F' ? 0 : Date.now() + CLUE_SECONDS * 1000,
    answers: new Map(), revealed: false,
  };
  if (key === 'F') game.phase = 'fwager';
  else { game.phase = 'clue'; game.used[key] = true; armTimer(game); }
}
function armTimer(game) {
  clearTimeout(game.timer);
  const ms = game.cur.deadline - Date.now();
  if (ms > 0) game.timer = setTimeout(() => broadcast(game), ms + 50);
}
function reveal(game) {
  const c = game.cur;
  c.revealed = true;
  c.deadline = Math.min(c.deadline, Date.now());
  clearTimeout(game.timer);
  for (const p of game.players.values()) {
    const ans = c.answers.get(p.pid);
    let pts = 0;
    if (c.key === 'F') { const w = p.wager || 0; pts = ans === c.correct ? w : -w; }
    else if (ans === c.correct) pts = c.value * (c.dd ? 2 : 1);
    p.results[c.key] = pts;
    p.score += pts;
  }
}

const hostActions = {
  start(game) { if (game.phase === 'lobby') game.phase = 'board'; },
  open(game, b) {
    if (game.phase !== 'board') return 'Finish the current clue first.';
    const key = String(b.key || '');
    if (!/^[0-4]-[0-4]$/.test(key)) return 'Unknown clue.';
    if (game.used[key]) return 'That clue has already been played.';
    openClue(game, key);
  },
  cancel(game) {
    if (game.phase !== 'clue') return;
    delete game.used[game.cur.key];
    clearTimeout(game.timer); game.cur = null; game.phase = 'board';
  },
  reveal(game) {
    if (game.phase === 'clue') { reveal(game); game.phase = 'reveal'; }
    else if (game.phase === 'fclue') { reveal(game); game.phase = 'freveal'; }
  },
  back(game) { if (game.phase === 'reveal') { game.cur = null; game.phase = 'board'; } },
  final(game) {
    if (game.phase !== 'board') return 'Finish the current clue first.';
    for (const p of game.players.values()) p.wager = null;
    openClue(game, 'F');
  },
  finalClue(game) {
    if (game.phase !== 'fwager') return;
    for (const p of game.players.values()) if (p.wager == null) p.wager = 0;
    game.cur.deadline = Date.now() + FINAL_SECONDS * 1000;
    game.phase = 'fclue'; armTimer(game);
  },
  finish(game) { if (game.phase === 'freveal') { game.phase = 'over'; } },
  kick(game, b) {
    const p = game.players.get(String(b.pid || ''));
    if (!p) return;
    game.players.delete(p.pid);
    for (const c of [...game.clients]) if (c.role === 'player' && c.pid === p.pid) { send(c, game); try { c.res.end(); } catch (e) {} game.clients.delete(c); }
  },
};

/* ---------- http ---------- */
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', ch => { data += ch; if (data.length > 8000) { req.destroy(); resolve(null); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}
function getGame(code) { return games.get(String(code || '').toUpperCase().trim()); }
function authPlayer(game, b) {
  const p = game && game.players.get(String(b.pid || ''));
  return p && p.token === b.ptoken ? p : null;
}

const routes = {
  'GET /api/ping': (req, res) => json(res, 200, { ok: true }),

  'POST /api/check': async (req, res) => {
    const b = await readBody(req);
    const game = b && getGame(b.code);
    const ok = game && (b.role === 'host' ? b.token === game.token : !!authPlayer(game, b));
    json(res, ok ? 200 : 404, { ok: !!ok });
  },

  'POST /api/host': async (req, res) => {
    const b = await readBody(req);
    if (!b) return json(res, 400, { error: 'Bad request.' });
    if (games.size >= MAX_GAMES) return json(res, 503, { error: 'The server is full. Try again later.' });
    const set = BANK.sets.find(s => s.id === String(b.set)) ? String(b.set) : BANK.sets[0].id;
    const code = newCode();
    const r = 2 + crypto.randomInt(3), c = crypto.randomInt(5);
    games.set(code, {
      code, token: rid(), set, phase: 'lobby', players: new Map(), used: {}, perms: {},
      dd: `${c}-${r}`, cur: null, clients: new Set(), touched: Date.now(), timer: null,
    });
    const g = games.get(code);
    json(res, 200, { code, token: g.token });
  },

  'POST /api/join': async (req, res) => {
    const b = await readBody(req);
    const game = b && getGame(b.code);
    if (!game) return json(res, 404, { error: 'No game with that code. Check the code on the board.' });
    const existing = authPlayer(game, b);
    if (existing) return json(res, 200, { pid: existing.pid, ptoken: existing.token, name: existing.name, code: game.code });
    if (game.phase === 'over') return json(res, 409, { error: 'This game has ended.' });
    const n = cleanName(b.name);
    if (n.error) return json(res, 400, { error: n.error });
    if (game.players.size >= MAX_PLAYERS) return json(res, 409, { error: `This game is full (${MAX_PLAYERS} players).` });
    const taken = [...game.players.values()].some(p => p.name.toLowerCase() === n.name.toLowerCase());
    if (taken) return json(res, 409, { error: `Someone already joined as ${n.name}. Add a number, like ${n.name}2.` });
    const p = { pid: rid(8), token: rid(), name: n.name, score: 0, results: {}, wager: null };
    game.players.set(p.pid, p);
    json(res, 200, { pid: p.pid, ptoken: p.token, name: p.name, code: game.code });
    broadcast(game);
  },

  'POST /api/action': async (req, res) => {
    const b = await readBody(req);
    const game = b && getGame(b.code);
    if (!game || b.token !== game.token) return json(res, 403, { error: 'Not the host of this game.' });
    const fn = hostActions[b.action];
    if (!fn) return json(res, 400, { error: 'Unknown action.' });
    const err = fn(game, b);
    if (err) return json(res, 409, { error: err });
    json(res, 200, { ok: true });
    broadcast(game);
  },

  'POST /api/answer': async (req, res) => {
    const b = await readBody(req);
    const game = b && getGame(b.code);
    const p = authPlayer(game, b || {});
    if (!p) return json(res, 403, { error: 'Join the game first.' });
    const c = game.cur;
    if (!c || !(game.phase === 'clue' || game.phase === 'fclue') || c.revealed) return json(res, 409, { error: 'No question is open right now.' });
    if (Date.now() > c.deadline + 1000) return json(res, 409, { error: 'Time is up for this question.' });
    const choice = Number(b.choice);
    if (!Number.isInteger(choice) || choice < 0 || choice >= c.opts.length) return json(res, 400, { error: 'Pick one of the choices.' });
    c.answers.set(p.pid, choice);
    json(res, 200, { ok: true });
    broadcast(game);
  },

  'POST /api/wager': async (req, res) => {
    const b = await readBody(req);
    const game = b && getGame(b.code);
    const p = authPlayer(game, b || {});
    if (!p) return json(res, 403, { error: 'Join the game first.' });
    if (game.phase !== 'fwager') return json(res, 409, { error: 'Wagers are closed.' });
    const max = Math.max(0, p.score);
    const w = Math.round(Number(b.amount));
    if (!Number.isFinite(w) || w < 0 || w > max) return json(res, 400, { error: `Wager a number from 0 to ${max}.` });
    p.wager = w;
    json(res, 200, { ok: true });
    broadcast(game);
  },
};

function events(req, res, url) {
  const game = getGame(url.searchParams.get('code'));
  const role = url.searchParams.get('role');
  let client;
  if (game && role === 'host' && url.searchParams.get('token') === game.token) client = { role: 'host' };
  else if (game && role === 'player') {
    const p = authPlayer(game, { pid: url.searchParams.get('pid'), ptoken: url.searchParams.get('ptoken') });
    if (p) client = { role: 'player', pid: p.pid };
  }
  if (!client) return json(res, 404, { error: 'Game not found.' });
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.write('retry: 2000\n\n');
  client.res = res;
  game.clients.add(client);
  broadcast(game);
  const ka = setInterval(() => { try { res.write(': keepalive\n\n'); } catch (e) {} }, 15000);
  res.on('close', () => { clearInterval(ka); game.clients.delete(client); broadcast(game); });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (FALL) {
    try { if (FALL.handle(req, res, url)) return; }
    catch (e) { console.error('[fall]', e); if (!res.headersSent) { res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end('Something went wrong.'); } return; }
  }
  if (req.method === 'GET' && STATIC[url.pathname]) {
    const [file, type] = STATIC[url.pathname];
    fs.readFile(path.join(__dirname, 'public', file), (err, data) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
      res.end(data);
    });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/events') return events(req, res, url);
  const route = routes[`${req.method} ${url.pathname}`];
  if (route) return route(req, res, url);
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

setInterval(() => {
  const cutoff = Date.now() - IDLE_HOURS * 3600 * 1000;
  for (const [code, g] of games) if (g.touched < cutoff && g.clients.size === 0) { clearTimeout(g.timer); games.delete(code); }
}, 10 * 60 * 1000);

server.listen(PORT, () => console.log(`Data Jeopardy Live is running on port ${PORT}`));
