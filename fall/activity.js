// Falling Objects Live: the activity's steps, prompts and answer key.
// The page loads this file in every browser, so the answer key is readable in the page source.
//
// Step kinds:
//   info  - content only, no student response
//   poll  - multiple choice with no right answer (a prediction)
//   mc    - multiple choice; `correct` is the index of the right option
//   num   - one or more number blanks; each field has `ans` and an optional `tol` (tolerance)
//   text  - a short written response, shown anonymously on the teacher screen

(function () {
/* ---------- small drawing helpers ---------- */
function miniGraph(fn, opts = {}) {
  // fn maps u in [0,1] to v in [0,1]; draws on a 0..1 square
  const W = 170, H = 130, x0 = 26, y0 = 108, w = 132, h = 92;
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40, v = fn(u);
    pts.push(`${(x0 + u * w).toFixed(1)},${(y0 - v * h).toFixed(1)}`);
  }
  return `<svg class="mini" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.aria || 'graph'}">
  <line class="ax" x1="${x0}" y1="${y0}" x2="${x0 + w + 6}" y2="${y0}"/><line class="ax" x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - h - 6}"/>
  <text class="axl" x="${x0 + w + 4}" y="${y0 + 16}" text-anchor="end">time (s)</text>
  <text class="axl" x="${x0 - 6}" y="${y0 - h - 2}" text-anchor="end">h</text>
  <text class="axl" x="${x0 - 6}" y="${y0 + 4}" text-anchor="end">0</text>
  <polyline class="cv" points="${pts.join(' ')}"/></svg>`;
}

function strobe() {
  // ball dropped from 256 ft, positions each second
  const H = [256, 240, 192, 112, 0];
  const top = 22, ground = 290, sc = (ground - top) / 256;
  const y = h => ground - h * sc;
  let s = `<svg class="strobe" viewBox="0 0 300 310" role="img" aria-label="A ball dropped from a 256 foot tower, shown at heights 256, 240, 192, 112 and 0 feet after 0 to 4 seconds">`;
  s += `<rect class="tower" x="28" y="${top}" width="46" height="${ground - top}" rx="2"/>`;
  for (let k = 0; k < 7; k++) s += `<rect class="win" x="38" y="${top + 16 + k * 36}" width="10" height="14"/><rect class="win" x="54" y="${top + 16 + k * 36}" width="10" height="14"/>`;
  s += `<line class="gnd" x1="10" y1="${ground}" x2="290" y2="${ground}"/>`;
  H.forEach((h, t) => {
    const cy = Math.min(y(h), ground - 8);
    s += `<circle class="ball" cx="104" cy="${cy.toFixed(1)}" r="8" style="opacity:${(0.45 + t * 0.14).toFixed(2)}"/>`;
    s += `<line class="tick" x1="116" y1="${cy.toFixed(1)}" x2="132" y2="${cy.toFixed(1)}"/>`;
    s += `<text class="lab" x="138" y="${(cy + 4).toFixed(1)}">t = ${t} s · ${h} ft</text>`;
  });
  s += `<text class="lab dim" x="51" y="${ground + 16}" text-anchor="middle">256 ft tower</text></svg>`;
  return s;
}

function table(head, rows, cls = '') {
  return `<div class="tblwrap"><table class="dt ${cls}"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

const qx = [0, 1, 2, 3, 4, 5, 6];
const growTable = table(['x', 'q(x) = 5x²', 'e(x) = 2<sup>x</sup>'], qx.map(x => [x, 5 * x * x, 2 ** x]));

/* ---------- the activity ---------- */
const parts = [
  { id: 1, name: 'Which grows faster?' },
  { id: 2, name: 'Dropping a ball' },
  { id: 3, name: 'What each part means' },
  { id: 4, name: 'Write your own' },
];

const steps = [
  /* ===== Part 1: exponential vs quadratic (14 min) ===== */
  {
    id: 'p1-predict', part: 1, minutes: 2, kind: 'poll',
    title: 'Make a prediction',
    html: `<p>Here are two functions:</p><p class="eq">q(x) = 5x²&emsp;&emsp;e(x) = 2<sup>x</sup></p><p>Right now, q(5) = 125 and e(5) = 32.</p>`,
    prompt: 'Which function will have the bigger value when x = 20?',
    options: ['q(x) = 5x²', 'e(x) = 2<sup>x</sup>', 'They will be about the same'],
    labels: ['q(x) = 5x²', 'e(x) = 2^x', 'About the same'],
    explain: 'q(20) = 5 · 400 = 2,000, but e(20) = 2²⁰ = 1,048,576. The exponential function is more than 500 times bigger. Let’s find out why.',
  },
  {
    id: 'p1-aroc', part: 1, minutes: 3, kind: 'num',
    title: 'Average rate of change',
    html: growTable + `<p class="hint">Average rate of change = (change in output) ÷ (change in x).</p>`,
    prompt: 'Find the average rate of change of each function from x = 0 to x = 5.',
    fields: [
      { label: 'q(x) = 5x²', ans: 25, tol: 0.001 },
      { label: 'e(x) = 2<sup>x</sup>', ans: 6.2, tol: 0.001 },
    ],
    show: v => `q: ${v[0]}   e: ${v[1]}`,
    answerText: 'q: 25   e: 6.2',
    explain: 'q: (125 − 0) ÷ 5 = 25.  e: (32 − 1) ÷ 5 = 31 ÷ 5 = 6.2. Over this interval the quadratic is growing faster.',
  },
  {
    id: 'p1-pattern', part: 1, minutes: 3, kind: 'mc',
    title: 'Look for the pattern',
    html: growTable + `<p class="hint">Look at how each column changes from one row to the next. Try subtracting, then subtracting again. Try dividing.</p>`,
    prompt: 'Which statement is true?',
    options: [
      'q(x) has constant <b>second differences</b> (always 10), and e(x) has a constant <b>ratio</b> (always × 2).',
      'Both functions have constant first differences.',
      'q(x) has a constant ratio, and e(x) has constant second differences.',
      'Neither function has a pattern.',
    ],
    labels: ['q: 2nd diff 10; e: ratio ×2', 'Both constant 1st diff', 'q ratio; e 2nd diff', 'No pattern'],
    correct: 0,
    explain: 'q(x): 5, 15, 25, 35, 45 are the first differences, and they grow by 10 each time. e(x) doubles every step. Adding a growing amount is quadratic growth. Multiplying by the same number is exponential growth.',
  },
  {
    id: 'p1-overtake', part: 1, minutes: 3, kind: 'num',
    title: 'When does it pass?',
    html: growTable + `<p class="hint">Keep the tables going past x = 6, or graph both functions in Desmos.</p>`,
    prompt: 'For x = 1, 2, 3, …, what is the first whole number x where e(x) is greater than q(x)?',
    fields: [{ label: 'x =', ans: 9 }],
    show: v => `x = ${v[0]}`,
    answerText: 'x = 9',
    explain: 'x = 8: e = 256, q = 320, so q is still ahead. x = 9: e = 512, q = 405. From then on e(x) stays ahead, and the gap keeps getting bigger.',
  },
  {
    id: 'p1-why', part: 1, minutes: 3, kind: 'text',
    title: 'Explain it',
    html: `<p class="eq">q(x) = 5x²&emsp;&emsp;e(x) = 2<sup>x</sup></p>`,
    prompt: 'Explain why the exponential function eventually passes the quadratic function, even though the quadratic started out ahead.',
    explain: 'A quadratic’s change grows by the same amount each step (+10, +10, +10). An exponential’s change grows by the same factor each step (×2). Repeated multiplying eventually beats repeated adding, so an increasing exponential function always passes a quadratic one eventually.',
  },

  /* ===== Part 2: free fall with tables and graphs (14 min) ===== */
  {
    id: 'p2-launch', part: 2, minutes: 2, kind: 'info',
    title: 'A ball is dropped',
    html: `<div class="split"><div>${strobe()}</div><div><p>A ball is dropped from the top of a 256‑foot tower.</p><p>Ignoring air resistance, the <b>distance the ball has fallen</b> after <i>t</i> seconds is</p><p class="eq">d(t) = 16t² feet</p><p>The picture shows where the ball is every second.</p></div></div>`,
    prompt: 'Talk with a partner: what do you notice about the gaps between the balls? What does that tell you about the ball’s speed?',
  },
  {
    id: 'p2-table', part: 2, minutes: 4, kind: 'num',
    title: 'Fill in the table',
    html: `<p>The ball falls <span class="eq-in">16t²</span> feet in <i>t</i> seconds, starting from 256 feet.</p>`,
    prompt: 'Complete the table.',
    table: {
      head: ['t (seconds)', 'Distance fallen (ft)', 'Height above ground (ft)'],
      rows: [['0', '0', '256'], ['1', { f: 0 }, { f: 4 }], ['2', { f: 1 }, { f: 5 }], ['3', { f: 2 }, { f: 6 }], ['4', { f: 3 }, { f: 7 }]],
    },
    fields: [
      { label: 'distance at t = 1', ans: 16 }, { label: 'distance at t = 2', ans: 64 }, { label: 'distance at t = 3', ans: 144 }, { label: 'distance at t = 4', ans: 256 },
      { label: 'height at t = 1', ans: 240 }, { label: 'height at t = 2', ans: 192 }, { label: 'height at t = 3', ans: 112 }, { label: 'height at t = 4', ans: 0 },
    ],
    answerText: 'Distance: 16, 64, 144, 256.  Height: 240, 192, 112, 0.',
    explain: 'Distance fallen is 16t²: 16(1)² = 16, 16(2)² = 64, 16(3)² = 144, 16(4)² = 256. Height is 256 minus the distance fallen. At t = 4 the height is 0, so the ball hits the ground after 4 seconds.',
  },
  {
    id: 'p2-graph', part: 2, minutes: 3, kind: 'mc',
    title: 'Pick the graph',
    html: `<p>Use your table: heights 256, 240, 192, 112, 0 at t = 0, 1, 2, 3, 4.</p>`,
    prompt: 'Which graph shows the ball’s height over time?',
    options: [
      `<span class="gl">A</span>${miniGraph(u => 1 - u, { aria: 'Graph A: a straight line going down' })}`,
      `<span class="gl">B</span>${miniGraph(u => 1 - (u * u), { aria: 'Graph B: a curve that starts flat and gets steeper going down' })}`,
      `<span class="gl">C</span>${miniGraph(u => (1 - u) * (1 - u), { aria: 'Graph C: a curve that starts steep and flattens out going down' })}`,
      `<span class="gl">D</span>${miniGraph(u => u * u, { aria: 'Graph D: a curve going up and getting steeper' })}`,
    ],
    labels: ['A (straight line down)', 'B (flat, then steeper)', 'C (steep, then flatter)', 'D (going up)'],
    grid: true,
    correct: 1,
    explain: 'Graph B. The height drops slowly at first (only 16 ft in the first second) and then faster and faster (112 ft in the last second). So the curve starts flat at 256 and gets steeper until it reaches 0 at t = 4.',
  },
  {
    id: 'p2-rate', part: 2, minutes: 3, kind: 'num',
    title: 'How fast is it falling?',
    html: table(['t (s)', '0', '1', '2', '3', '4'], [['Height (ft)', '256', '240', '192', '112', '0']], 'wide'),
    prompt: 'Find the average rate of change of the height (in feet per second) over each interval.',
    fields: [
      { label: 't = 0 to t = 1', ans: -16, post: ' ft/s' },
      { label: 't = 3 to t = 4', ans: -112, post: ' ft/s' },
    ],
    show: v => `0→1: ${v[0]}   3→4: ${v[1]}`,
    answerText: '0→1: −16 ft/s   3→4: −112 ft/s',
    explain: '(240 − 256) ÷ 1 = −16 ft/s and (0 − 112) ÷ 1 = −112 ft/s. The rates are negative because the height is going down. The ball is falling 7 times faster in the last second than in the first.',
  },
  {
    id: 'p2-type', part: 2, minutes: 2, kind: 'mc',
    title: 'What kind of function?',
    html: table(['t (s)', '0', '1', '2', '3', '4'], [['Height (ft)', '256', '240', '192', '112', '0'], ['1st difference', '', '−16', '−48', '−80', '−112'], ['2nd difference', '', '', '−32', '−32', '−32']], 'wide'),
    prompt: 'The second differences are all −32. What kind of function is the height?',
    options: ['Linear', 'Quadratic', 'Exponential'],
    correct: 1,
    explain: 'Constant second differences mean the function is quadratic, just like q(x) = 5x² in Part 1. An exponential function would have a constant ratio instead.',
  },

  /* ===== Part 3: meaning of each term (10 min) ===== */
  {
    id: 'p3-256', part: 3, minutes: 2, kind: 'mc',
    title: 'The starting number',
    html: `<p>The height of the ball can be written as</p><p class="eq">h(t) = 256 − 16t²</p>`,
    prompt: 'What does the 256 tell us?',
    options: ['The height the ball started at, in feet', 'How fast the ball is falling', 'How many seconds until it hits the ground', 'How far the ball falls each second'],
    labels: ['Starting height', 'Speed', 'Time to land', 'Distance per second'],
    correct: 0,
    explain: 'At t = 0, h(0) = 256 − 16(0)² = 256. So 256 is the starting height: the top of the tower.',
  },
  {
    id: 'p3-16t2', part: 3, minutes: 2, kind: 'mc',
    title: 'The 16t² part',
    html: `<p class="eq">h(t) = 256 − 16t²</p>`,
    prompt: 'What does 16t² represent?',
    options: ['The distance the ball has fallen after t seconds', 'The height of the ball after t seconds', 'The speed of the ball', 'The time it takes to fall 16 feet'],
    labels: ['Distance fallen', 'Height', 'Speed', 'Time to fall 16 ft'],
    correct: 0,
    explain: '16t² is d(t), the distance fallen from your table. Height = starting height − distance fallen. The 16 comes from gravity (in feet), and t² is why the ball keeps speeding up.',
  },
  {
    id: 'p3-wrong', part: 3, minutes: 3, kind: 'text',
    title: 'Find the mistake',
    html: `<p>A classmate says the height of the ball is</p><p class="eq">h(t) = 16t² − 256</p>`,
    prompt: 'Explain what is wrong with your classmate’s function. Use what each term means.',
    explain: 'In h(t) = 16t² − 256, h(0) = −256, so the ball would start underground, and the height would go up as time passes. The height should start at 256 and go down by the distance fallen: h(t) = 256 − 16t².',
  },
  {
    id: 'p3-read', part: 3, minutes: 3, kind: 'num',
    title: 'Read a new function',
    html: `<p>A different ball is dropped. Its height in feet after <i>t</i> seconds is</p><p class="eq">h(t) = 144 − 16t²</p>`,
    prompt: 'What height was it dropped from, and after how many seconds does it hit the ground?',
    fields: [
      { label: 'Starting height', ans: 144, post: ' ft' },
      { label: 'Hits the ground at t =', ans: 3, post: ' s' },
    ],
    show: v => `${v[0]} ft, ${v[1]} s`,
    answerText: '144 ft, 3 s',
    explain: 'The constant term is the starting height: 144 ft. It hits the ground when 16t² = 144, so t² = 9 and t = 3 seconds.',
  },

  /* ===== Part 4: write the function (12 min) ===== */
  {
    id: 'p4-cliff', part: 4, minutes: 3, kind: 'num',
    title: 'A rock off a cliff',
    html: `<p>A rock is dropped from the edge of a cliff that is 400 feet above the water. Use feet and seconds.</p>`,
    prompt: 'Write a function for the rock’s height, then find when it hits the water.',
    fields: [
      { label: 'h(t) =', ans: 400 },
      { label: '−', ans: 16, post: 't²' },
      { label: 'Hits the water at t =', ans: 5, post: ' s' },
    ],
    inline: [0, 1],
    show: v => `h(t) = ${v[0]} − ${v[1]}t²,  t = ${v[2]}`,
    answerText: 'h(t) = 400 − 16t²,  t = 5',
    explain: 'Start at 400 ft and subtract the distance fallen, 16t². It hits the water when 16t² = 400, so t² = 25 and t = 5 seconds.',
  },
  {
    id: 'p4-table', part: 4, minutes: 3, kind: 'num',
    title: 'From a table',
    html: table(['t (s)', '0', '1', '2', '3', '4'], [['Height (ft)', '300', '284', '236', '156', '?']], 'wide'),
    prompt: 'This table shows the height of a dropped object. Write its height function and find the missing height.',
    fields: [
      { label: 'h(t) =', ans: 300 },
      { label: '−', ans: 16, post: 't²' },
      { label: 'Height at t = 4', ans: 44, post: ' ft' },
    ],
    inline: [0, 1],
    show: v => `h(t) = ${v[0]} − ${v[1]}t²,  h(4) = ${v[2]}`,
    answerText: 'h(t) = 300 − 16t²,  h(4) = 44',
    explain: 'The height at t = 0 is 300, so that is the starting height. It fell 16 ft in the first second, so the distance fallen is 16t². h(4) = 300 − 16(16) = 300 − 256 = 44 ft.',
  },
  {
    id: 'p4-meters', part: 4, minutes: 3, kind: 'num',
    title: 'Now in meters',
    html: `<p>In <b>meters</b>, the distance an object falls in <i>t</i> seconds is <span class="eq-in">4.9t²</span>.</p><p>A phone is dropped from a balcony 78.4 meters above the ground.</p>`,
    prompt: 'Write a function for the phone’s height in meters, then find when it hits the ground.',
    fields: [
      { label: 'h(t) =', ans: 78.4, tol: 0.001 },
      { label: '−', ans: 4.9, post: 't²', tol: 0.001 },
      { label: 'Hits the ground at t =', ans: 4, post: ' s' },
    ],
    inline: [0, 1],
    show: v => `h(t) = ${v[0]} − ${v[1]}t²,  t = ${v[2]}`,
    answerText: 'h(t) = 78.4 − 4.9t²,  t = 4',
    explain: 'Same structure, different units: starting height 78.4 m, distance fallen 4.9t². 4.9t² = 78.4 gives t² = 16, so t = 4 seconds.',
  },
  {
    id: 'p4-exit', part: 4, minutes: 3, kind: 'text',
    title: 'Exit ticket',
    html: `<p class="eq">h(t) = 500 − 16t²</p>`,
    prompt: 'In your own words: what do 500 and 16t² mean? Then say how the height changes over time compared with an exponential function like 2^t.',
    explain: '500 is the starting height in feet, and 16t² is how far the object has fallen after t seconds. The height drops faster and faster with constant second differences (quadratic). An exponential function changes by a constant factor instead, and it eventually outgrows any quadratic.',
  },
];

const ACTIVITY = { title: 'Falling Objects', parts, steps };
if (typeof module !== 'undefined' && module.exports) module.exports = ACTIVITY;
else window.FALL_ACTIVITY = ACTIVITY;
})();
