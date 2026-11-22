const TOKEN_KEY = "blogspace_token_v1";
const USER_KEY = "blogspace_user_v1";
const imageByCategory = {
  Design:
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
  Lifestyle:
    "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80",
  Technology:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  Travel:
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80",
  "Personal Growth":
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
  Other:
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
};
const sampleStories = [
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

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}
function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "W"
  );
}
function setMessage(id, message, type = "error") {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}
function escapeHTML(value = "") {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(value).replace(
    /[&<>"']/g,
    (character) => replacements[character],
  );
}
function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
function getImage(post) {
  return post.image || imageByCategory[post.category] || imageByCategory.Other;
}
async function api(url, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(localStorage.getItem(TOKEN_KEY)
      ? { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
      : {}),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (
      response.status === 401 &&
      url !== "/api/auth/login" &&
      url !== "/api/auth/register"
    ) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    if (response.status === 404 && body.error === "API route not found.") {
      throw new Error("The server is running an older API version. Stop it and restart with npm start to enable editing.");
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
function logout() {
  clearSession();
  window.location.replace("index.html");
}

async function renderHome() {
  const grid = document.getElementById("blogGrid");
  if (!grid) return;
  const search = document.getElementById("searchInput");
  const loadNotice = document.getElementById("postsNotice");
  const filters = [...document.querySelectorAll(".filter-pill")];
  let category = "All";
  let posts = [];
  try {
    posts = await api("/api/posts");
    if (loadNotice) loadNotice.className = "form-message hidden";
  } catch (error) {
    posts = sampleStories;
    if (loadNotice) {
      loadNotice.textContent = `Showing sample stories. ${error.message} Your saved posts will appear when Supabase is available.`;
      loadNotice.className = "form-message error";
    }
  }
  function display() {
    const query = (search?.value || "").trim().toLowerCase();
    const filtered = posts.filter(
      (post) =>
        (category === "All" || post.category === category) &&
        [post.title, post.category, post.excerpt, post.author]
          .join(" ")
          .toLowerCase()
          .includes(query),
    );
    grid.innerHTML = filtered
      .map(
        (post) =>
          `<a class="blog-card" href="story.html?id=${encodeURIComponent(post.id)}" aria-label="Read ${escapeHTML(post.title)}"><div class="blog-card-image"><img src="${escapeHTML(getImage(post))}" alt="" loading="lazy"><span class="card-category">${escapeHTML(post.category.toUpperCase())}</span></div><div class="blog-card-body"><span class="eyebrow">${formatDate(post.date)}</span><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.excerpt || `${post.content.slice(0, 115)}...`)}</p><div class="card-meta"><span>By <strong>${escapeHTML(post.author)}</strong></span><span class="card-read" aria-hidden="true">↗</span></div></div></a>`,
      )
      .join("");
    document
      .getElementById("emptyState")
      ?.classList.toggle("hidden", filtered.length > 0);
  }
  search?.addEventListener("input", display);
  filters.forEach((button) =>
    button.addEventListener("click", () => {
      category = button.dataset.category;
      filters.forEach((item) =>
        item.classList.toggle("active", item === button),
      );
      display();
    }),
  );
  display();
}

function renderAuth() {
  document
    .getElementById("registerForm")
    ?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = document.getElementById("registerName").value.trim();
      const email = document
        .getElementById("registerEmail")
        .value.trim()
        .toLowerCase();
      const password = document.getElementById("registerPassword").value;
      if (password !== document.getElementById("confirmPassword").value)
        return setMessage("registerMessage", "Your passwords do not match.");
      try {
        const session = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        saveSession(session);
        setMessage(
          "registerMessage",
          "Account created successfully! Opening dashboard...",
          "success",
        );
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 500);
      } catch (error) {
        setMessage("registerMessage", error.message);
      }
    });
  document
    .getElementById("loginForm")
    ?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document
        .getElementById("loginEmail")
        .value.trim()
        .toLowerCase();
      const password = document.getElementById("loginPassword").value;
      try {
        const session = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        saveSession(session);
        setMessage(
          "loginMessage",
          "Login successful! Opening your dashboard...",
          "success",
        );
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 500);
      } catch (error) {
        setMessage("loginMessage", error.message);
      }
    });
  document.getElementById("logoutButton")?.addEventListener("click", logout);
  document.getElementById("homeLogoutButton")?.addEventListener("click", logout);
}

