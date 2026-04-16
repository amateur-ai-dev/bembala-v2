#!/usr/bin/env python3
"""
Vaakya — YouTube Transcript Fetcher
====================================
Downloads audio from YouTube videos and transcribes them using OpenAI Whisper.
Outputs raw transcripts + formatted JSONL training pairs.

Requirements:
    pip3 install yt-dlp openai-whisper

Usage:
    # Transcribe a single video
    python fetch_yt_transcripts.py --url "https://youtube.com/watch?v=..." --lang kn

    # Transcribe all videos in a playlist
    python fetch_yt_transcripts.py --playlist "https://youtube.com/playlist?list=..." --lang te

    # Batch-process from a channels file
    python fetch_yt_transcripts.py --channels channels.json --lang ta --max-per-channel 10

Filters applied automatically:
    - Skips videos > 30 minutes (likely news/documentary)
    - Skips videos with titles containing news keywords
    - Prefers videos < 8 minutes (skits, shorts, vlogs)
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path


def _yt_dlp_bin() -> str:
    path = shutil.which("yt-dlp")
    if not path:
        print("ERROR: yt-dlp not found. Run: brew install yt-dlp", file=sys.stderr)
        sys.exit(1)
    return path

# ── news / formal content keywords to skip ────────────────────────────────────
NEWS_KEYWORDS = [
    # English
    "breaking news", "news update", "live news", "latest news", "today news",
    "press conference", "parliament", "assembly", "budget", "election",
    # Kannada
    "ಸುದ್ದಿ", "ವಾರ್ತೆ",
    # Telugu
    "వార్తలు", "న్యూస్", "బ్రేకింగ్",
    # Tamil
    "செய்திகள்", "நியூஸ்",
]

LANG_WHISPER_MAP = {
    "kn": "kannada",
    "te": "telugu",
    "ta": "tamil",
}

OUT_DIR = Path(__file__).parent


def is_news(title: str) -> bool:
    tl = title.lower()
    return any(kw.lower() in tl for kw in NEWS_KEYWORDS)


def fetch_video_info(url: str) -> dict:
    """Use yt-dlp to get video metadata without downloading."""
    result = subprocess.run(
        [_yt_dlp_bin(), "--dump-json", "--no-playlist", url],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        return {}
    return json.loads(result.stdout)


def _subprocess_env() -> dict:
    env = os.environ.copy()
    env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:" + env.get("PATH", "")
    return env


def download_audio(url: str, out_path: Path) -> bool:
    """Download audio-only from a YouTube URL."""
    result = subprocess.run(
        [
            _yt_dlp_bin(),
            "-x",                       # extract audio only
            "--audio-format", "mp3",
            "--audio-quality", "5",     # ~128kbps — enough for Whisper
            "--no-playlist",
            "-o", str(out_path),
            url,
        ],
        capture_output=True, text=True, env=_subprocess_env(),
    )
    if result.returncode != 0:
        print(f"  yt-dlp stderr: {result.stderr[-500:]}", file=sys.stderr)
    return result.returncode == 0


def transcribe(audio_path: Path, lang: str) -> str:
    """Transcribe audio using Whisper. Returns raw transcript text."""
    try:
        import whisper  # type: ignore
    except ImportError:
        print("ERROR: whisper not installed. Run: pip install openai-whisper", file=sys.stderr)
        sys.exit(1)

    whisper_lang = LANG_WHISPER_MAP.get(lang, lang)
    model = whisper.load_model("medium")           # 'small' for faster, 'large' for better
    result = model.transcribe(str(audio_path), language=whisper_lang, task="transcribe")
    return result["text"].strip()


def transcript_to_training_pairs(transcript: str, persona_name: str) -> list[dict]:
    """
    Split a raw transcript into conversation training pairs.
    Heuristic: split on sentence boundaries, create Q/A windows.
    """
    sentences = re.split(r'[।॥\.\!\?]+', transcript)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 15]

    pairs = []
    for i in range(0, len(sentences) - 1, 2):
        user_turn = sentences[i]
        assistant_turn = sentences[i + 1] if i + 1 < len(sentences) else ""
        if user_turn and assistant_turn:
            pairs.append({
                "messages": [
                    {"role": "system", "content": f"You are {persona_name}, responding in your natural spoken dialect."},
                    {"role": "user", "content": user_turn},
                    {"role": "assistant", "content": assistant_turn},
                ]
            })
    return pairs


def process_video(url: str, lang: str, persona_name: str) -> list[dict]:
    """Full pipeline: metadata check → download → transcribe → training pairs."""
    print(f"  Fetching metadata for {url} ...")
    info = fetch_video_info(url)
    if not info:
        print("  ✗ Could not fetch metadata, skipping")
        return []

    title = info.get("title", "")
    duration = info.get("duration", 0)  # seconds

    if is_news(title):
        print(f"  ✗ Skipping (news): {title}")
        return []

    if duration > 1800:  # > 30 min
        print(f"  ✗ Skipping (too long: {duration//60}min): {title}")
        return []

    print(f"  ✓ Processing: {title} ({duration//60}m {duration%60}s)")

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        audio_path = Path(f.name)
    audio_path.unlink(missing_ok=True)  # yt-dlp must create the file itself

    try:
        if not download_audio(url, audio_path):
            print("  ✗ Download failed")
            return []

        transcript = transcribe(audio_path, lang)

        # Save raw transcript
        raw_dir = OUT_DIR / "raw_transcripts" / lang
        raw_dir.mkdir(parents=True, exist_ok=True)
        video_id = info.get("id", "unknown")
        transcript_file = raw_dir / f"{video_id}.txt"
        transcript_file.write_text(f"# {title}\n# URL: {url}\n\n{transcript}", encoding="utf-8")
        print(f"  ✓ Transcript saved → {transcript_file}")

        pairs = transcript_to_training_pairs(transcript, persona_name)
        print(f"  ✓ Generated {len(pairs)} training pairs")
        return pairs

    finally:
        audio_path.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description="Fetch & transcribe YouTube videos for Vaakya training data")
    parser.add_argument("--url", help="Single YouTube video URL")
    parser.add_argument("--playlist", help="YouTube playlist URL")
    parser.add_argument("--channels", help="JSON file with channel list (see channels_template.json)")
    parser.add_argument("--lang", required=True, choices=["kn", "te", "ta"])
    parser.add_argument("--persona", default="assistant", help="Persona name for system prompt")
    parser.add_argument("--max-per-channel", type=int, default=15)
    parser.add_argument("--out", help="Output JSONL file (default: training_data/<lang>/yt_scraped.jsonl)")
    args = parser.parse_args()

    out_file = Path(args.out) if args.out else (OUT_DIR / args.lang / "yt_scraped.jsonl")
    out_file.parent.mkdir(parents=True, exist_ok=True)

    all_pairs: list[dict] = []

    if args.url:
        all_pairs += process_video(args.url, args.lang, args.persona)

    elif args.playlist:
        # get all video URLs from playlist
        result = subprocess.run(
            [_yt_dlp_bin(), "--flat-playlist", "--dump-single-json", args.playlist],
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            playlist_info = json.loads(result.stdout)
            entries = playlist_info.get("entries", [])[:args.max_per_channel]
            for entry in entries:
                vid_url = f"https://youtube.com/watch?v={entry['id']}"
                all_pairs += process_video(vid_url, args.lang, args.persona)
                time.sleep(2)  # be polite

    elif args.channels:
        channels_data = json.loads(Path(args.channels).read_text())
        for channel in channels_data.get("channels", []):
            if channel.get("lang") != args.lang:
                continue
            persona = channel.get("persona", args.persona)
            playlist_url = channel.get("uploads_playlist") or channel.get("url")
            if not playlist_url:
                continue
            print(f"\n── Channel: {channel['name']} ──")
            result = subprocess.run(
                [_yt_dlp_bin(), "--flat-playlist", f"--playlist-end={args.max_per_channel}",
                 "--dump-single-json", playlist_url],
                capture_output=True, text=True,
            )
            if result.returncode != 0:
                continue
            info = json.loads(result.stdout)
            for entry in info.get("entries", []):
                vid_url = f"https://youtube.com/watch?v={entry['id']}"
                all_pairs += process_video(vid_url, args.lang, persona)
                time.sleep(2)

    else:
        parser.print_help()
        sys.exit(1)

    # Write output JSONL
    with open(out_file, "a", encoding="utf-8") as f:
        for pair in all_pairs:
            f.write(json.dumps(pair, ensure_ascii=False) + "\n")

    print(f"\n✓ {len(all_pairs)} training pairs appended to {out_file}")


if __name__ == "__main__":
    main()
