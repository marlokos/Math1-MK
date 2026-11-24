# Data Jeopardy Live

A classroom Jeopardy review on histograms, box plots, mean and median, range, IQR and standard deviation.

- **Class game:** the teacher shows the board on the projector. Up to 20 students join on their own phones or laptops with a 4-letter code and their first name, answer each clue, and earn points. The top three names stay at the bottom of the screen. Highest score wins.
- **Practice mode:** a student plays the whole board alone, and each answer is checked right away.
- Two question sets (Game 1 and Game 2), each with 25 clues and a Final Jeopardy.

## What's in this repository

| File | What it is |
| --- | --- |
| `server.js` | The game server. It needs Node.js 18 or newer and nothing else to install. |
| `package.json` | Tells hosting services how to start the server (`npm start`). |
| `render.yaml` | Optional settings that let Render set up the server in one step. |
| `public/index.html` | The page that teachers and students open. |
| `public/questions.js` | All questions and answers. Edit this file to change the questions. |
| `public/fonts/KGSummerSunshine.woff` | The display font for headings and tile values (see the font note below). |

## Putting this on GitHub

1. Sign in at github.com and choose **New repository**. Give it a name (for example `data-jeopardy-live`), choose **Public** or **Private**, and create it.
2. On the new repository's page, choose **uploading an existing file**.
3. Drag in **everything inside** the `data-jeopardy-live` folder: `server.js`, `package.json`, `render.yaml`, `README.md`, `.gitignore` and the `public` folder. Keep the `public` folder's contents in place.
   - `.gitignore` starts with a dot, so some computers hide it. It's fine to leave it out.
4. Choose **Commit changes**.

GitHub stores the code, but it can't run the game server itself. GitHub Pages only serves files, so class games won't work there. Connect the repository to a Node.js host using the steps below.

### Font note

The heading font, KG Summer Sunshine by Kimberly Geswein, is free for personal and classroom use, but its license may not allow sharing the font file publicly. If your repository is **public**, either:

- delete `public/fonts/KGSummerSunshine.woff` before uploading (the game automatically falls back to a standard font), or
- make the repository **private**. Render and most other hosts can deploy private repositories.

## Putting it online

Class games need a host that **runs a Node.js program**. A site that only stores files (Google Sites, Canvas pages, GitHub Pages, a shared drive) can show practice mode but can't run class games.

**Fastest with Render:** in Render, choose **New → Blueprint**, connect your GitHub account, and pick this repository. Render reads `render.yaml` and sets everything up.

Any Node.js host works. These steps fit most of them, including Render, Railway and Replit:

1. Make a free account with the host.
2. Connect the host to your GitHub account and choose this repository.
3. Create a **Web Service** (or "Node app").
   - Build command: leave blank, or `npm install` (there is nothing to install).
   - Start command: `npm start`
4. Wait for it to deploy. The host gives you a web address, such as `https://your-game.onrender.com`. That's the address students go to.

Check with your school's tech team that the address isn't blocked on student devices.

If your school has its own server, IT can run it with `node server.js`. It listens on port 3000, or on the port set in the `PORT` environment variable.

**Free plans often put the server to sleep when nobody is using it.** Open the address yourself a minute or two before class so it's awake when students join.

## Running a class game

1. Open the address on the computer connected to the projector and choose **Host a class game**.
2. Pick Game 1 or Game 2, then **Create game**. A big 4-letter code appears.
3. Students open the same address, choose **Join a class game**, and type the code and their first name.
   - Names must be one word with letters only. If two students have the same name, the second one is asked to add a number (for example, Maya2).
   - To remove a name, tap the **×** next to it, then tap **Remove?** to confirm. This works in the lobby and in **Players & scores** during the game.
