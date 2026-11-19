# BlogSpace

A responsive blogging app with an Express.js API, a static HTML/CSS/JavaScript frontend, and Supabase Postgres storage.

## Setup

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). It creates or upgrades the posts table (including missing columns), enables row-level security, denies direct browser table access, and inserts five example stories. If the posts table exists but is empty, the API also seeds the stories on first load.
3. Install Node.js 18 or newer and run `npm install` in this folder.
4. Copy `.env.example` to `.env`. Fill in `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` from the Supabase project API settings, and set a private random `JWT_SECRET`.
5. Run `npm start` and open `http://localhost:3000`.

For development with automatic server restarts, run `npm run dev`.

Keep the Supabase secret key and JWT secret on the server. Never add them to frontend JavaScript or commit `.env`. Supabase Auth manages account passwords; the app no longer depends on a custom `blog_users` table. Supabase secret keys bypass RLS, so the API verifies JWTs and scopes private post listing/deletion to the authenticated author. See [Supabase user creation](https://supabase.com/docs/reference/javascript/auth-admin-createuser) and [Supabase API key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

## Pages

- Home: search and filter published posts loaded from Supabase.
- Login and Register: backend authentication.
- Dashboard: view and delete your own posts.
- Create Blog: publish a post or save a draft.
- Story detail: click a story card to read a full published story.

## REST API

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create an account and return a token |
| `POST` | `/api/auth/login` | Public | Sign in and return a token |
| `GET` | `/api/posts` | Public | List published posts |
| `GET` | `/api/posts/:id` | Public | Read one published post |
| `GET` | `/api/posts/mine` | Token required | List the signed-in author's posts |
| `POST` | `/api/posts` | Token required | Create a published post or draft |
| `DELETE` | `/api/posts/:id` | Token required | Delete your own post |
| `GET` | `/api/health` | Public | Check the Supabase connection |

Protected requests use `Authorization: Bearer <token>`. Requests and responses use JSON.

## Environment

See `.env.example`. `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` are required. `PORT` defaults to `3000`. For production, always set a unique, long `JWT_SECRET`.
