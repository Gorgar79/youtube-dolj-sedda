// YouTube – Dölj sedda videor (content script)

const DEFAULTS = {
  enabled: true,          // automatisk döljning av sedda videor
  threshold: 95,          // procent som räknas som "sedd"
  showManualButton: true, // visa "Dölj"-knapp på videor
  includeHome: false,     // gäller även startsidan
  revealHidden: false     // visa dolda videor (tonade) istället för att gömma dem
};

let settings = { ...DEFAULTS };
let manualHidden = {}; // videoId -> tidsstämpel

const ITEM_SELECTOR = [
  'ytd-rich-item-renderer',
  'ytd-grid-video-renderer',
  'ytd-video-renderer'
].join(',');

// Den röda "sett hittills"-stapeln på miniatyren (gammalt och nytt YouTube-gränssnitt)
const PROGRESS_SELECTOR = [
  'ytd-thumbnail-overlay-resume-playback-renderer #progress',
  '.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment',
  '[class*="WatchedProgressBarSegment"]'
].join(',');

function isActivePage() {
  const p = location.pathname;
  if (p.startsWith('/feed/subscriptions')) return true;
  if (settings.includeHome && p === '/') return true;
  return false;
}

function getVideoId(item) {
  const a = item.querySelector('a[href*="/watch?v="], a[href*="/shorts/"]');
  if (!a) return null;
  const href = a.getAttribute('href') || '';
  const m = href.match(/[?&]v=([\w-]{11})/) || href.match(/\/shorts\/([\w-]{11})/);
  return m ? m[1] : null;
}

function getWatchedPercent(item) {
  const el = item.querySelector(PROGRESS_SELECTOR);
  if (!el) return 0;
  const w = parseFloat(el.style.width);
  return Number.isFinite(w) ? w : 0;
}

function saveManualHidden() {
  chrome.storage.local.set({ manualHidden });
}

function ensureButton(item) {
  let btn = item.querySelector(':scope > .ywh-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'ywh-btn';
    btn.type = 'button';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Läs id vid klick – YouTube återanvänder element för andra videor
      const id = getVideoId(item);
      if (!id) return;
      if (manualHidden[id]) delete manualHidden[id];
      else manualHidden[id] = Date.now();
      saveManualHidden();
      processItem(item);
    });
    item.appendChild(btn);
  }
  return btn;
}

function processItem(item) {
  const active = isActivePage();
  const id = getVideoId(item);

  if (!active || !id) {
    item.classList.remove('ywh-item', 'ywh-hidden', 'ywh-revealed');
    item.querySelector(':scope > .ywh-btn')?.remove();
    return;
  }

  item.classList.add('ywh-item');

  const isManual = !!manualHidden[id];
  const isWatched = settings.enabled && getWatchedPercent(item) >= settings.threshold;
  const shouldHide = isManual || isWatched;

  item.classList.toggle('ywh-hidden', shouldHide && !settings.revealHidden);
  item.classList.toggle('ywh-revealed', shouldHide && settings.revealHidden);

  if (settings.showManualButton) {
    const btn = ensureButton(item);
    const label = isManual ? 'Visa igen' : 'Dölj';
    if (btn.textContent !== label) btn.textContent = label;
    btn.title = isManual ? 'Sluta dölja den här videon' : 'Dölj den här videon';
  } else {
    item.querySelector(':scope > .ywh-btn')?.remove();
  }
}

function scan() {
  document.querySelectorAll(ITEM_SELECTOR).forEach(processItem);
}

// Begränsa hur ofta vi skannar – YouTube muterar DOM:en väldigt ofta
let scanTimer = null;
function scheduleScan() {
  if (scanTimer) return;
  scanTimer = setTimeout(() => {
    scanTimer = null;
    scan();
  }, 250);
}

async function init() {
  const [sync, local] = await Promise.all([
    chrome.storage.sync.get(DEFAULTS),
    chrome.storage.local.get({ manualHidden: {} })
  ]);
  settings = { ...DEFAULTS, ...sync };
  manualHidden = local.manualHidden || {};

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      for (const [k, v] of Object.entries(changes)) {
        if (k in DEFAULTS) settings[k] = v.newValue ?? DEFAULTS[k];
      }
    } else if (area === 'local' && changes.manualHidden) {
      manualHidden = changes.manualHidden.newValue || {};
    }
    scan();
  });

  new MutationObserver(scheduleScan).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'href']
  });

  // YouTube är en SPA – lyssna på navigering mellan sidor
  document.addEventListener('yt-navigate-finish', scheduleScan);

  scan();
}

init();
