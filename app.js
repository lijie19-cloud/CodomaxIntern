// app.js

// ======================================
// 1. LOCAL STORAGE KEYS
// ======================================

const STORAGE_POSTS = "blogspace_posts_v1";
const STORAGE_USERS = "blogspace_users_v1";
const STORAGE_CURRENT_USER = "blogspace_current_user_v1";

// ======================================
// 2. SAMPLE BLOG POSTS
// ======================================

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
  {
    id: "sample-6",
    title: "Make Space for Creative Work",
    category: "Design",
    excerpt:
      "A few thoughtful changes can make room for better ideas to arrive.",
    content:
      "Creativity rarely responds well to pressure. Give yourself a clear surface, a little time, and permission to make something imperfect.",
    author: "Maya Johnson",
    date: "2026-10-02",
    status: "published",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
  },
];

// ======================================
// 3. HELPER FUNCTIONS
// ======================================

// Read JSON data from LocalStorage.
function readJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch (error) {
    return fallback;
  }
}

// Get blog posts.
// Sample posts appear if the app has not saved any posts yet.
function getPosts() {
  return readJSON(STORAGE_POSTS, starterPosts);
}

// Save blog posts.
function savePosts(posts) {
  localStorage.setItem(STORAGE_POSTS, JSON.stringify(posts));
}

// Get the currently logged-in demo user.
function getCurrentUser() {
  return readJSON(STORAGE_CURRENT_USER, null);
}

// Display form messages.
function setMessage(id, message, type = "error") {
  const element = document.getElementById(id);

  if (!element) return;

  element.textContent = message;
  element.className = `form-message ${type}`;
}

// Escape text before inserting user-provided content into HTML.
function escapeHTML(value = "") {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(value).replace(/[&<>"']/g, (character) => {
    return replacements[character];
  });
}

// Format a date.
function formatDate(date) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Count words in a string.
function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// Choose an image for a blog post.
function getImage(post) {
  if (post.image) {
    return post.image;
  }

  const images = {
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

  return images[post.category] || images.Other;
}

// ======================================
// 4. HOMEPAGE: BLOG POSTS, SEARCH, FILTER
// ======================================

function renderHome() {
  const blogGrid = document.getElementById("blogGrid");

  // This function runs only on the homepage.
  if (!blogGrid) return;

  const searchInput = document.getElementById("searchInput");

  const filterButtons = [...document.querySelectorAll(".filter-pill")];

  let selectedCategory = "All";

  function displayPosts() {
    const query = (searchInput?.value || "").trim().toLowerCase();

    const posts = getPosts().filter((post) => {
      // Show published stories only.
      if (post.status !== "published") {
        return false;
      }

      // Filter by category.
      const matchesCategory =
        selectedCategory === "All" || post.category === selectedCategory;

      // Search titles, categories, excerpts, and authors.
      const searchableText = [
        post.title,
        post.category,
        post.excerpt,
        post.author,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);

      return matchesCategory && matchesSearch;
    });

    blogGrid.innerHTML = posts
      .map(
        (post) => `
      <article class="blog-card">

        <div class="blog-card-image">
          <img
            src="${escapeHTML(getImage(post))}"
            alt="${escapeHTML(post.title)}"
            loading="lazy">

          <span class="card-category">
            ${escapeHTML(post.category.toUpperCase())}
          </span>
        </div>

        <div class="blog-card-body">

          <span class="eyebrow">
            ${formatDate(post.date)}
          </span>

          <h3>${escapeHTML(post.title)}</h3>

          <p>
            ${escapeHTML(post.excerpt || post.content.slice(0, 115) + "...")}
          </p>

          <div class="card-meta">
            <span>
              By <strong>${escapeHTML(post.author)}</strong>
            </span>

            <span class="card-read">↗</span>
          </div>

        </div>

      </article>
    `,
      )
      .join("");

    const emptyState = document.getElementById("emptyState");

    if (emptyState) {
      emptyState.classList.toggle("hidden", posts.length > 0);
    }
  }

  // Search while the user types.
  searchInput?.addEventListener("input", displayPosts);

  // Filter posts when a category button is clicked.
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category;

      filterButtons.forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      displayPosts();
    });
  });

  displayPosts();
}

