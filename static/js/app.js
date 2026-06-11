const API = "";
const PRESET_KEY = "wc_filter_presets";

let state = {
  data: null,
  filter: "all",
  filters: {
    stage: "",
    date: "",
    venue: "",
    city: "",
    host: "",
    team: "",
    continent: "",
    timeSlot: "",
  },
  countdownTimer: null,
  refreshTimer: null,
  subscribed: new Set(),
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const pinSvg = `<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>`;

function isSubscribed(id) {
  return state.subscribed.has(String(id));
}

function timeRange(m) {
  return m.time_range_bj || `${m.time_bj || fmtTimeOnly(m.date)}–${m.time_bj_end || ""}`;
}

async function fetchData(force = false) {
  const badge = $("#refreshBadge");
  if (force) {
    badge?.classList.add("refresh-badge--busy");
    $("#lastUpdate").textContent = t("masthead.syncing");
  }
  try {
    const q = force ? `refresh=true&_=${Date.now()}` : "refresh=false";
    const res = await fetch(`${API}/api/data?${q}`, { cache: "no-store" });
    if (!res.ok) throw new Error(t("error.load"));
    state.data = await res.json();
    state.subscribed = new Set((state.data.subscribed_match_ids || []).map(String));
    render();
    const time = new Date(state.data.fetched_at).toLocaleTimeString(localeForDates());
    $("#lastUpdate").textContent = t("masthead.updated", { time });
  } finally {
    badge?.classList.remove("refresh-badge--busy");
  }
}

function matchPassesAdvanced(m) {
  const f = state.filters;
  if (f.stage) {
    if (f.stage === "knockout") {
      if (m.stage_category !== "knockout") return false;
    } else if (m.stage !== f.stage) return false;
  }
  if (f.date && m.date_bj !== f.date) return false;
  if (f.venue && m.venue?.name !== f.venue) return false;
  if (f.city && m.venue?.city !== f.city) return false;
  if (f.host && m.venue?.country !== f.host) return false;
  if (f.team) {
    if (m.home?.name !== f.team && m.away?.name !== f.team) return false;
  }
  if (f.continent) {
    const confs = [m.home?.confederation, m.away?.confederation];
    if (!confs.includes(f.continent)) return false;
  }
  if (f.timeSlot) {
    if (f.timeSlot === "daytime" || f.timeSlot === "night") {
      if (m.time_slot_simple !== f.timeSlot) return false;
    } else if (m.time_slot !== f.timeSlot) return false;
  }
  return true;
}

function getFilteredMatches() {
  if (!state.data) return [];
  const { matches, live, upcoming, finished } = state.data;
  let base;
  switch (state.filter) {
    case "live":
      base = live;
      break;
    case "upcoming":
      base = upcoming;
      break;
    case "finished":
      base = finished;
      break;
    case "recommended":
      base = matches.filter((m) => m.recommended);
      break;
    default:
      base = matches;
  }
  return base.filter(matchPassesAdvanced);
}

function hasActiveFilters() {
  return Object.values(state.filters).some(Boolean);
}

function filterPlaceholder(key) {
  return t(`filter.all${key.charAt(0).toUpperCase() + key.slice(1)}`) || t(`filter.all${key}`);
}

function populateFilterSelects() {
  const opts = state.data?.filter_options;
  if (!opts) return;

  const placeholders = {
    "#filterStage": "filter.allStage",
    "#filterDate": "filter.allDate",
    "#filterVenue": "filter.allVenue",
    "#filterCity": "filter.allCity",
    "#filterHost": "filter.allHost",
    "#filterTeam": "filter.allTeam",
    "#filterContinent": "filter.allContinent",
    "#filterTimeSlot": "filter.allTimeSlot",
  };

  const fill = (id, items, phKey) => {
    const el = $(id);
    const cur = el.value;
    el.innerHTML = `<option value="">${t(phKey)}</option>`;
    items.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.label;
      el.appendChild(opt);
    });
    if ([...el.options].some((o) => o.value === cur)) el.value = cur;
  };

  fill("#filterStage", opts.stages, "filter.allStage");
  fill("#filterDate", opts.dates, "filter.allDate");
  fill("#filterVenue", opts.venues, "filter.allVenue");
  fill("#filterCity", opts.cities, "filter.allCity");
  fill("#filterHost", opts.host_countries, "filter.allHost");
  fill("#filterTeam", opts.teams, "filter.allTeam");
  fill("#filterContinent", opts.continents, "filter.allContinent");
  fill("#filterTimeSlot", opts.time_slots || [], "filter.allTimeSlot");
  $("#recCount").textContent = state.data?.stats?.recommended_count ?? 0;
  renderPresetSelect();
}

