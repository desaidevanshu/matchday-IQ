"""
MATCHDAY IQ - Live Cricket Data Engine
Fetches real-time ongoing matches, live scorecards, and commentary directly from live feeds (Cricbuzz mcenter & OpenCricket).
"""

import re
import time
from typing import Dict, Any, List, Optional
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
}

# 1-minute TTL cache for live match list
_cached_live_matches: List[Dict[str, Any]] = []
_last_fetch_time: float = 0.0

def fetch_live_cricbuzz_matches() -> List[Dict[str, Any]]:
    global _cached_live_matches, _last_fetch_time
    now = time.time()
    if _cached_live_matches and (now - _last_fetch_time) < 45.0:
        return _cached_live_matches

    matches = []
    try:
        # Step 1: Scrape match IDs currently featured on live scores page
        r = requests.get("https://www.cricbuzz.com/cricket-match/live-scores", headers=HEADERS, timeout=8)
        if r.status_code != 200:
            return _cached_live_matches

        soup = BeautifulSoup(r.text, "html.parser")
        match_ids = []
        for a in soup.find_all("a", href=True):
            m = re.search(r"/live-cricket-scores/(\d+)/", a["href"])
            if m and m.group(1) not in match_ids:
                match_ids.append(m.group(1))

        # Fetch detail for top 10 unique live/upcoming matches
        for mid in match_ids[:10]:
            try:
                m_data = fetch_cricbuzz_match_comm(mid)
                if m_data:
                    matches.append(m_data)
            except Exception:
                continue

        if matches:
            _cached_live_matches = matches
            _last_fetch_time = now
            return matches
    except Exception as e:
        print(f"Error fetching live matches: {e}")

    return _cached_live_matches

def fetch_cricbuzz_match_comm(match_id: str) -> Optional[Dict[str, Any]]:
    try:
        url = f"https://www.cricbuzz.com/api/mcenter/comm/{match_id}"
        resp = requests.get(url, headers=HEADERS, timeout=6)
        if resp.status_code != 200:
            return None

        data = resp.json()
        header = data.get("matchHeader", {})
        miniscore = data.get("miniscore") or {}

        t1 = header.get("team1", {}).get("name", "Team 1")
        t2 = header.get("team2", {}).get("name", "Team 2")
        t1_short = header.get("team1", {}).get("shortName", t1[:3].upper())
        t2_short = header.get("team2", {}).get("shortName", t2[:3].upper())

        series = header.get("seriesName", "")
        desc = header.get("matchDescription", "")
        full_name = f"{t1} vs {t2}" + (f", {desc}" if desc else "") + (f" ({series})" if series else "")

        format_str = (header.get("matchFormat") or "t20").lower()
        state = (header.get("state") or "").lower()
        status_text = header.get("status") or (miniscore.get("customStatus") if miniscore else "") or "Match in progress"

        venue_data = header.get("venue", {})
        venue_name = venue_data.get("name", "")
        venue_city = venue_data.get("city", "")
        venue_str = f"{venue_name}, {venue_city}".strip(", ")

        # Parse innings scores
        scores = []
        inn_list = (miniscore.get("matchScoreDetails", {}).get("inningsScoreList")
                    if isinstance(miniscore.get("matchScoreDetails"), dict)
                    else None) or miniscore.get("inningsScoreList") or []
        for inn in inn_list:
            scores.append({
                "r": inn.get("score") or 0,
                "w": inn.get("wickets") or 0,
                "o": float(inn.get("overs") or 0.0),
                "inning": f"{inn.get('batTeamName', 'Team')} Inning {inn.get('inningsId', 1)}"
            })

        if not scores and miniscore and miniscore.get("batTeam"):
            bt = miniscore["batTeam"]
            bat_name = t2 if "bowl" in status_text.lower() else t1
            scores.append({
                "r": bt.get("teamScore") or 0,
                "w": bt.get("teamWkts") or 0,
                "o": float(miniscore.get("overs") or 0.0),
                "inning": f"{bat_name} Inning 1"
            })

        state_lower = state.lower()
        is_complete = state_lower in ["complete", "abandoned"] or "won" in status_text.lower()
        is_live = "in progress" in state_lower or len(scores) > 0 or ("opt to" in status_text.lower() and not is_complete)
        is_upcoming = not is_live and not is_complete

        return {
            "id": f"cb_{match_id}",
            "cricbuzzId": match_id,
            "name": full_name,
            "matchType": format_str,
            "status": status_text,
            "venue": venue_str,
            "date": "TODAY",
            "dateTimeGMT": header.get("matchStartTimestamp"),
            "teams": [t1, t2],
            "teamInfo": [
                {"name": t1, "shortname": t1_short},
                {"name": t2, "shortname": t2_short}
            ],
            "score": scores,
            "matchStarted": not is_upcoming,
            "matchEnded": is_complete,
            "isLive": is_live,
            "isUpcoming": is_upcoming,
            "isDemo": False,
            "source": "Cricbuzz Live Engine"
        }
    except Exception as e:
        print(f"Error parsing match {match_id}: {e}")
        return None

