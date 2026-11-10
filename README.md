# BlogSpace — Responsive Blog Application

A responsive blogging application with an Express.js REST API and a static HTML/CSS/JavaScript frontend.

## Technologies

- HTML5
- CSS3
- JavaScript
- Node.js and Express.js
- JSON file persistence (`data/db.json`)
- bcrypt password hashing and JWT authentication

## Pages

1. Home
2. Login
3. Register
4. Dashboard
5. Create Blog

## Features

- Responsive design
- User registration and login through the backend API
- Form validation
- Blog creation and publishing
- Save drafts
- Search blog posts
- Filter by category
- Dashboard statistics
- Delete blog posts
- Server-side blog persistence; LocalStorage stores only the login token and current user

## Installation

1. Install Node.js 18 or newer.
2. Run `npm install` in this folder.
3. Set a private `JWT_SECRET` environment variable before starting the server.
4. Run `npm start` and open `http://localhost:3000`.
5. Register an account and start writing blogs.

For development with automatic server restarts, run `npm run dev`.

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
| `GET` | `/api/health` | Public | Check that the API is running |

Send protected requests with `Authorization: Bearer <token>`. Request and response bodies use JSON.

## Project Structure

blogspace_app/
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── create-blog.html
├── styles.css
├── app.js
└── README.md

## Configuration and storage

The server listens on port `3000` by default; set `PORT` to change it. Set `JWT_SECRET` to a long random value for each deployment. The fallback secret exists only to make local learning easier and must not be used in a deployed environment. Passwords are hashed with bcrypt. Users and posts are stored in `data/db.json`; this simple file store is for learning and single-process local use, and can be replaced by a database for production.
