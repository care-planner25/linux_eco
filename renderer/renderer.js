// =============================================================================
//  Eco-système — logique du renderer (onglets via <webview>)
// =============================================================================

const HOME = 'https://admin.care-planner.org';   // section Admin par défaut
const PARTITION = 'persist:careplanner';          // session partagée entre onglets/sous-domaines

// Écosystème : un bouton par destination.
//   icon 'logo'  -> logo Care-Planner recoloré en blanc
//   icon 'globe' -> icône web   |  icon 'phone' -> icône smartphone
const ECO = [
  { name: 'Admin',        url: 'https://admin.care-planner.org',        color: '#6366F1', icon: 'logo'  },
  { name: 'CRM',          url: 'https://crm.care-planner.org',          color: '#0D6EFD', icon: 'logo'  },
  { name: 'Formation',    url: 'https://formation.care-planner.org',    color: '#16A34A', icon: 'logo'  },
  { name: 'Aide',         url: 'https://help.care-planner.org',         color: '#F59E0B', icon: 'logo'  },
  { name: 'Présentation', url: 'https://presentation.care-planner.org', color: '#DB2777', icon: 'logo'  },
  { name: 'Site web',     url: 'https://care-planner.org',              color: '#0D9488', icon: 'globe' },
  { name: 'Mobile',       url: 'https://mobile.care-planner.org',       color: '#8B5CF6', icon: 'phone' },
];

const SVG = {
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round">' +
         '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/>' +
         '<path d="M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
         '<rect x="6.5" y="2" width="11" height="20" rx="2.2"/><path d="M10.5 18.5h3"/></svg>',
};

const $ = (sel) => document.querySelector(sel);
const viewsEl = $('#views');
const stripEl = $('#tabstrip');

let tabs = [];        // { id, wv, title, color }
let activeId = null;
let nextId = 1;

// ----- utilitaires --------------------------------------------------------
function host(url) { try { return new URL(url).hostname; } catch { return ''; } }

function moduleColor(h) {
  for (const e of ECO) if (host(e.url) === h) return e.color;
  return null;
}

function darken(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
}

function activeTab() { return tabs.find((t) => t.id === activeId) || null; }
function activeWv()  { const t = activeTab(); return t ? t.wv : null; }

// ----- onglets ------------------------------------------------------------
function addTab(url) {
  const id = nextId++;

  const wv = document.createElement('webview');
  wv.setAttribute('partition', PARTITION);
  wv.setAttribute('allowpopups', '');
  wv.setAttribute('src', url);
  viewsEl.appendChild(wv);

  const tab = { id, wv, title: 'Eco-système', color: moduleColor(host(url)) };
  tabs.push(tab);

  wv.addEventListener('page-title-updated', (e) => {
    tab.title = e.title && e.title.trim() ? e.title : 'Eco-système';
    renderStrip();
  });
  wv.addEventListener('did-navigate', (e) => {
    tab.color = moduleColor(host(e.url));
    renderStrip();
    if (tab.id === activeId) updateNav();
  });
  wv.addEventListener('did-navigate-in-page', (e) => {
    tab.color = moduleColor(host(e.url));
    renderStrip();
  });
  wv.addEventListener('dom-ready', () => { if (tab.id === activeId) updateNav(); });

  selectTab(id);
  return tab;
}

function selectTab(id) {
  activeId = id;
  for (const t of tabs) t.wv.style.display = (t.id === id) ? 'block' : 'none';
  renderStrip();
  updateNav();
  const w = activeWv();
  if (w) try { w.focus(); } catch {}
}

function closeTab(id) {
  const idx = tabs.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const [tab] = tabs.splice(idx, 1);
  tab.wv.remove();

  if (activeId === id) {
    if (tabs.length === 0) addTab(HOME);
    else selectTab(tabs[Math.min(idx, tabs.length - 1)].id);
  } else {
    renderStrip();
  }
}

function cycle(dir) {
  if (tabs.length < 2) return;
  let i = tabs.findIndex((t) => t.id === activeId);
  i = (i + dir + tabs.length) % tabs.length;
  selectTab(tabs[i].id);
}

// ----- rendu de la bande d'onglets ---------------------------------------
function renderStrip() {
  stripEl.innerHTML = '';
  for (const t of tabs) {
    const active = t.id === activeId;
    const el = document.createElement('div');
    el.className = 'tab';

    if (t.color) {
      el.style.background = active ? t.color : darken(t.color, 0.5);
      el.style.color = '#fff';
    } else {
      el.style.background = active ? 'var(--accent)' : 'var(--bg2)';
      el.style.color = active ? '#fff' : 'var(--text-dim)';
    }

    const ico = document.createElement('img');
    ico.className = 'ico';
    ico.src = 'careplanner.png';

    const ttl = document.createElement('span');
    ttl.className = 'ttl';
    ttl.textContent = t.title;

    const x = document.createElement('span');
    x.className = 'x';
    x.textContent = '\u00D7';
    x.title = 'Fermer';
    x.addEventListener('click', (ev) => { ev.stopPropagation(); closeTab(t.id); });

    el.appendChild(ico);
    el.appendChild(ttl);
    el.appendChild(x);
    el.addEventListener('click', () => selectTab(t.id));
    stripEl.appendChild(el);
  }
}

// ----- navigation ---------------------------------------------------------
function updateNav() {
  const w = activeWv();
  let back = false, fwd = false;
  if (w) { try { back = w.canGoBack(); fwd = w.canGoForward(); } catch {} }
  $('[data-act="back"]').disabled = !back;
  $('[data-act="forward"]').disabled = !fwd;
}

document.getElementById('nav').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const w = activeWv();
  if (!w) return;
  try {
    switch (btn.dataset.act) {
      case 'back':    if (w.canGoBack()) w.goBack(); break;
      case 'forward': if (w.canGoForward()) w.goForward(); break;
      case 'reload':  w.reload(); break;
      case 'home':    w.loadURL(HOME); break;
    }
  } catch {}
});

$('#newtab').addEventListener('click', () => addTab(HOME));

// ----- boutons d'écosystème ----------------------------------------------
function buildEco() {
  const box = $('#eco');
  for (const e of ECO) {
    const b = document.createElement('div');
    b.className = 'eco';
    b.style.background = e.color;
    b.title = e.name + ' — ' + host(e.url);

    if (e.icon === 'logo') {
      const img = document.createElement('img');
      img.src = 'careplanner.png';
      b.appendChild(img);
    } else {
      b.innerHTML = SVG[e.icon];
    }

    const base = e.color;
    const hov = darken(e.color, 0.82);
    b.addEventListener('mouseenter', () => { b.style.background = hov; });
    b.addEventListener('mouseleave', () => { b.style.background = base; });
    b.addEventListener('click', () => addTab(e.url));
    box.appendChild(b);
  }
}

// ----- raccourcis (menu) + pop-up internes -------------------------------
window.eco.onMenu((action, arg) => {
  const w = activeWv();
  switch (action) {
    case 'new-tab':   addTab(HOME); break;
    case 'close-tab': if (activeId != null) closeTab(activeId); break;
    case 'reload':    if (w) try { w.reload(); } catch {} break;
    case 'back':      if (w) try { if (w.canGoBack()) w.goBack(); } catch {} break;
    case 'forward':   if (w) try { if (w.canGoForward()) w.goForward(); } catch {} break;
    case 'home':      if (w) try { w.loadURL(HOME); } catch {} break;
    case 'cycle':     cycle(arg); break;
  }
});

window.eco.onOpenTab((url) => addTab(url));

// ----- démarrage ----------------------------------------------------------
buildEco();
addTab(HOME);