def fetch_cricbuzz_full_scorecard(match_id: str) -> Optional[Dict[str, Any]]:
    clean_id = match_id.replace("cb_", "")
    try:
        url = f"https://www.cricbuzz.com/api/mcenter/scorecard/{clean_id}"
        resp = requests.get(url, headers=HEADERS, timeout=8)
        if resp.status_code != 200:
            return None

        data = resp.json()
        header = data.get("matchHeader", {})
        scorecard_raw = data.get("scoreCard", [])

        t1 = header.get("team1", {}).get("name", "Team 1")
        t2 = header.get("team2", {}).get("name", "Team 2")
        desc = header.get("matchDescription", "")
        series = header.get("seriesName", "")
        full_name = f"{t1} vs {t2}" + (f", {desc}" if desc else "") + (f" ({series})" if series else "")

        venue_data = header.get("venue", {})
        venue_str = f"{venue_data.get('name', '')}, {venue_data.get('city', '')}".strip(", ")

        innings_list = []
        scores = []

        for idx, inn in enumerate(scorecard_raw):
            bat_team = inn.get("batTeamDetails", {})
            bowl_team = inn.get("bowlTeamDetails", {})
            score_det = inn.get("scoreDetails", {})

            r = int(score_det.get("runs") or 0)
            w = int(score_det.get("wickets") or 0)
            o = float(score_det.get("overs") or 0.0)
            team_name = bat_team.get("batTeamName", f"Innings {idx+1}")

            scores.append({
                "r": r,
                "w": w,
                "o": o,
                "inning": f"{team_name} Inning {idx+1}"
            })

            # Batting figures
            batting = []
            for b_id, b_data in (bat_team.get("batsmenData") or {}).items():
                batting.append({
                    "batsman": {"name": b_data.get("batName", "Batter")},
                    "r": int(b_data.get("runs") or 0),
                    "b": int(b_data.get("balls") or 0),
                    "4s": int(b_data.get("fours") or 0),
                    "6s": int(b_data.get("sixes") or 0),
                    "sr": float(b_data.get("strikeRate") or 0.0),
                    "dismissal": b_data.get("outDesc") or ("batting" if not b_data.get("isOut") else "out")
                })

            # Bowling figures
            bowling = []
            for bw_id, bw_data in (bowl_team.get("bowlersData") or {}).items():
                bowling.append({
                    "bowler": {"name": bw_data.get("bowlName", "Bowler")},
                    "o": float(bw_data.get("overs") or 0.0),
                    "m": int(bw_data.get("maidens") or 0),
                    "r": int(bw_data.get("runs") or 0),
                    "w": int(bw_data.get("wickets") or 0),
                    "eco": float(bw_data.get("economy") or 0.0)
                })

            innings_list.append({
                "inning": f"{team_name} Inning {idx+1}",
                "batting": batting,
                "bowling": bowling,
                "total": r,
                "wickets": w,
                "overs": o,
                "extras": inn.get("extrasData", {}).get("total", 0)
            })

        return {
            "id": f"cb_{clean_id}",
            "cricbuzzId": clean_id,
            "name": full_name,
            "matchType": (header.get("matchFormat") or "t20").lower(),
            "status": data.get("status") or header.get("status") or "Match in progress",
            "venue": venue_str,
            "teams": [t1, t2],
            "score": scores,
            "scorecard": innings_list,
            "isDemo": False,
            "source": "Cricbuzz Live Scorecard"
        }
    except Exception as e:
        print(f"Error fetching full scorecard for {clean_id}: {e}")
        return None