function updateFilterSummary(list) {
  const el = $("#filterSummary");
  const total = state.data?.matches?.length ?? 0;
  const parts = [];
  if (state.filter !== "all") parts.push(chipFilterLabel(state.filter));
  const f = state.filters;
  if (f.stage) parts.push($("#filterStage").selectedOptions[0]?.textContent);
  if (f.date) parts.push($("#filterDate").selectedOptions[0]?.textContent);
  if (f.venue) parts.push($("#filterVenue").selectedOptions[0]?.textContent);
  if (f.city) parts.push($("#filterCity").selectedOptions[0]?.textContent);
  if (f.host) parts.push($("#filterHost").selectedOptions[0]?.textContent);
  if (f.team) parts.push($("#filterTeam").selectedOptions[0]?.textContent);
  if (f.continent) parts.push($("#filterContinent").selectedOptions[0]?.textContent);
  if (f.timeSlot) parts.push($("#filterTimeSlot").selectedOptions[0]?.textContent);

  if (!parts.length) {
    el.textContent = t("filter.total", { n: total });
    return;
  }
  el.innerHTML = t("filter.summary", { parts: parts.join(" · "), count: list.length, total });
}

function resetFilters() {
  state.filter = "all";
  state.filters = { stage: "", date: "", venue: "", city: "", host: "", team: "", continent: "", timeSlot: "" };
  $$(".chip").forEach((c) => c.classList.toggle("chip--active", c.dataset.filter === "all"));
  ["#filterStage", "#filterDate", "#filterVenue", "#filterCity", "#filterHost", "#filterTeam", "#filterContinent", "#filterTimeSlot"].forEach(
    (id) => {
      $(id).value = "";
    }
  );
  $("#presetSelect").value = "";
  renderMatches();
}

