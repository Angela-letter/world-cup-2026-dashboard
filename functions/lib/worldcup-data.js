import I18N from "./i18n-bundle.js";

const ESPN_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const ESPN_STANDINGS =
  "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";
const ESPN_NEWS =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news";

const STAR_TEAMS = new Set([
  "Brazil", "Argentina", "France", "Germany", "England", "Spain",
  "Portugal", "Netherlands", "Belgium", "Croatia", "Morocco", "Japan",
  "United States", "Mexico", "Uruguay", "Colombia",
]);
const HOST_TEAMS = new Set(["Mexico", "United States", "Canada"]);

const STAGE_TIPS = {
  "group-stage": "小组赛，积分关乎出线形势",
  "round-of-32": "32 强淘汰赛，一场定胜负",
  "round-of-16": "16 强激战，冷门与豪门同台",
  quarterfinal: "四分之一决赛，距四强一步之遥",
  semifinal: "半决赛，梦想与遗憾往往在此分野",
  "third-place": "三四名决赛，荣誉之战",
  final: "决赛夜，全球瞩目的冠军归属",
};

const RIVALRY = new Map([
  ["England|Scotland", "英伦德比，火药味十足"],
  ["Mexico|United States", "北美宿敌对决"],
  ["Argentina|Brazil", "南美超级德比"],
  ["Germany|Netherlands", "欧洲经典对抗"],
  ["Portugal|Spain", "伊比利亚半岛德比"],
  ["Japan|South Korea", "东亚德比，亚洲球迷必看"],
]);

const lookup = (map, key, fallback = key) => map[key] ?? fallback;

function pairKey(a, b) {
  return [a, b].sort().join("|");
}

function toBeijing(iso) {
  const t = new Date(iso).getTime() + 8 * 3600 * 1000;
  return new Date(t);
}

function bjHour(iso) {
  return toBeijing(iso).getUTCHours();
}