// ======================================
// 5. REGISTRATION AND LOGIN
// ======================================

function renderAuth() {
  // ---------- REGISTER ----------

  const registerForm = document.getElementById("registerForm");

  registerForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();

    const email = document
      .getElementById("registerEmail")
      .value.trim()
      .toLowerCase();

    const password = document.getElementById("registerPassword").value;

    const confirmPassword = document.getElementById("confirmPassword").value;

    if (name.length < 2) {
      return setMessage("registerMessage", "Please enter your full name.");
    }

    if (password.length < 6) {
      return setMessage(
        "registerMessage",
        "Your password must contain at least 6 characters.",
      );
    }

    if (password !== confirmPassword) {
      return setMessage("registerMessage", "Your passwords do not match.");
    }

    const users = readJSON(STORAGE_USERS, []);

    const existingUser = users.find((user) => {
      return user.email === email;
    });

    if (existingUser) {
      return setMessage(
        "registerMessage",
        "An account with this email already exists.",
      );
    }

    // Save the demo account.
    users.push({
      name: name,
      email: email,
      password: password,
    });

    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));

    // Set the current demo user.
    localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify({ name, email }));

    setMessage(
      "registerMessage",
      "Account created successfully! Opening dashboard...",
      "success",
    );

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 700);
  });

  // ---------- LOGIN ----------

  const loginForm = document.getElementById("loginForm");

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document
      .getElementById("loginEmail")
      .value.trim()
      .toLowerCase();

    const password = document.getElementById("loginPassword").value;

    const users = readJSON(STORAGE_USERS, []);

    const user = users.find((account) => {
      return account.email === email && account.password === password;
    });

    if (!user) {
      return setMessage(
        "loginMessage",
        "Invalid email or password. Please check your details or register first.",
      );
    }

    // Store the active demo user.
    localStorage.setItem(
      STORAGE_CURRENT_USER,
      JSON.stringify({
        name: user.name,
        email: user.email,
      }),
    );

    setMessage(
      "loginMessage",
      "Login successful! Opening your dashboard...",
      "success",
    );

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 600);
  });

  // ---------- LOGOUT ----------

  const logoutButton = document.getElementById("logoutButton");

  logoutButton?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_CURRENT_USER);

    window.location.href = "index.html";
  });
}

// ======================================
// 6. DASHBOARD
// ======================================

function renderDashboard() {
  const dashboardPosts = document.getElementById("dashboardPosts");

  // Run only on the dashboard page.
  if (!dashboardPosts) return;

  const user = getCurrentUser();

  const userChip = document.getElementById("userChip");

  if (userChip) {
    userChip.textContent = user?.name || "Guest writer";
  }

  // Get posts belonging to the current demo user.
  const myPosts = getPosts().filter((post) => {
    return post.authorEmail && post.authorEmail === user?.email;
  });

  // Calculate statistics.
  const total = myPosts.length;

  const published = myPosts.filter((post) => {
    return post.status === "published";
  }).length;

  const drafts = myPosts.filter((post) => {
    return post.status === "draft";
  }).length;

  document.getElementById("totalPosts").textContent = total;

  document.getElementById("publishedPosts").textContent = published;

  document.getElementById("draftPosts").textContent = drafts;

  // Show the empty state if there are no posts.
  const emptyState = document.getElementById("dashboardEmpty");

  if (emptyState) {
    emptyState.classList.toggle("hidden", total > 0);
  }

  // Display the user's posts.
  dashboardPosts.innerHTML = myPosts
    .map(
      (post) => `
    <article class="dashboard-post">

      <img
        class="post-thumb"
        src="${escapeHTML(getImage(post))}"
        alt="${escapeHTML(post.title)}">

      <div class="post-info">
        <h3>${escapeHTML(post.title)}</h3>
        <p>
          ${escapeHTML(post.category)}
          · ${formatDate(post.date)}
        </p>
      </div>

      <span class="status-badge ${post.status === "draft" ? "draft" : ""}">
        ${post.status === "draft" ? "Draft" : "Published"}
      </span>

      <button
        class="post-delete"
        data-delete="${escapeHTML(post.id)}"
        aria-label="Delete ${escapeHTML(post.title)}"
        title="Delete story">
        ×
      </button>

    </article>
  `,
    )
    .join("");

  // Delete a post when its delete button is clicked.
  dashboardPosts.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const confirmed = confirm("Are you sure you want to delete this story?");

      if (!confirmed) return;

      // Delete only the selected user's post.
      const remainingPosts = getPosts().filter((post) => {
        return !(
          post.id === button.dataset.delete && post.authorEmail === user?.email
        );
      });

      savePosts(remainingPosts);

      // Refresh the dashboard.
      renderDashboard();
    });
  });
}

