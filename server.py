"""2026 FIFA World Cup dashboard — ESPN data proxy, QQ email alerts, match subscriptions."""

from __future__ import annotations

import asyncio
import json
import os
import smtplib
import threading
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from calendar_export import build_ics, google_calendar_url
from email_templates import build_alert_email, build_digest_email
from i18n import (
    city_zh,
    confederation_of,
    confederation_zh,
    country_zh,
    group_zh,
    phase_detail_zh,
    phase_zh,
    stage_category,
    stage_zh,
    team_zh,
    time_slot_bj,
    time_slot_label,
    time_slot_simple,
    venue_zh,
)
from match_tips import enrich_match_tips

load_dotenv()

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
CONFIG_PATH = BASE_DIR / "notify_config.json"
STATE_PATH = BASE_DIR / "alert_state.json"
ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"
TOURNAMENT_START = datetime(2026, 6, 11, tzinfo=timezone.utc).date()
TOURNAMENT_END = datetime(2026, 7, 19, tzinfo=timezone.utc).date()
SCOREBOARD_LOOKAHEAD_DAYS = 16
ESPN_STANDINGS = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings"
ESPN_NEWS = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news"

_cache: dict[str, Any] = {"data": None, "fetched_at": None}
_lock = threading.Lock()

app = FastAPI(title="World Cup 2026 Dashboard")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SubscribeBody(BaseModel):
    email: str
    enabled: bool = True
    notify_before_minutes: int = Field(default=30, ge=5, le=180)
    auto_email_minutes: int = Field(default=60, ge=15, le=360)
    notify_score_change: bool = True
    notify_prematch: bool = True
    subscribed_matches: list[str] = Field(default_factory=list)


class SendEmailBody(BaseModel):
    email: Optional[str] = None


class MatchSubscribeBody(BaseModel):
    match_id: str
    action: str = "toggle"  # add | remove | toggle


class CalendarExportBody(BaseModel):
    match_ids: list[str] = Field(default_factory=list)


def load_config() -> dict:
    default = {
        "email": "",
        "enabled": False,
        "notify_before_minutes": 30,
        "auto_email_minutes": 60,
        "notify_score_change": True,
        "notify_prematch": True,
        "subscribed_matches": [],
    }
    if CONFIG_PATH.exists():
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        default.update(cfg)
        if "subscribed_matches" not in cfg:
            default["subscribed_matches"] = []
        return default
    return default


def save_config(cfg: dict) -> None:
    CONFIG_PATH.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")


def load_alert_state() -> dict:
    default = {
        "scores": {},
        "status": {},
        "standings": {},
        "notified_prematch": [],
        "notified_kickoff": [],
        "notified_fulltime": [],
    }
    if STATE_PATH.exists():
        return {**default, **json.loads(STATE_PATH.read_text(encoding="utf-8"))}
    return default


def save_alert_state(state: dict) -> None:
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def american_to_implied(odds: Any) -> Optional[float]:
    if odds is None:
        return None
    try:
        o = int(odds)
    except (TypeError, ValueError):
        return None
    if o > 0:
        return round(100 / (o + 100) * 100, 1)
    return round(abs(o) / (abs(o) + 100) * 100, 1)


def enrich_team(team_data: dict) -> dict:
    name = team_data.get("name", "")
    conf = confederation_of(name)
    team_data["name_zh"] = team_zh(name)
    team_data["confederation"] = conf
    team_data["confederation_zh"] = confederation_zh(conf)
    return team_data


def enrich_venue(venue: dict) -> dict:
    venue["name_zh"] = venue_zh(venue.get("name", ""))
    venue["city_zh"] = city_zh(venue.get("city", ""))
    venue["country_zh"] = country_zh(venue.get("country", ""))
    return venue


