require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET =
  process.env.JWT_SECRET || "development-only-change-this-secret";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const categories = [
  "Design",
  "Lifestyle",
  "Technology",
  "Travel",
  "Personal Growth",
  "Other",
];
const postColumns =
  "id,title,category,excerpt,content,author,author_email,author_id,date,status,image";
const starterPosts = [
  {
    id: "sample-1",
    title: "The Art of Slowing Down",
    category: "Lifestyle",
    excerpt:
      "Finding small moments of calm in a world that never stops moving.",
    content:
      "Sometimes the best way to move forward is to pause. A slower morning, a walk without a destination, or a few minutes with a book can help us notice what matters.",
    author: "Maya Johnson",
    date: "2026-10-18",
    status: "published",
    image:
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "sample-2",
    title: "Designing for People, Not Pixels",
    category: "Design",
    excerpt:
      "Good design starts with empathy, curiosity, and a willingness to listen.",
    content:
      "The most memorable designs are not just beautiful. They make a task clearer, a moment easier, or a person feel understood.",
    author: "Daniel Kim",
    date: "2026-10-15",
    status: "published",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "sample-3",
    title: "Small Habits, Meaningful Change",
    category: "Personal Growth",
    excerpt:
      "Big transformations often begin with tiny promises we keep to ourselves.",
    content:
      "A habit does not have to be dramatic to matter. Five minutes of reading, a short walk, or writing one paragraph can become the foundation for something bigger.",
    author: "Sara Ali",
    date: "2026-10-12",
    status: "published",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "sample-4",
    title: "What Learning to Code Taught Me",
    category: "Technology",
    excerpt:
      "Beyond syntax and screens, programming taught me how to approach problems.",
    content:
      "Learning to code is a practice in patience. Every bug is a question, every fix a lesson, and every small project a reason to keep going.",
    author: "Noah Williams",
    date: "2026-10-09",
    status: "published",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "sample-5",
    title: "A Weekend Away from the Noise",
    category: "Travel",
    excerpt:
      "Sometimes a change of scenery is all it takes to see things differently.",
    content:
      "A new place invites us to look again. You notice the light, the sounds, the people, and the little details that routine can make invisible.",
    author: "Alex Morgan",
    date: "2026-10-06",
    status: "published",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80",
  },
];

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    "Missing Supabase configuration. Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY in .env.",
  );
  process.exit(1);
}

// This secret-key client is server-only. It bypasses RLS, so every private
// query below is explicitly scoped to the signed-in user from the verified JWT.
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

function asyncRoute(handler) {
  return (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);
}

async function unwrap(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

function formatPost(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt || "",
    content: row.content,
    author: row.author,
    authorEmail: row.author_email || "",
    authorId: row.author_id,
    date: row.date,
    status: row.status,
    image: row.image || "",
  };
}

function auth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  if (!token)
    return res.status(401).json({ error: "Please log in to continue." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res
      .status(401)
      .json({ error: "Your session has expired. Please log in again." });
  }
}

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get(
  "/api/health",
  asyncRoute(async (_req, res) => {
    await unwrap(supabase.from("blog_posts").select("id").limit(1));
    res.json({ status: "ok", database: "connected" });
  }),
);

app.post(
  "/api/auth/register",
  asyncRoute(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2 || name.length > 80)
      return res.status(400).json({ error: "Please enter your full name." });
    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 6 || password.length > 72)
      return res
        .status(400)
        .json({
          error: "Your password must contain between 6 and 72 characters.",
        });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (
      error &&
      /already (registered|exists)|user_already_exists/i.test(
        `${error.code} ${error.message}`,
      )
    ) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    }
    if (error) throw error;

    const user = {
      id: data.user.id,
      name: data.user.user_metadata?.name || name,
      email: data.user.email,
    };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user });
  }),
);

app.post(
  "/api/auth/login",
  asyncRoute(async (req, res) => {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user)
      return res
        .status(401)
        .json({
          error:
            "Invalid email or password. Please check your details or register first.",
        });
    const user = {
      id: data.user.id,
      name: data.user.user_metadata?.name || email.split("@")[0],
      email: data.user.email,
    };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  }),
);

