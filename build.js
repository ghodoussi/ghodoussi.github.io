#!/usr/bin/env node
/**
 * build.js — regenerates the "Table of Contents" list in index.html by
 * reading the metadata embedded in every file under posts/.
 *
 * Run this any time you add, edit, or reorder a post, before you commit
 * and push:
 *
 *   node build.js
 *
 * Uses metadata block near the top of post files:
 *
 *   <script type="application/json" id="post-meta">
 *   { "title": "...", "date": "...", "sortDate": "2026-07", "tags": [...], "excerpt": "..." }
 *   </script>
 *
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, 'posts');
const INDEX_PATH = path.join(__dirname, 'index.html');
const TEMPLATE_NAME = 'post-template.html';

const START_MARKER = '<!-- AUTO-GENERATED TOC: START (do not hand-edit — run `node build.js`) -->';
const END_MARKER = '<!-- AUTO-GENERATED TOC: END -->';

function readPostMeta(filePath, filename) {
    const html = fs.readFileSync(filePath, 'utf8');
    const match = html.match(/<script type="application\/json" id="post-meta">([\s\S]*?)<\/script>/);
    if (!match) {
	console.warn(`  ! skipping ${filename} — no <script id="post-meta"> block found`);
	return null;
    }
    let meta;
    try {
	meta = JSON.parse(match[1]);
    } catch (err) {
	console.warn(`  ! skipping ${filename} — post-meta JSON didn't parse: ${err.message}`);
	return null;
    }
    const required = ['title', 'date', 'sortDate', 'tags', 'excerpt'];
    const missing = required.filter((k) => !(k in meta));
    if (missing.length) {
	console.warn(`  ! skipping ${filename} — post-meta missing: ${missing.join(', ')}`);
	return null;
    }
    meta.filename = filename;
    meta.draft = !!meta.draft; // optional field, defaults to false (published)
    return meta;
}

function escapeHtml(str) {
    return String(str)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;');
}

function buildTocHtml(posts) {
    const items = posts.map((post, i) => {
	const index = String(i + 1).padStart(2, '0');
	const tags = post.tags.map((t) => t.toUpperCase()).join(', ');
	return `        <li>
          <a class="toc__item" href="posts/${post.filename}">
            <span class="toc__index">${index}</span>
            <span class="toc__body">
              <h3 class="toc__post-title">${escapeHtml(post.title)}</h3>
              <p class="toc__meta">${escapeHtml(post.date.toUpperCase())} · ${escapeHtml(tags)}</p>
              <p class="toc__excerpt">
                ${escapeHtml(post.excerpt)}
              </p>
            </span>
          </a>
        </li>`;
    });
    return `<ul class="toc">\n${items.join('\n')}\n      </ul>`;
}

function main() {
    if (!fs.existsSync(POSTS_DIR)) {
	console.error(`No posts/ directory found at ${POSTS_DIR}`);
	process.exit(1);
    }

    const files = fs.readdirSync(POSTS_DIR)
	  .filter((f) => f.endsWith('.html') && f !== TEMPLATE_NAME);

    console.log(`Found ${files.length} post file(s):`);
    const allPosts = files
	  .map((f) => readPostMeta(path.join(POSTS_DIR, f), f))
	  .filter(Boolean);

    const drafts = allPosts.filter((p) => p.draft);
    const posts = allPosts.filter((p) => !p.draft);

    posts.sort((a, b) => (a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0));
    posts.forEach((p) => console.log(`  - ${p.sortDate}  ${p.title}`));
    if (drafts.length) {
	console.log(`Skipping ${drafts.length} draft(s) (not shown on homepage yet):`);
	drafts.forEach((p) => console.log(`  - ${p.sortDate}  ${p.title}  [draft]`));
    }

    const tocHtml = buildTocHtml(posts);

    let indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
    const startIdx = indexHtml.indexOf(START_MARKER);
    const endIdx = indexHtml.indexOf(END_MARKER);
    if (startIdx === -1 || endIdx === -1) {
	console.error(`Couldn't find TOC markers in index.html. Expected to find:\n  ${START_MARKER}\n  ${END_MARKER}`);
	process.exit(1);
    }

    const before = indexHtml.slice(0, startIdx + START_MARKER.length);
    const after = indexHtml.slice(endIdx);
    indexHtml = `${before}\n      ${tocHtml}\n      ${after}`;

    fs.writeFileSync(INDEX_PATH, indexHtml);
    console.log(`\nindex.html updated with ${posts.length} post(s), newest first.`);
}

main();