function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(PRESET_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePresets(list) {
  localStorage.setItem(PRESET_KEY, JSON.stringify(list));
}

function renderPresetSelect() {
  const el = $("#presetSelect");
  const cur = el.value;
  const presets = loadPresets();
  el.innerHTML = `<option value="">${t("filter.preset")}</option>`;
  presets.forEach((p, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = p.name;
    el.appendChild(opt);
  });
  if (cur && [...el.options].some((o) => o.value === cur)) el.value = cur;
}

function getCurrentFilterSnapshot() {
  return {
    filter: state.filter,
    filters: { ...state.filters },
  };
}

function applyFilterSnapshot(snap) {
  state.filter = snap.filter || "all";
  state.filters = { ...state.filters, ...snap.filters };
  $$(".chip").forEach((c) => c.classList.toggle("chip--active", c.dataset.filter === state.filter));
  $("#filterStage").value = state.filters.stage || "";
  $("#filterDate").value = state.filters.date || "";
  $("#filterVenue").value = state.filters.venue || "";
  $("#filterCity").value = state.filters.city || "";
  $("#filterHost").value = state.filters.host || "";
  $("#filterTeam").value = state.filters.team || "";
  $("#filterContinent").value = state.filters.continent || "";
  $("#filterTimeSlot").value = state.filters.timeSlot || "";
  renderMatches();
}

function saveCurrentPreset() {
  const name = prompt(t("prompt.presetName"), t("prompt.presetDefault"));
  if (!name?.trim()) return;
  const presets = loadPresets();
  presets.push({ name: name.trim(), ...getCurrentFilterSnapshot() });
  savePresets(presets);
  renderPresetSelect();
  showToast(t("toast.presetSaved", { name: name.trim() }));
}

function deleteCurrentPreset() {
  const idx = $("#presetSelect").value;
  if (!idx) {
    showToast(t("toast.presetDeleteSelect"), false);
    return;
  }
  const presets = loadPresets();
  const removed = presets.splice(Number(idx), 1)[0];
  savePresets(presets);
  renderPresetSelect();
  showToast(removed ? t("toast.presetDeleted", { name: removed.name }) : t("toast.presetDeletedShort"));
}

function showToast(msg, ok = true) {
  const el = $("#toastMsg");
  el.textContent = msg;
  el.hidden = false;
  el.className = `toast ${ok ? "toast--ok" : "toast--err"}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    el.hidden = true;
  }, 2800);
}

async function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportFilteredCalendar() {
  const list = getFilteredMatches();
  if (!list.length) {
    showToast(t("toast.exportNone"), false);
    return;
  }
  try {
    const res = await fetch(`${API}/api/calendar/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_ids: list.map((m) => String(m.id)) }),
    });
    if (!res.ok) throw new Error("export");
    const blob = await res.blob();
    await downloadBlob(blob, "worldcup-filtered.ics");
    showToast(t("toast.exportOk", { n: list.length }));
  } catch (err) {
    showToast(err.message, false);
  }
}