def parse_match(ev: dict) -> dict:
    comp = ev["competitions"][0]
    home = away = None
    for c in comp["competitors"]:
        team = enrich_team({
            "id": c["team"]["id"],
            "name": c["team"]["displayName"],
            "abbr": c["team"].get("abbreviation", ""),
            "flag": c["team"].get("logo", ""),
            "score": c.get("score", "0"),
            "record": c.get("records", [{}])[0].get("summary", ""),
        })
        if c["homeAway"] == "home":
            home = team
        else:
            away = team

    status = comp["status"]["type"]
    venue = enrich_venue({
        "name": comp.get("venue", {}).get("fullName", ""),
        "city": comp.get("venue", {}).get("address", {}).get("city", ""),
        "country": comp.get("venue", {}).get("address", {}).get("country", ""),
    })
    odds_raw = comp.get("odds") or []
    odds = odds_raw[0] if odds_raw and odds_raw[0] else {}
    ml = odds.get("moneyline", {})
    spread = odds.get("pointSpread", {})
    total = odds.get("total", {})

    stage = ev.get("season", {}).get("slug", "group-stage")
    kickoff = datetime.fromisoformat(ev["date"].replace("Z", "+00:00")).astimezone(
        timezone(timedelta(hours=8))
    )
    kickoff_end = kickoff + timedelta(hours=2)
    time_bj = kickoff.strftime("%H:%M")
    time_bj_end = kickoff_end.strftime("%H:%M")

    return {
        "id": ev["id"],
        "date": ev["date"],
        "date_bj": kickoff.strftime("%Y-%m-%d"),
        "date_bj_label": kickoff.strftime("%m月%d日"),
        "name": ev.get("name", ""),
        "stage": stage,
        "stage_zh": stage_zh(stage),
        "stage_category": stage_category(stage),
        "time_slot": time_slot_bj(kickoff.hour),
        "time_slot_simple": time_slot_simple(kickoff.hour),
        "time_slot_zh": time_slot_label(time_slot_bj(kickoff.hour)),
        "time_bj": time_bj,
        "time_bj_end": time_bj_end,
        "time_range_bj": f"{time_bj}–{time_bj_end}",
        "status": status.get("state", "pre"),
        "status_text": status.get("description", ""),
        "status_detail": status.get("detail", ""),
        "clock": comp["status"].get("displayClock", ""),
        "home": home,
        "away": away,
        "venue": venue,
        "broadcasts": comp.get("broadcasts", [{}])[0].get("names", []) if comp.get("broadcasts") else [],
        "odds": {
            "provider": odds.get("provider", {}).get("displayName", "DraftKings"),
            "over_under": odds.get("overUnder"),
            "home_ml": ml.get("home", {}).get("close", {}).get("odds") or ml.get("home", {}).get("open", {}).get("odds"),
            "away_ml": ml.get("away", {}).get("close", {}).get("odds") or ml.get("away", {}).get("open", {}).get("odds"),
            "draw_ml": ml.get("draw", {}).get("close", {}).get("odds") or ml.get("draw", {}).get("open", {}).get("odds"),
            "home_implied": american_to_implied(
                ml.get("home", {}).get("close", {}).get("odds") or ml.get("home", {}).get("open", {}).get("odds")
            ),
            "away_implied": american_to_implied(
                ml.get("away", {}).get("close", {}).get("odds") or ml.get("away", {}).get("open", {}).get("odds")
            ),
            "draw_implied": american_to_implied(
                ml.get("draw", {}).get("close", {}).get("odds") or ml.get("draw", {}).get("open", {}).get("odds")
            ),
            "spread_home": spread.get("home", {}).get("close", {}).get("line"),
            "spread_away": spread.get("away", {}).get("close", {}).get("line"),
            "over_line": total.get("over", {}).get("close", {}).get("line"),
            "under_line": total.get("under", {}).get("close", {}).get("line"),
        },
    }


