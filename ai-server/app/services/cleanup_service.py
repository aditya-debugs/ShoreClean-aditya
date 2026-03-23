import os
import base64
import json
import re
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def encode_image(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")


async def analyze_cleanup(before_bytes: bytes, after_bytes: bytes):
    before_b64 = encode_image(before_bytes)
    after_b64 = encode_image(after_bytes)

    prompt = """You are an expert at analyzing beach/shore cleanup effectiveness.
You are given two images:
- Image 1: BEFORE cleaning
- Image 2: AFTER cleaning

Analyze both images and respond ONLY with a valid JSON object (no markdown, no extra text) in this exact format:
{
  "cleaned": true or false,
  "cleanliness_score": <integer 0-100>,
  "explanation": "<one or two sentence summary of what changed>"
}

Guidelines:
- "cleaned" is true if the after image shows meaningful reduction in trash/debris
- "cleanliness_score" is 0 if no improvement, 100 if completely clean, scaled in between
- "explanation" should mention what trash was visible before and what changed after"""

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{before_b64}"
                        }
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{after_b64}"
                        }
                    },
                ],
            }
        ],
        max_tokens=300,
    )

    content = response.choices[0].message.content.strip()

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            result = json.loads(match.group())
        else:
            result = {
                "cleaned": False,
                "cleanliness_score": 0,
                "explanation": content
            }

    return {
        "cleaned": bool(result.get("cleaned", False)),
        "cleanliness_score": int(result.get("cleanliness_score", 0)),
        "explanation": str(result.get("explanation", "No explanation provided."))
    }
