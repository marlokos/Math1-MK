// Unit 7 Lesson 2: Comparing Quadratic and Exponential Functions (live class activity).
// Follows the lesson slides: Bridge, Warm-up, Activities 1–5, a practice problem and the cool-down.
// The page loads this file in every browser, so the answer key is readable in the page source.
//
// Step kinds:
//   info  - content only, no student response
//   poll  - multiple choice with no right answer (a prediction)
//   mc    - multiple choice; `correct` is the index of the right option
//   num   - one or more number blanks; each field has `ans` and an optional `tol` (tolerance)
//   text  - a short written response, shown anonymously on the teacher screen

(function () {
/* ---------- drawing helpers ---------- */
function miniGraph(fn, opts = {}) {
  // fn maps u in [0,1] to v in [0,1]
  const W = 170, H = 130, x0 = 26, y0 = 108, w = 132, h = 92;
  const pts = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40, v = fn(u); pts.push(`${(x0 + u * w).toFixed(1)},${(y0 - v * h).toFixed(1)}`); }
  return `<svg class="mini" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.aria || 'graph'}">
  <line class="ax" x1="${x0}" y1="${y0}" x2="${x0 + w + 6}" y2="${y0}"/><line class="ax" x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - h - 6}"/>
  <text class="axl" x="${x0 + w + 4}" y="${y0 + 16}" text-anchor="end">time (s)</text>
  <text class="axl" x="${x0 - 6}" y="${y0 - h - 2}" text-anchor="end">ft</text>
  <text class="axl" x="${x0 - 6}" y="${y0 + 4}" text-anchor="end">0</text>
  <polyline class="cv" points="${pts.join(' ')}"/></svg>`;
}

// A building with the rock's position each second (distance fallen from the top).
function building(total, fell) {
  const top = 20, ground = 292, sc = (ground - top) / total, y = d => top + d * sc;
  let s = `<svg class="strobe" viewBox="0 0 300 312" role="img" aria-label="A rock dropped from a ${total}-foot building, shown after each second: ${fell.map((d, t) => `${t} s fell ${d} ft`).join(', ')}">`;
  s += `<rect class="tower" x="24" y="${top}" width="56" height="${ground - top}" rx="2"/>`;
  for (let k = 0; k < 8; k++) s += `<rect class="win" x="34" y="${top + 14 + k * 32}" width="12" height="14"/><rect class="win" x="56" y="${top + 14 + k * 32}" width="12" height="14"/>`;
  s += `<line class="gnd" x1="8" y1="${ground}" x2="292" y2="${ground}"/>`;
  s += `<line class="tick" x1="104" y1="${top}" x2="104" y2="${ground}" stroke-dasharray="3 4"/>`;
  let lastLab = -99;
  fell.forEach((d, t) => {
    const cy = Math.min(y(d), ground - 7), ly = Math.max(cy + 4, lastLab + 14);
    lastLab = ly;
    s += `<circle class="ball" cx="104" cy="${cy.toFixed(1)}" r="6" style="opacity:${(0.4 + t * 0.12).toFixed(2)}"/>`;
    s += `<line class="tick" x1="112" y1="${cy.toFixed(1)}" x2="120" y2="${(ly - 4).toFixed(1)}"/>`;
    s += `<text class="lab" x="124" y="${ly.toFixed(1)}">${t} s, fell ${d} ft</text>`;
  });
  s += `<text class="lab dim" x="52" y="${ground + 15}" text-anchor="middle">${total} ft</text></svg>`;
  return s;
}

// Pattern A (n by n squares) and Pattern B (doubling), figures 0-3.
function patterns() {
  const u = 16, gap = 24;
  const grid = (x, y, cols, rows) => { let r = ''; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) r += `<rect class="sq" x="${x + i * u}" y="${y - (j + 1) * u}" width="${u}" height="${u}"/>`; return r; };
  const panel = (title, figs, ox) => {
    let s = `<text class="lab" x="${ox + 4}" y="14" font-weight="700">${title}</text>`;
    let x = ox + 14;
    figs.forEach(([c, r], n) => {
      s += grid(x, 90, c, r);
      s += `<text class="lab dim" x="${x + Math.max(c, 1) * u / 2}" y="108" text-anchor="middle">Fig ${n}</text>`;
      x += Math.max(c, 1) * u + gap;
    });
    return s;
  };
  const one = (title, figs, aria) => `<svg class="patterns" viewBox="0 0 250 114" role="img" aria-label="${aria}">${panel(title, figs, 0)}</svg>`;
  return `<div class="pats">${one('Pattern A', [[0, 0], [1, 1], [2, 2], [3, 3]], 'Pattern A: figure 0 has no squares, figure 1 is 1 by 1, figure 2 is 2 by 2, figure 3 is 3 by 3.')}${one('Pattern B', [[1, 1], [1, 2], [2, 2], [4, 2]], 'Pattern B: figures 0 to 3 have 1, 2, 4 and 8 squares.')}</div>`;
}