function fmtDateBJ(iso) {
  const d = toBeijing(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDateBJLabel(iso) {
  const d = toBeijing(iso);
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

function fmtTimeBJ(iso) {
  const d = toBeijing(iso);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

function timeSlotBj(hour) {
  if (hour < 8) return "dawn";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function timeSlotSimple(hour) {
  return hour >= 8 && hour < 18 ? "daytime" : "night";
}

function americanToImplied(odds) {
  if (odds == null) return null;
  const o = Number.parseInt(String(odds), 10);
  if (Number.isNaN(o)) return null;
  if (o > 0) return Math.round((100 / (o + 100)) * 1000) / 10;
  return Math.round((Math.abs(o) / (Math.abs(o) + 100)) * 1000) / 10;
}

function enrichTeam(team) {
  const name = team.name || "";
  const conf = lookup(I18N.TEAM_CONFEDERATION, name, "other");
  return {
    ...team,
    name_zh: lookup(I18N.TEAM_ZH, name),
    confederation: conf,
    confederation_zh: lookup(I18N.CONFEDERATION_ZH, conf, "其他"),
  };
}

function enrichVenue(venue) {
  return {
    ...venue,
    name_zh: lookup(I18N.VENUE_ZH, venue.name || ""),
    city_zh: lookup(I18N.CITY_ZH, venue.city || ""),
    country_zh: lookup(I18N.COUNTRY_ZH, venue.country || ""),
  };
}

function parseMatch(ev) {
  const comp = ev.competitions[0];
  let home = null;
  let away = null;
  for (const c of comp.competitors) {
    const team = enrichTeam({
      id: c.team.id,
      name: c.team.displayName,
      abbr: c.team.abbreviation || "",
      flag: c.team.logo || "",
      score: c.score ?? "0",
      record: c.records?.[0]?.summary || "",
    });
    if (c.homeAway === "home") home = team;
    else away = team;
  }

  const status = comp.status.type;
  const venue = enrichVenue({
    name: comp.venue?.fullName || "",
    city: comp.venue?.address?.city || "",
    country: comp.venue?.address?.country || "",
  });
  const oddsRaw = comp.odds?.[0] || {};
  const ml = oddsRaw.moneyline || {};
  const spread = oddsRaw.pointSpread || {};
  const total = oddsRaw.total || {};
  const stage = ev.season?.slug || "group-stage";
  const hour = bjHour(ev.date);
  const timeBj = fmtTimeBJ(ev.date);
  const endHour = (hour + 2) % 24;
  const timeBjEnd = `${String(endHour).padStart(2, "0")}:${timeBj.split(":")[1]}`;

  const homeMl =
    ml.home?.close?.odds ?? ml.home?.open?.odds ?? null;
  const awayMl =
    ml.away?.close?.odds ?? ml.away?.open?.odds ?? null;
  const drawMl =
    ml.draw?.close?.odds ?? ml.draw?.open?.odds ?? null;

  return {
    id: ev.id,
    date: ev.date,
    date_bj: fmtDateBJ(ev.date),
    date_bj_label: fmtDateBJLabel(ev.date),
    name: ev.name || "",
    stage,
    stage_zh: lookup(I18N.STAGE_ZH, stage),
    stage_category: lookup(I18N.STAGE_CATEGORY, stage, "other"),
    time_slot: timeSlotBj(hour),
    time_slot_simple: timeSlotSimple(hour),
    time_slot_zh: lookup(I18N.TIME_SLOT_ZH, timeSlotBj(hour)),
    time_bj: timeBj,
    time_bj_end: timeBjEnd,
    time_range_bj: `${timeBj}–${timeBjEnd}`,
    status: status.state || "pre",
    status_text: status.description || "",
    status_detail: status.detail || "",
    clock: comp.status?.displayClock || "",
    home,
    away,
    venue,
    broadcasts: comp.broadcasts?.[0]?.names || [],
    odds: {
      provider: oddsRaw.provider?.displayName || "DraftKings",
      over_under: oddsRaw.overUnder ?? null,
      home_ml: homeMl,
      away_ml: awayMl,
      draw_ml: drawMl,
      home_implied: americanToImplied(homeMl),
      away_implied: americanToImplied(awayMl),
      draw_implied: americanToImplied(drawMl),
      spread_home: spread.home?.close?.line ?? null,
      spread_away: spread.away?.close?.line ?? null,
      over_line: total.over?.close?.line ?? null,
      under_line: total.under?.close?.line ?? null,
    },
  };
}

function parseStandings(raw) {
  const groups = [];
  for (const child of raw.children || []) {
    const gname = child.name || child.abbreviation || "Group";
    const entries = [];
    for (const entry of child.standings?.entries || []) {
      const team = entry.team || {};
      const tname = team.displayName || "";
      const stats = Object.fromEntries(
        (entry.stats || []).map((s) => [s.name, s.displayValue ?? s.value ?? ""])
      );
      entries.push({
        rank: stats.rank || "",
        team: tname,
        team_zh: lookup(I18N.TEAM_ZH, tname),
        abbr: team.abbreviation || "",
        flag: team.logos?.[0]?.href || "",
        played: stats.gamesPlayed || "0",
        wins: stats.wins || "0",
        draws: stats.ties || "0",
        losses: stats.losses || "0",
        gf: stats.pointsFor || "0",
        ga: stats.pointsAgainst || "0",
        gd: stats.pointDifferential || "0",
        points: stats.points || "0",
      });
    }
    const nameZh = gname.startsWith("Group ")
      ? `${gname.replace("Group ", "")}组`
      : gname;
    groups.push({ name: gname, name_zh: nameZh, entries });
  }
  return groups;
}

function parseNews(raw, limit = 12) {
  return (raw.articles || []).slice(0, limit).map((item) => ({
    headline: item.headline || "",
    description: item.description || "",
    published: item.published || "",
    link: item.links?.web?.href || "",
    image: item.images?.[0]?.url || "",
  }));
}

function phaseDetailZh(detail) {
  if (!detail) return detail;
  const text = detail.trim();
  const cross = text.match(/^([A-Za-z]{3})\s+(\d+)-([A-Za-z]{3})\s+(\d+)$/);
  if (cross) {
    const [, m1, d1, m2, d2] = cross;
    return `${lookup(I18N.MONTH_ZH, m1)}${d1}日–${lookup(I18N.MONTH_ZH, m2)}${d2}日`;
  }
  const same = text.match(/^([A-Za-z]{3})\s+(\d+)-(\d+)$/);
  if (same) {
    const [, mon, d1, d2] = same;
    return `${lookup(I18N.MONTH_ZH, mon)}${d1}–${d2}日`;
  }
  const single = text.match(/^([A-Za-z]{3})\s+(\d+)$/);
  if (single) {
    const [, mon, day] = single;
    return `${lookup(I18N.MONTH_ZH, mon)}${day}日`;
  }
  return text;
}

function localizeCalendar(calendar) {
  return calendar.map((e) => ({
    ...e,
    label_zh: lookup(I18N.PHASE_ZH, e.label || ""),
    detail_zh: phaseDetailZh(e.detail || ""),
  }));
}

function googleCalendarUrl(m) {
  const home = m.home.name_zh || m.home.name;
  const away = m.away.name_zh || m.away.name;
  const loc = [m.venue.name_zh || m.venue.name, m.venue.city_zh || m.venue.city]
    .filter(Boolean)
    .join(", ");
  const start = new Date(m.date);
  const end = new Date(start.getTime() + 2 * 3600 * 1000);
  const fmt = (d) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${home} vs ${away} · 2026世界杯`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `${home} vs ${away} · ${m.stage_zh || ""}`,
    location: loc,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function matchTipFor(m, curated, reasons) {
  const mid = String(m.id);
  if (reasons[mid]) return reasons[mid];
  const home = m.home.name;
  const away = m.away.name;
  const key = pairKey(home, away);
  if (curated.has(key)) return curated.get(key);
  if (RIVALRY.has(key)) return RIVALRY.get(key);
  if (HOST_TEAMS.has(home) || HOST_TEAMS.has(away)) {
    const host = HOST_TEAMS.has(home) ? m.home.name_zh : m.away.name_zh;
    return `${host}主场作战，现场氛围拉满`;
  }
  const stars = [];
  if (STAR_TEAMS.has(home)) stars.push(m.home.name_zh);
  if (STAR_TEAMS.has(away)) stars.push(m.away.name_zh);
  if (stars.length === 2) return `${stars[0]} vs ${stars[1]}，球星云集的焦点战`;
  if (stars.length === 1) return `${stars[0]}出战，关注强队发挥`;
  const confs = new Set([m.home.confederation, m.away.confederation]);
  if (confs.has("uefa") && confs.has("caf")) return "欧亚或欧美风格碰撞，战术看点十足";
  if (confs.has("conmebol") && confs.has("uefa")) return "南美技术流迎战欧洲体系足球";
  if (confs.has("afc") && confs.has("uefa")) return "亚洲球队挑战欧洲劲旅";
  if (m.stage !== "group-stage") return STAGE_TIPS[m.stage] || "世界杯淘汰赛";
  return STAGE_TIPS["group-stage"];
}

function enrichMatches(matches) {
  const curated = new Map();
  for (const pick of I18N.NEW_FAN_PICKS) {
    curated.set(pairKey(pick.home, pick.away), pick.reason);
  }
  const index = new Map();
  for (const m of matches) {
    index.set(`${m.home.name}|${m.away.name}`, m.id);
    index.set(`${m.away.name}|${m.home.name}`, m.id);
  }
  const recIds = new Set();
  const reasons = {};
  for (const pick of I18N.NEW_FAN_PICKS) {
    const mid = index.get(`${pick.home}|${pick.away}`);
    if (mid) {
      recIds.add(String(mid));
      reasons[String(mid)] = pick.reason;
    }
  }
  for (const m of matches) {
    const mid = String(m.id);
    m.match_tip = matchTipFor(m, curated, reasons);
    m.recommended = recIds.has(mid);
    m.recommend_reason = reasons[mid] || "";
    m.google_calendar_url = googleCalendarUrl(m);
  }
  return { recIds, reasons };
}

function buildFilterOptions(matches) {
  const venues = {};
  const cities = {};
  const hostCountries = {};
  const teams = {};
  const dates = {};
  const continents = {};

  for (const m of matches) {
    const v = m.venue;
    if (v.name) {
      venues[v.name] = { value: v.name, label: v.name_zh || v.name, city: v.city_zh || "" };
    }
    if (v.city) cities[v.city] = { value: v.city, label: v.city_zh || v.city };
    if (v.country) {
      hostCountries[v.country] = {
        value: v.country,
        label: v.country_zh || v.country,
      };
    }
    if (m.date_bj) {
      dates[m.date_bj] = { value: m.date_bj, label: m.date_bj_label || m.date_bj };
    }
    for (const t of [m.home, m.away]) {
      teams[t.name] = {
        value: t.name,
        label: t.name_zh || t.name,
        confederation: t.confederation || "",
      };
      if (t.confederation) {
        continents[t.confederation] = {
          value: t.confederation,
          label: t.confederation_zh || lookup(I18N.CONFEDERATION_ZH, t.confederation),
        };
      }
    }
  }

  const sortByLabel = (items) => items.sort((a, b) => a.label.localeCompare(b.label, "zh"));
  return {
    venues: sortByLabel(Object.values(venues)),
    cities: sortByLabel(Object.values(cities)),
    host_countries: sortByLabel(Object.values(hostCountries)),
    teams: sortByLabel(Object.values(teams)),
    continents: sortByLabel(Object.values(continents)),
    dates: Object.values(dates).sort((a, b) => a.value.localeCompare(b.value)),
    stages: [
      { value: "group-stage", label: "小组赛" },
      { value: "knockout", label: "淘汰赛（全部）" },
      { value: "round-of-32", label: "32 强" },
      { value: "round-of-16", label: "16 强" },
      { value: "quarterfinal", label: "四分之一决赛" },
      { value: "semifinal", label: "半决赛" },
      { value: "third-place", label: "三四名决赛" },
      { value: "final", label: "决赛" },
    ],
    time_slots: [
      { value: "daytime", label: "早场·白天 (08:00–18:00)" },
      { value: "night", label: "晚场·夜间 (18:00–08:00)" },
      { value: "dawn", label: "凌晨场 (00:00–08:00)" },
      { value: "morning", label: "上午场 (08:00–12:00)" },
      { value: "afternoon", label: "下午场 (12:00–18:00)" },
      { value: "evening", label: "晚场 (18:00–24:00)" },
    ],
  };
}

function ymdOffset(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export async function fetchAllData() {
  const now = new Date();
  const matches = [];
  const seen = new Set();
  let calendar = [];

  for (let offset = 0; offset < 18; offset += 1) {
    const day = ymdOffset(offset - 1);
    try {
      const res = await fetch(`${ESPN_SCOREBOARD}?dates=${day}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (offset === 0) {
        for (const league of data.leagues || []) {
          for (const cal of league.calendar || []) {
            calendar = localizeCalendar(cal.entries || []);
          }
        }
      }
      for (const ev of data.events || []) {
        if (!seen.has(ev.id)) {
          seen.add(ev.id);
          matches.push(parseMatch(ev));
        }
      }
    } catch {
      // skip failed day
    }
  }

  let standings = [];
  let news = [];
  try {
    const sr = await fetch(ESPN_STANDINGS);
    if (sr.ok) standings = parseStandings(await sr.json());
  } catch {
    // ignore
  }
  try {
    const nr = await fetch(ESPN_NEWS);
    if (nr.ok) news = parseNews(await nr.json());
  } catch {
    // ignore
  }

  matches.sort((a, b) => a.date.localeCompare(b.date));
  const { recIds, reasons } = enrichMatches(matches);
  const live = matches.filter((m) => m.status === "in");
  const upcoming = matches.filter((m) => m.status === "pre");
  const finished = matches.filter((m) => m.status === "post");

  return {
    fetched_at: now.toISOString(),
    calendar,
    filter_options: buildFilterOptions(matches),
    matches,
    live,
    upcoming: upcoming.slice(0, 20),
    finished: finished.slice(-10),
    next_match: upcoming[0] || null,
    standings,
    news,
    subscribed_match_ids: [],
    subscribed_matches_preview: [],
    recommended_match_ids: [...recIds],
    recommend_reasons: reasons,
    stats: {
      total_matches: matches.length,
      live_count: live.length,
      upcoming_count: upcoming.length,
      subscribed_count: 0,
      recommended_count: [...recIds].length,
    },
  };
}