// ======================================
// 7. CREATE BLOG AND SAVE DRAFT
// ======================================

function setupEditor() {
  const form = document.getElementById("createBlogForm");

  // Run only on the create-blog page.
  if (!form) return;

  const contentInput = document.getElementById("blogContent");

  // Update the word count.
  contentInput.addEventListener("input", () => {
    const count = wordCount(contentInput.value);

    document.getElementById("wordCount").textContent =
      `${count} ${count === 1 ? "word" : "words"}`;
  });

  // Create either a draft or a published blog.
  function createPost(status) {
    const title = document.getElementById("blogTitle").value.trim();

    const category = document.getElementById("blogCategory").value;

    const excerpt = document.getElementById("blogExcerpt").value.trim();

    const content = contentInput.value.trim();

    // Validate the blog fields.
    if (!title || !category || content.length < 20) {
      return setMessage(
        "createMessage",
        "Please enter a title, select a category, and write at least 20 characters.",
      );
    }

    // Require a demo account.
    const user = getCurrentUser();

    if (!user) {
      setMessage(
        "createMessage",
        "Please log in or register before creating a blog.",
      );

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);

      return;
    }

    // Create a new post object.
    const newPost = {
      id: `post-${Date.now()}`,

      title: title,

      category: category,

      excerpt:
        excerpt || content.slice(0, 150) + (content.length > 150 ? "..." : ""),

      content: content,

      author: user.name,

      authorEmail: user.email,

      date: new Date().toISOString().slice(0, 10),

      status: status,

      image: getImage({ category: category }),
    };

    // Add the post to the existing posts.
    const posts = getPosts();

    posts.unshift(newPost);

    savePosts(posts);

    const message =
      status === "draft"
        ? "Draft saved successfully! Opening dashboard..."
        : "Your story has been published! Opening dashboard...";

    setMessage("createMessage", message, "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 650);
  }

  // Publish a blog.
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    createPost("published");
  });

  // Save a draft.
  const saveDraftButton = document.getElementById("saveDraftButton");

  saveDraftButton?.addEventListener("click", () => {
    createPost("draft");
  });
}

// ======================================
// 8. MOBILE NAVIGATION
// ======================================

function setupMobileNavigation() {
  const menuButtons = document.querySelectorAll(".menu-toggle");

  menuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const navLinks = document.querySelector(".nav-links");

      if (!navLinks) return;

      const isOpen = navLinks.classList.toggle("open");

      button.setAttribute("aria-expanded", String(isOpen));
    });
  });
}

// ======================================
// 9. INITIALIZE APPLICATION
// ======================================

document.addEventListener("DOMContentLoaded", () => {
  // Display the current year in the footer.
  const yearElement = document.getElementById("year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Initialize application features.
  setupMobileNavigation();

  renderHome();

  renderAuth();

  renderDashboard();

  setupEditor();
});
