"""iCalendar (.ics) 导出，兼容 Apple / Google / Outlook / Windows。"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional
from urllib.parse import quote

BJ = timezone(timedelta(hours=8))


def _ics_escape(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


def _fmt_ics_utc(iso: str) -> str:
    dt = datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(timezone.utc)
    return dt.strftime("%Y%m%dT%H%M%SZ")


def match_to_vevent(m: dict, reason: str = "") -> str:
    home = m["home"].get("name_zh") or m["home"]["name"]
    away = m["away"].get("name_zh") or m["away"]["name"]
    venue = m["venue"]
    loc = " · ".join(
        p
        for p in [
            venue.get("name_zh") or venue.get("name", ""),
            venue.get("city_zh") or venue.get("city", ""),
            venue.get("country_zh") or venue.get("country", ""),
        ]
        if p
    )
    stage = m.get("stage_zh", "")
    start = _fmt_ics_utc(m["date"])
    end_dt = datetime.fromisoformat(m["date"].replace("Z", "+00:00")) + timedelta(hours=2)
    end = end_dt.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    kickoff_bj = datetime.fromisoformat(m["date"].replace("Z", "+00:00")).astimezone(BJ)
    bj_str = kickoff_bj.strftime("%Y-%m-%d %H:%M")

    desc_parts = [
        f"{home} vs {away}",
        f"赛段：{stage}",
        f"北京时间：{bj_str}",
        f"球场：{loc}",
    ]
    if reason:
        desc_parts.insert(0, f"推荐：{reason}")
    o = m.get("odds", {})
    if o.get("over_under"):
        desc_parts.append(f"大小球 O/U {o['over_under']}")
    description = _ics_escape("\n".join(desc_parts))

    return f"""BEGIN:VEVENT
UID:wc2026-{m['id']}@worldcup-dashboard
DTSTAMP:{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}
DTSTART:{start}
DTEND:{end}
SUMMARY:{_ics_escape(f'⚽ {home} vs {away} · 2026世界杯')}
LOCATION:{_ics_escape(loc)}
DESCRIPTION:{description}
STATUS:CONFIRMED
END:VEVENT"""


def build_ics(matches: Iterable[dict], cal_name: str = "2026 世界杯赛程", reasons: Optional[dict] = None) -> str:
    reasons = reasons or {}
    events = "\n".join(match_to_vevent(m, reasons.get(str(m["id"]), "")) for m in matches)
    return f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//World Cup 2026 Dashboard//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:{_ics_escape(cal_name)}
{events}
END:VCALENDAR"""


def google_calendar_url(m: dict) -> str:
    """Google Calendar 一键添加链接。"""
    home = m["home"].get("name_zh") or m["home"]["name"]
    away = m["away"].get("name_zh") or m["away"]["name"]
    venue = m["venue"]
    loc = ", ".join(
        p
        for p in [
            venue.get("name_zh") or venue.get("name", ""),
            venue.get("city_zh") or venue.get("city", ""),
        ]
        if p
    )
    start = datetime.fromisoformat(m["date"].replace("Z", "+00:00")).astimezone(timezone.utc)
    end = start + timedelta(hours=2)
    fmt = lambda d: d.strftime("%Y%m%dT%H%M%SZ")
    params = {
        "action": "TEMPLATE",
        "text": f"{home} vs {away} · 2026世界杯",
        "dates": f"{fmt(start)}/{fmt(end)}",
        "details": f"{home} vs {away} · {m.get('stage_zh', '')}",
        "location": loc,
    }
    q = "&".join(f"{k}={quote(str(v))}" for k, v in params.items())
    return f"https://calendar.google.com/calendar/render?{q}"
