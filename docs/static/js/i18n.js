/** UI i18n — 8 languages, localStorage persistence */
const WC_LANG_KEY = "wc_lang";
const WC_DEFAULT_LANG = "zh-CN";

const WC_LANGS = [
  { code: "zh-CN", label: "简体中文" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "ko", label: "한국어" },
];

const STRINGS = {
  "zh-CN": {
    "page.title": "2026 世界杯 · 观赛指挥台",
    "masthead.titleHtml": "世界杯 <em>观赛指挥台</em>",
    "masthead.sub": "美加墨 · 48 队 · 实时赛程 · 赔率 · 积分 · 邮件推送",
    "masthead.updated": "更新于 {time}",
    "masthead.syncing": "同步中…",
    "masthead.autoRefresh": "自动刷新",
    "masthead.refreshMin": "{n} 分钟",
    "tab.matches": "赛程",
    "tab.standings": "积分榜",
    "tab.news": "资讯",
    "tab.notify": "邮件推送",
    "hero.label": "距下一场比赛",
    "hero.noMatch": "暂无即将开始的比赛",
    "hero.kickoffSoon": "即将开赛",
    "hero.venueLine": "{date} {range} ({tz}) · {venue}",
    "tz.followLang": "跟随语言默认",
    "tz.browser": "本机时区",
    "tz.label": "时区",
    "demo.banner": "演示模式 — 静态快照数据，只读浏览",
    "filter.status": "状态",
    "filter.all": "全部",
    "filter.live": "进行中",
    "filter.upcoming": "未开始",
    "filter.finished": "已结束",
    "filter.recommended": "新球迷推荐",
    "filter.more": "更多筛选 · 赛段 / 球场 / 球队",
    "filter.stage": "赛段",
    "filter.date": "日期",
    "filter.venue": "体育场",
    "filter.city": "城市",
    "filter.host": "举办国",
    "filter.team": "参赛队",
    "filter.continent": "洲别",
    "filter.timeSlot": "开球时段",
    "filter.reset": "重置",
    "filter.preset": "常用筛选…",
    "filter.save": "保存",
    "filter.delete": "删除",
    "filter.total": "共 {n} 场",
    "filter.summary": "{parts} · {count}/{total}",
    "filter.allStage": "全部赛段",
    "filter.allDate": "全部日期",
    "filter.allVenue": "全部球场",
    "filter.allCity": "全部城市",
    "filter.allHost": "全部举办国",
    "filter.allTeam": "全部球队",
    "filter.allContinent": "全部大洲",
    "filter.allTimeSlot": "全部时段",
    "calendar.title": "日历",
    "calendar.exportFiltered": "导出当前筛选",
    "calendar.recommended": "新球迷推荐赛程",
    "calendar.subscribed": "我的订阅赛程",
    "match.subscribe": "订阅",
    "match.subscribed": "已订阅",
    "match.unsubscribe": "取消",
    "match.home": "主胜",
    "match.draw": "平局",
    "match.away": "客胜",
    "match.spread": "让球",
    "match.timeLocal": "{range} ({tz})",
    "empty.noFilter": "没有符合筛选条件的比赛",
    "empty.noCategory": "该分类暂无比赛",
    "empty.standings": "积分榜数据尚未更新",
    "empty.news": "暂无资讯",
    "empty.subscribed": "在赛程页点击「订阅」添加",
    "notify.title": "邮件推送（可选）",
    "notify.desc": "发件需配置 QQ SMTP（环境变量 QQ_EMAIL_ACCOUNT / QQ_EMAIL_AUTH_CODE）；收件可为任意邮箱（Gmail、Outlook、163 等）。在赛程卡点击「订阅」，保存邮箱并勾选「启用自动推送」。日历导出见右上角「日历」。",
    "notify.email": "收件邮箱",
    "notify.before": "赛前提醒（分钟）",
    "notify.interval": "定时简报间隔（分钟）",
    "notify.prematch": "赛前提醒",
    "notify.score": "比分变化",
    "notify.enabled": "启用自动推送",
    "notify.save": "保存订阅",
    "notify.sendNow": "立即发送简报",
    "notify.subscribedTitle": "已订阅比赛",
    "notify.subscribedDesc": "订阅后将在开赛、比分变化、完场、小组积分变动时推送邮件。",
    "sidebar.phases": "赛事阶段",
    "sidebar.legend": "数据说明",
    "sidebar.oddsNote": "赔率来源 ESPN / DraftKings，仅供参考。",
    "legend.ml": "胜平负美式赔率",
    "legend.pct": "隐含胜率",
    "legend.ou": "大小球盘口",
    "legend.sp": "让球盘",
    "footer.disclaimer": "非投注建议",
    "footer.github": "GitHub ★",
    "star.title": "觉得好用？",
    "star.body": "给开源项目点个 Star，支持我们继续维护赛程与功能。",
    "star.cta": "⭐ Star on GitHub",
    "star.dismiss": "下次再说",
    "slot.dawn": "凌晨场 (00:00–08:00)",
    "slot.morning": "上午场 (08:00–12:00)",
    "slot.afternoon": "下午场 (12:00–18:00)",
    "slot.evening": "晚场 (18:00–24:00)",
    "slot.daytime": "早场·白天 (08:00–18:00)",
    "slot.night": "晚场·夜间 (18:00–08:00)",
    "stage.group-stage": "小组赛",
    "stage.round-of-32": "32 强",
    "stage.round-of-16": "16 强",
    "stage.quarterfinal": "四分之一决赛",
    "stage.semifinal": "半决赛",
    "stage.third-place": "三四名决赛",
    "stage.final": "决赛",
    "stage.knockout": "淘汰赛（全部）",
    "standings.thTeam": "球队",
    "standings.thPlayed": "赛",
    "standings.thW": "胜",
    "standings.thD": "平",
    "standings.thL": "负",
    "standings.thGFGA": "进/失",
    "standings.thPts": "分",
    "tip.group": "小组赛，积分关乎出线形势",
    "tip.knockout": "淘汰赛，一场定胜负",
    "error.load": "数据加载失败",
    "error.generic": "错误: {msg}",
    "toast.exportNone": "当前筛选无比赛可导出",
    "toast.exportOk": "已导出 {n} 场比赛到日历文件",
    "toast.subFirst": "请先订阅至少一场比赛",
    "toast.presetDeleteSelect": "请先选择要删除的组合",
    "toast.presetSaved": "已保存「{name}」",
    "toast.presetDeleted": "已删除「{name}」",
    "toast.presetDeletedShort": "已删除",
    "prompt.presetName": "给这套筛选起个名字：",
    "prompt.presetDefault": "我的观赛清单",
    "chip.live": "进行中",
    "chip.upcoming": "未开始",
    "chip.finished": "已结束",
    "chip.recommended": "新球迷推荐",
  },
  en: {
    "page.title": "2026 World Cup · Match Center",
    "masthead.titleHtml": "World Cup <em>Match Center</em>",
    "masthead.sub": "USA · Canada · Mexico · 48 teams · Live schedule · Odds · Standings · Email alerts",
    "masthead.updated": "Updated {time}",
    "masthead.syncing": "Syncing…",
    "masthead.autoRefresh": "Auto refresh",
    "masthead.refreshMin": "{n} min",
    "tab.matches": "Matches",
    "tab.standings": "Standings",
    "tab.news": "News",
    "tab.notify": "Email alerts",
    "hero.label": "Next match in",
    "hero.noMatch": "No upcoming matches",
    "hero.kickoffSoon": "Kickoff soon",
    "hero.venueLine": "{date} {range} ({tz}) · {venue}",
    "tz.followLang": "Follow language default",
    "tz.browser": "Browser local",
    "tz.label": "Timezone",
    "demo.banner": "Demo mode — snapshot data, read-only",
    "filter.status": "Status",
    "filter.all": "All",
    "filter.live": "Live",
    "filter.upcoming": "Upcoming",
    "filter.finished": "Finished",
    "filter.recommended": "Fan picks",
    "filter.more": "More filters · Stage / Venue / Team",
    "filter.stage": "Stage",
    "filter.date": "Date",
    "filter.venue": "Stadium",
    "filter.city": "City",
    "filter.host": "Host nation",
    "filter.team": "Team",
    "filter.continent": "Confederation",
    "filter.timeSlot": "Kickoff slot",
    "filter.reset": "Reset",
    "filter.preset": "Saved filters…",
    "filter.save": "Save",
    "filter.delete": "Delete",
    "filter.total": "{n} matches",
    "filter.summary": "{parts} · {count}/{total}",
    "filter.allStage": "All stages",
    "filter.allDate": "All dates",
    "filter.allVenue": "All stadiums",
    "filter.allCity": "All cities",
    "filter.allHost": "All hosts",
    "filter.allTeam": "All teams",
    "filter.allContinent": "All confederations",
    "filter.allTimeSlot": "All slots",
    "calendar.title": "Calendar",
    "calendar.exportFiltered": "Export filtered",
    "calendar.recommended": "Fan picks (.ics)",
    "calendar.subscribed": "My subscriptions (.ics)",
    "match.subscribe": "Subscribe",
    "match.subscribed": "Subscribed",
    "match.unsubscribe": "Remove",
    "match.home": "Home",
    "match.draw": "Draw",
    "match.away": "Away",
    "match.spread": "Spread",
    "match.timeLocal": "{range} ({tz})",
    "empty.noFilter": "No matches match your filters",
    "empty.noCategory": "No matches in this category",
    "empty.standings": "Standings not available yet",
    "empty.news": "No news yet",
    "empty.subscribed": "Tap Subscribe on a match card",
    "notify.title": "Email alerts (optional)",
    "notify.desc": "Sending uses QQ SMTP (set QQ_EMAIL_ACCOUNT / QQ_EMAIL_AUTH_CODE). Any inbox works—Gmail, Outlook, Yahoo, etc. Subscribe on match cards, save your email, and enable auto alerts. Calendar export is in the top-right menu.",
    "notify.email": "Recipient email",
    "notify.before": "Pre-match reminder (min)",
    "notify.interval": "Digest interval (min)",
    "notify.prematch": "Pre-match",
    "notify.score": "Score changes",
    "notify.enabled": "Enable auto alerts",
    "notify.save": "Save settings",
    "notify.sendNow": "Send digest now",
    "notify.subscribedTitle": "Subscribed matches",
    "notify.subscribedDesc": "Alerts for kickoff, score changes, full-time, and group table updates.",
    "sidebar.phases": "Tournament phases",
    "sidebar.legend": "Odds legend",
    "sidebar.oddsNote": "Odds from ESPN / DraftKings. For reference only.",
    "legend.ml": "Moneyline (American)",
    "legend.pct": "Implied win %",
    "legend.ou": "Over/Under",
    "legend.sp": "Point spread",
    "footer.disclaimer": "Not betting advice",
    "footer.github": "GitHub ★",
    "star.title": "Enjoying the dashboard?",
    "star.body": "Star the project on GitHub — it helps us keep schedules and features updated.",
    "star.cta": "⭐ Star on GitHub",
    "star.dismiss": "Not now",
    "slot.dawn": "Late night (00:00–08:00)",
    "slot.morning": "Morning (08:00–12:00)",
    "slot.afternoon": "Afternoon (12:00–18:00)",
    "slot.evening": "Evening (18:00–24:00)",
    "slot.daytime": "Daytime (08:00–18:00)",
    "slot.night": "Night (18:00–08:00)",
    "stage.group-stage": "Group stage",
    "stage.round-of-32": "Round of 32",
    "stage.round-of-16": "Round of 16",
    "stage.quarterfinal": "Quarter-finals",
    "stage.semifinal": "Semi-finals",
    "stage.third-place": "Third-place",
    "stage.final": "Final",
    "stage.knockout": "Knockout (all)",
    "standings.thTeam": "Team",
    "standings.thPlayed": "P",
    "standings.thW": "W",
    "standings.thD": "D",
    "standings.thL": "L",
    "standings.thGFGA": "GF/GA",
    "standings.thPts": "Pts",
    "tip.group": "Group match—points matter for qualification",
    "tip.knockout": "Knockout—win or go home",
    "error.load": "Failed to load data",
    "error.generic": "Error: {msg}",
    "toast.exportNone": "No matches to export",
    "toast.exportOk": "Exported {n} matches",
    "toast.subFirst": "Subscribe to at least one match first",
    "toast.presetDeleteSelect": "Select a saved filter to delete",
    "toast.presetSaved": "Saved “{name}”",
    "toast.presetDeleted": "Deleted “{name}”",
    "toast.presetDeletedShort": "Deleted",
    "prompt.presetName": "Name this filter set:",
    "prompt.presetDefault": "My watchlist",
    "chip.live": "Live",
    "chip.upcoming": "Upcoming",
    "chip.finished": "Finished",
    "chip.recommended": "Fan picks",
  },
};

