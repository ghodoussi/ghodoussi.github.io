## Add a new blog post through built-in editor:

1. Open `write-post.html` directly
2. Build the post (or copy an existing post and start editing it).
3. Save post file. Works best in Chrome or Edge, navigate into `posts/`
folder and save it there.
4. Save as draft if not ready to publish yet — the post file
exists in `posts/`, but won't appear on the homepage until accessed again,
unchecked "draft" option, save again, and rebuild.
5. Run `node build.js` to add it to the homepage list (skip while it's
still a draft).
6. Commit and push as usual:
```
git add . && git commit -m "Add post: your post title" && git push
```

## Add a new blog post from the command line

1. **Set up file** `node new-post.js "Post Title"` — answer the
prompts (tags, excerpt, and whether it's a draft) and it creates
`posts/post-title.html` from the template, with the title and
metadata already filled in.
2. **Edit** Open the file and replace the placeholder text. For
code cells, there are three kinds — see the comments in the template:
- **Live JavaScript cell** (`data-lang="js"`): runs instantly, no setup
- **Live Python cell** (`data-lang="python"`): runs via [Pyodide](https://pyodide.org),
- **Static cell** (`class="cell cell--static"`, no `data-lang`): just shows
code and output you write by hand.
3. **Publish to homepage**: `node build.js` — this reads every
non-draft post's metadata and regenerates the post list in `index.html`,
newest first, with the numbering recalculated. Nothing to edit by hand.
4. Commit and push as usual.

### How the auto-generated list works

Every post has a small metadata block right after its `<title>` tag:

```html
<script type="application/json" id="post-meta">
{
"title": "Post Title",
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

## Note to self for Pyodide

"Pyodide only supports pure-Python code and a limited set of packages
(numpy, pandas, etc. are available via `micropip`, but not arbitrary pip
packages). For anything beyond the standard library, check
https://pyodide.org/en/stable/usage/packages-in-pyodide.html first."