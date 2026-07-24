# Your personal site

A plain HTML/CSS/JS site: no framework, nothing to `npm install`. Visitors'
browsers just get static files. Open `index.html` directly to preview it,
or push the whole folder to a static host (GitHub Pages, Netlify, Vercel
all work with zero config).

There are three small local tools — nothing here runs on the live site,
they're just for you to use on your own machine before you push:

- `new-post.js` — command-line: scaffolds a post file, you write the HTML by hand
- `write-post.html` — a browser-based, no-coding editor: open it in your browser, write with buttons and text fields, click Save
- `build.js` — regenerates index.html's post list — run after adding/editing/removing a post

## Structure

```
index.html            landing page + auto-generated blog post listing
styles.css             all styling
script.js              scroll-fade effect + notebook cell engine
build.js               regenerates index.html's post list — run after adding/editing a post
new-post.js             scaffolds a new post file from the command line
write-post.html         browser-based post editor — no coding required
posts/
  first-post.html      example post (live JS cell, live Python cell, static cell)
  post-template.html   the template new-post.js copies from
```

## Customize the landing page

Open `index.html` and edit:
- Your name, class year, and bio text in the `.cover` section
- The LinkedIn URL in the `<a class="icon-link" href="https://www.linkedin.com/in/your-handle" ...>` line
- The email and GitHub links (or delete those `<a class="icon-link">` blocks if you don't want them)

## Add a new blog post — no coding required

1. Open `write-post.html` directly in your browser (double-click it, or
   drag it into a browser tab).
2. Fill in the title, tags, and excerpt, then use "+ Paragraph", "+ Heading",
   and "+ Code cell" to build the post. The preview pane on the right shows
   how it'll actually look, using the site's real styles.
3. Click **Save post file**. In Chrome or Edge, this opens a save dialog —
   navigate into your `posts/` folder and save it there. (In other browsers,
   or if you cancel that dialog, it just downloads the file instead — move
   it into `posts/` yourself.)
4. Check "Save as draft" if you're not ready to publish yet — the post file
   exists in `posts/`, but won't appear on the homepage until you come back,
   uncheck it, save again, and rebuild.
5. Run `node build.js` to add it to the homepage list (skip this while it's
   still a draft).
6. Commit and push as usual:
   ```
   git add . && git commit -m "Add post: your post title" && git push
   ```

To keep working on a post later, use the "Continue editing an existing
post" file picker at the top of `write-post.html` — pick the file from your
`posts/` folder and it loads your title, tags, excerpt, and content back
into the editor.

## Add a new blog post — from the command line

1. **Scaffold it**: `node new-post.js "Your Post Title"` — answer the
   prompts (tags, excerpt, and whether it's a draft) and it creates
   `posts/your-post-title.html` from the template, with the title and
   metadata already filled in.
2. **Write it**: open the new file and replace the placeholder prose. For
   code cells, there are three kinds — see the comments in the template:
   - **Live JavaScript cell** (`data-lang="js"`): runs instantly, no setup
   - **Live Python cell** (`data-lang="python"`): runs via [Pyodide](https://pyodide.org),
     a real Python interpreter compiled to WebAssembly. It lazy-loads only when
     a reader clicks "Run" on a Python cell, so it never slows down pages that
     don't have one. First run on a page takes a few seconds to load; after
     that it's fast.
   - **Static cell** (`class="cell cell--static"`, no `data-lang`): just shows
     code and output you write by hand — no Run button, nothing executes.
     Good for showing output that took too long to compute live, or isn't
     safely re-runnable.
3. **Publish it to the homepage**: `node build.js` — this reads every
   non-draft post's metadata and regenerates the post list in `index.html`,
   newest first, with the numbering recalculated. Nothing to edit by hand.
4. Commit and push as usual.

### How the auto-generated list works

Every post has a small metadata block right after its `<title>` tag:

```html
<script type="application/json" id="post-meta">
{
  "title": "Your Post Title",
  "date": "July 2026",
  "sortDate": "2026-07",
  "tags": ["Python", "JavaScript"],
  "excerpt": "One or two sentences shown on the homepage.",
  "draft": false
}
</script>
```

Both `new-post.js` and `write-post.html` fill this in for you automatically.
`build.js` reads it back out of every file in `posts/`, skips anything
marked `"draft": true`, sorts the rest by `sortDate` (newest first), and
rewrites the `<ul class="toc">` block in `index.html` between two
`<!-- AUTO-GENERATED TOC -->` comments — everything else in `index.html` is
left alone. If you ever add a post by hand instead, just copy that metadata
block into it yourself so `build.js` can find it.

This all runs locally (no packages to install for the Node scripts; no
server needed for `write-post.html`, since saving happens straight from
your browser) — none of it runs in visitors' browsers, so there's no build
step or authoring tool shipped to the live site.

A couple of things worth knowing about `write-post.html`:
- The "Save post file" dialog (letting you save directly into `posts/`)
  needs a Chromium-based browser (Chrome, Edge, Brave). Firefox and Safari
  will just download the file instead — that's fine, just drag it into
  `posts/` afterward.
- Paragraph text supports blank lines between paragraphs and `` `backtick` ``
  for inline code — no other formatting (no bold/italic/links) is
  supported, to keep the round-trip between editor and file reliable.

## Notes on the Python cells

Pyodide only supports pure-Python code and a limited set of packages
(numpy, pandas, etc. are available via `micropip`, but not arbitrary pip
packages). For anything beyond the standard library, check
https://pyodide.org/en/stable/usage/packages-in-pyodide.html first.

## Hosting on GitHub Pages (free)

1. Create a new GitHub repo, e.g. `yourname.github.io`
2. Push this folder's contents to the repo's root
3. In the repo's Settings → Pages, set the source to the `main` branch, root folder
4. Your site will be live at `https://yourname.github.io` within a minute or two