async function toggleSubscribe(matchId, btn) {
  try {
    const res = await fetch(`${API}/api/subscribe/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: String(matchId), action: "toggle" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "subscribe");
    state.subscribed = new Set(data.subscribed_matches.map(String));
    if (state.data) state.data.subscribed_match_ids = data.subscribed_matches;
    renderMatches();
    renderSubscribedList();
    if (btn) {
      btn.classList.toggle("btn-subscribe--active", isSubscribed(matchId));
      btn.textContent = isSubscribed(matchId) ? t("match.subscribed") : t("match.subscribe");
    }
  } catch (err) {
    alert(err.message);
  }
}

function renderHero() {
  const nm = state.data?.next_match;
  const timerEl = $("#countdownTimer");
  const matchEl = $("#heroMatch");
  const flagsEl = $("#heroFlags");

  if (!nm) {
    timerEl.textContent = "—";
    matchEl.textContent = t("hero.noMatch");
    flagsEl.innerHTML = "";
    return;
  }

  const kickoff = new Date(nm.date);
  const range = timeRange(nm);
  matchEl.innerHTML = `
    <strong>${teamDisplay(nm.home)}</strong> vs <strong>${teamDisplay(nm.away)}</strong><br/>
    <small>${t("hero.venueBJ", { time: range, venue: venueDisplay(nm.venue) })}</small>
  `;
  flagsEl.innerHTML = `
    <img src="${nm.home.flag}" alt="${teamDisplay(nm.home)}" onerror="this.style.display='none'" />
    <span class="vs">VS</span>
    <img src="${nm.away.flag}" alt="${teamDisplay(nm.away)}" onerror="this.style.display='none'" />
  `;

  function tick() {
    const diff = kickoff - Date.now();
    if (diff <= 0) {
      timerEl.textContent = t("hero.kickoffSoon");
      return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    timerEl.textContent = [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  }
  tick();
  clearInterval(state.countdownTimer);
  state.countdownTimer = setInterval(tick, 1000);
}

function renderMatches() {
  const grid = $("#matchGrid");
  const list = getFilteredMatches();

  $("#liveCount").textContent = state.data?.stats?.live_count ?? 0;
  updateFilterSummary(list);

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state">${hasActiveFilters() || state.filter !== "all" ? t("empty.noFilter") : t("empty.noCategory")}</div>`;
    return;
  }

  grid.innerHTML = list
    .map((m, i) => {
      const live = m.status === "in";
      const finished = m.status === "post";
      const showScore = live || finished;
      const o = m.odds || {};
      const sub = isSubscribed(m.id);
      const tip = matchTipDisplay(m);
      const slot = slotLabel(m.time_slot || "evening");
      const range = timeRange(m);

      return `
      <article class="match-card ${live ? "match-card--live" : ""} ${m.recommended ? "match-card--recommended" : ""}" style="--i:${i}">
        <div class="match-card__time">
          <strong>${fmtTimeOnly(m.date)}</strong>
          ${fmtDateDay(m.date)}
          <div class="match-card__status">${stageLabelFrom(m)} · ${slot}</div>
          <div class="match-card__range">${t("match.timeBJ", { range })}</div>
        </div>
        <div>
          ${tip ? `<p class="match-card__tip${m.recommended ? " match-card__tip--star" : ""}">${m.recommended ? "⭐ " : ""}${tip}</p>` : ""}
          <div class="match-card__teams">
            <div class="team">
              <img class="team__flag" src="${m.home.flag}" alt="" onerror="this.src=''" />
              <span class="team__name">${teamDisplay(m.home)}</span>
              ${showScore ? `<span class="team__score">${m.home.score}</span>` : ""}
            </div>
            <span class="match-card__vs">${showScore ? "—" : "VS"}</span>
            <div class="team team--away">
              <img class="team__flag" src="${m.away.flag}" alt="" onerror="this.src=''" />
              <span class="team__name">${teamDisplay(m.away)}</span>
              ${showScore ? `<span class="team__score">${m.away.score}</span>` : ""}
            </div>
          </div>
          <div class="match-card__venue">${pinSvg} ${venueDisplay(m.venue)}</div>
        </div>
        <div class="match-card__actions">
          <button type="button" class="btn-subscribe ${sub ? "btn-subscribe--active" : ""}" data-match-id="${m.id}">
            ${sub ? t("match.subscribed") : t("match.subscribe")}
          </button>
          <div class="match-card__odds">
            ${o.home_ml ? `<div class="odds-pill"><span>${t("match.home")}</span> ${o.home_ml} <span>(${o.home_implied ?? "-"}%)</span></div>` : ""}
            ${o.draw_ml ? `<div class="odds-pill"><span>${t("match.draw")}</span> ${o.draw_ml} <span>(${o.draw_implied ?? "-"}%)</span></div>` : ""}
            ${o.away_ml ? `<div class="odds-pill"><span>${t("match.away")}</span> ${o.away_ml} <span>(${o.away_implied ?? "-"}%)</span></div>` : ""}
            ${o.over_under ? `<div class="odds-pill"><span>O/U</span> ${o.over_under}</div>` : ""}
            ${o.spread_home ? `<div class="odds-pill"><span>${t("match.spread")}</span> ${o.spread_home}</div>` : ""}
          </div>
        </div>
      </article>`;
    })
    .join("");

  grid.querySelectorAll(".btn-subscribe").forEach((btn) => {
    btn.addEventListener("click", () => toggleSubscribe(btn.dataset.matchId, btn));
  });
}

function renderStandings() {
  const el = $("#standingsGrid");
  const groups = state.data?.standings || [];

  if (!groups.length) {
    el.innerHTML = `<div class="empty-state">${t("empty.standings")}</div>`;
    return;
  }

  el.innerHTML = groups
    .map(
      (g) => `
    <div class="group-table">
      <h3>${isZh() ? g.name_zh || g.name : g.name || g.name_zh}</h3>
      <table>
        <thead>
          <tr><th>#</th><th>${t("standings.thTeam")}</th><th>${t("standings.thPlayed")}</th><th>${t("standings.thW")}</th><th>${t("standings.thD")}</th><th>${t("standings.thL")}</th><th>${t("standings.thGFGA")}</th><th>${t("standings.thPts")}</th></tr>
        </thead>
        <tbody>
          ${g.entries
            .map(
              (e) => `
            <tr>
              <td>${e.rank}</td>
              <td><div class="team-cell">${e.flag ? `<img src="${e.flag}" alt="" />` : ""}${isZh() ? e.team_zh || e.team : e.team || e.team_zh}</div></td>
              <td>${e.played}</td><td>${e.wins}</td><td>${e.draws}</td><td>${e.losses}</td>
              <td>${e.gf}/${e.ga}</td><td><strong>${e.points}</strong></td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`
    )
    .join("");
}

function renderNews() {
  const el = $("#newsList");
  const news = state.data?.news || [];

  if (!news.length) {
    el.innerHTML = `<div class="empty-state">${t("empty.news")}</div>`;
    return;
  }

  el.innerHTML = news
    .map(
      (n, i) => `
    <a class="news-item" href="${n.link}" target="_blank" rel="noopener" style="--i:${i}">
      ${n.image ? `<img src="${n.image}" alt="" loading="lazy" />` : "<div></div>"}
      <div>
        <time>${n.published ? new Date(n.published).toLocaleDateString(localeForDates()) : ""}</time>
        <h4>${n.headline}</h4>
        <p>${n.description || ""}</p>
      </div>
    </a>`
    )
    .join("");
}

function renderPhases() {
  const el = $("#phaseList");
  const cal = state.data?.calendar || [];
  el.innerHTML = cal
    .map((p) => {
      const detail = isZh() ? p.detail_zh || p.detail : p.detail_zh || p.detail;
      return `<li><span>${phaseLabel(p)}</span><span>${detail}</span></li>`;
    })
    .join("");
}

function renderSubscribedList() {
  const el = $("#subscribedList");
  const ids = state.subscribed;
  if (!ids.size || !state.data?.matches) {
    el.innerHTML = `<li class="empty-state">${t("empty.subscribed")}</li>`;
    return;
  }
  const matches = state.data.matches.filter((m) => ids.has(String(m.id)));
  el.innerHTML = matches
    .map(
      (m) => `
    <li>
      <span class="sub-teams">
        <img src="${m.home.flag}" alt="" />
        ${teamDisplay(m.home)} vs ${teamDisplay(m.away)}
      </span>
      <button type="button" class="btn-subscribe btn-subscribe--active" data-unsub="${m.id}">${t("match.unsubscribe")}</button>
    </li>`
    )
    .join("");

  el.querySelectorAll("[data-unsub]").forEach((btn) => {
    btn.addEventListener("click", () => toggleSubscribe(btn.dataset.unsub));
  });
}

function render() {
  applyStaticI18n();
  updateRefreshIntervalLabels();
  populateFilterSelects();
  renderHero();
  renderMatches();
  renderStandings();
  renderNews();
  renderPhases();
  renderSubscribedList();
}

function setupTabs() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => t.classList.remove("tab--active"));
      $$(".panel").forEach((p) => p.classList.remove("panel--active"));
      tab.classList.add("tab--active");
      $(`#panel-${tab.dataset.tab}`).classList.add("panel--active");
    });
  });
}

