const API_URL       = "http://localhost:8000/api/v1/advice";
const USER_ID       = "demo-user";

const form          = document.getElementById("advice-form");
const submitBtn     = document.getElementById("submit-btn");
const errorSection  = document.getElementById("error-section");
const errorMessage  = document.getElementById("error-message");
const resultSection = document.getElementById("result");       // synthesis card
const situationEl   = document.getElementById("situation");
const charCountEl   = document.getElementById("char-count");

// ── Character counter ──────────────────────────────────────────────────────
situationEl.addEventListener("input", () => {
  const n = situationEl.value.length;
  charCountEl.textContent = `${n} / 1000`;
  charCountEl.classList.toggle("near-limit", n > 850);
});

// ── Form submit ────────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setLoading(true);
  hideError();
  resetCards();
  resultSection.hidden = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Server returned ${response.status}: ${detail}`);
    }

    const data = await response.json();
    renderResult(data);
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    showError(err.message || "Request failed. Is the backend running?");
    resetCards();
  } finally {
    setLoading(false);
  }
});

function buildPayload() {
  const situation = situationEl.value.trim();
  return {
    user_id:    USER_ID,
    birth_date: "1990-01-01",
    preferences: {
      looking_for: "relationship-advice",
      interests:   situation ? [situation] : [],
      dealbreakers: [],
    },
  };
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderResult(data) {
  renderOpinions(data.opinions || []);
  document.getElementById("final-advice").textContent = data.final_advice;
  document.getElementById("rationale").textContent    = data.rationale;
  // Hidden compat containers
  renderScores(data.scores || []);
  renderSources(data.agent_sources || {});
}

// Update the three static advisor cards in place
function renderOpinions(opinions) {
  opinions.forEach((op) => {
    const key  = op.agent_name.toLowerCase();
    const card = document.querySelector(`.advisor-card[data-agent="${key}"]`);
    if (!card) return;

    const adviceEl = card.querySelector(".advisor-advice");
    adviceEl.textContent = op.advice;
    adviceEl.classList.remove("advisor-advice--idle");

    const badge = card.querySelector(".source-badge");
    badge.textContent  = op.source;
    badge.className    = `source-badge source-${op.source}`;
    badge.hidden       = false;

    card.classList.remove("card--loading");
    card.classList.add("card--active");
  });
}

// Reset cards to idle placeholder state
const IDLE_TEXT = {
  astrology:  "Describe your situation above and the stars will speak.",
  behavioral: "Share your story and your patterns will be read.",
  history:    "Speak your truth and experience will guide you.",
};

function resetCards() {
  document.querySelectorAll(".advisor-card[data-agent]").forEach((card) => {
    const key = card.dataset.agent;
    const adviceEl = card.querySelector(".advisor-advice");
    adviceEl.textContent = IDLE_TEXT[key] || "Awaiting your situation…";
    adviceEl.classList.add("advisor-advice--idle");
    const badge = card.querySelector(".source-badge");
    badge.hidden = true;
    card.classList.remove("card--active");
    card.classList.add("card--loading");
  });
}

// Hidden compat — containers are display:none in HTML
function renderScores(scores) {
  const c = document.getElementById("scores");
  if (!c) return;
  c.innerHTML = "";
  scores.forEach((s) => {
    const d = document.createElement("div");
    d.textContent = `${capitalize(s.agent_name)}: ${fmt(s.relevance)} / ${fmt(s.safety)} / ${fmt(s.coherence)}`;
    c.appendChild(d);
  });
}

function renderSources(sources) {
  const c = document.getElementById("agent-sources");
  if (!c) return;
  c.innerHTML = "";
  Object.entries(sources).forEach(([agent, src]) => {
    const d = document.createElement("div");
    d.textContent = `${capitalize(agent)}: ${src}`;
    c.appendChild(d);
  });
}

// ── UI helpers ─────────────────────────────────────────────────────────────
const BTN_INNER = {
  loading: `<svg class="btn-moon" viewBox="0 0 14 14" fill="none"><path d="M7 1.5C4 1.5 1.5 4 1.5 7s2.5 5.5 5.5 5.5c.7 0 1.4-.14 2-.4C6.8 11.1 5.5 9.2 5.5 7S6.8 2.9 9 1.9A5.4 5.4 0 0 0 7 1.5Z" fill="currentColor"/></svg> Consulting…`,
  default: `<svg class="btn-moon" viewBox="0 0 14 14" fill="none"><path d="M7 1.5C4 1.5 1.5 4 1.5 7s2.5 5.5 5.5 5.5c.7 0 1.4-.14 2-.4C6.8 11.1 5.5 9.2 5.5 7S6.8 2.9 9 1.9A5.4 5.4 0 0 0 7 1.5Z" fill="currentColor"/></svg> Summon the Council`,
};

function setLoading(on) {
  submitBtn.disabled   = on;
  submitBtn.innerHTML  = on ? BTN_INNER.loading : BTN_INNER.default;
  document.querySelectorAll(".advisor-card[data-agent]").forEach((c) => {
    c.classList.toggle("card--loading", on);
  });
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorSection.hidden = false;
}

function hideError() {
  errorSection.hidden = true;
  errorMessage.textContent = "";
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function fmt(n)        { return (Math.round(n * 100) / 100).toFixed(2); }

// ── Star field ─────────────────────────────────────────────────────────────
(function initStars() {
  const canvas = document.getElementById("stars-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // Dim background stars
  const stars = Array.from({ length: 175 }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.0 + 0.18,
    a: Math.random() * 0.4  + 0.07,
    s: Math.random() * 0.00026 + 0.00006,
    p: Math.random() * Math.PI * 2,
  }));

  // Brighter accent stars with glow halos
  const bright = Array.from({ length: 20 }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.2 + 0.85,
    a: Math.random() * 0.5  + 0.22,
    s: Math.random() * 0.00018 + 0.00005,
    p: Math.random() * Math.PI * 2,
  }));

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width, H = canvas.height;

    for (const s of stars) {
      const a = s.a * (0.5 + 0.5 * Math.sin(t * s.s * 1000 + s.p));
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,182,255,${a})`;
      ctx.fill();
    }

    for (const s of bright) {
      const a = s.a * (0.55 + 0.45 * Math.sin(t * s.s * 1000 + s.p));
      const x = s.x * W, y = s.y * H;
      const g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 3.8);
      g.addColorStop(0, `rgba(230,215,255,${a})`);
      g.addColorStop(1, `rgba(180,155,255,0)`);
      ctx.beginPath();
      ctx.arc(x, y, s.r * 3.8, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,230,255,${a})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