def parse_standings(raw: dict) -> list[dict]:
    groups = []
    for child in raw.get("children", []):
        gname = child.get("name", child.get("abbreviation", "Group"))
        entries = []
        for entry in child.get("standings", {}).get("entries", []):
            team = entry.get("team", {})
            tname = team.get("displayName", "")
            stats = {s["name"]: s.get("displayValue", s.get("value", "")) for s in entry.get("stats", [])}
            entries.append({
                "rank": stats.get("rank", ""),
                "team": tname,
                "team_zh": team_zh(tname),
                "abbr": team.get("abbreviation", ""),
                "flag": team.get("logos", [{}])[0].get("href", "") if team.get("logos") else "",
                "played": stats.get("gamesPlayed", "0"),
                "wins": stats.get("wins", "0"),
                "draws": stats.get("ties", "0"),
                "losses": stats.get("losses", "0"),
                "gf": stats.get("pointsFor", "0"),
                "ga": stats.get("pointsAgainst", "0"),
                "gd": stats.get("pointDifferential", "0"),
                "points": stats.get("points", "0"),
            })
        groups.append({"name": gname, "name_zh": group_zh(gname), "entries": entries})
    return groups


def parse_news(raw: dict, limit: int = 12) -> list[dict]:
    articles = []
    for item in raw.get("articles", [])[:limit]:
        articles.append({
            "headline": item.get("headline", ""),
            "description": item.get("description", ""),
            "published": item.get("published", ""),
            "link": item.get("links", {}).get("web", {}).get("href", ""),
            "image": item.get("images", [{}])[0].get("url", "") if item.get("images") else "",
        })
    return articles


def build_filter_options(matches: list[dict]) -> dict:
    venues, cities, host_countries, teams, dates, stages = {}, {}, {}, {}, {}, {}
    continents = {}

    for m in matches:
        v = m["venue"]
        vkey = v.get("name") or ""
        if vkey:
            venues[vkey] = {"value": vkey, "label": v.get("name_zh") or vkey, "city": v.get("city_zh", "")}
        ckey = v.get("city") or ""
        if ckey:
            cities[ckey] = {"value": ckey, "label": v.get("city_zh") or ckey}
        hkey = v.get("country") or ""
        if hkey:
            host_countries[hkey] = {"value": hkey, "label": v.get("country_zh") or hkey}
        dkey = m.get("date_bj", "")
        if dkey:
            dates[dkey] = {"value": dkey, "label": m.get("date_bj_label", dkey)}
        skey = m.get("stage", "")
        if skey:
            stages[skey] = {"value": skey, "label": m.get("stage_zh", skey)}
        for t in (m["home"], m["away"]):
            tkey = t["name"]
            teams[tkey] = {"value": tkey, "label": t.get("name_zh") or tkey, "confederation": t.get("confederation", "")}
            conf = t.get("confederation", "")
            if conf:
                continents[conf] = {"value": conf, "label": t.get("confederation_zh") or confederation_zh(conf)}

    sort_by_label = lambda items: sorted(items, key=lambda x: x["label"])

    return {
        "venues": sort_by_label(venues.values()),
        "cities": sort_by_label(cities.values()),
        "host_countries": sort_by_label(host_countries.values()),
        "teams": sort_by_label(teams.values()),
        "continents": sort_by_label(continents.values()),
        "dates": sorted(dates.values(), key=lambda x: x["value"]),
        "stages": [
            {"value": "group-stage", "label": "小组赛"},
            {"value": "knockout", "label": "淘汰赛（全部）"},
            {"value": "round-of-32", "label": "32 强"},
            {"value": "round-of-16", "label": "16 强"},
            {"value": "quarterfinal", "label": "四分之一决赛"},
            {"value": "semifinal", "label": "半决赛"},
            {"value": "third-place", "label": "三四名决赛"},
            {"value": "final", "label": "决赛"},
        ],
        "time_slots": [
            {"value": "daytime", "label": "早场·白天 (08:00–18:00)"},
            {"value": "night", "label": "晚场·夜间 (18:00–08:00)"},
            {"value": "dawn", "label": "凌晨场 (00:00–08:00)"},
            {"value": "morning", "label": "上午场 (08:00–12:00)"},
            {"value": "afternoon", "label": "下午场 (12:00–18:00)"},
            {"value": "evening", "label": "晚场 (18:00–24:00)"},
        ],
    }


