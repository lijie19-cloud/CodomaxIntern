# BlogSpace

**A place to read, write, and share stories.** BlogSpace is a full stack blogging application with a responsive web interface, an Express REST API, Supabase Auth, and Supabase Postgres. Readers can discover stories, while writers can publish and manage posts, connect with readers, and build a profile.

**Live application:** `https://<your-deployed-app-url>`

_Replace this placeholder with your deployment URL when the app is live._

**Built with:** Node.js · Express · Supabase · HTML · CSS · JavaScript

## Contents

- [Features](#features)
- [Technology](#technology)
- [Local development](#local-development)
- [Configuration and security](#configuration-and-security)
- [Application pages](#application-pages)
- [API reference](#api-reference)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Features

- Responsive home, authentication, dashboard, editor, and story detail pages
- User registration and login through Supabase Auth
- Signed, expiring JWT sessions for protected API requests
- Create, read, update, and delete operations for blog posts
- Private dashboard scoped to the signed-in writer
- Profile photos and uploaded story cover images (JPEG, PNG, WebP, or GIF; up to 5 MB)
- Persistent likes and comments on published stories
- Published story search and category filters
- Sample stories in the Supabase migration, with a local display fallback if the API is unavailable
- Server-side validation and ownership checks for post changes

## Technology

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Node.js and Express
- **Database and identity:** Supabase Postgres and Supabase Auth
- **Image storage:** Supabase Storage

## Requirements

- Node.js 18 or newer
- npm
- A Supabase project

## Local development

1. Create a Supabase project.
2. Open the Supabase SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql). This creates or upgrades the posts table, creates likes and comments tables, configures the public image bucket, applies the required grants and row-level security policies, and inserts sample stories. Existing posts are preserved. Re-run this script after upgrading an older database so all required columns and tables exist.
3. Copy `.env.example` to `.env` and fill in your project values:

   ```env
   PORT=3000
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   SUPABASE_SECRET_KEY=your-supabase-secret-key
   JWT_SECRET=your-long-random-secret
   ```

   Find the Supabase URL and keys in the project API settings. Generate a unique random value for `JWT_SECRET` (for example, with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). The secret key and JWT secret are server-only. Never place them in browser code or commit `.env`.

4. Install dependencies and start the server:

   ```bash
   npm install
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000). The app and API are served from the same Express process.

For development with automatic server restarts, use `npm run dev`. Restart the server after changing backend code when running `npm start`; an already running Node process does not load changed routes.

## Configuration and security

The backend requires `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY`. `PORT` defaults to `3000`. Set a unique `JWT_SECRET` in every environment; the built-in development fallback is not suitable for deployment.

Supabase Auth stores and verifies passwords. The server uses its secret key for database access, so it verifies the app JWT and filters private post reads, edits, and deletes by the authenticated user's ID. Keep the Supabase secret key and `JWT_SECRET` out of frontend files and source control. Supabase's secret key bypasses row-level security; the API's authorization checks are therefore essential.

Account registration currently confirms the email from the server so a new account can sign in immediately. Configure email verification before changing that behavior for a public production launch.

## Application pages

| Page | File | Purpose |
| --- | --- | --- |
| Home | `index.html` | Browse, search, and filter published stories |
| Register | `register.html` | Create an account |
| Login | `login.html` | Sign in |
| Dashboard | `dashboard.html` | View and manage your own stories and profile |
| Story editor | `create-blog.html` | Create a story or edit an existing one |
| Story detail | `story.html` | Read an individual published story |

## API reference

Protected routes require `Authorization: Bearer <token>`. Requests and responses use JSON unless the response is `204 No Content`.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register and return a session token |
| `POST` | `/api/auth/login` | Public | Sign in and return a session token |
| `GET` | `/api/auth/me` | Token required | Validate the session and return the profile |
| `GET` | `/api/posts` | Public | List published stories; seed samples if the table is empty |
| `GET` | `/api/posts/:id` | Public | Read one published story |
| `GET` | `/api/posts/mine` | Token required | List the signed-in writer's posts and drafts |
| `POST` | `/api/posts` | Token required | Create a published story or draft |
| `PUT` | `/api/posts/:id` | Token required | Update a story owned by the signed-in writer |
| `DELETE` | `/api/posts/:id` | Token required | Delete a story owned by the signed-in writer |
| `POST` | `/api/uploads` | Token required | Upload a profile or story image to Supabase Storage |
| `GET` | `/api/posts/:id/engagement` | Public | Get the like count and current user's like state |
| `POST` | `/api/posts/:id/likes` | Token required | Toggle the signed-in user's like |
| `GET` | `/api/posts/:id/comments` | Public | List comments on a published story |
| `POST` | `/api/posts/:id/comments` | Token required | Add a comment to a published story |
| `GET` | `/api/health` | Public | Check the Supabase database connection |

Post fields are `title`, `category`, `excerpt`, `content`, `status`, and `image`. Categories are Design, Lifestyle, Technology, Travel, Personal Growth, and Other. Status is `published` or `draft`.

Image uploads use an authenticated JSON request with a base64 `dataUrl` and `purpose` (`profile` or `post`). The API validates image type and size before uploading. Profile image URLs are saved in Supabase Auth metadata and included in the refreshed app token. Likes require login and are unique per writer and story. Comments are public to read and require login to post.

For an existing installation whose likes or comments fail with a foreign-key error on `user_id`, run [`supabase/fix-social-user-references.sql`](supabase/fix-social-user-references.sql) in the Supabase SQL Editor. The API verifies the signed BlogSpace JWT; legacy app sessions do not necessarily have a matching row in `auth.users`.

## Deployment

Deploy BlogSpace as a Node.js web service because Express serves both the frontend and REST API. Configure the environment variables listed in `.env.example`, set the start command to `npm start`, and let the host provide `PORT`. Run `supabase/schema.sql` against the production Supabase project before serving traffic. For an existing database with social-feature foreign key errors, also run `supabase/fix-social-user-references.sql`. Keep the Supabase secret key and JWT secret in the hosting provider's encrypted environment settings.

After deployment, check `/api/health` and confirm registration, login, post creation, editing, deletion, likes, comments, image uploads, and the mobile layout on the deployed URL. Replace the live application placeholder at the top of this README with the final public URL.

## Project structure

```text
blog-app/
├── app.js                 # Browser interactions and API calls
├── server.js              # Express server, REST API, and auth middleware
├── styles.css             # Shared styles and responsive breakpoints
├── *.html                 # Static app pages
├── supabase/schema.sql    # Database schema, security grants, and sample data
├── .env.example           # Environment variable template
└── package.json           # Scripts and dependencies
```

## Troubleshooting

- **Missing table or column errors:** Run the current `supabase/schema.sql` in the correct Supabase project's SQL Editor, then restart the app and check `/api/health`.
- **Author photo column has not been migrated yet:** Story reads fall back to the existing columns so saved stories remain visible. Run the current schema to enable stored writer photos, Storage uploads, likes, and comments.
- **`API route not found` after an API change:** Stop the old server process and run `npm start` again so Express loads the updated routes.
- **Stories show a sample-data notice:** The browser could not load the API or Supabase. Check that the server is running, the `.env` values belong to the same Supabase project, and `/api/health` reports a connected database.
- **Login fails:** Register the account first, then verify that the Supabase project URL and keys in `.env` are correct.