function table(head, rows, cls = '') {
  return `<div class="tblwrap"><table class="dt ${cls}"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

const ROCK = building(500, [0, 16, 64, 144, 256, 400]);
const GALILEO = `<p>Galileo Galilei and other scholars studied free-falling objects. Their law: <span class="eq-in">d(t) = 16t²</span> gives the distance fallen in feet after <i>t</i> seconds.</p><p><b>An object is dropped from a height of 576 feet.</b></p>`;
const ELENA_DIEGO = `<div class="pair">
  <div><p class="cap">Elena’s table</p>${table(['Time (s)', 'Distance fallen (ft)'], [[0, 0], [1, 16], [2, 64], [3, ''], [4, ''], ['t', '']])}</div>
  <div><p class="cap">Diego’s table</p>${table(['Time (s)', 'Distance from the ground (ft)'], [[0, 576], [1, 560], [2, 512], [3, ''], [4, ''], ['t', '']])}</div></div>`;

/* ---------- the activity ---------- */
const parts = [
  { id: 1, name: 'Warm-up' },
  { id: 2, name: 'Which one grows faster?' },
  { id: 3, name: 'Falling from the sky' },
  { id: 4, name: 'Galileo and gravity' },
  { id: 5, name: 'Check your understanding' },
];

const steps = [
  /* ===== Part 1: Bridge and warm-up (5 min) ===== */
  {
    id: 'bridge', part: 1, minutes: 3, kind: 'num',
    title: 'Bridge: Fix the mistakes',
    html: `<p>Noah and Mai evaluated two expressions, and both made mistakes.</p>` +
      table(['', 'Noah’s work', 'Mai’s work'], [
        ['Evaluate 5<sup>x</sup> when x is 6', '5<sup>6</sup> = 30', '5<sup>6</sup> = 6 · 6 · 6 · 6 · 6 = 7,776'],
        ['Evaluate 3 · 6<sup>x</sup> when x is 2', '3 · 6² = 3 · 12 = 36', '3 · 6² = 18² = 324'],
      ], 'wide'),
    prompt: 'Evaluate each expression correctly.',
    fields: [
      { label: '5<sup>x</sup> when x = 6:', ans: 15625 },
      { label: '3 · 6<sup>x</sup> when x = 2:', ans: 108 },
    ],
    show: v => `5⁶ = ${v[0]}   3·6² = ${v[1]}`,
    answerText: '5⁶ = 15,625   3 · 6² = 108',
    explain: '5⁶ means six factors of 5: 5 · 5 · 5 · 5 · 5 · 5 = 15,625. Noah multiplied 5 · 6, and Mai used five factors of 6. For 3 · 6², the exponent applies only to the 6: 6² = 36, then 3 · 36 = 108. Noah doubled 6 instead of squaring it, and Mai multiplied 3 · 6 before squaring.',
  },
  {
    id: 'order', part: 1, minutes: 2, kind: 'mc',
    title: 'Warm-up: Least to greatest',
    html: `<p class="eq">Ⓐ 2¹⁰&emsp;Ⓑ 10²&emsp;Ⓒ 2⁹&emsp;Ⓓ 9²</p><p class="hint">Don’t evaluate each one. Think about the structure.</p>`,
    prompt: 'Which list puts these quantities in order from least to greatest?',
    options: ['D, B, C, A', 'B, D, C, A', 'D, B, A, C', 'C, A, D, B'],
    correct: 0,
    explain: '9² < 10² because 9 < 10. 2⁹ < 2¹⁰ because 2¹⁰ is 2⁹ doubled. And 2⁹ is already bigger than 10², since 2⁹ = 2 · 2⁸ and 2⁸ = 256. So the order is 9², 10², 2⁹, 2¹⁰ (81, 100, 512, 1,024).',
  },

  /* ===== Part 2: Activities 1 and 2 (15 min) ===== */
  {
    id: 'a1-predict', part: 2, minutes: 2, kind: 'poll',
    title: 'Activity 1: Which one grows faster?',
    html: patterns() + `<ul class="facts"><li>In <b>pattern A</b>, the length and width of the rectangle grow by one small square from each figure to the next.</li><li>In <b>pattern B</b>, the number of small squares doubles from each figure to the next.</li></ul>`,
    prompt: 'Predict: which pattern will have more small squares in figure 10?',
    options: ['Pattern A', 'Pattern B', 'They will have the same number'],
    explain: 'Figure 10 of pattern A has 10 · 10 = 100 squares. Figure 10 of pattern B has 2¹⁰ = 1,024 squares. Pattern B has more than ten times as many.',
  },
  {
    id: 'a1-table', part: 2, minutes: 5, kind: 'num',
    title: 'Complete the tables',
    html: patterns() + `<p>f(n) is the number of small squares in figure n of pattern A. g(n) is the number in pattern B.</p>`,
    prompt: 'Fill in the missing values.',
    table: {
      head: ['n, figure number', 'f(n), pattern A', 'g(n), pattern B'],
      rows: [['0', '0', '1'], ['1', '1', '2'], ['2', '4', '4'], ['3', '9', '8'], ['4', { f: 0 }, { f: 3 }], ['5', { f: 1 }, { f: 4 }], ['8', { f: 2 }, { f: 5 }]],
    },
    fields: [
      { label: 'f(4)', ans: 16 }, { label: 'f(5)', ans: 25 }, { label: 'f(8)', ans: 64 },
      { label: 'g(4)', ans: 16 }, { label: 'g(5)', ans: 32 }, { label: 'g(8)', ans: 256 },
    ],
    answerText: 'f: 16, 25, 64.  g: 16, 32, 256.',
    explain: 'Pattern A is an n by n square, so f(n) = n²: 4² = 16, 5² = 25, 8² = 64. Pattern B doubles each time starting from 1, so g(n) = 2ⁿ: 2⁴ = 16, 2⁵ = 32, 2⁸ = 256. The patterns are equal at n = 4, then pattern B pulls ahead.',
  },
  {
    id: 'a1-eq', part: 2, minutes: 2, kind: 'mc',
    title: 'Write the equations',
    html: patterns(),
    prompt: 'Which equations represent the two patterns, and what type is each function?',
    options: [
      'A: f(n) = n² (quadratic)<br>B: g(n) = 2ⁿ (exponential)',
      'A: f(n) = 2n (linear)<br>B: g(n) = n² (quadratic)',
      'A: f(n) = n² (quadratic)<br>B: g(n) = 2n (linear)',
      'A: f(n) = 2ⁿ (exponential)<br>B: g(n) = n² (quadratic)',
    ],
    labels: ['A n² quad, B 2ⁿ exp', 'A 2n lin, B n² quad', 'A n² quad, B 2n lin', 'A 2ⁿ exp, B n² quad'],
    correct: 0,
    explain: 'Pattern A’s length and width are both n, so f(n) = n², a quadratic function. Pattern B starts at 1 and doubles each time, so g(n) = 2ⁿ, an exponential function.',
  },
  {
    id: 'a1-factor', part: 2, minutes: 2, kind: 'num',
    title: 'Growth factors',
    html: table(['n', 'f(n) = n²', 'growth factor', 'g(n) = 2ⁿ', 'growth factor'], [
      [2, 4, '4 ÷ 1 = 4', 4, '4 ÷ 2 = 2'], [3, 9, '9 ÷ 4 = 2.25', 8, '8 ÷ 4 = 2'], [4, 16, '16 ÷ 9 ≈ 1.78', 16, '16 ÷ 8 = 2'],
      [5, 25, '25 ÷ 16 ≈ 1.56', 32, '32 ÷ 16 = 2'], [7, 49, '', 128, ''], [8, 64, '?', 256, '?']]),
    prompt: 'Find each growth factor from n = 7 to n = 8. Round to 2 decimal places.',
    fields: [
      { label: 'f: 64 ÷ 49 ≈', ans: 1.31, tol: 0.006 },
      { label: 'g: 256 ÷ 128 =', ans: 2 },
    ],
    show: v => `f: ${v[0]}   g: ${v[1]}`,
    answerText: 'f: 1.31   g: 2',
    explain: 'The quadratic’s growth factor keeps shrinking (4, 2.25, 1.78, 1.56, … 1.31). The exponential’s growth factor is always 2. That is why the exponential eventually grows faster.',
  },
  {
    id: 'a1-compare', part: 2, minutes: 1, kind: 'text',
    title: 'If they keep growing',
    html: patterns(),
    prompt: 'How would the two patterns compare if they continue to grow? Make one or two observations.',
    explain: 'Both start close together, and they’re equal at n = 4. After that, pattern B pulls further ahead every step, because it is always multiplied by 2 while pattern A’s growth factor gets closer and closer to 1.',
  },
  {
    id: 'a2', part: 2, minutes: 3, kind: 'num',
    title: 'Activity 2: Two more functions',
    html: `<p class="eq">p(x) = 6x²&emsp;&emsp;q(x) = 3<sup>x</sup></p><p>Investigate the outputs of p and q for different values of x. A table or Desmos can help.</p>`,
    prompt: 'For x = 1, 2, 3, …, what is the first whole number x where q(x) is greater than p(x)?',
    fields: [{ label: 'x =', ans: 5 }],
    show: v => `x = ${v[0]}`,
    answerText: 'x = 5',
    explain: 'At x = 4, p = 96 and q = 81. At x = 5, p = 150 and q = 243. From then on q stays ahead: q is always multiplied by 3, while p’s growth factor keeps shrinking toward 1. So the exponential function q eventually has the greater value.',
  },

  /* ===== Part 3: Activities 3 and 4 (12 min) ===== */
  {
    id: 'a3', part: 3, minutes: 2, kind: 'text',
    title: 'Activity 3: A numerical pattern',
    html: table(['x', '0', '1', '2', '3', '4', '5'], [['y', '0', '16', '64', '144', '256', '400']], 'wide'),
    prompt: 'What do you notice? What do you wonder?',
    explain: 'Every y-value is a multiple of 16, and the gaps between them keep growing (16, 48, 80, 112, 144). We’ll see where these numbers come from next.',
  },
  {
    id: 'a4-same', part: 3, minutes: 2, kind: 'mc',
    title: 'Activity 4: Falling from the sky',
    html: `<div class="split"><div>${ROCK}</div><div><p>A rock is dropped from the top floor of a 500-foot tall building. A camera captures the distance the rock has traveled, in feet, after each second.</p></div></div>`,
    prompt: 'Does the rock fall the same distance every second?',
    options: ['Yes, it falls 16 feet every second', 'No, it falls farther each second', 'No, it falls less each second'],
    labels: ['Yes, 16 ft each second', 'No, farther each second', 'No, less each second'],
    correct: 1,
    explain: 'In each second it falls 16, 48, 80, 112 and 144 feet. The distance per second grows by 32 each time, so the rock is speeding up.',
  },
  {
    id: 'a4-six', part: 3, minutes: 3, kind: 'num',
    title: 'After 6 seconds',
    html: `<div class="split"><div>${ROCK}</div><div><p>A rock is dropped from the top floor of a 500-foot tall building.</p><p class="hint">“After 6 seconds, I think the rock will have fallen ___ feet because I noticed that…”</p></div></div>`,
    prompt: 'Following the pattern, how far will the rock have fallen after 6 seconds?',
    fields: [{ label: 'Distance fallen:', ans: 576, post: ' ft' }],
    show: v => `${v[0]} ft`,
    answerText: '576 ft',
    explain: 'The distance fallen each second grows by 32: 16, 48, 80, 112, 144, then 176. So 400 + 176 = 576 feet, which is also 16 · 6². But the building is only 500 feet tall, so this rock would actually hit the ground before 6 seconds.',
  },
  {
    id: 'a4-seven', part: 3, minutes: 2, kind: 'num',
    title: 'Jada’s observation',
    html: `<p>Jada noticed that the distances fallen are all multiples of 16:</p><p class="eq">16 = 16 · 1&emsp;64 = 16 · 4&emsp;144 = 16 · 9<br>256 = 16 · 16&emsp;400 = 16 · 25</p><p>Then she noticed that 1, 4, 9, 16 and 25 are 1², 2², 3², 4² and 5².</p>`,
    prompt: 'Use Jada’s observations to predict the distance fallen from an even taller building after 7 seconds.',
    fields: [{ label: 'Distance fallen:', ans: 784, post: ' ft' }],
    show: v => `${v[0]} ft`,
    answerText: '784 ft',
    explain: 'Following Jada’s pattern, the distance after t seconds is 16 · t². After 7 seconds: 16 · 7² = 16 · 49 = 784 feet.',
  },
  {
    id: 'a4-eq', part: 3, minutes: 3, kind: 'mc',
    title: 'Write the equation',
    html: `<p>Use Jada’s observations. Let <i>d</i> be the distance fallen in feet after <i>t</i> seconds.</p>` + table(['t (s)', '0', '1', '2', '3', '4', '5'], [['d (ft)', '0', '16', '64', '144', '256', '400']], 'wide'),
    prompt: 'Which equation represents this function?',
    options: ['d = 16t', 'd = 16t²', 'd = 16 · 2<sup>t</sup>', 'd = t² + 16'],
    labels: ['d = 16t', 'd = 16t²', 'd = 16 · 2^t', 'd = t² + 16'],
    correct: 1,
    explain: 'd = 16t². Check: at t = 3, 16 · 9 = 144. The t² makes this a quadratic function. It isn’t exponential: the outputs aren’t multiplied by the same factor each second (64 ÷ 16 = 4, but 144 ÷ 64 = 2.25).',
  },

  /* ===== Part 4: Activity 5 (12 min) ===== */
  {
    id: 'a5-half', part: 4, minutes: 2, kind: 'num',
    title: 'Activity 5: Galileo and gravity',
    html: GALILEO,
    prompt: 'Evaluate d(0.5).',
    fields: [{ label: 'd(0.5) =', ans: 4 }],
    show: v => `d(0.5) = ${v[0]}`,
    answerText: 'd(0.5) = 4',
    explain: 'd(0.5) = 16 · 0.5² = 16 · 0.25 = 4. It means that half a second after the object is dropped, it has fallen 4 feet.',
  },
  {
    id: 'a5-alike', part: 4, minutes: 2, kind: 'text',
    title: 'Elena’s and Diego’s tables',
    html: GALILEO + `<p>To find where the object is in the first few seconds, Elena and Diego made different tables.</p>` + ELENA_DIEGO,
    prompt: 'How are the two tables alike? How are they different?',
    explain: 'Both tables use the same times and the same falling object. Elena’s table shows how far the object has fallen (it starts at 0 and increases). Diego’s table shows its height above the ground (it starts at 576 and decreases). At every time, the two values add up to 576.',
  },
  {
    id: 'a5-complete', part: 4, minutes: 4, kind: 'num',
    title: 'Complete the tables',
    html: GALILEO,
    prompt: 'Complete Elena’s and Diego’s tables for 3 and 4 seconds.',
    table: {
      head: ['Time (s)', 'Elena: distance fallen (ft)', 'Diego: distance from the ground (ft)'],
      rows: [['0', '0', '576'], ['1', '16', '560'], ['2', '64', '512'], ['3', { f: 0 }, { f: 2 }], ['4', { f: 1 }, { f: 3 }]],
    },
    fields: [
      { label: 'Elena at 3 s', ans: 144 }, { label: 'Elena at 4 s', ans: 256 },
      { label: 'Diego at 3 s', ans: 432 }, { label: 'Diego at 4 s', ans: 320 },
    ],
    answerText: 'Elena: 144, 256.  Diego: 432, 320.',
    explain: 'Elena uses d(t) = 16t²: 16 · 9 = 144 and 16 · 16 = 256. Diego subtracts the distance fallen from the starting height: 576 − 144 = 432 and 576 − 256 = 320.',
  },
  {
    id: 'a5-expr', part: 4, minutes: 2, kind: 'mc',
    title: 'The t row',
    html: GALILEO + ELENA_DIEGO,
    prompt: 'Which expressions belong in the last row (time t) of each table?',
    options: [
      'Elena: 16t²&emsp;Diego: 576 − 16t²',
      'Elena: 576 − 16t²&emsp;Diego: 16t²',
      'Elena: 16t²&emsp;Diego: 16t² − 576',
      'Elena: 16t&emsp;Diego: 576 − 16t',
    ],
    labels: ['16t² and 576 − 16t²', '576 − 16t² and 16t²', '16t² and 16t² − 576', '16t and 576 − 16t'],
    correct: 0,
    explain: 'Elena’s table is the distance fallen, 16t². Diego’s table is the height: start at 576 and subtract the distance fallen, 576 − 16t². In Diego’s function, 576 is the starting height and −16t² is the distance the object has fallen.',
  },
  {
    id: 'a5-graph', part: 4, minutes: 2, kind: 'mc',
    title: 'Graph the height',
    html: GALILEO,
    prompt: 'Which graph shows Diego’s function, the object’s distance from the ground over time?',
    options: [
      `<span class="gl">A</span>${miniGraph(u => u * u, { aria: 'Graph A: starts at 0 and curves up, getting steeper' })}`,
      `<span class="gl">B</span>${miniGraph(u => 1 - u * u, { aria: 'Graph B: starts high, flat at first, then curves down more steeply to 0' })}`,
      `<span class="gl">C</span>${miniGraph(u => 1 - u, { aria: 'Graph C: a straight line going down to 0' })}`,
      `<span class="gl">D</span>${miniGraph(u => (1 - u) * (1 - u), { aria: 'Graph D: starts high and steep, then flattens out near 0' })}`,
    ],
    labels: ['A (curves up from 0)', 'B (flat, then steeper down)', 'C (straight line down)', 'D (steep, then flatter)'],
    grid: true,
    correct: 1,
    explain: 'Graph B. It starts at 576 when t = 0 and decreases slowly at first, then faster and faster, reaching 0 at t = 6 (576 − 16 · 36 = 0). Graph A is Elena’s distance fallen. Neither graph is the path of the object: the object falls straight down.',
  },

  /* ===== Part 5: Practice and cool-down (6 min) ===== */
  {
    id: 'p10', part: 5, minutes: 2, kind: 'mc',
    title: 'Practice: Diego’s claim',
    html: `<p>Diego claimed that <span class="eq-in">10 + x²</span> is always greater than <span class="eq-in">2<sup>x</sup></span> and used this table as evidence.</p>` +
      table(['x', '10 + x²', '2<sup>x</sup>'], [[1, 11, 2], [2, 14, 4], [3, 19, 8], [4, 26, 16]]),
    prompt: 'Do you agree with Diego?',
    options: [
      'Agree. The table shows 10 + x² is greater every time.',
      'Disagree. When x = 6, 10 + x² is 46, but 2<sup>x</sup> is 64.',
      'Agree. Quadratic functions always grow faster than exponential functions.',
      'Disagree. When x = 4, 2<sup>x</sup> is already greater.',
    ],
    labels: ['Agree: table shows it', 'Disagree: x = 6 gives 46 vs 64', 'Agree: quadratics grow faster', 'Disagree: x = 4'],
    correct: 1,
    explain: 'A table with only four rows can’t show what happens later. At x = 5, 10 + 25 = 35 and 2⁵ = 32. At x = 6, 10 + 36 = 46 but 2⁶ = 64. The exponential passes the quadratic and stays ahead.',
  },
  {
    id: 'cooldown', part: 5, minutes: 4, kind: 'num',
    title: 'Cool-down: Where will it be?',
    html: `<p>The expression <span class="eq-in">16t²</span> represents the distance in feet an object falls after <i>t</i> seconds. The object is dropped from a height of <b>906 feet</b>.</p>`,
    prompt: 'Write a function for the object’s height in feet t seconds after it is dropped. Then find its height 2 seconds after it is dropped.',
    fields: [
      { label: 'h(t) =', ans: 906 },
      { label: '−', ans: 16, post: 't²' },
      { label: 'Height after 2 seconds:', ans: 842, post: ' ft' },
    ],
    inline: [0, 1],
    show: v => `h(t) = ${v[0]} − ${v[1]}t²,  h(2) = ${v[2]}`,
    answerText: 'h(t) = 906 − 16t²,  h(2) = 842 ft',
    explain: 'Start at 906 feet and subtract the distance fallen: h(t) = 906 − 16t². After 2 seconds it has fallen 16 · 2² = 64 feet, so its height is 906 − 64 = 842 feet.',
  },
];

const ACTIVITY = { title: 'Comparing Quadratic and Exponential Functions', brand: ['Quadratic vs.', 'Exponential'], lesson: 'Unit 7 · Lesson 2', parts, steps };
if (typeof module !== 'undefined' && module.exports) module.exports = ACTIVITY;
else window.FALL_ACTIVITY = ACTIVITY;
})();
