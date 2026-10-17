const DEFAULTS = {
  enabled: true,
  threshold: 95,
  showManualButton: true,
  includeHome: false,
  revealHidden: false
};

const $ = (id) => document.getElementById(id);
const checkboxes = ['enabled', 'showManualButton', 'includeHome', 'revealHidden'];

function clampThreshold(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return DEFAULTS.threshold;
  return Math.min(100, Math.max(1, n));
}

function setThreshold(v, save) {
  const t = clampThreshold(v);
  $('thresholdRange').value = t;
  $('thresholdNumber').value = t;
  if (save) chrome.storage.sync.set({ threshold: t });
}

function updateManualCount(manualHidden) {
  const n = Object.keys(manualHidden || {}).length;
  $('manualCount').textContent = `Manuellt dolda videor: ${n}`;
  $('clearManual').disabled = n === 0;
}

async function init() {
  const [settings, local] = await Promise.all([
    chrome.storage.sync.get(DEFAULTS),
    chrome.storage.local.get({ manualHidden: {} })
  ]);

  for (const key of checkboxes) {
    $(key).checked = !!settings[key];
    $(key).addEventListener('change', (e) => {
      chrome.storage.sync.set({ [key]: e.target.checked });
    });
  }

  setThreshold(settings.threshold, false);
  $('thresholdRange').addEventListener('input', (e) => setThreshold(e.target.value, true));
  $('thresholdNumber').addEventListener('change', (e) => setThreshold(e.target.value, true));

  updateManualCount(local.manualHidden);
  $('clearManual').addEventListener('click', () => {
    if (confirm('Visa alla manuellt dolda videor igen?')) {
      chrome.storage.local.set({ manualHidden: {} });
      updateManualCount({});
    }
  });
}

init();