function setupHomeAuthNavigation() {
  const loginLink = document.getElementById("homeLoginLink");
  if (!loginLink) return;
  const registerLink = document.getElementById("homeRegisterLink");
  const profileLink = document.getElementById("homeProfileLink");
  const logoutButton = document.getElementById("homeLogoutButton");

  function displayUser(user) {
    const signedIn = Boolean(user && localStorage.getItem(TOKEN_KEY));
    loginLink.classList.toggle("hidden", signedIn);
    registerLink.classList.toggle("hidden", signedIn);
    profileLink.classList.toggle("hidden", !signedIn);
    logoutButton.classList.toggle("hidden", !signedIn);
    if (signedIn) profileLink.textContent = `Hi, ${user.name}`;
  }

  const cachedUser = getUser();
  displayUser(cachedUser);
  if (!localStorage.getItem(TOKEN_KEY)) return;

  api("/api/auth/me")
    .then(({ user }) => {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      displayUser(user);
    })
    .catch(() => displayUser(getUser()));
}

async function renderDashboard() {
  const list = document.getElementById("dashboardPosts");
  if (!list) return;
  if (!localStorage.getItem(TOKEN_KEY)) {
    window.location.href = "login.html";
    return;
  }
  try {
    const { user } = await api("/api/auth/me");
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    document.getElementById("userChip").textContent = user.name;
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;
    document.getElementById("profileInitials").textContent = getInitials(
      user.name,
    );

    const posts = await api("/api/posts/mine");
    const published = posts.filter(
      (post) => post.status === "published",
    ).length;
    document.getElementById("totalPosts").textContent = posts.length;
    document.getElementById("publishedPosts").textContent = published;
    document.getElementById("draftPosts").textContent =
      posts.length - published;
    document
      .getElementById("dashboardEmpty")
      ?.classList.toggle("hidden", posts.length > 0);
    list.innerHTML = posts
      .map(
        (post) =>
          `<article class="dashboard-post"><img class="post-thumb" src="${escapeHTML(getImage(post))}" alt="${escapeHTML(post.title)}"><div class="post-info"><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.category)} · ${formatDate(post.date)}</p></div><span class="status-badge ${post.status === "draft" ? "draft" : ""}">${post.status === "draft" ? "Draft" : "Published"}</span><div class="post-controls"><a class="post-edit" href="create-blog.html?id=${encodeURIComponent(post.id)}" aria-label="Edit ${escapeHTML(post.title)}">Edit</a><button class="post-delete" data-delete="${escapeHTML(post.id)}" aria-label="Delete ${escapeHTML(post.title)}" title="Delete story">×</button></div></article>`,
      )
      .join("");
    list.querySelectorAll("[data-delete]").forEach((button) =>
      button.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this story?")) return;
        try {
          await api(`/api/posts/${encodeURIComponent(button.dataset.delete)}`, {
            method: "DELETE",
          });
          await renderDashboard();
        } catch (error) {
          alert(error.message);
        }
      }),
    );
  } catch (error) {
    if (!localStorage.getItem(TOKEN_KEY)) {
      window.location.href = "login.html";
      return;
    }
    setMessage("dashboardMessage", error.message);
  }
}

async function renderStory() {
  const container = document.getElementById("storyDetail");
  if (!container) return;
  const postId = new URLSearchParams(window.location.search).get("id");
  if (!postId) {
    container.innerHTML = '<p class="form-message error">Story not found.</p>';
    return;
  }
  function display(post) {
    document.title = `${post.title} | BlogSpace`;
    container.innerHTML = `<article class="story-article"><img class="story-cover" src="${escapeHTML(getImage(post))}" alt=""><div class="story-copy"><a class="text-link story-back" href="index.html#latest">← All stories</a><span class="card-category story-category">${escapeHTML(post.category.toUpperCase())}</span><h1>${escapeHTML(post.title)}</h1><div class="story-byline">By <strong>${escapeHTML(post.author)}</strong><span aria-hidden="true">·</span><time datetime="${escapeHTML(post.date)}">${formatDate(post.date)}</time></div>${post.excerpt ? `<p class="story-excerpt">${escapeHTML(post.excerpt)}</p>` : ""}<div class="story-content">${escapeHTML(post.content).replace(/\n/g, "<br>")}</div></div></article>`;
  }
  try {
    display(await api(`/api/posts/${encodeURIComponent(postId)}`));
  } catch (error) {
    const sample = sampleStories.find((post) => post.id === postId);
    if (sample) {
      display(sample);
      container.insertAdjacentHTML(
        "afterbegin",
        `<p class="form-message error">Showing sample story. ${escapeHTML(error.message)}</p>`,
      );
    } else {
      container.innerHTML = `<p class="form-message error">${escapeHTML(error.message)} <a href="index.html#latest">Return to stories</a></p>`;
    }
  }
}

