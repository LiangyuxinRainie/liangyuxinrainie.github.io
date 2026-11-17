# Yuxin Liang's Academic Homepage

Source for [Yuxin Liang's academic homepage](https://liangyuxinrainie.github.io).
The site is a statically exported Next.js application adapted from the PRISM
academic homepage template.

## Editing content

Homepage and page content is stored in `content/`:

- `config.toml`: profile, site metadata, and navigation
- `about.toml`, `bio.md`, and `contact.md`: homepage sections
- `news.toml`: news items
- `publications.bib`: publications and selected-paper settings
- `teaching.toml`, `awards.toml`, and `services.toml`: academic activity pages
- `cv.md`: curriculum vitae


## Local development

Node.js 22 is required.

```bash
npm install
npm run dev
npm run build
```