// Extend other languages from EN with localized overrides
Object.assign(STRINGS, {
  ja: {
    ...STRINGS.en,
    "page.title": "2026 ワールドカップ · 試合センター",
    "masthead.titleHtml": "ワールドカップ <em>観戦センター</em>",
    "masthead.sub": "米加墨 · 48チーム · 日程 · オッズ · 順位表 · メール通知",
    "star.title": "便利ですか？",
    "star.body": "GitHub で Star をいただけると、今後の更新の励みになります。",
    "star.cta": "⭐ GitHub で Star",
    "star.dismiss": "あとで",
    "masthead.updated": "更新 {time}",
    "masthead.syncing": "同期中…",
    "masthead.autoRefresh": "自動更新",
    "masthead.refreshMin": "{n} 分",
    "tab.matches": "試合",
    "tab.standings": "順位",
    "tab.news": "ニュース",
    "tab.notify": "メール通知",
    "hero.label": "次の試合まで",
    "hero.noMatch": "予定された試合はありません",
    "hero.kickoffSoon": "まもなくキックオフ",
    "filter.all": "すべて",
    "filter.live": "進行中",
    "filter.upcoming": "未開始",
    "filter.finished": "終了",
    "filter.recommended": "おすすめ",
    "calendar.title": "カレンダー",
    "match.subscribe": "登録",
    "match.subscribed": "登録済み",
    "notify.title": "メール通知（任意）",
    "footer.disclaimer": "賭けのアドバイスではありません",
    "stage.group-stage": "グループステージ",
    "stage.final": "決勝",
  },
  es: {
    ...STRINGS.en,
    "page.title": "Mundial 2026 · Centro de partidos",
    "masthead.titleHtml": "Mundial <em>Centro de partidos</em>",
    "masthead.sub": "EE.UU. · Canadá · México · 48 selecciones · Calendario · Cuotas · Clasificación",
    "star.title": "¿Te resulta útil?",
    "star.body": "Dale una Star en GitHub y ayúdanos a seguir mejorando el calendario.",
    "star.cta": "⭐ Star en GitHub",
    "star.dismiss": "Ahora no",
    "masthead.updated": "Actualizado {time}",
    "masthead.syncing": "Sincronizando…",
    "masthead.autoRefresh": "Autoactualizar",
    "masthead.refreshMin": "{n} min",
    "tab.matches": "Partidos",
    "tab.standings": "Clasificación",
    "tab.news": "Noticias",
    "tab.notify": "Alertas email",
    "hero.label": "Próximo partido en",
    "filter.all": "Todos",
    "filter.live": "En vivo",
    "filter.upcoming": "Próximos",
    "filter.finished": "Finalizados",
    "calendar.title": "Calendario",
    "match.subscribe": "Suscribir",
    "stage.group-stage": "Fase de grupos",
    "stage.final": "Final",
    "footer.disclaimer": "No es consejo de apuestas",
  },
  pt: {
    ...STRINGS.en,
    "page.title": "Copa 2026 · Central de jogos",
    "masthead.titleHtml": "Copa <em>Central de jogos</em>",
    "masthead.sub": "EUA · Canadá · México · 48 seleções · Calendário · Odds · Classificação",
    "star.title": "Está gostando?",
    "star.body": "Deixe uma Star no GitHub — isso nos ajuda a manter o projeto.",
    "star.cta": "⭐ Star no GitHub",
    "star.dismiss": "Depois",
    "masthead.updated": "Atualizado {time}",
    "masthead.syncing": "Sincronizando…",
    "masthead.autoRefresh": "Atualização automática",
    "tab.matches": "Jogos",
    "tab.standings": "Classificação",
    "tab.news": "Notícias",
    "tab.notify": "Alertas por email",
    "hero.label": "Próximo jogo em",
    "filter.all": "Todos",
    "filter.live": "Ao vivo",
    "calendar.title": "Calendário",
    "match.subscribe": "Inscrever",
    "stage.group-stage": "Fase de grupos",
    "stage.final": "Final",
  },
  de: {
    ...STRINGS.en,
    "page.title": "WM 2026 · Spielzentrale",
    "masthead.titleHtml": "WM <em>Spielzentrale</em>",
    "masthead.sub": "USA · Kanada · Mexiko · 48 Teams · Spielplan · Quoten · Tabelle",
    "star.title": "Gefällt dir die Seite?",
    "star.body": "Gib uns einen Star auf GitHub — das hilft bei weiteren Updates.",
    "star.cta": "⭐ Star auf GitHub",
    "star.dismiss": "Später",
    "masthead.updated": "Aktualisiert {time}",
    "masthead.syncing": "Synchronisiere…",
    "masthead.autoRefresh": "Auto-Aktualisierung",
    "tab.matches": "Spiele",
    "tab.standings": "Tabelle",
    "tab.news": "News",
    "tab.notify": "E-Mail-Alerts",
    "hero.label": "Nächstes Spiel in",
    "filter.all": "Alle",
    "filter.live": "Live",
    "calendar.title": "Kalender",
    "match.subscribe": "Abonnieren",
    "stage.group-stage": "Gruppenphase",
    "stage.final": "Finale",
  },
  fr: {
    ...STRINGS.en,
    "page.title": "Coupe du monde 2026 · Centre matchs",
    "masthead.titleHtml": "Coupe du monde <em>Centre matchs</em>",
    "masthead.sub": "États-Unis · Canada · Mexique · 48 équipes · Calendrier · Cotes · Classement",
    "star.title": "Ça vous plaît ?",
    "star.body": "Une étoile sur GitHub nous aide à faire évoluer le calendrier.",
    "star.cta": "⭐ Star sur GitHub",
    "star.dismiss": "Plus tard",
    "masthead.updated": "Mis à jour {time}",
    "masthead.syncing": "Synchronisation…",
    "masthead.autoRefresh": "Rafraîchissement auto",
    "tab.matches": "Matchs",
    "tab.standings": "Classement",
    "tab.news": "Actus",
    "tab.notify": "Alertes email",
    "hero.label": "Prochain match dans",
    "filter.all": "Tous",
    "filter.live": "En direct",
    "calendar.title": "Calendrier",
    "match.subscribe": "S'abonner",
    "stage.group-stage": "Phase de groupes",
    "stage.final": "Finale",
  },
  ko: {
    ...STRINGS.en,
    "page.title": "2026 월드컵 · 경기 센터",
    "masthead.titleHtml": "월드컵 <em>경기 센터</em>",
    "masthead.sub": "미국 · 캐나다 · 멕시코 · 48개국 · 일정 · 배당 · 순위 · 이메일 알림",
    "star.title": "마음에 드시나요?",
    "star.body": "GitHub에서 Star를 눌러 주시면 개발에 큰 힘이 됩니다.",
    "star.cta": "⭐ GitHub Star",
    "star.dismiss": "나중에",
    "masthead.updated": "업데이트 {time}",
    "masthead.syncing": "동기화 중…",
    "masthead.autoRefresh": "자동 새로고침",
    "masthead.refreshMin": "{n}분",
    "tab.matches": "경기",
    "tab.standings": "순위",
    "tab.news": "뉴스",
    "tab.notify": "이메일 알림",
    "hero.label": "다음 경기까지",
    "filter.all": "전체",
    "filter.live": "진행 중",
    "filter.upcoming": "예정",
    "filter.finished": "종료",
    "calendar.title": "캘린더",
    "match.subscribe": "구독",
    "match.subscribed": "구독 중",
    "stage.group-stage": "조별리그",
    "stage.final": "결승",
    "footer.disclaimer": "베팅 조언이 아닙니다",
  },
});