def enrich_matches(matches: list[dict]) -> tuple[list[dict], dict[str, str]]:
    rec_ids, reasons = enrich_match_tips(matches)
    for m in matches:
        m["google_calendar_url"] = google_calendar_url(m)
    return matches, reasons


def localize_calendar(calendar: list[dict]) -> list[dict]:
    return [
        {
            **e,
            "label_zh": phase_zh(e.get("label", "")),
            "detail_zh": phase_detail_zh(e.get("detail", "")),
        }
        for e in calendar
    ]


def scoreboard_dates(now: Optional[datetime] = None) -> list[str]:
    """Fetch from tournament start through today + lookahead (capped at final)."""
    now = now or datetime.now(timezone.utc)
    today = now.date()
    end = min(TOURNAMENT_END, today + timedelta(days=SCOREBOARD_LOOKAHEAD_DAYS))
    start = TOURNAMENT_START
    if end < start:
        return [today.strftime("%Y%m%d")]
    days: list[str] = []
    d = start
    while d <= end:
        days.append(d.strftime("%Y%m%d"))
        d += timedelta(days=1)
    return days


async def _fetch_scoreboard_day(client: httpx.AsyncClient, day: str) -> Optional[dict]:
    try:
        r = await client.get(ESPN_SCOREBOARD, params={"dates": day})
        if r.status_code != 200:
            return None
        return r.json()
    except httpx.HTTPError:
        return None


async def fetch_all_data() -> dict:
    now = datetime.now(timezone.utc)
    matches: list[dict] = []
    calendar: list[dict] = []
    seen: set[str] = set()

    async with httpx.AsyncClient(timeout=30) as client:
        day_payloads = await asyncio.gather(
            *[_fetch_scoreboard_day(client, day) for day in scoreboard_dates(now)]
        )
        for data in day_payloads:
            if not data:
                continue
            if not calendar:
                for league in data.get("leagues", []):
                    for cal in league.get("calendar", []):
                        calendar = localize_calendar(cal.get("entries", []))
            for ev in data.get("events", []):
                if ev["id"] not in seen:
                    seen.add(ev["id"])
                    matches.append(parse_match(ev))

        standings: list[dict] = []
        news: list[dict] = []
        try:
            sr = await client.get(ESPN_STANDINGS)
            if sr.status_code == 200:
                standings = parse_standings(sr.json())
        except httpx.HTTPError:
            pass
        try:
            nr = await client.get(ESPN_NEWS)
            if nr.status_code == 200:
                news = parse_news(nr.json())
        except httpx.HTTPError:
            pass

    matches.sort(key=lambda m: m["date"])
    matches, recommend_reasons = enrich_matches(matches)
    live = [m for m in matches if m["status"] == "in"]
    upcoming = [m for m in matches if m["status"] == "pre"]
    finished = [m for m in matches if m["status"] == "post"]

    cfg = load_config()
    sub_ids = set(cfg.get("subscribed_matches", []))
    subscribed_preview = [m for m in matches if m["id"] in sub_ids]

    return {
        "fetched_at": now.isoformat(),
        "calendar": calendar,
        "filter_options": build_filter_options(matches),
        "matches": matches,
        "live": live,
        "upcoming": upcoming,
        "finished": finished,
        "next_match": upcoming[0] if upcoming else None,
        "standings": standings,
        "news": news,
        "subscribed_match_ids": list(sub_ids),
        "subscribed_matches_preview": subscribed_preview,
        "recommended_match_ids": [m["id"] for m in matches if m.get("recommended")],
        "recommend_reasons": recommend_reasons,
        "stats": {
            "total_matches": len(matches),
            "live_count": len(live),
            "upcoming_count": len(upcoming),
            "finished_count": len(finished),
            "subscribed_count": len(sub_ids),
            "recommended_count": sum(1 for m in matches if m.get("recommended")),
        },
    }


