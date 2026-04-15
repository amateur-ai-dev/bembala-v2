# Vaakya — Challenges Faced & How We Fixed Them

> A plain record of every problem hit during the build, what caused it, and how it was resolved.
> Useful for debugging similar issues in the future.

---

## 1. Docker Not Picking Up Code Changes

**What happened:**
Edited a Python file in the backend. Restarted the container with `docker compose restart backend`. The change had no effect.

**Why it happened:**
`docker compose restart` just restarts the existing container — it does not rebuild the Docker image. The old code was still baked into the image.

**Fix:**
```bash
docker compose up -d --build backend
```
The `--build` flag forces Docker to rebuild the image from the latest code.

**Rule going forward:** Any time you change backend code, always use `--build`.

---

## 2. `pip` Not Found on Mac

**What happened:**
Tried to install Python packages with `pip install ...`. Got "command not found".

**Why it happened:**
On Mac with Xcode Command Line Tools, Python is installed as Python 3.9 but only the `pip3` command is available, not `pip`.

**Fix:**
Use `pip3` instead of `pip` for everything:
```bash
pip3 install yt-dlp openai-whisper
```

---

## 3. Script Run From Wrong Directory

**What happened:**
Tried to run the YouTube transcript script from the home directory (`~`):
```
python3 training_data/fetch_yt_transcripts.py ...
```
Got: `can't open file '/Users/nithingowda/training_data/fetch_yt_transcripts.py'`

**Why it happened:**
The path `training_data/fetch_yt_transcripts.py` is relative. When run from `~`, Python looked for it in the home directory, not the project folder.

**Fix:**
Always `cd` into the project folder first:
```bash
cd /Users/nithingowda/vaakya
python3 training_data/fetch_yt_transcripts.py ...
```

---

## 4. `yt-dlp` Not Found When Called From Python Script

**What happened:**
`yt-dlp` worked fine in the terminal. But when the Python script called it via `subprocess`, it got `FileNotFoundError: No such file or directory: 'yt-dlp'`.

**Why it happened:**
When Python spawns a subprocess, it uses a minimal PATH that doesn't include all the directories in the terminal PATH. `yt-dlp` was installed via `pip3` into a user folder that wasn't on the subprocess PATH.

**Fix:**
Install yt-dlp via Homebrew instead of pip3:
```bash
brew install yt-dlp
```
Homebrew installs to `/opt/homebrew/bin` which is more reliably found. The script was also updated to use `shutil.which("yt-dlp")` to resolve the full binary path at runtime.

---

## 5. `ffmpeg` / `ffprobe` Not Found in Subprocess

**What happened:**
yt-dlp downloaded the audio file but failed during conversion with:
```
ERROR: Postprocessing: WARNING: unable to obtain file audio codec with ffprobe
```

**Why it happened:**
Same PATH issue as above. `ffmpeg` was installed via Homebrew at `/opt/homebrew/bin/ffprobe`, but the subprocess spawned by Python didn't have `/opt/homebrew/bin` on its PATH.

**Fix:**
Explicitly pass the full PATH including Homebrew to every subprocess call:
```python
def _subprocess_env() -> dict:
    env = os.environ.copy()
    env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:" + env.get("PATH", "")
    return env
```
Then pass `env=_subprocess_env()` to every `subprocess.run()` call.

---

## 6. yt-dlp Skipping Downloads Due to Empty Temp File

**What happened:**
Even after fixing PATH issues, downloads still failed with the same ffprobe error. When running yt-dlp directly with the same URL and path, it worked fine.

**Why it happened:**
Python's `tempfile.NamedTemporaryFile` creates an actual empty file on disk immediately. When yt-dlp was told to download to that path, it saw the file already existed, assumed it had "already been downloaded", and tried to postprocess the empty file — which ffprobe correctly failed to read.

```
[download] /tmp/tmpXXXXXX.mp3 has already been downloaded
ERROR: Postprocessing: WARNING: unable to obtain file audio codec with ffprobe
```

**Fix:**
Delete the temp file immediately after getting its path, before calling yt-dlp:
```python
with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
    audio_path = Path(f.name)
audio_path.unlink(missing_ok=True)  # yt-dlp must create the file itself
```

---

## 7. TypeScript: `useEffect` Not Imported

**What happened:**
After adding a redirect check in `LoginScreen.tsx`, the frontend failed to compile:
```
Cannot find name 'useEffect'
```

**Why it happened:**
Only `useState` was imported from React. `useEffect` is a separate import.

**Fix:**
```tsx
// Before
import { useState } from 'react'

// After
import { useState, useEffect } from 'react'
```

---

## 8. TypeScript: Unused Functions Warning Treated as Error

**What happened:**
Two helper functions in `transliterate.ts` (`matchCons` and `matchVowel`) caused a TypeScript compile error:
```
TS6133: 'matchCons' is declared but its value is never read
```

**Why it happened:**
The project's TypeScript config treats unused variables as errors (`noUnusedLocals: true`). The functions were extracted helpers whose logic was later inlined directly, leaving the originals unused.