const PHASE_LABELS = {
  Group: { "zh-CN": "小组赛", en: "Group stage", ja: "グループ", es: "Grupos", pt: "Grupos", de: "Gruppenphase", fr: "Groupes", ko: "조별리그" },
  "Round of 32": { en: "Round of 32", "zh-CN": "32 强", ja: "ラウンド32", es: "Dieciseisavos", pt: "32 avos", de: "Achtzehntelfinale", fr: "Seizièmes", ko: "32강" },
  "Rd of 16": { en: "Round of 16", "zh-CN": "16 强", ja: "ベスト16", es: "Octavos", pt: "Oitavas", de: "Achtelfinale", fr: "Huitièmes", ko: "16강" },
  Quarterfinals: { en: "Quarter-finals", "zh-CN": "四分之一决赛", ja: "準々決勝", es: "Cuartos", pt: "Quartas", de: "Viertelfinale", fr: "Quarts", ko: "8강" },
  Semifinals: { en: "Semi-finals", "zh-CN": "半决赛", ja: "準決勝", es: "Semifinal", pt: "Semifinal", de: "Halbfinale", fr: "Demi-finales", ko: "준결승" },
  "3rd-Place Match": { en: "Third place", "zh-CN": "三四名决赛", ja: "3位決定戦", es: "Tercer puesto", pt: "3º lugar", de: "Spiel um Platz 3", fr: "Match pour la 3e place", ko: "3·4위전" },
  Final: { en: "Final", "zh-CN": "决赛", ja: "決勝", es: "Final", pt: "Final", de: "Finale", fr: "Finale", ko: "결승" },
};

