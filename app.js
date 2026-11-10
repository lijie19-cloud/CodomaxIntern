const TOKEN_KEY = "blogspace_token_v1";
const USER_KEY = "blogspace_user_v1";
const imageByCategory = {
  Design: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
  Lifestyle: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80",
  Technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  Travel: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80",
  "Personal Growth": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
  Other: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
};

function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
}
function setMessage(id, message, type = "error") {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}
function escapeHTML(value = "") {
  const replacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, character => replacements[character]);
}
function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function wordCount(text) { return text.trim() ? text.trim().split(/\s+/).length : 0; }
function getImage(post) { return post.image || imageByCategory[post.category] || imageByCategory.Other; }
async function api(url, options = {}) {
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(localStorage.getItem(TOKEN_KEY) ? { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` } : {}), ...options.headers };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && url !== "/api/auth/login" && url !== "/api/auth/register") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    throw new Error(body.error || "Request failed. Please try again.");
  }
  return body;
}
function saveSession(session) {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}
function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function renderHome() {
  const grid = document.getElementById("blogGrid");
  if (!grid) return;
  const search = document.getElementById("searchInput");
  const filters = [...document.querySelectorAll(".filter-pill")];
  let category = "All";
  let posts = [];
  try { posts = await api("/api/posts"); }
  catch (error) { grid.innerHTML = `<p class="form-message error">${escapeHTML(error.message)} Start the server with <code>npm start</code>.</p>`; return; }
  function display() {
    const query = (search?.value || "").trim().toLowerCase();
    const filtered = posts.filter(post => (category === "All" || post.category === category) && [post.title, post.category, post.excerpt, post.author].join(" ").toLowerCase().includes(query));
    grid.innerHTML = filtered.map(post => `<a class="blog-card" href="story.html?id=${encodeURIComponent(post.id)}" aria-label="Read ${escapeHTML(post.title)}"><div class="blog-card-image"><img src="${escapeHTML(getImage(post))}" alt="" loading="lazy"><span class="card-category">${escapeHTML(post.category.toUpperCase())}</span></div><div class="blog-card-body"><span class="eyebrow">${formatDate(post.date)}</span><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.excerpt || `${post.content.slice(0, 115)}...`)}</p><div class="card-meta"><span>By <strong>${escapeHTML(post.author)}</strong></span><span class="card-read" aria-hidden="true">↗</span></div></div></a>`).join("");
    document.getElementById("emptyState")?.classList.toggle("hidden", filtered.length > 0);
  }
  search?.addEventListener("input", display);
  filters.forEach(button => button.addEventListener("click", () => {
    category = button.dataset.category;
    filters.forEach(item => item.classList.toggle("active", item === button));
    display();
  }));
  display();
}

function renderAuth() {
  document.getElementById("registerForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;
    if (password !== document.getElementById("confirmPassword").value) return setMessage("registerMessage", "Your passwords do not match.");
    try {
      const session = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
      saveSession(session);
      setMessage("registerMessage", "Account created successfully! Opening dashboard...", "success");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
    } catch (error) { setMessage("registerMessage", error.message); }
  });
  document.getElementById("loginForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    try {
      const session = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      saveSession(session);
      setMessage("loginMessage", "Login successful! Opening your dashboard...", "success");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
    } catch (error) { setMessage("loginMessage", error.message); }
  });
  document.getElementById("logoutButton")?.addEventListener("click", () => { clearSession(); window.location.href = "index.html"; });
}

async function renderDashboard() {
  const list = document.getElementById("dashboardPosts");
  if (!list) return;
  const user = getUser();
  if (!user || !localStorage.getItem(TOKEN_KEY)) { window.location.href = "login.html"; return; }
  document.getElementById("userChip").textContent = user.name;
  try {
    const posts = await api("/api/posts/mine");
    const published = posts.filter(post => post.status === "published").length;
    document.getElementById("totalPosts").textContent = posts.length;
    document.getElementById("publishedPosts").textContent = published;
    document.getElementById("draftPosts").textContent = posts.length - published;
    document.getElementById("dashboardEmpty")?.classList.toggle("hidden", posts.length > 0);
    list.innerHTML = posts.map(post => `<article class="dashboard-post"><img class="post-thumb" src="${escapeHTML(getImage(post))}" alt="${escapeHTML(post.title)}"><div class="post-info"><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.category)} · ${formatDate(post.date)}</p></div><span class="status-badge ${post.status === "draft" ? "draft" : ""}">${post.status === "draft" ? "Draft" : "Published"}</span><button class="post-delete" data-delete="${escapeHTML(post.id)}" aria-label="Delete ${escapeHTML(post.title)}" title="Delete story">×</button></article>`).join("");
    list.querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete this story?")) return;
      try { await api(`/api/posts/${encodeURIComponent(button.dataset.delete)}`, { method: "DELETE" }); await renderDashboard(); }
      catch (error) { alert(error.message); }
    }));
  } catch (error) { setMessage("dashboardMessage", error.message); }
}

async function renderStory() {
  const container = document.getElementById("storyDetail");
  if (!container) return;
  const postId = new URLSearchParams(window.location.search).get("id");
  if (!postId) { container.innerHTML = '<p class="form-message error">Story not found.</p>'; return; }
  try {
    const post = await api(`/api/posts/${encodeURIComponent(postId)}`);
    document.title = `${post.title} | BlogSpace`;
    container.innerHTML = `<article class="story-article"><img class="story-cover" src="${escapeHTML(getImage(post))}" alt=""><div class="story-copy"><a class="text-link story-back" href="index.html#latest">← All stories</a><span class="card-category story-category">${escapeHTML(post.category.toUpperCase())}</span><h1>${escapeHTML(post.title)}</h1><div class="story-byline">By <strong>${escapeHTML(post.author)}</strong><span aria-hidden="true">·</span><time datetime="${escapeHTML(post.date)}">${formatDate(post.date)}</time></div>${post.excerpt ? `<p class="story-excerpt">${escapeHTML(post.excerpt)}</p>` : ""}<div class="story-content">${escapeHTML(post.content).replace(/\n/g, "<br>")}</div></div></article>`;
  } catch (error) { container.innerHTML = `<p class="form-message error">${escapeHTML(error.message)} <a href="index.html#latest">Return to stories</a></p>`; }
}

function setupEditor() {
  const form = document.getElementById("createBlogForm");
  if (!form) return;
  const content = document.getElementById("blogContent");
  content.addEventListener("input", () => { document.getElementById("wordCount").textContent = `${wordCount(content.value)} ${wordCount(content.value) === 1 ? "word" : "words"}`; });
  async function createPost(status) {
    const user = getUser();
    if (!user || !localStorage.getItem(TOKEN_KEY)) { setMessage("createMessage", "Please log in or register before creating a blog."); setTimeout(() => { window.location.href = "login.html"; }, 900); return; }
    const category = document.getElementById("blogCategory").value;
    const payload = { title: document.getElementById("blogTitle").value.trim(), category, excerpt: document.getElementById("blogExcerpt").value.trim(), content: content.value.trim(), status, image: imageByCategory[category] || imageByCategory.Other };
    if (!payload.title || !category || payload.content.length < 20) return setMessage("createMessage", "Please enter a title, select a category, and write at least 20 characters.");
    try {
      await api("/api/posts", { method: "POST", body: JSON.stringify(payload) });
      setMessage("createMessage", status === "draft" ? "Draft saved successfully! Opening dashboard..." : "Your story has been published! Opening dashboard...", "success");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
    } catch (error) { setMessage("createMessage", error.message); }
  }
  form.addEventListener("submit", event => { event.preventDefault(); createPost("published"); });
  document.getElementById("saveDraftButton")?.addEventListener("click", () => createPost("draft"));
}

function setupMobileNavigation() {
  document.querySelectorAll(".menu-toggle").forEach(button => button.addEventListener("click", () => {
    const links = document.querySelector(".nav-links");
    if (links) button.setAttribute("aria-expanded", String(links.classList.toggle("open")));
  }));
}

document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  setupMobileNavigation();
  renderAuth();
  setupEditor();
  await Promise.all([renderHome(), renderDashboard(), renderStory()]);
});
