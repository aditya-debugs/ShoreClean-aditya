import os
import base64
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
_model = genai.GenerativeModel("gemini-1.5-flash")

TRASH_KEYWORDS = [
    "trash", "garbage", "plastic", "bottle", "wrapper", "can",
    "paper", "rubbish", "litter", "waste", "debris", "pollution",
]


def _bytes_to_part(image_bytes: bytes) -> dict:
    """Convert raw bytes to a Gemini inline image part."""
    return {
        "inline_data": {
            "mime_type": "image/jpeg",
            "data": base64.b64encode(image_bytes).decode("utf-8"),
        }
    }


async def analyze_cleanup(before_bytes: bytes, after_bytes: bytes):
    prompt = """
You are a beach cleanup analysis assistant.

You will receive TWO images:
  1. BEFORE image — taken before the beach cleanup
  2. AFTER image — taken after the beach cleanup

Analyse both images and respond ONLY with a valid JSON object (no markdown, no explanation outside the JSON) in this exact format:
{
  "before_trash_count": <integer — estimated number of trash items visible>,
  "after_trash_count": <integer — estimated number of trash items visible>,
  "before_trash_items": [<list of trash item names detected in BEFORE image>],
  "after_trash_items": [<list of trash item names detected in AFTER image>],
  "cleaned": <true if the area looks cleaner, false otherwise>,
  "cleanliness_score": <integer 0-100 representing % improvement>,
  "explanation": "<one sentence summary of the analysis>"
}
"""

    before_part = _bytes_to_part(before_bytes)
    after_part = _bytes_to_part(after_bytes)

    response = _model.generate_content(
        [
            prompt,
            {"inline_data": before_part["inline_data"]},
            {"inline_data": after_part["inline_data"]},
        ]
    )

    raw = response.text.strip()

    # Strip markdown code fences if Gemini wraps the JSON
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    data = json.loads(raw)

    before_trash = int(data.get("before_trash_count", 0))
    after_trash = int(data.get("after_trash_count", 0))
    cleaned = bool(data.get("cleaned", after_trash < before_trash))

    # Recalculate score defensively
    if before_trash == 0:
        score = 100 if cleaned else 0
    else:
        score = max(0, min(100, int((before_trash - after_trash) / before_trash * 100)))

    score = data.get("cleanliness_score", score)

    explanation = (
        data.get("explanation")
        or (
            f"Before image had {before_trash} potential trash item(s), "
            f"after image has {after_trash}. "
            f"Area cleaned: {cleaned}."
        )
    )

    return {
        "cleaned": cleaned,
        "cleanliness_score": score,
        "explanation": explanation,
        "before_trash_items": data.get("before_trash_items", []),
        "after_trash_items": data.get("after_trash_items", []),
    }
