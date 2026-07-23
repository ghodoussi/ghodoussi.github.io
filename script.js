/* =========================================================================
   Hero -> notebook scroll fade
   The cover is position:fixed. As the user scrolls through the height of
   .cover-spacer, we fade + slightly scale the cover down so it feels like
   the page is "opening" into the notebook underneath.
   ========================================================================= */
(function heroFade() {
  const cover = document.querySelector('.cover');
  const spacer = document.querySelector('.cover-spacer');
  if (!cover || !spacer) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function update() {
    const distance = spacer.offsetHeight;
    const progress = Math.min(Math.max(window.scrollY / distance, 0), 1);
    if (reduceMotion) {
      cover.style.opacity = progress > 0.5 ? '0' : '1';
      cover.style.visibility = progress > 0.5 ? 'hidden' : 'visible';
      return;
    }
    cover.style.opacity = String(1 - progress);
    cover.style.transform = `scale(${1 - progress * 0.06}) translateY(${progress * -30}px)`;
    cover.style.visibility = progress >= 1 ? 'hidden' : 'visible';
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* =========================================================================
   Starscape
   Draws a field of stars on the hero canvas. The number of stars scales
   with how many posts exist in the notebook's table of contents — so the
   sky fills in a little more with every post you write. No manual count
   to maintain: it just reads the DOM.
   ========================================================================= */
(function initStarscape() {
  const canvas = document.getElementById('starscape');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.max(window.devicePixelRatio || 1, 1);

  const postCount = Math.max(document.querySelectorAll('.toc__item').length, 1);
  // Diminishing returns so the sky doesn't get noisy after dozens of posts.
  const starCount = Math.round(60 + 55 * Math.sqrt(postCount));

  let stars = [];
  let resizeTimer = null;

  function sizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(rect.width, 1) * dpr;
    canvas.height = Math.max(rect.height, 1) * dpr;
  }

  function generateStars() {
    stars = [];
    for (let i = 0; i < starCount; i++) {
      const roll = Math.random();
      // three size classes, most stars small — mirrors a real night sky
      const radius = roll < 0.72 ? 0.5 + Math.random() * 0.5
                    : roll < 0.94 ? 1.0 + Math.random() * 0.6
                    : 1.7 + Math.random() * 0.9;
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: radius * dpr,
        baseAlpha: 0.35 + Math.random() * 0.65,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.9,
        glow: roll >= 0.94, // only the biggest stars get a soft glow
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const twinkle = reduceMotion ? 1 : 0.7 + 0.3 * Math.sin((time / 1000) * s.speed + s.phase);
      const alpha = s.baseAlpha * twinkle;
      if (s.glow) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(243,244,240,${(alpha * 0.08).toFixed(3)})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(243,244,240,${alpha.toFixed(3)})`;
      ctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeCanvas();
      generateStars();
      if (reduceMotion) draw(0);
    }, 150);
  }

  sizeCanvas();
  generateStars();
  requestAnimationFrame(draw);
  window.addEventListener('resize', handleResize);
})();

/* =========================================================================
   Notebook cell engine
   Each cell in the DOM looks like:

   <div class="cell" data-lang="js">
     <div class="cell__prompt">In [<span class="count">1</span>]:</div>
     <div class="cell__code-wrap">
       <pre class="cell__code" contenteditable="true">code here</pre>
       <div class="cell__toolbar">
         <button class="cell__run">Run ▸</button>
         <span class="cell__lang">JavaScript</span>
       </div>
     </div>
     <div class="cell__output-wrap">
       <div class="cell__prompt">Out[<span class="count">1</span>]:</div>
       <pre class="cell__output"></pre>
     </div>
   </div>

   Static (non-runnable) cells: add class "cell--static" and no data-lang;
   the Run button is omitted at authoring time for those.
   ========================================================================= */

let executionCount = 0;
let pyodideReady = null; // promise, set on first python run

function nextExecutionCount() {
  executionCount += 1;
  return executionCount;
}

async function ensurePyodide(onStatus) {
  if (pyodideReady) return pyodideReady;
  onStatus('loading python runtime (first run only, ~a few seconds)…');
  pyodideReady = (async () => {
    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return await window.loadPyodide();
  })();
  return pyodideReady;
}

function runJS(code) {
  const logs = [];
  const sandboxConsole = {
    log: (...args) => logs.push(args.map(String).join(' ')),
    error: (...args) => logs.push(args.map(String).join(' ')),
  };
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', `"use strict";\n${code}`);
    const result = fn(sandboxConsole);
    if (result !== undefined) logs.push(String(result));
    return { ok: true, text: logs.join('\n') || '(no output)' };
  } catch (err) {
    return { ok: false, text: `${err.name}: ${err.message}` };
  }
}

async function runPython(code, onStatus) {
  const pyodide = await ensurePyodide(onStatus);
  try {
    let stdout = '';
    pyodide.setStdout({ batched: (s) => { stdout += s + '\n'; } });
    const result = await pyodide.runPythonAsync(code);
    if (result !== undefined && result !== null) stdout += String(result);
    return { ok: true, text: stdout.trim() || '(no output)' };
  } catch (err) {
    return { ok: false, text: String(err) };
  }
}

function wireCell(cell) {
  const runBtn = cell.querySelector('.cell__run');
  if (!runBtn) return; // static cell, nothing to wire
  const codeEl = cell.querySelector('.cell__code');
  const outputEl = cell.querySelector('.cell__output');
  const promptCounts = cell.querySelectorAll('.cell__prompt .count');
  const lang = cell.dataset.lang;

  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    const originalLabel = runBtn.textContent;
    runBtn.textContent = 'running…';
    outputEl.classList.remove('cell__output--error');

    const code = codeEl.innerText;
    let res;
    if (lang === 'python') {
      res = await runPython(code, (status) => { runBtn.textContent = status; });
    } else {
      res = runJS(code);
    }

    const n = nextExecutionCount();
    promptCounts.forEach((el) => { el.textContent = String(n); });
    outputEl.textContent = res.text;
    outputEl.classList.add('cell__output--visible');
    if (!res.ok) outputEl.classList.add('cell__output--error');

    runBtn.disabled = false;
    runBtn.textContent = originalLabel;
  });
}

document.querySelectorAll('.cell').forEach(wireCell);