function setupFilters() {
  $$(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".chip").forEach((c) => c.classList.remove("chip--active"));
      chip.classList.add("chip--active");
      state.filter = chip.dataset.filter;
      renderMatches();
    });
  });

  const bind = (id, key) => {
    $(id).addEventListener("change", () => {
      state.filters[key] = $(id).value;
      renderMatches();
    });
  };

  bind("#filterStage", "stage");
  bind("#filterDate", "date");
  bind("#filterVenue", "venue");
  bind("#filterCity", "city");
  bind("#filterHost", "host");
  bind("#filterTeam", "team");
  bind("#filterContinent", "continent");
  bind("#filterTimeSlot", "timeSlot");

  $("#filterReset").addEventListener("click", resetFilters);
  $("#presetSave").addEventListener("click", saveCurrentPreset);
  $("#presetDelete").addEventListener("click", deleteCurrentPreset);
  $("#presetSelect").addEventListener("change", () => {
    const idx = $("#presetSelect").value;
    if (!idx) return;
    const preset = loadPresets()[Number(idx)];
    if (preset) applyFilterSnapshot(preset);
  });
  $("#btnExportFiltered").addEventListener("click", exportFilteredCalendar);
  $("#btnExportSubscribed").addEventListener("click", (e) => {
    if (!state.subscribed.size) {
      e.preventDefault();
      showToast(t("toast.subFirst"), false);
    }
  });
}

