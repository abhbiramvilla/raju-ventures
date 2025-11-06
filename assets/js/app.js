const DISCOUNT_RATE = 0.01;

function formatINR(n) {
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

function discountedPrice(raw) {
  return Auth.isLoggedIn() ? Math.round(raw * (1 - DISCOUNT_RATE)) : raw;
}

function priceHTML(raw) {
  if (Auth.isLoggedIn()) {
    const d = discountedPrice(raw);
    return `<span class="price"><s>${formatINR(raw)}</s> ${formatINR(d)} <span class="badge">1% off</span></span>`;
  }
  return `<span class="price">${formatINR(raw)}</span>`;
}

function landCardHTML(p) {
  const img = (p.images && p.images[0]) || "assets/img/logo.png";
  return `
  <article class="card">
    <a href="land.html?id=${p.id}">
      <div class="media"><img src="${img}" alt="${p.title}" loading="lazy"></div>
    </a>
    <div class="body">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;">
        <h3 style="margin:0">${p.title}</h3>
        <span class="badge">${p.type}</span>
      </div>
      <div class="meta" style="margin-top:.5rem">
        <span>${p.size}</span><span>${p.location}</span><span>${p.facing || ""}</span>
      </div>
      <a class="btn" style="margin-top:.75rem" href="land.html?id=${p.id}">View details</a>
    </div>
  </article>`;
}

function renderFeatured(containerId, count = 6) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const list = LANDS.slice(0, count);
  el.innerHTML = list.map(landCardHTML).join("");
}

function parseQuery() {
  const params = new URLSearchParams(location.search);
  return Object.fromEntries(params.entries());
}

function inBudget(price, budgetStr) {
  if (!budgetStr) return true;
  const [min, max] = budgetStr.split("-").map(n => parseInt(n, 10));
  return price >= (min || 0) && price <= (max || Number.MAX_SAFE_INTEGER);
}

function initListings(gridId, formId) {
  const grid = document.getElementById(gridId);
  const form = document.getElementById(formId);
  function applyFilter() {
    const fd = new FormData(form);
    const q = (fd.get("q") || "").toString().toLowerCase();
    const type = (fd.get("type") || "");
    const budget = (fd.get("budget") || "");
    let list = LANDS.filter(p => {
      const matchesQ = p.location.toLowerCase().includes(q) || p.title.toLowerCase().includes(q);
      const matchesType = type ? p.type === type : true;
      const matchesBudget = inBudget(p.price, budget);
      return matchesQ && matchesType && matchesBudget;
    });
    grid.innerHTML = list.map(landCardHTML).join("") || "<p class='text-muted'>No results found.</p>";
  }
  // Pre-fill from URL
  const params = parseQuery();
  if (params.q) form.querySelector("[name='q']").value = params.q;
  if (params.type) form.querySelector("[name='type']").value = params.type;
  if (params.budget) form.querySelector("[name='budget']").value = params.budget;
  form.addEventListener("submit", (e) => { e.preventDefault(); applyFilter(); });
  applyFilter();
}

function renderDetail(sectionId) {
  const { id } = parseQuery();
  const p = LANDS.find(x => String(x.id) === String(id));
  const el = document.getElementById(sectionId);
  if (!p) {
    el.innerHTML = "<p class='text-muted'>Land not found.</p>";
    return;
  }
  const imgs = (p.images && p.images.length) ? p.images : ["assets/img/logo.png"];
  el.innerHTML = `
    <div class="grid" style="grid-template-columns:2fr 1fr; gap:.75rem;">
      <div><img src="${imgs[0]}" alt="${p.title}"></div>
      <div class="grid" style="grid-template-columns:1fr; gap:.75rem;">
        ${imgs.slice(1,4).map(src => `<img src="${src}" alt="${p.title}">`).join("") || "<div class='panel text-muted'>Add more images in data.js</div>"}
      </div>
    </div>
    <div style="margin-top:1rem">
      <h1 style="margin-bottom:.25rem">${p.title}</h1>
      <div>${priceHTML(p.price)}</div>
      <div class="grid" style="grid-template-columns:repeat(4,1fr);gap:.75rem;margin-top:1rem;">
        <div class="panel"><strong>Type</strong><br/>${p.type}</div>
        <div class="panel"><strong>Size</strong><br/>${p.size}</div>
        <div class="panel"><strong>Location</strong><br/>${p.location}</div>
        <div class="panel"><strong>Facing</strong><br/>${p.facing || "—"}</div>
      </div>
      <div class="panel" style="margin-top:1rem">
        <h3>Enquire about this land</h3>
        <form id="enquiryForm">
          <div class="grid" style="grid-template-columns:1fr 1fr">
            <label>Name <input name="name" required></label>
            <label>Phone <input name="phone" required></label>
          </div>
          <label style="margin-top:.75rem;">Message <textarea name="msg" rows="3" placeholder="I’m interested in ${p.title}"></textarea></label>
          <button class="btn btn-primary" style="margin-top:.75rem">Contact Agent</button>
          <p id="enquiryStatus" class="text-muted" style="margin-top:.5rem;"></p>
        </form>
      </div>

      ${p.lat && p.lng ? `
      <div class="panel" style="margin-top:1rem">
        <h3>Location</h3>
        <div class="map-embed">
          <iframe
            src="https://www.google.com/maps?q=${p.lat},${p.lng}&z=14&output=embed"
            width="100%" height="260" style="border:0;" loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>` : ``}
    </div>
  `;

  document.getElementById("enquiryForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = new FormData(e.target).get("name") || "there";
    document.getElementById("enquiryStatus").textContent = `Thanks, ${name}! We'll reach out shortly.`;
    e.target.reset();
  });

  // Smart WhatsApp link with title
  const wa = document.getElementById('waFloat');
  if (wa) {
    const msg = `Hi Raju Ventures, I'm interested in "${p.title}" in ${p.location}.`;
    wa.href = `https://wa.me/919985574879?text=${encodeURIComponent(msg)}`;
  }
}