**Fix:**
Removed the unused standalone functions. The logic was already inlined in the main `transliterate()` function, so nothing was lost.

---

## 9. Whisper Model Checksum Mismatch

**What happened:**
When Whisper first loaded, it printed:
```
UserWarning: medium.pt exists, but the SHA256 checksum does not match; re-downloading the file
```
Then re-downloaded 1.42GB.

**Why it happened:**
A previous partial or corrupted download of the Whisper `medium` model was cached at `~/.cache/whisper/medium.pt`. The file existed but was damaged or incomplete.

**Fix:**
Whisper detected this automatically and re-downloaded the correct file. No manual action needed — just wait for the download to complete.

---

## 10. Backslash Line Continuation Failing in zsh

**What happened:**
Tried to run a multi-line command with backslash continuation:
```bash
python3 training_data/fetch_yt_transcripts.py \
  --channels training_data/channels.json \
  --lang te
```
Got: `zsh: command not found: --channels`

**Why it happened:**
When copying multi-line commands from a chat, invisible characters or spacing issues can break zsh's line continuation. Each line was being interpreted as a separate command.

**Fix:**
Run everything on a single line:
```bash
python3 training_data/fetch_yt_transcripts.py --channels training_data/channels.json --lang te --max-per-channel 10
```

---

## 11. Research Subagents Had No Web Access

**What happened:**
Launched 3 parallel AI subagents to research Kannada/Telugu/Tamil colloquial language data. All 3 failed — WebSearch and WebFetch tools were not available to them.

**Why it happened:**
The subagents ran in a context where network tool permissions were not granted.

**Fix:**
Performed all web research directly in the main session using WebSearch and WebFetch. Found and extracted data from:
- kannadakaranakannadaka.substack.com (Kannada verb conjugation tables)
- currylangs.tumblr.com (Telugu Telangana contractions)
- decodetamil.com, chennaigaga.com (Tamil/Madras bashai)
- srikaram.org (Telangana slang)

---

## 12. Language Picker Bypassed on Direct Login URL

**What happened:**
Users navigating directly to `/worker/login` would skip the language picker screen at `/`. The app would then load without a selected language.

**Why it happened:**
The `ProtectedRoute` only checked for authentication, not for language selection. There was no guard ensuring the language was chosen first.

**Fix:**
Added a `useEffect` in `LoginScreen.tsx` that checks for `vaakya_lang` in localStorage on mount. If it's missing, the user is redirected to `/` (the language picker) before they can proceed.

```tsx
useEffect(() => {
  if (!localStorage.getItem('vaakya_lang')) {
    navigate('/', { replace: true })
  }
}, [])
```

---

## 13. Voice Transcription Not Visible in Chat

**What happened:**
After recording a voice message, the user's spoken words were not visible as text in the chat.

**Why it happened:**
The transcript was being rendered — but as `text-sm text-gray-300` positioned *below* the Play button. On the indigo bubble background the contrast was low, and the small size made it easy to miss. Additionally, there was no error handling: if the session creation or S2S API call failed silently, no messages were added at all and no error was shown to the user.

**Fix:**
- Moved transcript above the AudioPlayer button in `ChatBubble.tsx`
- Changed styling to `text-base font-medium` (normal size, full weight)
- Added `try/catch` with user-visible error messages in `VoiceChat.tsx`
- Added `.catch()` handler on `createSession()` with an error message

---

## 14. User's Recorded Audio Would Not Play Back

**What happened:**
Clicking "Play" on the user's own voice message produced no sound.

**Why it happened:**
`MediaRecorder` captures audio as `audio/webm`. The `AudioPlayer` component hardcoded `format='wav'` as a default. This produced `data:audio/wav;base64,<webm_data>` — an incorrect MIME type. The browser silently failed to decode it.

**Fix:**
VoiceChat now tracks the format per message. User messages get `format: 'webm'`; assistant messages get the format from the API response (always `'wav'`). Both are passed through `ChatBubble` to `AudioPlayer` which uses them to build the correct `data:audio/<format>;base64,...` URI.

---

## 15. Assistant Response Audio Not Auto-Playing

**What happened:**
The user had to manually click a "Play" button to hear the AI's spoken response. There was no auto-play.

**Why it happened:**
`AudioPlayer` was a click-only component. Nothing triggered playback automatically after the API response arrived.

**Fix:**
Added a dedicated `<audio ref={responseAudioRef} hidden />` element directly in `VoiceChat`. After the S2S API call succeeds, the handler sets `.src` and calls `.play()` on it immediately — before the React state update even renders the new message. `.catch(() => {})` handles browser autoplay policy rejections silently (the user can still click "Play again" on the bubble).

---

## 16. Frontend README Was the Default Vite Boilerplate

**What happened:**
`frontend/README.md` contained the default Vite template content — nothing about Vaakya.

**Why it happened:**
The frontend was scaffolded with `npm create vite` which generates a boilerplate README. It was never replaced.

**Fix:**
Replaced with a Vaakya-specific README covering the frontend's structure, screens, design system, and dev commands. Root `README.md` created for the full project.
