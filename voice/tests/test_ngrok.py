import os
import time
import statistics
import httpx
from dotenv import load_dotenv

load_dotenv(".env.local")

# ── Config ────────────────────────────────────────────────────────────────────
NGROK_BASE_URL = os.getenv("NGROK_BASE_URL", "https://freeda-bangup-bently.ngrok-free.dev/v1")
MODEL_NAME     = "narad-v1"
NUM_RUNS       = 5          # how many times to ping for average latency

TEST_PROMPTS = [
    "Hello, can you help me?",
    "Mera paani ka connection kharab hai.",
    "What schemes are available for farmers?",
]

# ── Helpers ───────────────────────────────────────────────────────────────────
def separator(char="─", width=60):
    print(char * width)

def test_health():
    """Quick ping to check if the server is even reachable."""
    separator()
    print("🔌  HEALTH CHECK")
    separator()
    try:
        start = time.perf_counter()
        r = httpx.get(NGROK_BASE_URL.replace("/v1", ""), timeout=10)
        elapsed = (time.perf_counter() - start) * 1000
        print(f"  URL      : {NGROK_BASE_URL}")
        print(f"  Status   : {r.status_code}")
        print(f"  Ping     : {elapsed:.1f} ms")
    except Exception as e:
        print(f"  ❌ Server unreachable: {e}")
    print()

def test_models():
    """List models available on the server."""
    separator()
    print("📋  AVAILABLE MODELS")
    separator()
    try:
        r = httpx.get(f"{NGROK_BASE_URL}/models", timeout=10)
        data = r.json()
        models = [m["id"] for m in data.get("data", [])]
        for m in models:
            print(f"  • {m}")
        if not models:
            print("  (no models listed or non-standard response)")
            print(f"  Raw: {data}")
    except Exception as e:
        print(f"  ❌ Could not fetch models: {e}")
    print()

def single_inference(prompt: str, stream: bool = False) -> dict:
    """
    Send one chat completion request and return timing + response info.
    Returns dict with keys: ttfb_ms, total_ms, tokens, text, error
    """
    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200,
        "stream": stream,
    }

    result = {"ttfb_ms": None, "total_ms": None, "tokens": None, "text": "", "error": None}

    try:
        t_start = time.perf_counter()

        with httpx.stream("POST", f"{NGROK_BASE_URL}/chat/completions",
                          json=payload, timeout=60) as resp:

            # Time to first byte
            first_chunk = True
            chunks = []

            for chunk in resp.iter_bytes():
                if first_chunk:
                    result["ttfb_ms"] = (time.perf_counter() - t_start) * 1000
                    first_chunk = False
                chunks.append(chunk)

        result["total_ms"] = (time.perf_counter() - t_start) * 1000

        # Parse response
        import json
        raw = b"".join(chunks).decode()
        data = json.loads(raw)
        choice = data["choices"][0]
        result["text"] = choice["message"]["content"].strip()
        result["tokens"] = data.get("usage", {}).get("completion_tokens", "n/a")

    except Exception as e:
        result["error"] = str(e)
        result["total_ms"] = (time.perf_counter() - t_start) * 1000

    return result

def test_latency():
    """Run each prompt once and show TTFB + total time."""
    separator()
    print("⚡  LATENCY TEST  (single shot per prompt)")
    separator()

    for prompt in TEST_PROMPTS:
        print(f"\n  Prompt : \"{prompt}\"")
        r = single_inference(prompt)
        if r["error"]:
            print(f"  ❌ Error : {r['error']}")
        else:
            print(f"  TTFB   : {r['ttfb_ms']:.0f} ms   (time to first byte)")
            print(f"  Total  : {r['total_ms']:.0f} ms   (full response)")
            print(f"  Tokens : {r['tokens']}")
            print(f"  Reply  : {r['text'][:120]}{'...' if len(r['text']) > 120 else ''}")
    print()

def test_average_latency():
    """Run the first prompt N times and compute statistics."""
    separator()
    print(f"📊  AVERAGE LATENCY  ({NUM_RUNS} runs, prompt: \"{TEST_PROMPTS[0]}\")")
    separator()

    ttfbs, totals = [], []

    for i in range(1, NUM_RUNS + 1):
        r = single_inference(TEST_PROMPTS[0])
        if r["error"]:
            print(f"  Run {i}: ❌ {r['error']}")
            continue
        ttfbs.append(r["ttfb_ms"])
        totals.append(r["total_ms"])
        print(f"  Run {i}: TTFB {r['ttfb_ms']:.0f} ms  |  Total {r['total_ms']:.0f} ms")

    if totals:
        print()
        print(f"  TTFB   →  avg {statistics.mean(ttfbs):.0f} ms  |  min {min(ttfbs):.0f} ms  |  max {max(ttfbs):.0f} ms")
        print(f"  Total  →  avg {statistics.mean(totals):.0f} ms  |  min {min(totals):.0f} ms  |  max {max(totals):.0f} ms")

        # Voice agent threshold check
        print()
        avg_total = statistics.mean(totals)
        if avg_total < 1500:
            print(f"  ✅  {avg_total:.0f} ms avg — Good for voice agent (target < 1500 ms)")
        elif avg_total < 3000:
            print(f"  ⚠️   {avg_total:.0f} ms avg — Borderline for voice (users may notice delay)")
        else:
            print(f"  ❌  {avg_total:.0f} ms avg — Too slow for voice UX (consider reducing max_tokens)")
    print()

# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    separator("═")
    print("  NARAD — NGROK SERVER LATENCY TESTER")
    print(f"  Server: {NGROK_BASE_URL}")
    separator("═")
    print()

    test_health()
    test_models()
    test_latency()
    test_average_latency()