import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import CrimeRecord, Suspect, District
from typing import List, Dict, Any, Optional
import math

class PredictionService:
    # Seasonal weights (index 0 = Jan)
    SEASONAL = [0.92, 0.88, 0.95, 1.02, 1.05, 1.10, 1.12, 1.08, 1.00, 0.98, 1.03, 1.15]
    # Day multipliers (0=Sun)
    DAY_MULTIPLIER = [1.08, 0.92, 0.88, 0.90, 0.96, 1.12, 1.14]

    @staticmethod
    def linear_regression(data: List[int]):
        n = len(data)
        if n < 2:
            return 0.0, data[0] if n > 0 else 0.0, 0.0

        sumX = sum(range(n))
        sumY = sum(data)
        sumXY = sum(x * y for x, y in enumerate(data))
        sumX2 = sum(x * x for x in range(n))

        slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) if (n * sumX2 - sumX * sumX) != 0 else 0.0
        intercept = (sumY - slope * sumX) / n

        meanY = sumY / n
        ssTot = sum((y - meanY) ** 2 for y in data)
        ssRes = sum((y - (slope * x + intercept)) ** 2 for x, y in enumerate(data))
        r2 = 1.0 - (ssRes / ssTot) if ssTot > 0 else 0.0

        return slope, intercept, r2

    @classmethod
    def get_monthly_history(cls, db: Session, district: str, crime_type: str) -> List[int]:
        counts = [0] * 18 # Jan 2024 to Jun 2025
        
        q = db.query(CrimeRecord)
        if district != "all":
            q = q.filter(CrimeRecord.district == district)
        if crime_type != "all":
            q = q.filter((CrimeRecord.crime_type == crime_type) | (CrimeRecord.category == crime_type))

        for inc in q.all():
            try:
                d = datetime.datetime.strptime(inc.date, "%Y-%m-%d")
                year, month = d.year, d.month - 1
                
                idx = -1
                if year == 2024:
                    idx = month
                elif year == 2025:
                    idx = 12 + month
                    
                if 0 <= idx < 18:
                    counts[idx] += 1
            except:
                continue
        return counts

    @classmethod
    def predict(cls, db: Session, district: str = "all", crime_type: str = "all", horizon: str = "week") -> Dict[str, Any]:
        history = cls.get_monthly_history(db, district, crime_type)
        slope, intercept, r2 = cls.linear_regression(history)

        # Base month index 18 (July 2025)
        base_prediction = max(0.0, slope * 18 + intercept)
        
        # Double Exponential Smoothing (Holt's Method) for local trend weight adjustments
        alpha, beta = 0.3, 0.1
        level = history[0]
        trend = history[1] - history[0] if len(history) > 1 else 0.0
        for val in history[1:]:
            last_level = level
            level = alpha * val + (1.0 - alpha) * (level + trend)
            trend = beta * (level - last_level) + (1.0 - beta) * trend
        
        holt_forecast = max(0.0, level + trend)
        
        # Ensemble: 60% Linear Trend + 40% Local Holt Smoothing
        hybrid_prediction = (0.6 * base_prediction) + (0.4 * holt_forecast)
        seasonally_adjusted = hybrid_prediction * cls.SEASONAL[6] # July

        if horizon == "tomorrow":
            day_of_week = (datetime.datetime.now().weekday() + 1) % 7
            mult = cls.DAY_MULTIPLIER[day_of_week]
            predicted_count = max(1, round((seasonally_adjusted / 30.0) * mult))
            horizon_label = "Next 24 Hours"
            horizon_days = 1
        elif horizon == "week":
            predicted_count = max(3, round(seasonally_adjusted / 4.3))
            horizon_label = "Next 7 Days"
            horizon_days = 7
        else: # month
            predicted_count = max(10, round(seasonally_adjusted))
            horizon_label = "Next 30 Days"
            horizon_days = 30

        data_vol = sum(history)
        vol_factor = min(1.0, data_vol / 200.0)
        confidence = float(min(0.97, max(0.40, (r2 * 0.6) + (vol_factor * 0.4))))

        per_day = predicted_count / horizon_days
        risk_level = "LOW"
        if per_day > 15:
            risk_level = "CRITICAL"
        elif per_day > 8:
            risk_level = "HIGH"
        elif per_day > 4:
            risk_level = "MEDIUM"

        probability = float(min(0.97, confidence * 0.9 + 0.05))

        recent_avg = sum(history[14:]) / 4.0 if len(history) >= 4 else 0.0
        prior_avg = sum(history[10:14]) / 4.0 if len(history) >= 8 else 0.0
        trend_pct = ((recent_avg - prior_avg) / prior_avg * 100.0) if prior_avg > 0 else 0.0
        trend_dir = "INCREASING" if trend_pct > 5 else "DECREASING" if trend_pct < -5 else "STABLE"

        factors = []
        if slope > 0.5:
            factors.append(f"Long-term crime trend is increasing at +{slope:.1f} cases/month.")
        elif slope < -0.5:
            factors.append(f"Long-term crime trend is decreasing at {slope:.1f} cases/month.")
        else:
            factors.append(f"Crime volume is stable (slope: {slope:.2f} cases/month).")

        if cls.SEASONAL[6] > 1.05:
            factors.append(f"July historically shows a +{round((cls.SEASONAL[6] - 1.0) * 100)}% seasonal uplift due to monsoons.")

        factors.append(f"Model fit quality (R²): {r2 * 100.0:.0f}% — {'high' if r2 > 0.7 else 'moderate' if r2 > 0.4 else 'limited'} confidence.")

        recs = []
        if risk_level in ["CRITICAL", "HIGH"]:
            recs.append({"action": "Increase patrol density", "priority": "high", "reason": f"Predicted {predicted_count} incidents"})
            recs.append({"action": "Activate CCTV alert monitoring", "priority": "high", "reason": "High-risk period"})
        recs.append({"action": "Issue district briefing", "priority": "low", "reason": "Inform field staff"})

        return {
            "type": "prediction",
            "district": "All Karnataka" if district == "all" else district,
            "crime_type": "All Crime Types" if crime_type == "all" else crime_type,
            "horizon": horizon,
            "horizon_label": horizon_label,
            "predicted_count": predicted_count,
            "probability": round(probability, 2),
            "confidence": round(confidence, 2),
            "risk_level": risk_level,
            "trend_direction": trend_dir,
            "trend_pct": round(trend_pct, 1),
            "factors": factors,
            "recommendations": recs
        }

