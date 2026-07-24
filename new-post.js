#!/usr/bin/env node
/**
 * new-post.js — scaffolds a new post from posts/post-template.html.
 *
 * Usage:
 *   node new-post.js "My Post Title"
 *   (or just `node new-post.js` and it'll prompt you)
 *
 * It asks a couple quick questions, fills in the metadata block and
 * title in a copy of the template, and drops it in posts/. Write your
 * actual content in there, then run `node build.js` to add it to the
 * homepage list.
 *
 * This is a local-only tool — there's no "publish" button on the live
 * site itself. You write posts on your machine and push like normal.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const POSTS_DIR = path.join(__dirname, 'posts');
const TEMPLATE_PATH = path.join(POSTS_DIR, 'post-template.html');

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// A prompt() built on the readline async iterator rather than chained
// rl.question() calls — chaining multiple awaited question() calls can
// silently drop input when stdin isn't an interactive TTY (e.g. piped
// input), since only one "question" listener is active at a time.
// Iterating the interface directly consumes each line reliably instead.
function makePrompt(rl) {
  const iterator = rl[Symbol.asyncIterator]();
  return async function prompt(question) {
    process.stdout.write(question);
    const { value, done } = await iterator.next();
    return done ? '' : value;
  };
}

async function main() {
  const titleArg = process.argv.slice(2).join(' ').trim();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const prompt = makePrompt(rl);

  const title = titleArg || (await prompt('Post title: ')).trim();
  if (!title) {
    console.error('A title is required.');
    rl.close();
    process.exit(1);
  }

  const tagsInput = await prompt('Tags (comma-separated, e.g. Python, JavaScript): ');
  const excerpt = await prompt('One or two sentence excerpt for the homepage listing: ');
  const draftInput = await prompt('Save as draft — hide from the homepage until you rebuild later? (y/N): ');
  rl.close();

  const draft = /^y/i.test(draftInput.trim());
  const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
  const slug = slugify(title);
  const outPath = path.join(POSTS_DIR, `${slug}.html`);

  if (fs.existsSync(outPath)) {
    console.error(`posts/${slug}.html already exists — pick a different title, or rename/remove that file first.`);
    process.exit(1);
  }

  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dateDisplay = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const sortDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const metaBlock = `<script type="application/json" id="post-meta">
{
  "title": ${JSON.stringify(title)},
  "date": ${JSON.stringify(dateDisplay)},
  "sortDate": ${JSON.stringify(sortDate)},
  "tags": ${JSON.stringify(tags)},
  "excerpt": ${JSON.stringify(excerpt)},
  "draft": ${draft}
}
</script>`;

  template = template
    .replace(
      '<title>Post Title Here — Ryon Ghodoussi</title>',
      `<title>${title} — Ryon Ghodoussi</title>\n${metaBlock}`
    )
    .replace('MONTH YEAR · TAGS, GO, HERE', `${dateDisplay.toUpperCase()} · ${tags.join(', ').toUpperCase()}`)
    .replace('Post Title Here</h1>', `${title}</h1>`);

  fs.writeFileSync(outPath, template);
  console.log(`\nCreated posts/${slug}.html${draft ? ' (draft)' : ''}`);
  console.log('Next: open it up, write your post, then run `node build.js` to add it to the homepage.');
}

main();
