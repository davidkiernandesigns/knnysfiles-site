# knnysfiles

next.js site for knnysfiles. motion handles animation, lenis handles smooth scroll.

## run

    npm install
    npm run dev

open http://localhost:3000

## where things live

- `src/content/site.ts`: all copy, projects and photos, shaped like the planned sanity documents. counts come from each project's photos.
- `src/components/SiteImage.tsx`: every image goes through here, so moving to sanity's image cdn is one small swap.
- `src/app/globals.css`: design tokens and styles from figma v3.
- `public/assets/`: images and cursors. add a photo by setting `image` on it in `site.ts`.

## hosting on cloudflare

this deploys as a cloudflare worker through the opennext adapter. in the cloudflare dashboard, under workers & pages, create a worker from the github repo and use:

- build command: `npx opennextjs-cloudflare build`
- deploy command: `npx opennextjs-cloudflare deploy`
- worker name: `knnysfiles-site`, which has to match `name` in `wrangler.jsonc`

add `INQUIRY_WEBHOOK_URL` as a secret on the worker. test the cloudflare runtime locally with `npm run preview`.

## before launch

- set `INQUIRY_WEBHOOK_URL` (see `.env.example`). without it, the form shows an error in production. in dev it logs to the terminal and shows the sent window.
- replace the bracketed placeholders in `site.ts`: email, bio, counts, photo details, project descriptions.
- give each project its own cover. all four use the wedding photo for now.
