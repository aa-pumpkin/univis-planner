# UnivIS import

CAU Kiel exposes public course data through UnivIS' PRG XML interface. No credentials are required.

```text
https://univis.uni-kiel.de/prg?search=lectures&department=080110000&show=xml&sem=2026s
```

`080110000` is the public organisation number of `Institut für Informatik`.

The UnivIS server does not send an `Access-Control-Allow-Origin` header. A browser deployed on Cloudflare Pages therefore cannot request it directly. `npm run data:update` downloads and normalizes the XML into `public/data/`. The deployed app remains completely static.

`scripts/update-active-terms.mjs` maintains a rolling semester window:

- April–September: current summer semester and upcoming winter semester.
- October–March: current winter semester and upcoming summer semester.
- Odd Fachsemester use the winter dataset; even Fachsemester use the summer dataset.

`.github/workflows/update-univis.yml` runs every day at 03:17 UTC. It downloads both relevant datasets, runs tests and the production build, and commits only verified changes. When the repository is connected to Cloudflare Pages, that commit automatically triggers a new deployment. Enable **Read and write permissions** for GitHub Actions if the repository organization overrides the workflow permission.

The normalized dataset intentionally stays separate from curated module mappings. `parent-lv` and `import_parent_id` help associate exercises with lectures, but titles and manual mappings will still be needed for ambiguous records.