let _lang = localStorage.getItem(WC_LANG_KEY) || WC_DEFAULT_LANG;
let _onChange = null;

function getLang() {
  return _lang;
}

function isZh() {
  return _lang === "zh-CN";
}

function t(key, vars = {}) {
  const bag = STRINGS[_lang] || STRINGS.en;
  let s = bag[key] ?? STRINGS.en[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  });
  return s;
}

function setLang(code, onChange) {
  if (!STRINGS[code]) code = WC_DEFAULT_LANG;
  _lang = code;
  localStorage.setItem(WC_LANG_KEY, code);
  document.documentElement.lang = code;
  document.title = t("page.title");
  if (typeof isTzManual === "function" && !isTzManual() && typeof applyLangDefaultTz === "function") {
    applyLangDefaultTz();
    if (typeof syncTzSelectValue === "function") syncTzSelectValue();
  }
  if (onChange) onChange();
  if (_onChange) _onChange();
}

function onLangChange(fn) {
  _onChange = fn;
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.dataset.i18nHtml;
    if (key) el.innerHTML = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (key) el.placeholder = t(key);
  });
  const sel = document.getElementById("langSelect");
  if (sel) sel.value = _lang;
}

function slotLabel(slot) {
  return t(`slot.${slot}`) || slot;
}

