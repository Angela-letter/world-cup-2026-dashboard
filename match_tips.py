"""每场比赛一句话观赛提示（含新球迷推荐 + 各轮次默认文案）。"""

from __future__ import annotations

from recommendations import NEW_FAN_PICKS

STAR_TEAMS = {
    "Brazil", "Argentina", "France", "Germany", "England", "Spain",
    "Portugal", "Netherlands", "Belgium", "Croatia", "Morocco", "Japan",
    "United States", "Mexico", "Uruguay", "Colombia",
}

HOST_TEAMS = {"Mexico", "United States", "Canada"}

STAGE_TIPS = {
    "group-stage": "小组赛，积分关乎出线形势",
    "round-of-32": "32 强淘汰赛，一场定胜负",
    "round-of-16": "16 强激战，冷门与豪门同台",
    "quarterfinal": "四分之一决赛，距四强一步之遥",
    "semifinal": "半决赛，梦想与遗憾往往在此分野",
    "third-place": "三四名决赛，荣誉之战",
    "final": "决赛夜，全球瞩目的冠军归属",
}

RIVALRY = {
    frozenset({"England", "Scotland"}): "英伦德比，火药味十足",
    frozenset({"United States", "Mexico"}): "北美宿敌对决",
    frozenset({"Brazil", "Argentina"}): "南美超级德比",
    frozenset({"Germany", "Netherlands"}): "欧洲经典对抗",
    frozenset({"Spain", "Portugal"}): "伊比利亚半岛德比",
    frozenset({"Japan", "South Korea"}): "东亚德比，亚洲球迷必看",
}


def _pair_key(home: str, away: str) -> frozenset:
    return frozenset({home, away})


def _curated_index() -> dict[frozenset, str]:
    idx = {}
    for pick in NEW_FAN_PICKS:
        idx[_pair_key(pick["home"], pick["away"])] = pick["reason"]
    return idx


CURATED = _curated_index()


def _group_tip(m: dict) -> str:
    home, away = m["home"]["name"], m["away"]["name"]
    hzh, azh = m["home"].get("name_zh", home), m["away"].get("name_zh", away)

    if key := _pair_key(home, away):
        if key in CURATED:
            return CURATED[key]
        if key in RIVALRY:
            return RIVALRY[key]

    if home in HOST_TEAMS or away in HOST_TEAMS:
        host = hzh if home in HOST_TEAMS else azh
        return f"{host}主场作战，现场氛围拉满"

    stars = []
    if home in STAR_TEAMS:
        stars.append(hzh)
    if away in STAR_TEAMS:
        stars.append(azh)
    if len(stars) == 2:
        return f"{stars[0]} vs {stars[1]}，球星云集的焦点战"
    if len(stars) == 1:
        return f"{stars[0]}出战，关注强队发挥"

    confs = {m["home"].get("confederation"), m["away"].get("confederation")}
    if confs == {"uefa", "caf"} or confs == {"uefa", "concacaf"}:
        return "欧亚或欧美风格碰撞，战术看点十足"
    if confs == {"conmebol", "uefa"}:
        return "南美技术流迎战欧洲体系足球"
    if "afc" in confs and "uefa" in confs:
        return "亚洲球队挑战欧洲劲旅"

    return STAGE_TIPS["group-stage"]


def match_tip_for(m: dict) -> str:
    stage = m.get("stage", "group-stage")
    if stage != "group-stage":
        return STAGE_TIPS.get(stage, "世界杯淘汰赛")
    return _group_tip(m)


def enrich_match_tips(matches: list[dict]) -> tuple[set[str], dict[str, str]]:
    """为全部比赛写入 match_tip；返回推荐 ID 集合与理由（兼容旧逻辑）。"""
    rec_ids: set[str] = set()
    reasons: dict[str, str] = {}
    index = {}
    for m in matches:
        key = (m["home"]["name"], m["away"]["name"])
        index[key] = m["id"]
        index[(m["away"]["name"], m["home"]["name"])] = m["id"]

    for pick in NEW_FAN_PICKS:
        mid = index.get((pick["home"], pick["away"]))
        if mid:
            rec_ids.add(str(mid))
            reasons[str(mid)] = pick["reason"]

    for m in matches:
        mid = str(m["id"])
        tip = reasons.get(mid) or match_tip_for(m)
        m["match_tip"] = tip
        m["recommended"] = mid in rec_ids
        m["recommend_reason"] = reasons.get(mid, "")

    return rec_ids, reasons