function setupEditor() {
  const form = document.getElementById("createBlogForm");
  if (!form) return;
  const content = document.getElementById("blogContent");
  const postId = new URLSearchParams(window.location.search).get("id");
  const title = document.getElementById("blogTitle");
  const category = document.getElementById("blogCategory");
  const excerpt = document.getElementById("blogExcerpt");
  const submitButton = form.querySelector('button[type="submit"]');
  let originalStatus = "published";
  content.addEventListener("input", () => {
    document.getElementById("wordCount").textContent =
      `${wordCount(content.value)} ${wordCount(content.value) === 1 ? "word" : "words"}`;
  });
  if (postId) {
    const user = getUser();
    if (!user || !localStorage.getItem(TOKEN_KEY)) {
      window.location.href = "login.html";
      return;
    }
    submitButton.disabled = true;
    document.getElementById("saveDraftButton").disabled = true;
    api("/api/posts/mine")
      .then((posts) => {
        const post = posts.find((item) => String(item.id) === postId);
        if (!post)
          throw new Error(
            "Story not found or you do not have permission to edit it.",
          );
        title.value = post.title;
        category.value = post.category;
        excerpt.value = post.excerpt || "";
        content.value = post.content;
        originalStatus = post.status;
        document.getElementById("wordCount").textContent =
          `${wordCount(content.value)} ${wordCount(content.value) === 1 ? "word" : "words"}`;
        document.getElementById("editorTitle").textContent = "Edit your story";
        document.getElementById("editorSubtitle").textContent =
          "Polish your words and save your changes.";
        document.getElementById("editorEyebrow").textContent =
          "YOUR STORY, YOUR WAY";
        submitButton.textContent =
          originalStatus === "draft" ? "Publish story ↗" : "Update & publish ↗";
        document.getElementById("saveDraftButton").textContent =
          "Save as draft";
        document.title = "Edit Story | BlogSpace";
        submitButton.disabled = false;
        document.getElementById("saveDraftButton").disabled = false;
      })
      .catch((error) => {
        setMessage("createMessage", error.message);
        document.getElementById("saveDraftButton").disabled = true;
      });
  }
  async function savePost(status) {
    const user = getUser();
    if (!user || !localStorage.getItem(TOKEN_KEY)) {
      setMessage(
        "createMessage",
        "Please log in or register before creating a blog.",
      );
      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
      return;
    }
    const selectedCategory = category.value;
    const payload = {
      title: title.value.trim(),
      category: selectedCategory,
      excerpt: excerpt.value.trim(),
      content: content.value.trim(),
      status,
      image: imageByCategory[selectedCategory] || imageByCategory.Other,
    };
    if (!payload.title || !selectedCategory || payload.content.length < 20)
      return setMessage(
        "createMessage",
        "Please enter a title, select a category, and write at least 20 characters.",
      );
    try {
      await api(
        postId ? `/api/posts/${encodeURIComponent(postId)}` : "/api/posts",
        { method: postId ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      const message = postId
        ? status === "draft"
          ? "Draft updated! Opening dashboard..."
          : "Your story was updated! Opening dashboard..."
        : status === "draft"
          ? "Draft saved successfully! Opening dashboard..."
          : "Your story has been published! Opening dashboard...";
      setMessage("createMessage", message, "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);
    } catch (error) {
      setMessage("createMessage", error.message);
    }
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    savePost("published");
  });
  document
    .getElementById("saveDraftButton")
    ?.addEventListener("click", () => savePost("draft"));
}

function setupMobileNavigation() {
  document.querySelectorAll(".menu-toggle").forEach((button) =>
    button.addEventListener("click", () => {
      const menu = button.getAttribute("aria-controls")
        ? document.getElementById(button.getAttribute("aria-controls"))
        : button.closest(".nav")?.querySelector(".nav-links");
      if (menu) {
        button.setAttribute(
          "aria-expanded",
          String(menu.classList.toggle("open")),
        );
      }
    }),
  );
  document.querySelectorAll(".home-nav-menu a").forEach((link) =>
    link.addEventListener("click", () => {
      const menu = document.getElementById("homeNavMenu");
      const button = document.querySelector('[aria-controls="homeNavMenu"]');
      menu?.classList.remove("open");
      button?.setAttribute("aria-expanded", "false");
    }),
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  setupMobileNavigation();
  renderAuth();
  setupHomeAuthNavigation();
  setupEditor();
  await Promise.all([renderHome(), renderDashboard(), renderStory()]);
});

window.addEventListener("pageshow", () => {
  if (document.getElementById("homeLoginLink")) {
    setupHomeAuthNavigation();
  }
  if (
    document.getElementById("dashboardPosts") &&
    !localStorage.getItem(TOKEN_KEY)
  ) {
    window.location.replace("login.html");
  }
});
