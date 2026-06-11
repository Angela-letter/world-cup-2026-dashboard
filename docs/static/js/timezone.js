/** Timezone helpers — UTC offset minutes, language defaults, local formatting */
const WC_TZ_OFFSET_KEY = "wc_tz_offset";
const WC_TZ_MANUAL_KEY = "wc_tz_manual";
const WC_TZ_FOLLOW = "follow";

const LANG_DEFAULT_TZ = {
  "zh-CN": 480,
  en: -300,
  ja: 540,
  es: -360,
  pt: -180,
  de: 60,
  fr: 60,
  ko: 540,
};

const TZ_CITY_HINTS = {
  "-720": "Baker Island",
  "-660": "Pago Pago",
  "-600": "Honolulu",
  "-540": "Anchorage",
  "-480": "Los Angeles",
  "-420": "Denver",
  "-360": "Mexico City",
  "-300": "New York",
  "-240": "Santiago",
  "-180": "São Paulo",
  "-120": "South Georgia",
  "-60": "Azores",
  0: "London",
  60: "Paris",
  120: "Cairo",
  180: "Moscow",
  240: "Dubai",
  300: "Karachi",
  330: "Mumbai",
  360: "Dhaka",
  420: "Bangkok",
  480: "Shanghai",
  540: "Tokyo",
  600: "Sydney",
  660: "Nouméa",
  720: "Auckland",
};

function _storedLang() {
  return localStorage.getItem("wc_lang") || "zh-CN";
}

let _offsetMinutes = parseInt(localStorage.getItem(WC_TZ_OFFSET_KEY) || "", 10);
if (Number.isNaN(_offsetMinutes)) {
  _offsetMinutes = LANG_DEFAULT_TZ[_storedLang()] ?? 480;
}

function isTzManual() {
  return localStorage.getItem(WC_TZ_MANUAL_KEY) === "true";
}

function getTzOffsetMinutes() {
  return _offsetMinutes;
}

function offsetToLabel(minutes) {
  const h = minutes / 60;
  if (h === 0) return "UTC";
  const sign = h > 0 ? "+" : "−";
  return `UTC${sign}${Math.abs(h)}`;
}

function tzLabel() {
  return offsetToLabel(_offsetMinutes);
}

function setTzOffset(minutes, { manual = true } = {}) {
  _offsetMinutes = minutes;
  localStorage.setItem(WC_TZ_OFFSET_KEY, String(minutes));
  if (manual) {
    localStorage.setItem(WC_TZ_MANUAL_KEY, "true");
  } else {
    localStorage.removeItem(WC_TZ_MANUAL_KEY);
  }
}

function applyLangDefaultTz() {
  const lang = typeof getLang === "function" ? getLang() : _storedLang();
  const def = LANG_DEFAULT_TZ[lang] ?? 480;
  setTzOffset(def, { manual: false });
}

function clearTzManualAndApplyLang() {
  localStorage.removeItem(WC_TZ_MANUAL_KEY);
  applyLangDefaultTz();
}

function _localParts(iso) {
  const d = new Date(iso);
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  const local = new Date(utcMs + _offsetMinutes * 60000);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
  };
}

function _pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTime(iso) {
  const p = _localParts(iso);
  return `${_pad2(p.hour)}:${_pad2(p.minute)}`;
}

function formatDateDay(iso) {
  const p = _localParts(iso);
  const loc = typeof localeForDates === "function" ? localeForDates() : "en-US";
  if (loc.startsWith("zh")) return `${p.month}月${p.day}日`;
  return `${p.month}/${p.day}`;
}

function formatDateShort(iso) {
  return `${formatDateDay(iso)} ${formatTime(iso)}`;
}

function formatRange(iso, durationMin = 120) {
  const start = formatTime(iso);
  const d = new Date(iso);
  const endIso = new Date(d.getTime() + durationMin * 60000).toISOString();
  return `${start}–${formatTime(endIso)}`;
}

function localDateKey(iso) {
  const p = _localParts(iso);
  return `${p.year}-${_pad2(p.month)}-${_pad2(p.day)}`;
}

function slotKeyFromHour(hour) {
  if (hour < 8) return "dawn";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function slotKey(iso) {
  return slotKeyFromHour(_localParts(iso).hour);
}

function slotLabelFor(iso) {
  const key = slotKey(iso);
  return typeof t === "function" ? t(`slot.${key}`) : key;
}

function slotSimpleKey(iso) {
  const h = _localParts(iso).hour;
  return h >= 8 && h < 18 ? "daytime" : "night";
}

function formatPhaseDetail(detail, useZh) {
  if (!detail) return "";
  if (useZh && /月/.test(detail)) return detail;

  const cross = detail.match(/^([A-Za-z]{3})\s+(\d+)-([A-Za-z]{3})\s+(\d+)$/);
  if (cross) {
    const months = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    const m1 = months[cross[1]] || cross[1];
    const m2 = months[cross[3]] || cross[3];
    if (useZh) return `${m1}月${cross[2]}日–${m2}月${cross[4]}日`;
    const names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${names[m1]} ${cross[2]}–${names[m2]} ${cross[4]}`;
  }

  const same = detail.match(/^([A-Za-z]{3})\s+(\d+)-(\d+)$/);
  if (same) {
    const months = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    const m = months[same[1]] || same[1];
    if (useZh) return `${m}月${same[2]}–${same[3]}日`;
    return `${same[1]} ${same[2]}–${same[3]}`;
  }

  const single = detail.match(/^([A-Za-z]{3})\s+(\d+)$/);
  if (single) {
    if (useZh) {
      const months = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
      const m = months[single[1]] || single[1];
      return `${m}月${single[2]}日`;
    }
    return `${single[1]} ${single[2]}`;
  }

  return detail;
}

function buildTzSelectOptions() {
  const opts = [];
  opts.push({ value: WC_TZ_FOLLOW, label: typeof t === "function" ? t("tz.followLang") : "Follow language" });
  for (let h = -12; h <= 14; h += 1) {
    const min = h * 60;
    const hint = TZ_CITY_HINTS[String(min)] || "";
    const label = hint ? `${offsetToLabel(min)} ${hint}` : offsetToLabel(min);
    opts.push({ value: String(min), label });
  }
  return opts;
}

function syncTzSelectValue() {
  const sel = document.getElementById("tzSelect");
  if (!sel) return;
  sel.value = isTzManual() ? String(_offsetMinutes) : WC_TZ_FOLLOW;
}
