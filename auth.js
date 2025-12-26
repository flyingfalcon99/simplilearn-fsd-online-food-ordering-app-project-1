// Simple demo auth helpers (localStorage-based)
const AUTH_KEYS = {
  USERS: "foodapp_users_v1",
  CURRENT_USER: "foodapp_current_user_v1",
};

function uid(prefix = "u") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function loadJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch (e) {
    return fallback;
  }
}
function saveJSON(key, v) {
  localStorage.setItem(key, JSON.stringify(v));
}

// Seed admin user if missing
function ensureDefaultUsers() {
  const users = loadJSON(AUTH_KEYS.USERS, []);
  const adminEmail = "admin@myfoodiejunction.com";
  if (!users.find((u) => u.email === adminEmail)) {
    users.push({
      id: uid("u"),
      name: "Admin",
      email: adminEmail,
      password: "adminpass", // demo password
      role: "admin",
    });
  }
  // add a demo regular user
  if (!users.find((u) => u.email === "jane@demo.com")) {
    users.push({ id: uid("u"), name: "Jane Demo", email: "jane@demo.com", password: "demo", role: "customer" });
  }
  saveJSON(AUTH_KEYS.USERS, users);
}

const Auth = (function () {
  ensureDefaultUsers();

  let listeners = [];

  function getUsers() {
    return loadJSON(AUTH_KEYS.USERS, []);
  }
  function saveUsers(u) {
    saveJSON(AUTH_KEYS.USERS, u);
  }

  function getCurrentUser() {
    return loadJSON(AUTH_KEYS.CURRENT_USER, null);
  }

  function setCurrentUser(user) {
    if (user) saveJSON(AUTH_KEYS.CURRENT_USER, user);
    else localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
    listeners.forEach((fn) => fn(getCurrentUser()));
    renderHeader();
  }

  function register({ name, email, password }) {
    const users = getUsers();
    if (users.find((u) => u.email === email)) {
      throw new Error("Email already registered");
    }
    const u = { id: uid("u"), name, email, password, role: "customer" };
    users.push(u);
    saveUsers(users);
    setCurrentUser({ id: u.id, name: u.name, email: u.email, role: u.role });
    return u;
  }

  function login({ email, password }) {
    const users = getUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) return null;
    setCurrentUser({ id: found.id, name: found.name, email: found.email, role: found.role });
    return found;
  }

  function logout() {
    setCurrentUser(null);
  }

  function onAuthChange(fn) {
    listeners.push(fn);
  }

  // UI helpers: update header/auth links
  function renderHeader() {
    const cur = getCurrentUser();
    const authLinks = document.getElementById("authLinks");
    const curEl = document.getElementById("currentUserDisplay");
    const curEmailEl = document.getElementById("currentUserEmail");
    const btnLogout = document.getElementById("btnLogout");

    if (!authLinks || !curEl || !curEmailEl) return;

    if (cur) {
      authLinks.classList.add("hidden");
      curEl.classList.remove("hidden");
      curEmailEl.textContent = cur.email;

      const roleBadge = document.getElementById("currentUserBadge");
      if (roleBadge) {
        if (cur.role === "admin") {
          roleBadge.classList.remove("hidden");
          roleBadge.textContent = "Admin";
        } else {
          roleBadge.classList.add("hidden");
        }
      }
    } else {
      authLinks.classList.remove("hidden");
      curEl.classList.add("hidden");
      curEmailEl.textContent = "Guest";

      const roleBadge = document.getElementById("currentUserBadge");
      if (roleBadge) roleBadge.classList.add("hidden");
    }

    if (btnLogout) {
      btnLogout.onclick = () => {
        logout();
        window.location.href = "index.html";
      };
    }

    // Also toggle admin button visibility if present
    const adminBtn = document.getElementById("btnAdminMode");
    if (adminBtn) {
      if (cur && cur.role === "admin") adminBtn.classList.remove("hidden");
      else {
        adminBtn.classList.add("hidden");
      }
    }
  }

  // Auto-bind sign-in and sign-up forms if present on the page
  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();

    const signinForm = document.getElementById("signinForm");
    if (signinForm) {
      signinForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const em = (document.getElementById("signinEmail").value || "").trim();
        const pw = (document.getElementById("signinPassword").value || "").trim();
        const ok = login({ email: em, password: pw });
        if (!ok) {
          alert("Invalid credentials");
          return;
        }
        // After login, ensure profile name is set if missing
        const profileKey = "foodapp_profile_v1";
        const profile = JSON.parse(localStorage.getItem(profileKey) || "null") || { name: "Guest User", phone: "", address: "" };
        if ((!profile.name || profile.name === "Guest User") && ok.name) {
          profile.name = ok.name;
          localStorage.setItem(profileKey, JSON.stringify(profile));
        }
        // redirect to home
        window.location.href = "index.html";
      });
    }

    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
      signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = (document.getElementById("signupName").value || "").trim();
        const email = (document.getElementById("signupEmail").value || "").trim();
        const pw = (document.getElementById("signupPassword").value || "").trim();
        try {
          const u = register({ name, email, password: pw });
          // set profile
          const profile = { name: u.name || "Guest User", phone: "", address: "" };
          localStorage.setItem("foodapp_profile_v1", JSON.stringify(profile));
          window.location.href = "index.html";
        } catch (err) {
          alert(err.message || "Registration failed");
        }
      });
    }
  });

  return { getUsers, getCurrentUser, login, register, logout, onAuthChange, renderHeader };
})();

// Expose globally
window.Auth = Auth;