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
