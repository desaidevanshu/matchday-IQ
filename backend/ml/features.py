"""
MATCHDAY IQ — Feature Engineering & Data Pipeline
Normalizes cricket match data and derives deterministic cricket metrics.
"""

from typing import Dict, Any, List

def engineer_features(match_data: Dict[str, Any]) -> Dict[str, Any]:
    features = {
        "matchId": match_data.get("id"),
        "matchType": match_data.get("matchType", "t20"),
        "status": match_data.get("status", ""),
        "teams": match_data.get("teams", []),
        "innings": [],
        "currentSituation": None,
        "isDemo": match_data.get("isDemo", False)
    }

    scores = match_data.get("score") or []
    if not scores:
        return features

    match_type = str(match_data.get("matchType", "t20")).lower()
    max_overs = 20 if "t20" in match_type else (50 if "odi" in match_type else 90)
    max_balls = max_overs * 6

    for idx, inning in enumerate(scores):
        runs = int(inning.get("r") or 0)
        wickets = int(inning.get("w") or 0)
        overs_raw = float(inning.get("o") or 0.0)
        
        completed_overs = int(overs_raw)
        balls_in_over = int(round((overs_raw - completed_overs) * 10))
        total_balls = completed_overs * 6 + balls_in_over
        balls_remaining = max(0, max_balls - total_balls)
        wickets_remaining = max(0, 10 - wickets)
        
        crr = (runs / total_balls * 6.0) if total_balls > 0 else 0.0

        features["innings"].append({
            "inningName": inning.get("inning", f"Innings {idx + 1}"),
            "runs": runs,
            "wickets": wickets,
            "overs": overs_raw,
            "totalBalls": total_balls,
            "ballsRemaining": balls_remaining,
            "wicketsRemaining": wickets_remaining,
            "currentRunRate": round(crr, 2),
            "maxOvers": max_overs,
            "maxBalls": max_balls
        })

    if len(features["innings"]) >= 2:
        first_inn = features["innings"][0]
        second_inn = features["innings"][1]
        target = first_inn["runs"] + 1
        runs_required = target - second_inn["runs"]
        balls_left = second_inn["ballsRemaining"]
        wickets_left = second_inn["wicketsRemaining"]
        
        rrr = (runs_required / balls_left * 6.0) if balls_left > 0 else (0.0 if runs_required <= 0 else 99.9)
        rr_diff = rrr - second_inn["currentRunRate"]

        difficulty = _calculate_chase_difficulty(runs_required, balls_left, wickets_left, rrr)

        features["currentSituation"] = {
            "target": target,
            "runsRequired": max(0, runs_required),
            "ballsRemaining": balls_left,
            "wicketsRemaining": wickets_left,
            "currentRunRate": second_inn["currentRunRate"],
            "requiredRunRate": round(rrr, 2),
            "runRateDiff": round(rr_diff, 2),
            "chaseDifficulty": difficulty,
            "isChasing": runs_required > 0,
            "hasWon": runs_required <= 0
        }

    return features

def _calculate_chase_difficulty(runs_required: int, balls_left: int, wickets_left: int, rrr: float) -> str:
    if runs_required <= 0:
        return "won"
    if balls_left <= 0 or wickets_left <= 0:
        return "lost"

    score = 0
    if rrr > 14:
        score += 4
    elif rrr > 11:
        score += 3
    elif rrr > 9:
        score += 2
    elif rrr > 7.5:
        score += 1

    if wickets_left <= 2:
        score += 3
    elif wickets_left <= 4:
        score += 2
    elif wickets_left <= 6:
        score += 1

    if balls_left <= 12:
        score += 2
    elif balls_left <= 24:
        score += 1

    if score >= 6:
        return "very_hard"
    if score >= 4:
        return "hard"
    if score >= 2:
        return "moderate"
    return "comfortable"