function updateRefreshIntervalLabels() {
  $$("#refreshInterval option").forEach((opt) => {
    const n = opt.dataset.min || Math.round(parseInt(opt.value, 10) / 60);
    opt.textContent = t("masthead.refreshMin", { n });
  });
}

function setupRefresh() {
  function schedule() {
    clearInterval(state.refreshTimer);
    const sec = parseInt($("#refreshInterval").value, 10);
    state.refreshTimer = setInterval(() => fetchData(true).catch(showErr), sec * 1000);
  }
  $("#refreshInterval").addEventListener("change", schedule);
  schedule();
}

function setupLang() {
  const sel = $("#langSelect");
  WC_LANGS.forEach(({ code, label }) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = label;
    sel.appendChild(opt);
  });
  sel.value = getLang();
  sel.addEventListener("change", () => {
    setLang(sel.value, () => render());
  });
  onLangChange(() => render());
}

async function loadSubscribe() {
  try {
    const res = await fetch(`${API}/api/subscribe`);
    const cfg = await res.json();
    if (cfg.email) $("#notifyEmail").value = cfg.email;
    $("#notifyBefore").value = cfg.notify_before_minutes ?? 30;
    $("#autoEmailMin").value = cfg.auto_email_minutes ?? 60;
    $("#notifyPrematch").checked = cfg.notify_prematch !== false;
    $("#notifyScore").checked = cfg.notify_score_change !== false;
    $("#notifyEnabled").checked = !!cfg.enabled;
    state.subscribed = new Set((cfg.subscribed_matches || []).map(String));
  } catch (_) {}
}

function showNotify(msg, ok = true) {
  const el = $("#notifyStatus");
  el.textContent = msg;
  el.className = `notify-status ${ok ? "notify-status--ok" : "notify-status--err"}`;
}

function setupNotify() {
  $("#notifyForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      email: $("#notifyEmail").value,
      enabled: $("#notifyEnabled").checked,
      notify_before_minutes: parseInt($("#notifyBefore").value, 10),
      auto_email_minutes: parseInt($("#autoEmailMin").value, 10),
      notify_prematch: $("#notifyPrematch").checked,
      notify_score_change: $("#notifyScore").checked,
      subscribed_matches: Array.from(state.subscribed),
    };
    try {
      const res = await fetch(`${API}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "save");
      showNotify(body.enabled ? "OK" : "OK");
    } catch (err) {
      showNotify(err.message, false);
    }
  });

  $("#btnSendNow").addEventListener("click", async () => {
    const email = $("#notifyEmail").value;
    if (!email) {
      showNotify(t("notify.email"), false);
      return;
    }
    try {
      const res = await fetch(`${API}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "send");
      showNotify(`${data.sent_to}`);
    } catch (err) {
      showNotify(err.message, false);
    }
  });
}

function showErr(err) {
  $("#lastUpdate").textContent = t("error.generic", { msg: err.message });
}

function setupFilterMore() {
  const el = $(".filter-more");
  if (!el) return;
  const sync = () => {
    if (window.matchMedia("(min-width: 961px)").matches) {
      el.setAttribute("open", "");
    }
  };
  sync();
  window.addEventListener("resize", sync);
}

async function init() {
  setupLang();
  setupTabs();
  setupFilters();
  setupFilterMore();
  setupRefresh();
  setupNotify();
  applyStaticI18n();
  await loadSubscribe();
  await fetchData(false).catch(showErr);
}

init();