app.get("/api/auth/me", auth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

app.get(
  "/api/posts",
  asyncRoute(async (_req, res) => {
    const existing = await unwrap(
      supabase.from("blog_posts").select("id").limit(1),
    );
    if (existing.length === 0) {
      const seeds = starterPosts.map(({ id: _sampleId, ...post }) => post);
      await unwrap(supabase.from("blog_posts").insert(seeds));
    }
    const rows = await unwrap(
      supabase
        .from("blog_posts")
        .select(postColumns)
        .eq("status", "published")
        .order("date", { ascending: false }),
    );
    res.json(rows.map(formatPost));
  }),
);

app.get(
  "/api/posts/mine",
  auth,
  asyncRoute(async (req, res) => {
    const rows = await unwrap(
      supabase
        .from("blog_posts")
        .select(postColumns)
        .eq("author_id", req.user.id)
        .order("date", { ascending: false }),
    );
    res.json(rows.map(formatPost));
  }),
);

app.get(
  "/api/posts/:id",
  asyncRoute(async (req, res) => {
    const row = await unwrap(
      supabase
        .from("blog_posts")
        .select(postColumns)
        .eq("id", req.params.id)
        .eq("status", "published")
        .maybeSingle(),
    );
    if (!row) return res.status(404).json({ error: "Story not found." });
    res.json(formatPost(row));
  }),
);

app.post(
  "/api/posts",
  auth,
  asyncRoute(async (req, res) => {
    const {
      title,
      category,
      excerpt = "",
      content,
      status = "published",
      image = "",
    } = req.body;
    const cleanTitle = String(title || "").trim();
    const cleanContent = String(content || "").trim();
    if (
      !cleanTitle ||
      cleanTitle.length > 100 ||
      !categories.includes(category) ||
      cleanContent.length < 20 ||
      cleanContent.length > 100000
    ) {
      return res
        .status(400)
        .json({
          error:
            "Enter a title, choose a category, and write between 20 and 100,000 characters.",
        });
    }
    if (!["published", "draft"].includes(status))
      return res
        .status(400)
        .json({ error: "Status must be published or draft." });

    const row = await unwrap(
      supabase
        .from("blog_posts")
        .insert({
          title: cleanTitle,
          category,
          excerpt:
            String(excerpt).trim().slice(0, 180) || cleanContent.slice(0, 150),
          content: cleanContent,
          author: req.user.name,
          author_email: req.user.email,
          author_id: req.user.id,
          date: new Date().toISOString().slice(0, 10),
          status,
          image: typeof image === "string" ? image.slice(0, 2000) : "",
        })
        .select(postColumns)
        .single(),
    );
    res.status(201).json(formatPost(row));
  }),
);

app.put(
  "/api/posts/:id",
  auth,
  asyncRoute(async (req, res) => {
    const {
      title,
      category,
      excerpt = "",
      content,
      status = "published",
      image = "",
    } = req.body;
    const cleanTitle = String(title || "").trim();
    const cleanContent = String(content || "").trim();
    if (
      !cleanTitle ||
      cleanTitle.length > 100 ||
      !categories.includes(category) ||
      cleanContent.length < 20 ||
      cleanContent.length > 100000
    ) {
      return res
        .status(400)
        .json({
          error:
            "Enter a title, choose a category, and write between 20 and 100,000 characters.",
        });
    }
    if (!["published", "draft"].includes(status))
      return res
        .status(400)
        .json({ error: "Status must be published or draft." });

    const row = await unwrap(
      supabase
        .from("blog_posts")
        .update({
          title: cleanTitle,
          category,
          excerpt:
            String(excerpt).trim().slice(0, 180) || cleanContent.slice(0, 150),
          content: cleanContent,
          status,
          image: typeof image === "string" ? image.slice(0, 2000) : "",
        })
        .eq("id", req.params.id)
        .eq("author_id", req.user.id)
        .select(postColumns)
        .maybeSingle(),
    );
    if (!row)
      return res
        .status(404)
        .json({
          error: "Story not found or you do not have permission to edit it.",
        });
    res.json(formatPost(row));
  }),
);

app.delete(
  "/api/posts/:id",
  auth,
  asyncRoute(async (req, res) => {
    const deleted = await unwrap(
      supabase
        .from("blog_posts")
        .delete()
        .eq("id", req.params.id)
        .eq("author_id", req.user.id)
        .select("id"),
    );
    if (!deleted.length)
      return res.status(404).json({ error: "Story not found." });
    res.status(204).end();
  }),
);

app.use("/api", (_req, res) =>
  res.status(404).json({ error: "API route not found." }),
);
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === "PGRST205" || error.code === "42P01") {
    return res
      .status(503)
      .json({
        error:
          "Supabase tables are missing. Run supabase/schema.sql in your project's SQL Editor, then reload.",
      });
  }
  if (error.code === "PGRST204" || error.code === "42703") {
    return res
      .status(503)
      .json({
        error:
          "Supabase blog_posts is missing required columns. Run the updated supabase/schema.sql in your project's SQL Editor, then reload.",
      });
  }
  if (
    error.code === "42501" ||
    error.code === "PGRST301" ||
    error.status === 401 ||
    error.status === 403
  ) {
    return res
      .status(503)
      .json({
        error:
          "Supabase denied this request. Check SUPABASE_URL, SUPABASE_SECRET_KEY, and the table grants in supabase/schema.sql.",
      });
  }
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(PORT, () =>
  console.log(`BlogSpace is running at http://localhost:${PORT}`),
);