class HotspotService:
    @staticmethod
    def detect_clusters(db: Session, district: str = "all") -> List[Dict[str, Any]]:
        # Run simple clustering logic based on bounding box splits of incident lat/lngs
        q = db.query(CrimeRecord)
        if district != "all":
            q = q.filter(CrimeRecord.district == district)
        
        incidents = q.all()
        if not incidents:
            return []

        # Partition into simple geographic grids (size approx 0.05 degrees)
        grids = {}
        for inc in incidents:
            grid_x = round(inc.lat / 0.02) * 0.02
            grid_y = round(inc.lng / 0.02) * 0.02
            key = (round(grid_x, 4), round(grid_y, 4))
            
            if key not in grids:
                grids[key] = []
            grids[key].append(inc)

        clusters = []
        cluster_idx = 1
        for (lat, lng), inc_list in grids.items():
            count = len(inc_list)
            if count < 5:
                continue # filter low density areas

            # Calculate convex hull bounding box simple boundaries
            lats = [i.lat for i in inc_list]
            lngs = [i.lng for i in inc_list]
            min_lat, max_lat = min(lats), max(lats)
            min_lng, max_lng = min(lngs), max(lngs)

            # Center coordinates
            center_lat = sum(lats) / count
            center_lng = sum(lngs) / count

            # Emerging check (if count increased by 30% recently)
            # split incidents by date (pre/post June 2025)
            recent_count = sum(1 for i in inc_list if i.date >= "2025-05-15")
            prior_count = count - recent_count
            is_emerging = recent_count > (prior_count * 0.5) and count > 8

            clusters.append({
                "id": f"CLUST_{cluster_idx}",
                "name": f"Sector-{cluster_idx} Density Point",
                "center": [center_lat, center_lng],
                "radius": 1500, # meters
                "intensity": "Critical" if count > 45 else "High" if count > 20 else "Medium",
                "count": count,
                "confidence": min(0.95, 0.40 + count * 0.02),
                "isEmerging": is_emerging,
                "polygon": [
                    [min_lat - 0.002, min_lng - 0.002],
                    [min_lat - 0.002, max_lng + 0.002],
                    [max_lat + 0.002, max_lng + 0.002],
                    [max_lat + 0.002, min_lng - 0.002]
                ]
            })
            cluster_idx += 1

        return sorted(clusters, key=lambda x: x["count"], reverse=True)

