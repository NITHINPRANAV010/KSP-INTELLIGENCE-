from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import CrimeRecord, Case, Evidence, District, Report, Suspect, Alert
from app.ai.vector_store import SimpleVectorStore
from app.ai.providers import LLMProvider
from app.services.ai_services import PredictionService, HotspotService, AnomalyService
from typing import List, Dict, Any, Optional
import json

class RAGAgentLoop:
    _store: Optional[SimpleVectorStore] = None
    _indexed: bool = False

    @classmethod
    def index_database(cls, db: Session):
        """
        Pull all assets from DB and index them in the SimpleVectorStore.
        """
        cls._store = SimpleVectorStore()
        
        # 1. Index Crimes & Cases
        crimes = db.query(CrimeRecord).all()
        for c in crimes:
            content = (
                f"Crime Case ID {c.id} Case Number {c.case_number} "
                f"Type {c.crime_type} Category {c.category} "
                f"District {c.district} Station {c.police_station} "
                f"Method {c.crime_method} Vehicle {c.vehicle_info} "
                f"Phone {c.phone_number} Severity {c.severity} Status {c.status}"
            )
            cls._store.add_document(
                doc_id=c.id,
                content=content,
                original_obj={"id": c.id, "type": "crime", "crime_type": c.crime_type, "district": c.district}
            )

        # 2. Index Evidence
        evidence = db.query(Evidence).all()
        for ev in evidence:
            content = (
                f"Evidence ID {ev.id} Case ID {ev.case_id} "
                f"Name {ev.name} Type {ev.type} "
                f"Uploaded by {ev.uploaded_by} Hash {ev.hash_id}"
            )
            cls._store.add_document(
                doc_id=ev.id,
                content=content,
                original_obj={"id": ev.id, "type": "evidence", "case_id": ev.case_id}
            )

        # 3. Index Reports
        reports = db.query(Report).all()
        for rep in reports:
            content = f"Report ID {rep.id} Title {rep.title} Type {rep.type} Created at {rep.created_at}"
            cls._store.add_document(
                doc_id=rep.id,
                content=content,
                original_obj={"id": rep.id, "type": "report", "title": rep.title}
            )

        cls._store.build_index()
        cls._indexed = True
        print(f"RAG-AGENT: Indexed {len(cls._store.documents)} records successfully.")

    @classmethod
    def _get_live_stats(cls, db: Session) -> str:
        """
        Pull real-time aggregate statistics from the database and format
        them as a structured context block for the LLM prompt.
        """
        try:
            total = db.query(func.count(CrimeRecord.id)).scalar() or 0
            solved = db.query(func.count(CrimeRecord.id)).filter(
                CrimeRecord.status.in_(["Resolved", "Arrested"])
            ).scalar() or 0
            active = total - solved
            solve_rate = round((solved / total * 100), 1) if total > 0 else 0

            repeat_offenders = db.query(func.count(Suspect.id)).filter(
                Suspect.is_repeat_offender == True
            ).scalar() or 0

            active_alerts = db.query(func.count(Alert.id)).filter(
                Alert.resolved == False
            ).scalar() or 0

            # Top districts by incident count
            top_districts = (
                db.query(CrimeRecord.district, func.count(CrimeRecord.id).label("cnt"))
                .group_by(CrimeRecord.district)
                .order_by(func.count(CrimeRecord.id).desc())
                .limit(5)
                .all()
            )
            districts_str = ", ".join(
                [f"{d.district} ({d.cnt} incidents)" for d in top_districts]
            ) or "N/A"

            # Top crime types
            top_crimes = (
                db.query(CrimeRecord.crime_type, func.count(CrimeRecord.id).label("cnt"))
                .group_by(CrimeRecord.crime_type)
                .order_by(func.count(CrimeRecord.id).desc())
                .limit(5)
                .all()
            )
            crimes_str = ", ".join([f"{c.crime_type} ({c.cnt})" for c in top_crimes]) or "N/A"

            # Known repeat offender suspects
            top_suspects = (
                db.query(Suspect)
                .filter(Suspect.is_repeat_offender == True)
                .limit(5)
                .all()
            )
            suspects_str = (
                ", ".join([f"{s.name} (age {s.age}, {s.gender})" for s in top_suspects])
                if top_suspects else "None on record"
            )

            # Recent active crimes
            recent_crimes = (
                db.query(CrimeRecord)
                .filter(CrimeRecord.status == "Active")
                .order_by(CrimeRecord.date.desc())
                .limit(5)
                .all()
            )
            recent_str = "\n".join([
                f"  - [{c.id}] {c.crime_type} in {c.district} on {c.date} (Severity: {c.severity})"
                for c in recent_crimes
            ]) or "  - None"

            return (
                f"=== LIVE DATABASE STATISTICS (Real-time from KSP SQLite) ===\n"
                f"Total Crime Records    : {total:,}\n"
                f"Solved / Resolved      : {solved:,} ({solve_rate}% solve rate)\n"
                f"Active Investigations  : {active:,}\n"
                f"Repeat Offenders       : {repeat_offenders}\n"
                f"Unresolved Alerts      : {active_alerts}\n\n"
                f"Top Districts by Volume: {districts_str}\n"
                f"Top Crime Types        : {crimes_str}\n"
                f"Known Repeat Offenders : {suspects_str}\n\n"
                f"Recent Active Cases:\n{recent_str}\n"
                f"=== END LIVE STATS ===\n"
            )
        except Exception as e:
            print(f"RAG-AGENT: Failed to fetch live stats: {e}")
            return "=== LIVE STATS: Unavailable (DB read error) ===\n"

    @classmethod
    def run_query(cls, db: Session, user_query: str, provider: str = "openrouter") -> Dict[str, Any]:
        """
        Full RAG pipeline:
        1. Index DB (if not already indexed)
        2. Fetch live aggregate stats from DB
        3. Semantic search for relevant crime records
        4. Build enriched prompt with real data context
        5. Query Ling-3.0-tiny (via OpenRouter) with full context
        6. Return grounded response with explainability metadata
        """
        # Perform indexing on first query run if not already indexed
        if not cls._indexed or cls._store is None:
            cls.index_database(db)

        # 1. Live DB stats (real numbers)
        live_stats = cls._get_live_stats(db)

        # 2. Semantic search for relevant crime records
        rag_results = cls._store.search(user_query, top_n=5)
        context_blocks = []
        sources = []

        for r in rag_results:
            doc = r["doc"]
            score = r["score"]
            context_blocks.append(f"[Match {score:.2f}] {doc['content']}")
            sources.append(f"{doc['id']} ({doc['original']['type'].capitalize()})")

        context_str = (
            "\n".join(context_blocks)
            if context_blocks
            else "No specific records matched this query in the semantic index."
        )

        # 3. Build enriched prompt with live DB context + matched records
        system_instruction = (
            "You are the KSP AI Crime Intelligence Copilot — a Senior Police Crime Intelligence Analyst "
            "for Karnataka State Police. You have access to REAL live database statistics and crime records. "
            "Always ground your answers in the provided database data. Be concise, professional, and structured. "
            "Use bold headings and bullet points. Quote actual numbers from the data. "
            "Never hallucinate or invent statistics — only use what is in the provided context."
        )

        prompt_template = (
            f"Officer's Question: {user_query}\n\n"
            f"--- REAL-TIME DATABASE CONTEXT ---\n"
            f"{live_stats}\n"
            f"--- SEMANTICALLY MATCHED CASE RECORDS ---\n"
            f"{context_str}\n\n"
            f"--- INSTRUCTIONS ---\n"
            f"Answer the officer's question using ONLY the real data provided above. "
            f"Structure your answer with headers. Quote actual numbers from the database. "
            f"Conclude with 2-3 concrete tactical action items based on the data."
        )

        # 4. Query Ling-3.0-tiny via OpenRouter
        llm_response = LLMProvider.query(
            prompt=prompt_template,
            system_instruction=system_instruction,
            provider=provider
        )

        # 5. Build explainability metadata
        confidence = 0.92 if rag_results else 0.70
        suggested_actions = [
            "Deploy patrol units to top-incident districts.",
            "Review recent active cases for investigative leads.",
            "Cross-reference repeat offenders with open cases.",
        ]

        return {
            "response": llm_response,
            "type": "agent_analysis",
            "explainability": {
                "confidenceRating": f"{confidence * 100:.0f}%",
                "evidenceUsed": sources if sources else ["Live DB Statistics"],
                "dataSources": [
                    "KSP SQLite Crime Registry",
                    "TF-IDF Semantic Index",
                    "OpenRouter Ling-3.0-tiny"
                ],
                "reasoningChain": (
                    "1. Fetched real-time aggregate stats from SQLite DB. "
                    "2. Ran TF-IDF cosine similarity search over indexed crime records. "
                    "3. Built enriched prompt with live stats + matched records. "
                    "4. Queried inclusionai/ling-3.0-tiny via OpenRouter with full context."
                ),
                "suggestedNextActions": suggested_actions
            }
        }