4. Choose **Start the game**, then pick a tile.
5. The clue and its four choices appear on the projector and on every student's device. Students have 30 seconds to tap an answer and can change it until time runs out. The projector shows how many students have answered.
6. Choose **Show answer**. The projector shows the correct choice, how many students picked each choice, the explanation, and who got it right. Each student's device shows whether they were right and how many points they earned.
7. **Back to board** for the next clue. If you open a tile by mistake, **Cancel clue** puts it back without scoring.
8. When you're ready, choose **Go to Final Jeopardy**.
   - Each student wagers up to their current score. Students with 0 or fewer points wager 0.
   - **Show the clue** gives everyone 60 seconds to answer.
   - **Show answer** adds the wager for a right answer and subtracts it for a wrong one.
   - **Show final results** shows the winner, the podium and the full standings.

### Scoring

- A right answer earns the clue's value (100–500). A wrong answer or no answer earns 0.
- One hidden tile, worth 300–500, is a **Daily Double**: every right answer on it earns double points.
- Final Jeopardy uses each student's own wager.

### If something goes wrong

- **A student's page reloads or their device sleeps:** they open the address again and go straight back into the game with their score.
- **The teacher's page reloads:** opening the address again returns you to the game you were hosting.
- **The server restarts:** games in progress are lost (they are kept in memory only). Start a new game.
- Games are cleared automatically after 6 hours of no activity.

## Changing the questions

Open `public/questions.js` in any text editor. Each clue looks like this:

```js
{ q: 'Find the range: <b>12, 5, 19, 8, 15</b>', c: ['14', '19', '12', '11.8'], w: 'Range = maximum − minimum = 19 − 5 = 14.' }
```

- `q` is the question. `<b>…</b>` makes words bold.
- `c` is the four choices. **Put the correct answer first.** The game shuffles the order for students.
- `w` is the explanation shown after the answer.
- `fig` (optional) draws a histogram (`t: 'h'`) or box plot (`t: 'b'`). Copy an existing one and change the numbers.

Keep 5 categories with 5 clues each. Upload the changed file to your host to update the game.

---

# Falling Objects Live

A teacher-driven class activity that runs from GitHub Pages, using the same Firebase database as Math 1 Linear Jeopardy:

**https://marlokos.github.io/Math1-MK/fall/**

It takes about 50 minutes and builds in four parts:

| Part | Steps | Time | Learning goal |
| --- | --- | --- | --- |
| 1. Which grows faster? | 1–5 | 14 min | Compare rates of change for exponential and quadratic functions |
| 2. Dropping a ball | 6–10 | 14 min | Use tables, graphs and rates of change for the height of a falling object |
| 3. What each part means | 11–14 | 10 min | Explain the meaning of each term in h(t) = h₀ − 16t² |
| 4. Write your own | 15–18 | 12 min | Write quadratic functions for falling objects (feet and meters) |

## Running it

1. On the projector computer, open the link above and choose **Start a class session**. A 4-letter code appears.
2. Students open the same link on their own devices, choose **Join class**, and type the code and their **first name**. Names show on the lobby screen while students join, and nowhere on the board after that.
3. Choose **Start the activity**. You control which step everyone sees with **Next**, **Back**, the numbered dots, or the ← → arrow keys. Each step shows a suggested time and a timer.
4. Students answer on their devices. The board shows how many have answered.
   - **Show responses** puts the class's answers on the board without names: bar charts for multiple choice, grouped answers for number questions, the most common answer in each blank for the table, and anonymous cards for written answers.
   - Tap **×** on a written answer to hide it from the board.
   - **Reveal answer** (or **Show takeaway** on prediction and writing steps) shows the answer and explanation on the board, closes answers for that step, and tells each student whether they were right.
5. **Class list** (keep it off the projector) shows who has joined and who has answered the current step, and lets you remove a name.
6. **End session** when you're done. It deletes the session and its answers from the database.

If the teacher's page reloads, open the link again and choose **Return to the session I'm running**. Students who reload choose **Rejoin**.

## Changing the questions

Everything is in `fall/activity.js`: prompts, choices, answers and explanations. The page loads this file in the browser, so a student who views the page source could find the answers.

## Files

| File | What it is |
| --- | --- |
| `fall/index.html` | The teacher and student page, including the Firebase settings |
| `fall/activity.js` | Steps, prompts, answers and explanations |