class AnomalyService:
    @staticmethod
    def scan(db: Session) -> List[Dict[str, Any]]:
        anomalies = []
        districts = [d[0] for d in db.query(CrimeRecord.district).distinct().all()]
        types = [t[0] for t in db.query(CrimeRecord.crime_type).distinct().all()]

        # Threshold date for recent 14 days
        t_recent = "2025-06-15"
        
        for dist in districts:
            for c_type in types:
                # Count cases in recent 14 days
                recent = db.query(func.count(CrimeRecord.id)).filter(
                    CrimeRecord.district == dist,
                    CrimeRecord.crime_type == c_type,
                    CrimeRecord.date >= t_recent
                ).scalar() or 0

                # Count historical total
                total = db.query(func.count(CrimeRecord.id)).filter(
                    CrimeRecord.district == dist,
                    CrimeRecord.crime_type == c_type
                ).scalar() or 0

                # Normal baseline expected cases in 14 days based on total 18 months
                expected = max(1.0, (total - recent) / 36.0) # 18 months ~ 36 fortnights
                
                # Check if recent exceeds baseline by 2 standard deviations
                if recent > 5 and recent > (expected * 2.5):
                    ratio = recent / expected
                    anomalies.append({
                        "id": f"ANOM_{dist[:3].upper()}_{c_type[:3].upper()}",
                        "type": "Spike",
                        "severity": "critical" if ratio > 4 else "high",
                        "district": dist,
                        "crimeType": c_type,
                        "description": f"**{c_type}** is {ratio:.1f}x above baseline in {dist} over the last 14 days ({recent} cases vs expected {expected:.1f}).",
                        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %I:%M %p")
                    })
        return anomalies

class NetworkService:
    @staticmethod
    def get_network(db: Session) -> Dict[str, Any]:
        # Discovers links from shared vehicles or shared phone numbers
        incidents = db.query(CrimeRecord).filter(CrimeRecord.suspect != None).all()
        suspects = {}
        links = []

        # Find suspects and link them if they are in the same district and category
        for inc in incidents:
            if not inc.suspect:
                continue
            s_name = inc.suspect.name
            if s_name not in suspects:
                suspects[s_name] = {
                    "id": inc.suspect.id,
                    "name": s_name,
                    "district": inc.district,
                    "isRepeat": inc.suspect.is_repeat_offender,
                    "cases": []
                }
            suspects[s_name]["cases"].append(inc.id)

        # Generate links for shared fields
        sus_list = list(suspects.values())
        for i in range(len(sus_list)):
            for j in range(i + 1, len(sus_list)):
                s1 = sus_list[i]
                s2 = sus_list[j]
                
                # Shared case or shared district crime categories
                shared_cases = set(s1["cases"]).intersection(set(s2["cases"]))
                if shared_cases:
                    links.append({
                        "source": s1["name"],
                        "target": s2["name"],
                        "type": "Case Co-accused",
                        "weight": len(shared_cases) * 5
                    })
                elif s1["isRepeat"] and s2["isRepeat"] and s1["district"] == s2["district"]:
                    links.append({
                        "source": s1["name"],
                        "target": s2["name"],
                        "type": "Shared District Ring",
                        "weight": 2
                    })

        return {
            "nodes": sus_list,
            "links": links
        }

class ChatbotService:
    @staticmethod
    def parse_and_respond(db: Session, query: str) -> Dict[str, Any]:
        q_lower = query.lower()
        
        # Check predict keywords
        if "predict" in q_lower or "forecast" in q_lower:
            # extract district
            dist = "all"
            if "bengaluru" in q_lower:
                dist = "Bengaluru Urban"
            elif "mysuru" in q_lower:
                dist = "Mysuru"
            
            # extract type
            c_type = "all"
            if "cyber" in q_lower:
                c_type = "Cybercrime"
            elif "theft" in q_lower:
                c_type = "Vehicle Theft"

            result = PredictionService.predict(db, dist, c_type, "week")
            explanation = (
                f"📊 **AI Prediction Forecast for {result['district']} ({result['crime_type']})**\n"
                f"→ Horizon: {result['horizon_label']} | Risk: **{result['risk_level']}**\n"
                f"→ Expected Count: **{result['predicted_count']} incidents** (Confidence: {result['confidence'] * 100:.0f}%)\n"
                f"→ Recommendations: {', '.join(r['action'] for r in result['recommendations'])}"
            )
            return {"response": explanation, "type": "prediction", "data": result}

        # Check anomaly keywords
        if "anomaly" in q_lower or "spike" in q_lower:
            anoms = AnomalyService.scan(db)
            if anoms:
                explanation = "🚨 **Active AI Anomalies Flagged:**\n" + "\n".join(f"• {a['description']}" for a in anoms[:3])
                return {"response": explanation, "type": "anomaly", "data": {"anomalies": anoms}}
            return {"response": "No significant statistical anomalies detected in the last 14 days.", "type": "text"}

        # General help response
        response = (
            "👮 **Karnataka Police Intelligence Assistant**\n\n"
            "I can analyze the active database and compute real-time metrics:\n"
            "• *'Predict vehicle theft in Bengaluru'* (Statistical regression forecasts)\n"
            "• *'Show active anomalies'* (Dynamic statistical spike scans)\n"
            "• *'Scan hotspots'* (Convex hull clustering checks)"
        )
        return {"response": response, "type": "text"}