def ics_response(matches: list[dict], filename: str, cal_name: str, reasons: Optional[dict] = None) -> Response:
    content = build_ics(matches, cal_name, reasons)
    safe_name = "".join(c if c.isascii() and c not in '\\"' else "_" for c in filename) or "worldcup.ics"
    return Response(
        content=content.encode("utf-8"),
        media_type="text/calendar; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'},
    )


async def get_cached_data(force: bool = False) -> dict:
    with _lock:
        if not force and _cache["data"] and _cache["fetched_at"]:
            age = (datetime.now(timezone.utc) - _cache["fetched_at"]).total_seconds()
            if age < 120:
                return _cache["data"]
    data = await fetch_all_data()
    with _lock:
        _cache["data"] = data
        _cache["fetched_at"] = datetime.now(timezone.utc)
    return data


def send_qq_email(to: str, subject: str, html: str) -> None:
    account = os.environ.get("QQ_EMAIL_ACCOUNT")
    auth = os.environ.get("QQ_EMAIL_AUTH_CODE")
    if not account or not auth:
        raise HTTPException(
            status_code=503,
            detail="邮件未配置：请设置环境变量 QQ_EMAIL_ACCOUNT 和 QQ_EMAIL_AUTH_CODE（QQ SMTP 发件，收件可为任意邮箱）",
        )
    msg = MIMEMultipart("alternative")
    msg["From"] = account
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html", "utf-8"))
    with smtplib.SMTP_SSL("smtp.qq.com", 465) as smtp:
        smtp.login(account, auth)
        smtp.send_message(msg)


def find_group_for_team(standings: list[dict], team_name: str) -> Optional[dict]:
    for g in standings:
        for e in g["entries"]:
            if e["team"] == team_name or e.get("team_zh") == team_name:
                return g
    return None


def standings_snapshot(standings: list[dict]) -> dict:
    snap = {}
    for g in standings:
        for e in g["entries"]:
            snap[e["team"]] = e["points"]
    return snap


