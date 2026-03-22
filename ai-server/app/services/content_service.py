import os
import logging
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env")

genai.configure(api_key=GEMINI_API_KEY)
_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=(
        "You are a helpful AI assistant. Generate a detailed, attractive event description. "
        "Include: purpose, audience, location, date/time, activities, registration, call-to-action."
    ),
)


async def generate_content(event_query: str) -> str:
    logging.info(f"Generating content for: {event_query}")
    response = _model.generate_content(event_query)
    return response.text.strip()
