# knnysfiles

next.js site for knnysfiles. motion handles animation, lenis handles smooth scroll. a built-in `/admin` handles content, inquiries and analytics.

## run

    npm install
    npm run dev

open http://localhost:3000 and http://localhost:3000/admin

`npm run dev` runs the cloudflare bindings locally (a database and photo storage in `.wrangler/state`), so the admin works on your machine. to log in locally, put `ADMIN_PASSWORD=something` in a `.dev.vars` file (see `.dev.vars.example`). that file is gitignored.

## where things live

- `src/content/site.ts`: the starting content and its types. the database is seeded from it the first time the site runs, and the site falls back to it if the database isn't connected. after that, edit content in `/admin`.
- `src/server/`: database, auth, analytics and inquiries code. tables create themselves on first use, so there is no migration step.
- `src/app/admin/` and `src/components/admin/`: the admin screens. api routes are in `src/app/api/admin/`.
- `src/app/media/`: serves photos uploaded in the admin from r2, and makes smaller copies on request (`?w=`).
- `src/track.ts` and `src/components/Tracker.tsx`: the visitor side of analytics.
- `src/components/SiteImage.tsx`: every image goes through here.
- `src/app/globals.css`: design tokens and styles from figma v3. admin styles are in `src/app/admin/admin.css`.

## the admin

sign in at `/admin` with the password.

- **overview**: visitors, page views, inquiries and conversion, a daily chart, where visitors come from, utm campaigns, folders opened, devices, countries, link clicks. no cookies. a visitor is a daily hash of address and browser, and the address is never stored. your own visits while signed in are left out, and visitors with do not track or global privacy control on are not counted.
- **inquiries**: everything from the book a shoot form, with status (new, replied, booked, done, lost), private notes, search and a reply button. each one records where the visitor came from.
- **content**: site text, home photo, about, folders and photos. upload, reorder, rename and delete. photos are shrunk in the browser before upload. changes go live when you hit save.

tag links for campaigns like `https://knnysfiles.com/?utm_source=instagram&utm_medium=bio&utm_campaign=launch` and they show up in overview and on any inquiry that comes from that visit.

## hosting on cloudflare

this deploys as a cloudflare worker through the opennext adapter. in the cloudflare dashboard, under workers & pages, create a worker from the github repo and use:

- build command: `npx opennextjs-cloudflare build`
- deploy command: `npx opennextjs-cloudflare deploy`
- root directory: `/`
- worker name: `knnysfiles-site`, which has to match `name` in `wrangler.jsonc`

then set up what the admin needs. wrangler creates the database on deploy. if it complains that it doesn't exist, make it once with `npx wrangler d1 create knnysfiles-db` and paste the database_id it prints into wrangler.jsonc.

**photo uploads need r2, which is off for now.** r2 has to be enabled on the cloudflare account first (free tier, card on file). then add this to `wrangler.jsonc` and deploy, and the upload buttons in the admin switch on by themselves:

    "r2_buckets": [{ "binding": "MEDIA", "bucket_name": "knnysfiles-media" }],

and add the admin password as a secret on the worker (dashboard: settings, variables and secrets, or `npx wrangler secret put ADMIN_PASSWORD`). pick a long one. five wrong tries locks an address out for ten minutes.

optional: `INQUIRY_WEBHOOK_URL` as a secret sends a copy of each inquiry to a webhook (slack, zapier, an email service). inquiries are always saved to the database either way.

test the cloudflare runtime locally with `npm run preview`.

## before launch

- open `/admin/content` and replace the bracketed placeholders: email, bio, photo details, folder descriptions. add real photos and covers.
- give every photo a description for screen readers. the editor counts the ones still missing.
- the three accounts (cloudflare, github, domain) should sit under the client, with david added as admin.