def check_alerts(data: dict, cfg: dict) -> list[dict]:
    """返回结构化 alert 列表，供邮件模板渲染。"""
    alerts: list[dict] = []
    now = datetime.now(timezone.utc)
    state = load_alert_state()
    sub_ids = set(cfg.get("subscribed_matches", []))
    all_matches = {m["id"]: m for m in data.get("matches", [])}

    def is_subscribed(m: dict) -> bool:
        return m["id"] in sub_ids

    # 赛前提醒（全局或已订阅）
    if cfg.get("notify_prematch"):
        for m in data.get("upcoming", []):
            if sub_ids and not is_subscribed(m):
                continue
            kickoff = datetime.fromisoformat(m["date"].replace("Z", "+00:00"))
            mins = (kickoff - now).total_seconds() / 60
            key = f"pre_{m['id']}"
            if 0 < mins <= cfg.get("notify_before_minutes", 30) and key not in state["notified_prematch"]:
                state["notified_prematch"].append(key)
                dt_bj = kickoff.astimezone(timezone(timedelta(hours=8)))
                alerts.append({
                    "kind": "prematch",
                    "match": m,
                    "subject": f"⏰ 赛前提醒 · {m['home']['name_zh']} vs {m['away']['name_zh']}",
                    "detail": (
                        f"约 <b>{int(mins)}</b> 分钟后开赛（北京时间 <b>{dt_bj.strftime('%H:%M')}</b>）<br/>"
                        f"📍 <b>{m['venue']['name_zh']}</b> · {m['venue']['city_zh']}"
                    ),
                })

    for m in data.get("matches", []):
        mid = m["id"]
        score_key = f"{m['home']['score']}-{m['away']['score']}"
        prev_status = state["status"].get(mid)
        prev_score = state["scores"].get(mid)
        cur_status = m["status"]
        subscribed = is_subscribed(m)

        # 开赛
        if subscribed and prev_status == "pre" and cur_status == "in":
            kickoff_key = f"kick_{mid}"
            if kickoff_key not in state["notified_kickoff"]:
                state["notified_kickoff"].append(kickoff_key)
                alerts.append({
                    "kind": "kickoff",
                    "match": m,
                    "subject": f"⚽ 比赛开始 · {m['home']['name_zh']} vs {m['away']['name_zh']}",
                    "detail": f"比赛已开始！<br/>📍 {m['venue']['name_zh']} · {m['venue']['city_zh']}",
                })

        # 比分变化（订阅比赛或全局开关）
        if (
            cur_status == "in"
            and prev_score
            and prev_score != score_key
            and cfg.get("notify_score_change")
            and (subscribed or not sub_ids)
        ):
            alerts.append({
                "kind": "score",
                "match": m,
                "subject": f"⚽ 比分 · {m['home']['name_zh']} {m['home']['score']} - {m['away']['score']} {m['away']['name_zh']}",
                "detail": f"比分更新为 <b>{m['home']['score']} : {m['away']['score']}</b> · {m.get('clock', '')}",
            })

        # 完场
        if subscribed and prev_status == "in" and cur_status == "post":
            ft_key = f"ft_{mid}"
            if ft_key not in state["notified_fulltime"]:
                state["notified_fulltime"].append(ft_key)
                alerts.append({
                    "kind": "fulltime",
                    "match": m,
                    "subject": f"🏁 完场 · {m['home']['name_zh']} {m['home']['score']} - {m['away']['score']} {m['away']['name_zh']}",
                    "detail": f"比赛结束，最终比分 <b>{m['home']['score']} : {m['away']['score']}</b>",
                })

        state["status"][mid] = cur_status
        state["scores"][mid] = score_key

    # 小组积分变动（订阅球队所在组）
    if sub_ids and data.get("standings"):
        current_snap = standings_snapshot(data["standings"])
        prev_snap = state.get("standings", {})
        if prev_snap:
            for m in data.get("matches", []):
                if not is_subscribed(m) or m["status"] != "post":
                    continue
                for tname in (m["home"]["name"], m["away"]["name"]):
                    grp = find_group_for_team(data["standings"], tname)
                    if not grp:
                        continue
                    changed = []
                    for e in grp["entries"]:
                        old_pts = prev_snap.get(e["team"])
                        new_pts = e["points"]
                        if old_pts is not None and str(old_pts) != str(new_pts):
                            changed.append({
                                "rank": e["rank"],
                                "team": e.get("team_zh", e["team"]),
                                "played": e["played"],
                                "wins": e["wins"],
                                "draws": e["draws"],
                                "losses": e["losses"],
                                "points": e["points"],
                            })
                    if changed:
                        alerts.append({
                            "kind": "standings",
                            "match": m,
                            "group_name": grp["name"],
                            "standings_rows": sorted(changed, key=lambda x: int(x["rank"] or 99)),
                            "subject": f"📊 积分更新 · {grp['name']}",
                            "detail": f"因 <b>{m['home']['name_zh']} vs {m['away']['name_zh']}</b> 完场，小组积分发生变化。",
                        })
                        break
        state["standings"] = current_snap

    save_alert_state(state)
    return alerts


async def background_worker():
    last_digest = datetime.min.replace(tzinfo=timezone.utc)
    while True:
        try:
            cfg = load_config()
            if cfg.get("enabled") and cfg.get("email"):
                data = await get_cached_data(force=True)
                alerts = check_alerts(data, cfg)
                for alert in alerts:
                    subject = alert.get("subject", "世界杯提醒")
                    html = build_alert_email(alert, data)
                    try:
                        send_qq_email(cfg["email"], subject, html)
                    except HTTPException:
                        pass

                interval = cfg.get("auto_email_minutes", 60) * 60
                if (datetime.now(timezone.utc) - last_digest).total_seconds() >= interval:
                    send_qq_email(
                        cfg["email"],
                        "🏆 世界杯观赛简报",
                        build_digest_email(data, "世界杯观赛简报"),
                    )
                    last_digest = datetime.now(timezone.utc)
        except Exception:
            pass
        await asyncio.sleep(60)


