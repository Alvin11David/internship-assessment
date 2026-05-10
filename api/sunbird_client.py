"""
Thin wrapper around Sunbird AI API endpoints.
Handles authentication and request/response formatting.
"""
import os
import requests
from typing import Optional, Dict, Any

class SunbirdClient:
    """Client for interacting with Sunbird AI APIs."""
    
    BASE_URL = "https://api.sunbird.ai"
    
    def __init__(self, api_token: Optional[str] = None):
        """Initialize with API token from environment or parameter."""
        self.api_token = api_token or os.getenv("SUNBIRD_API_TOKEN")
        if not self.api_token:
            raise ValueError("SUNBIRD_API_TOKEN environment variable not set")
        self.headers = {
            "Authorization": f"Bearer {self.api_token}"
        }
    
    def _extract_text(self, response: Dict[str, Any], fallback: str = "") -> str:
        if not isinstance(response, dict):
            return fallback

        if response.get("response"):
            return response.get("response")

        if response.get("text"):
            return response.get("text")

        if response.get("translation"):
            return response.get("translation")

        if response.get("summary"):
            return response.get("summary")

        output = response.get("output")
        if isinstance(output, dict):
            if output.get("text"):
                return output.get("text")
            if output.get("translation"):
                return output.get("translation")
        if isinstance(output, str):
            return output

        choices = response.get("choices")
        if isinstance(choices, list) and choices:
            first_choice = choices[0]
            if isinstance(first_choice, dict) and first_choice.get("text"):
                return first_choice.get("text")
            if isinstance(first_choice, str):
                return first_choice

        return fallback
    
    def transcribe(self, audio_file_path: str, language: str = "en") -> Dict[str, Any]:
        """
        Transcribe audio file to text using Speech-to-Text API.
        """
        url = f"{self.BASE_URL}/tasks/stt"
        with open(audio_file_path, 'rb') as f:
            files = {'audio': f}
            data = {'language': language}
            response = requests.post(url, headers=self.headers, files=files, data=data)
            response.raise_for_status()
            return response.json()
    
    def summarize(self, text: str, language: str = "en") -> Dict[str, Any]:
        """
        Summarize text using Sunflower Simple inference.
        """
        url = f"{self.BASE_URL}/tasks/sunflower_simple"
        payload = {
            "instruction": f"Summarize the following text concisely:\n\n{text}",
            "model_type": "qwen",
            "temperature": 0.3
        }
        response = requests.post(url, headers=self.headers, data=payload)
        response.raise_for_status()
        return response.json()
    
    def translate(self, text: str, target_language: str) -> Dict[str, Any]:
        """
        Translate text to a target language.
        """
        url = f"{self.BASE_URL}/tasks/translate"
        payload = {
            "text": text,
            "target_language": target_language
        }
        response = requests.post(url, headers={**self.headers, "Content-Type": "application/json"}, json=payload)
        response.raise_for_status()
        return response.json()
    
    def text_to_speech(self, text: str, language: str = "en") -> Dict[str, Any]:
        """
        Generate audio from text using Text-to-Speech API.
        """
        url = f"{self.BASE_URL}/tasks/modal/tts"
        payload = {
            "text": text,
            "response_mode": "url"
        }
        response = requests.post(url, headers={**self.headers, "Content-Type": "application/json"}, json=payload)
        response.raise_for_status()
        return response.json()
    
    def summarize_text(self, text: str) -> str:
        return self._extract_text(self.summarize(text), text[:100])

    def translate_text(self, text: str, target_language: str) -> str:
        return self._extract_text(self.translate(text, target_language), text)
