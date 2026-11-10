const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.JWT_SECRET || "development-only-change-this-secret";
const DATA_FILE = path.join(__dirname, "data", "db.json");
const categories = ["Design", "Lifestyle", "Technology", "Travel", "Personal Growth", "Other"];

const starterPosts = [
  { id: "sample-1", title: "The Art of Slowing Down", category: "Lifestyle", excerpt: "Finding small moments of calm in a world that never stops moving.", content: "Sometimes the best way to move forward is to pause. A slower morning, a walk without a destination, or a few minutes with a book can help us notice what matters.", author: "Maya Johnson", date: "2026-10-18", status: "published", image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80" },
  { id: "sample-2", title: "Designing for People, Not Pixels", category: "Design", excerpt: "Good design starts with empathy, curiosity, and a willingness to listen.", content: "The most memorable designs are not just beautiful. They make a task clearer, a moment easier, or a person feel understood.", author: "Daniel Kim", date: "2026-10-15", status: "published", image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80" },
  { id: "sample-3", title: "Small Habits, Meaningful Change", category: "Personal Growth", excerpt: "Big transformations often begin with tiny promises we keep to ourselves.", content: "A habit does not have to be dramatic to matter. Five minutes of reading, a short walk, or writing one paragraph can become the foundation for something bigger.", author: "Sara Ali", date: "2026-10-12", status: "published", image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80" },
  { id: "sample-4", title: "What Learning to Code Taught Me", category: "Technology", excerpt: "Beyond syntax and screens, programming taught me how to approach problems.", content: "Learning to code is a practice in patience. Every bug is a question, every fix a lesson, and every small project a reason to keep going.", author: "Noah Williams", date: "2026-10-09", status: "published", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80" },
  { id: "sample-5", title: "A Weekend Away from the Noise", category: "Travel", excerpt: "Sometimes a change of scenery is all it takes to see things differently.", content: "A new place invites us to look again. You notice the light, the sounds, the people, and the little details that routine can make invisible.", author: "Alex Morgan", date: "2026-10-06", status: "published", image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80" },
];

async function readDb() {
  try { return JSON.parse(await fs.readFile(DATA_FILE, "utf8")); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    const db = { users: [], posts: starterPosts };
    await writeDb(db);
    return db;
  }
}
async function writeDb(db) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
}
function auth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in to continue." });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { return res.status(401).json({ error: "Your session has expired. Please log in again." }); }
}

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2) return res.status(400).json({ error: "Please enter your full name." });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 6) return res.status(400).json({ error: "Your password must contain at least 6 characters." });
    const db = await readDb();
    if (db.users.some(user => user.email === email)) return res.status(409).json({ error: "An account with this email already exists." });
    const user = { id: crypto.randomUUID(), name, email, passwordHash: await bcrypt.hash(password, 12) };
    db.users.push(user);
    await writeDb(db);
    const token = jwt.sign({ id: user.id, name, email }, SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user.id, name, email } });
  } catch (error) { next(error); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const db = await readDb();
    const user = db.users.find(account => account.email === email);
    if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.passwordHash))) return res.status(401).json({ error: "Invalid email or password. Please check your details or register first." });
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) { next(error); }
});

app.get("/api/posts", async (_req, res, next) => {
  try { const db = await readDb(); res.json(db.posts.filter(post => post.status === "published").sort((a, b) => b.date.localeCompare(a.date))); }
  catch (error) { next(error); }
});
app.get("/api/posts/mine", auth, async (req, res, next) => {
  try { const db = await readDb(); res.json(db.posts.filter(post => post.authorId === req.user.id)); }
  catch (error) { next(error); }
});
app.get("/api/posts/:id", async (req, res, next) => {
  try {
    const db = await readDb();
    const post = db.posts.find(item => item.id === req.params.id && item.status === "published");
    if (!post) return res.status(404).json({ error: "Story not found." });
    res.json(post);
  } catch (error) { next(error); }
});
app.post("/api/posts", auth, async (req, res, next) => {
  try {
    const { title, category, excerpt = "", content, status = "published", image = "" } = req.body;
    if (!String(title || "").trim() || !categories.includes(category) || String(content || "").trim().length < 20) return res.status(400).json({ error: "Enter a title, choose a category, and write at least 20 characters." });
    if (!["published", "draft"].includes(status)) return res.status(400).json({ error: "Status must be published or draft." });
    const db = await readDb();
    const post = { id: crypto.randomUUID(), title: String(title).trim(), category, excerpt: String(excerpt).trim() || String(content).trim().slice(0, 150), content: String(content).trim(), author: req.user.name, authorEmail: req.user.email, authorId: req.user.id, date: new Date().toISOString().slice(0, 10), status, image };
    db.posts.unshift(post);
    await writeDb(db);
    res.status(201).json(post);
  } catch (error) { next(error); }
});
app.delete("/api/posts/:id", auth, async (req, res, next) => {
  try {
    const db = await readDb();
    const index = db.posts.findIndex(post => post.id === req.params.id && post.authorId === req.user.id);
    if (index < 0) return res.status(404).json({ error: "Story not found." });
    db.posts.splice(index, 1);
    await writeDb(db);
    res.status(204).end();
  } catch (error) { next(error); }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found." }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});
app.listen(PORT, () => console.log(`BlogSpace is running at http://localhost:${PORT}`));
