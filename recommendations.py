"""新球迷推荐场次：按球队名匹配，运行时解析为比赛 ID。"""

NEW_FAN_PICKS = [
    {"home": "Mexico", "away": "South Africa", "reason": "揭幕战，感受世界杯主场氛围"},
    {"home": "United States", "away": "Paraguay", "reason": "东道主首战，美国队亮相"},
    {"home": "Brazil", "away": "Morocco", "reason": "南美豪门 vs 非洲劲旅，质量最高的小组赛之一"},
    {"home": "Netherlands", "away": "Japan", "reason": "欧亚对决，赔率接近、悬念十足"},
    {"home": "France", "away": "Senegal", "reason": "卫冕冠军迎战非洲强队"},
    {"home": "Argentina", "away": "Algeria", "reason": "世界杯冠军首秀，梅西后继时代的阿根廷"},
    {"home": "England", "away": "Croatia", "reason": "2018 半决赛重演，经典恩怨"},
    {"home": "Germany", "away": "Ivory Coast", "reason": "德国战车回归，非洲黑马考验"},
    {"home": "Spain", "away": "Saudi Arabia", "reason": "西班牙传控足球，回顾 2022 沙特爆冷名局"},
    {"home": "Mexico", "away": "South Korea", "reason": "亚洲球队焦点战，韩国挑战东道主"},
    {"home": "Portugal", "away": "Colombia", "reason": "C 罗最后一届？南美硬碰硬"},
    {"home": "Belgium", "away": "Egypt", "reason": "欧洲黄金一代 vs 萨拉赫领衔埃及"},
]


def resolve_recommendations(matches: list[dict]) -> tuple[set[str], dict[str, str]]:
    """返回推荐比赛 ID 集合，以及 id -> 推荐理由。"""
    ids: set[str] = set()
    reasons: dict[str, str] = {}
    index = {}
    for m in matches:
        key = (m["home"]["name"], m["away"]["name"])
        index[key] = m["id"]
        index[(m["away"]["name"], m["home"]["name"])] = m["id"]

    for pick in NEW_FAN_PICKS:
        mid = index.get((pick["home"], pick["away"]))
        if mid:
            ids.add(str(mid))
            reasons[str(mid)] = pick["reason"]

    return ids, reasons
