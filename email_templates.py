"""邮件 HTML 模板（中文排版优化）。"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from i18n import stage_zh, team_zh, venue_zh, city_zh, country_zh

BJ = timezone(timedelta(hours=8))


def fmt_bj(iso: str) -> str:
    dt = datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(BJ)
    return dt.strftime("%m月%d日 %H:%M")


def _base_styles() -> str:
    return """
    body{margin:0;padding:0;background:#ece7df;font-family:'PingFang SC','Microsoft YaHei',Georgia,serif;color:#1a1814}
    .wrap{max-width:640px;margin:0 auto;padding:20px 12px}
    .card{background:#fffdf9;border:1px solid #d9d0c3;border-radius:2px;overflow:hidden;box-shadow:0 12px 40px rgba(26,24,20,.08)}
    .banner{background:linear-gradient(135deg,#0f4d32 0%,#1a6b47 55%,#b8860b 120%);padding:28px 24px;color:#fff}
    .banner h1{margin:0;font-size:22px;letter-spacing:.04em}
    .banner p{margin:8px 0 0;opacity:.85;font-size:13px}
    .section{padding:20px 24px;border-top:1px solid #ebe5da}
    .section h2{margin:0 0 14px;font-size:14px;color:#0f4d32;letter-spacing:.12em;text-transform:uppercase}
    .badge{display:inline-block;font-size:11px;padding:3px 8px;border-radius:2px;font-weight:600;letter-spacing:.06em}
    .badge-live{background:#fde8ec;color:#c41e3a}
    .badge-pre{background:#e8f4ee;color:#0f4d32}
    .badge-post{background:#f0ebe3;color:#6b6560}
    .badge-alert{background:#fff3cd;color:#856404}
    .match{border:1px solid #ebe5da;border-radius:2px;margin-bottom:12px;overflow:hidden}
    .match-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f7f4ee;font-size:12px;color:#6b6560}
    .match-body{padding:16px 14px}
    .teams{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .team{flex:1;text-align:center}
    .team img{width:40px;height:40px;border-radius:50%;border:2px solid #ebe5da;background:#fff}
    .team .name{font-size:14px;font-weight:600;margin-top:6px}
    .team .name-en{font-size:11px;color:#a8a29e;margin-top:2px}
    .score{font-size:28px;font-weight:700;color:#0f4d32;min-width:60px;text-align:center}
    .meta{font-size:12px;color:#6b6560;margin-top:10px;line-height:1.6}
    .odds{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
    .odds span{font-size:11px;background:#f5e6b8;padding:4px 8px;border-left:3px solid #b8860b}
    .alert-box{background:#fff8e6;border-left:4px solid #b8860b;padding:14px 16px;margin-bottom:16px;font-size:14px;line-height:1.7}
    .standings{width:100%;border-collapse:collapse;font-size:12px}
    .standings th,.standings td{padding:6px 8px;border-bottom:1px solid #ebe5da;text-align:left}
    .standings th{color:#6b6560;font-weight:500;font-size:11px}
    .news-item{margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed #ebe5da}
    .news-item a{color:#0f4d32;text-decoration:none;font-weight:600;font-size:13px}
    .news-item p{margin:4px 0 0;font-size:12px;color:#6b6560}
    .footer{padding:16px 24px;font-size:11px;color:#a8a29e;text-align:center;background:#f7f4ee}
    """


def _match_card(m: dict, badge: Optional[str] = None, badge_class: str = "badge-pre") -> str:
    home, away = m["home"], m["away"]
    o = m.get("odds", {})
    show_score = m["status"] in ("in", "post")
    if badge:
        badge_text, badge_cls = badge, badge_class
    else:
        badge_text, badge_cls = {
            "in": ("进行中", "badge-live"),
            "post": ("已结束", "badge-post"),
            "pre": ("未开始", "badge-pre"),
        }.get(m["status"], ("未开始", "badge-pre"))

    score_html = (
        f'<div class="score">{home["score"]} : {away["score"]}</div>'
        if show_score
        else '<div class="score" style="font-size:16px;color:#b8860b">VS</div>'
    )

    odds_html = ""
    if o.get("home_ml"):
        odds_html = f"""<div class="odds">
          <span>主胜 {o.get('home_ml')} ({o.get('home_implied','-')}%)</span>
          <span>平 {o.get('draw_ml','-')} ({o.get('draw_implied','-')}%)</span>
          <span>客胜 {o.get('away_ml')} ({o.get('away_implied','-')}%)</span>
          <span>O/U {o.get('over_under','-')}</span>
        </div>"""

    vn = m["venue"].get("name_zh") or venue_zh(m["venue"].get("name", ""))
    vc = m["venue"].get("city_zh") or city_zh(m["venue"].get("city", ""))
    vco = m["venue"].get("country_zh") or country_zh(m["venue"].get("country", ""))

    return f"""
    <div class="match">
      <div class="match-head">
        <span>{fmt_bj(m['date'])} 北京 · {stage_zh(m.get('stage',''))}</span>
        <span class="badge {badge_cls}">{badge_text}</span>
      </div>
      <div class="match-body">
        <div class="teams">
          <div class="team">
            <img src="{home.get('flag','')}" alt="" />
            <div class="name">{home.get('name_zh', team_zh(home['name']))}</div>
            <div class="name-en">{home['name']}</div>
          </div>
          {score_html}
          <div class="team">
            <img src="{away.get('flag','')}" alt="" />
            <div class="name">{away.get('name_zh', team_zh(away['name']))}</div>
            <div class="name-en">{away['name']}</div>
          </div>
        </div>
        <div class="meta">📍 {vn} · {vc}{(' · ' + vco) if vco and vco != vc else ''}
          {(' · ' + m['clock']) if m.get('clock') and m['status']=='in' else ''}
        </div>
        {odds_html}
      </div>
    </div>"""


def build_digest_email(data: dict, title: str = "世界杯观赛简报") -> str:
    live_cards = "".join(_match_card(m) for m in (data.get("live") or [])[:6])
    upcoming_cards = "".join(_match_card(m) for m in (data.get("upcoming") or [])[:8])

    news_html = ""
    for n in (data.get("news") or [])[:5]:
        news_html += f"""<div class="news-item">
          <a href="{n.get('link','#')}">{n.get('headline','')}</a>
          <p>{n.get('description','')[:120]}</p>
        </div>"""

    subscribed = data.get("subscribed_matches_preview") or []
    sub_html = "".join(_match_card(m, "已订阅", "badge-alert") for m in subscribed[:6])

    fetched = data.get("fetched_at", "")[:19].replace("T", " ")

    return f"""<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"/><style>{_base_styles()}</style></head>
    <body><div class="wrap"><div class="card">
      <div class="banner">
        <h1>🏆 {title}</h1>
        <p>2026 美加墨世界杯 · 更新于 {fetched}（北京时间）</p>
      </div>
      {('<div class="section"><h2>⭐ 我的订阅</h2>' + sub_html + '</div>') if sub_html else ''}
      {('<div class="section"><h2>● 进行中</h2>' + live_cards + '</div>') if live_cards else ''}
      <div class="section"><h2>📅 即将开始</h2>{upcoming_cards or '<p style="color:#6b6560">暂无赛程</p>'}</div>
      {('<div class="section"><h2>📰 最新资讯</h2>' + news_html + '</div>') if news_html else ''}
      <div class="footer">数据来源 ESPN · 赔率仅供参考，不构成投注建议</div>
    </div></div></body></html>"""


def build_alert_email(alert: dict, data: Optional[dict] = None) -> str:
    """单场事件推送：开赛 / 比分 / 完场 / 积分变动。"""
    m = alert["match"]
    kind = alert["kind"]
    titles = {
        "kickoff": "⚽ 比赛开始",
        "score": "⚽ 比分更新",
        "fulltime": "🏁 比赛结束",
        "standings": "📊 小组积分变动",
        "prematch": "⏰ 赛前提醒",
    }
    title = titles.get(kind, "世界杯提醒")
    detail = alert.get("detail", "")

    extra = ""
    if kind == "standings" and alert.get("standings_rows"):
        rows = "".join(
            f"<tr><td>{r['rank']}</td><td>{r['team']}</td><td>{r['played']}</td>"
            f"<td>{r['wins']}/{r['draws']}/{r['losses']}</td><td><b>{r['points']}</b></td></tr>"
            for r in alert["standings_rows"]
        )
        extra = f"""<div class="section"><h2>📊 {alert.get('group_name','小组')} 积分榜</h2>
        <table class="standings"><thead><tr><th>#</th><th>球队</th><th>赛</th><th>胜/平/负</th><th>分</th></tr></thead>
        <tbody>{rows}</tbody></table></div>"""

    subject_line = alert.get("subject") or f"{title}：{m['home'].get('name_zh', team_zh(m['home']['name']))} vs {m['away'].get('name_zh', team_zh(m['away']['name']))}"

    return f"""<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"/><style>{_base_styles()}</style></head>
    <body><div class="wrap"><div class="card">
      <div class="banner"><h1>{subject_line}</h1><p>{title}</p></div>
      <div class="section">
        <div class="alert-box">{detail}</div>
        {_match_card(m, badge_class="badge-alert")}
      </div>
      {extra}
      <div class="footer">世界杯观赛指挥台 · 订阅推送</div>
    </div></div></body></html>"""
