#!/usr/bin/env python3
"""
Vaakya — DB Training Pair Exporter
====================================
Pulls approved conversations from the database and exports them as JSONL
training pairs, appending to the existing language-specific training files.

Usage:
    # Export all approved pairs for all languages
    python3 export_training_pairs.py

    # Export for a specific language only
    python3 export_training_pairs.py --lang te

    # Dry run — print pairs without writing
    python3 export_training_pairs.py --dry-run

    # Export to a custom output file
    python3 export_training_pairs.py --lang kn --out /tmp/kn_export.jsonl

How to mark conversations for training:
    In pgAdmin, set messages.approved_for_training = true on assistant messages
    whose content you want included. The script pairs each approved assistant
    message with the preceding user message in the same session.

Output format (matches existing synthetic training data):
    {"messages": [
        {"role": "system", "content": "<persona system prompt>"},
        {"role": "user",   "content": "<user message>"},
        {"role": "assistant", "content": "<assistant reply>"}
    ]}
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary", file=sys.stderr)
    sys.exit(1)

OUT_DIR = Path(__file__).parent

LANG_FROM_DIALECT = {
    "kn": "kn",
    "te": "te",
    "ta": "ta",
}

# Maps dialect_code prefix → persona system prompt (mirrors personas.py)
DIALECT_PERSONA_MAP = {
    "kn-north":    "You are Raju, a worker from Hubli. Speak North Karnataka Kannada with Hindi mix, use 'bhava', 'guru'.",
    "kn-bengaluru":"You are Priya, a worker from Bengaluru. Speak Bengaluru Kannada with English mix (Kanglish).",
    "kn-coastal":  "You are Shivu, a worker from Mangalore. Speak Coastal Karnataka Kannada with Tulu influence.",
    "te-hyderabad":"You are Ravi, a worker from Hyderabad. Speak Hyderabadi Telugu with Urdu-Hindi mix, use 'bro', 'maccha'.",
    "te-coastal-ap": "You are Lakshmi, a worker from Coastal AP. Speak Coastal Andhra Telugu.",
    "te-rayalaseema": "You are Suresh, a worker from Kurnool. Speak Rayalaseema Telugu with clipped pronunciation.",
    "ta-chennai":  "You are Murugan, a worker from Chennai. Speak Chennai Tamil (Madras bashai), use 'machan', 'da'.",
    "ta-west":     "You are Kavitha, a worker from Coimbatore. Speak West Tamil with 'nga' suffix.",
    "ta-south":    "You are Selvam, a worker from Madurai. Speak South Tamil with vowel elongation.",
}

DEFAULT_SYSTEM = "You are a helpful assistant responding in the user's natural spoken dialect."


def get_db_connection():
    db_url = os.environ.get("DATABASE_URL", "postgresql://vaakya:vaakya@localhost:5432/vaakya")
    # psycopg2 doesn't accept the postgresql:// scheme — normalise
    db_url = db_url.replace("postgresql://", "postgres://", 1)
    return psycopg2.connect(db_url, cursor_factory=psycopg2.extras.RealDictCursor)


def dialect_to_lang(dialect_code: str) -> str | None:
    if dialect_code:
        prefix = dialect_code.split("-")[0]
        if prefix in LANG_FROM_DIALECT:
            return prefix
    return None


def system_prompt_for_dialect(dialect_code: str) -> str:
    if not dialect_code:
        return DEFAULT_SYSTEM
    for prefix, prompt in DIALECT_PERSONA_MAP.items():
        if dialect_code.startswith(prefix):
            return prompt
    return DEFAULT_SYSTEM


def fetch_approved_pairs(conn, lang_filter: str = None) -> list[dict]:
    """
    For each approved assistant message, find the immediately preceding
    user message in the same session and form a training pair.
    """
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                m.id              AS msg_id,
                m.session_id,
                m.content         AS assistant_content,
                m.transcript      AS assistant_transcript,
                u.dialect_code,
                -- previous user message in same session
                prev.content      AS user_content,
                prev.transcript   AS user_transcript
            FROM messages m
            JOIN sessions s ON s.id = m.session_id
            JOIN users u ON u.id = s.user_id
            LEFT JOIN LATERAL (
                SELECT content, transcript
                FROM messages
                WHERE session_id = m.session_id
                  AND role = 'user'
                  AND id < m.id
                ORDER BY id DESC
                LIMIT 1
            ) prev ON true
            WHERE m.role = 'assistant'
              AND m.approved_for_training = true
              AND prev.content IS NOT NULL
            ORDER BY m.session_id, m.id
        """)
        rows = cur.fetchall()

    pairs = []
    for row in rows:
        lang = dialect_to_lang(row["dialect_code"])
        if lang_filter and lang != lang_filter:
            continue
        if not lang:
            continue

        # Prefer transcript (spoken) over content (may be audio_b64)
        user_text = row["user_transcript"] or row["user_content"]
        assistant_text = row["assistant_transcript"] or row["assistant_content"]

        # Skip if either side looks like raw audio data
        if not user_text or len(user_text) < 5:
            continue
        if not assistant_text or len(assistant_text) < 5:
            continue
        if user_text.startswith("//") or assistant_text.startswith("//"):
            continue

        pairs.append({
            "lang": lang,
            "dialect_code": row["dialect_code"],
            "messages": [
                {"role": "system",    "content": system_prompt_for_dialect(row["dialect_code"])},
                {"role": "user",      "content": user_text},
                {"role": "assistant", "content": assistant_text},
            ],
        })

    return pairs


def export(pairs: list[dict], out_file: Path, dry_run: bool):
    if dry_run:
        for p in pairs:
            print(json.dumps(p, ensure_ascii=False))
        return

    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "a", encoding="utf-8") as f:
        for p in pairs:
            record = {"messages": p["messages"]}
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    print(f"  ✓ {len(pairs)} pairs appended → {out_file}")


def main():
    parser = argparse.ArgumentParser(description="Export approved DB conversations as JSONL training pairs")
    parser.add_argument("--lang", choices=["kn", "te", "ta"], help="Export only this language (default: all)")
    parser.add_argument("--out", help="Output JSONL file (default: training_data/<lang>/db_exported.jsonl)")
    parser.add_argument("--dry-run", action="store_true", help="Print pairs to stdout without writing")
    args = parser.parse_args()

    conn = get_db_connection()
    pairs = fetch_approved_pairs(conn, lang_filter=args.lang)
    conn.close()

    if not pairs:
        print("No approved pairs found. Mark assistant messages with approved_for_training=true in pgAdmin.")
        return

    print(f"Found {len(pairs)} approved pairs.")

    if args.lang:
        # Single language export
        out_file = Path(args.out) if args.out else (OUT_DIR / args.lang / "db_exported.jsonl")
        export(pairs, out_file, args.dry_run)
    else:
        # Split by language
        by_lang: dict[str, list] = {}
        for p in pairs:
            by_lang.setdefault(p["lang"], []).append(p)

        for lang, lang_pairs in by_lang.items():
            out_file = Path(args.out) if args.out else (OUT_DIR / lang / "db_exported.jsonl")
            print(f"  {lang}: {len(lang_pairs)} pairs")
            export(lang_pairs, out_file, args.dry_run)


if __name__ == "__main__":
    main()
