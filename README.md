# Your personal site

A plain HTML/CSS/JS site: no build step, no framework. Open `index.html`
directly in a browser to preview it, or push the whole folder to a static
host (GitHub Pages, Netlify, Vercel all work with zero config).

## Structure

```
index.html            landing page + blog post listing
styles.css             all styling
script.js              scroll-fade effect + notebook cell engine
posts/
  first-post.html      example post (live JS cell, live Python cell, static cell)
  post-template.html   copy this to start a new post
```

## Customize the landing page

Open `index.html` and edit:
- Your name, class year, and bio text in the `.cover` section
- The LinkedIn URL in the `<a class="icon-link" href="https://www.linkedin.com/in/your-handle" ...>` line
- The email and GitHub links (or delete those `<a class="icon-link">` blocks if you don't want them)

## Add a new blog post

1. Copy `posts/post-template.html` to `posts/your-slug.html`
2. Fill in the title, date/tags line, and your writing
3. For code cells, there are three kinds — see the comments in the template:
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
4. Add a new `<li class="toc__item">` entry in `index.html`'s post list,
   pointing at your new file, with the next index number.

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