@app.on_event("startup")
async def startup():
    asyncio.create_task(background_worker())


@app.get("/")
async def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/data")
async def api_data(refresh: bool = False):
    data = await get_cached_data(force=refresh)
    return JSONResponse(
        content=data,
        headers={"Cache-Control": "no-store, no-cache, must-revalidate"},
    )


@app.post("/api/subscribe")
async def api_subscribe(body: SubscribeBody):
    cfg = load_config()
    cfg.update(body.model_dump())
    cfg["email"] = str(body.email)
    save_config(cfg)
    return {"ok": True, "config": cfg}


@app.get("/api/subscribe")
async def api_get_subscribe():
    cfg = load_config()
    return cfg


@app.post("/api/subscribe/match")
async def api_subscribe_match(body: MatchSubscribeBody):
    cfg = load_config()
    subs = list(cfg.get("subscribed_matches", []))
    mid = body.match_id
    if body.action == "add" and mid not in subs:
        subs.append(mid)
    elif body.action == "remove" and mid in subs:
        subs.remove(mid)
    elif body.action == "toggle":
        if mid in subs:
            subs.remove(mid)
        else:
            subs.append(mid)
    cfg["subscribed_matches"] = subs
    save_config(cfg)
    with _lock:
        _cache["data"] = None
    return {"ok": True, "subscribed_matches": subs}


@app.get("/api/calendar/match/{match_id}.ics")
async def calendar_match(match_id: str):
    data = await get_cached_data()
    m = next((x for x in data["matches"] if str(x["id"]) == match_id), None)
    if not m:
        raise HTTPException(status_code=404, detail="比赛不存在")
    reasons = {match_id: m.get("recommend_reason", "")} if m.get("recommend_reason") else None
    home = m["home"].get("name_zh", m["home"]["name"])
    away = m["away"].get("name_zh", m["away"]["name"])
    return ics_response([m], f"wc-{match_id}.ics", f"{home} vs {away}", reasons)


@app.get("/api/calendar/recommended.ics")
async def calendar_recommended():
    data = await get_cached_data()
    matches = [m for m in data["matches"] if m.get("recommended")]
    return ics_response(matches, "worldcup-recommended.ics", "2026世界杯·新球迷推荐", data.get("recommend_reasons"))


@app.get("/api/calendar/subscribed.ics")
async def calendar_subscribed():
    data = await get_cached_data()
    sub_ids = set(str(x) for x in data.get("subscribed_match_ids", []))
    matches = [m for m in data["matches"] if str(m["id"]) in sub_ids]
    if not matches:
        raise HTTPException(status_code=404, detail="暂无已订阅比赛")
    return ics_response(matches, "worldcup-subscribed.ics", "2026世界杯·我的订阅")


@app.post("/api/calendar/export")
async def calendar_export(body: CalendarExportBody):
    data = await get_cached_data()
    id_set = set(str(x) for x in body.match_ids)
    matches = [m for m in data["matches"] if str(m["id"]) in id_set]
    if not matches:
        raise HTTPException(status_code=400, detail="未找到对应比赛")
    return ics_response(matches, "worldcup-filtered.ics", "2026世界杯·筛选赛程", data.get("recommend_reasons"))


@app.post("/api/email/send")
async def api_send_email(body: SendEmailBody):
    cfg = load_config()
    to = str(body.email) if body.email else cfg.get("email")
    if not to:
        raise HTTPException(status_code=400, detail="请填写收件邮箱")
    data = await get_cached_data(force=True)
    send_qq_email(to, "🏆 世界杯观赛简报", build_digest_email(data, "世界杯观赛简报"))
    return {"ok": True, "sent_to": to}


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=8765, reload=False)
