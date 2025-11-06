// Simple localStorage auth
const Auth = {
  key: "rv_user",
  login(email) {
    localStorage.setItem(this.key, JSON.stringify({ email, ts: Date.now() }));
  },
  logout() {
    localStorage.removeItem(this.key);
  },
  current() {
    try { return JSON.parse(localStorage.getItem(this.key)); } catch { return null; }
  },
  isLoggedIn() {
    return !!this.current();
  }
};

// Update navbar (Login ↔ Logout + Member badge)
function initNavbar() {
  const authLink = document.getElementById("authLink");
  const badge = document.getElementById("memberBadge");
  if (!authLink) return;

  if (Auth.isLoggedIn()) {
    if (badge) badge.classList.remove("hidden");
    authLink.textContent = "Logout";
    authLink.classList.remove("btn-primary");
    authLink.href = "#";
    authLink.addEventListener("click", (e) => {
      e.preventDefault();
      Auth.logout();
      location.reload();
    });
  } else {
    if (badge) badge.classList.add("hidden");
    authLink.textContent = "Login";
    authLink.classList.add("btn-primary");
    authLink.href = "login.html";
  }
}