function stageLabelFrom(m) {
  const slug = m?.stage || "group-stage";
  return t(`stage.${slug}`) || m?.stage_zh || slug;
}

function phaseLabel(p) {
  const map = PHASE_LABELS[p?.label];
  if (map) return map[_lang] || map.en || p.label_zh || p.label;
  return isZh() ? p?.label_zh || p?.label : p?.label || p?.label_zh;
}

function teamDisplay(t) {
  if (!t) return "";
  return isZh() ? t.name_zh || t.name : t.name || t.name_zh;
}

function venueDisplay(v) {
  if (!v) return "—";
  const name = isZh() ? v.name_zh || v.name : v.name || v.name_zh;
  const city = isZh() ? v.city_zh || v.city : v.city || v.city_zh;
  const country = isZh() ? v.country_zh || v.country : v.country || v.country_zh;
  const parts = [name, city];
  if (country && country !== city) parts.push(country);
  return parts.filter(Boolean).join(" · ");
}

function matchTipDisplay(m) {
  if (isZh()) return m.match_tip || m.recommend_reason || "";
  const home = m.home?.name || "";
  const away = m.away?.name || "";
  if (m.recommended && m.recommend_reason && !isZh()) {
    return `${home} vs ${away} — fan pick`;
  }
  if (m.stage && m.stage !== "group-stage") return t("tip.knockout");
  return t("tip.group");
}

function localeForDates() {
  const map = { "zh-CN": "zh-CN", en: "en-US", ja: "ja-JP", es: "es-ES", pt: "pt-BR", de: "de-DE", fr: "fr-FR", ko: "ko-KR" };
  return map[_lang] || "en-US";
}

function fmtDateShort(iso) {
  return typeof formatDateShort === "function" ? formatDateShort(iso) : iso;
}

function fmtTimeOnly(iso) {
  return typeof formatTime === "function" ? formatTime(iso) : iso;
}

function fmtDateDay(iso) {
  return typeof formatDateDay === "function" ? formatDateDay(iso) : iso;
}

function chipFilterLabel(filter) {
  const map = { all: "filter.all", live: "chip.live", upcoming: "chip.upcoming", finished: "chip.finished", recommended: "chip.recommended" };
  return t(map[filter] || "filter.all");
}

// init lang on load
document.documentElement.lang = _lang;
