"""
Thin wrapper around Sunbird AI API endpoints.
Handles authentication and request/response formatting.
"""
import os
import requests
from typing import Optional, Dict, Any

class SunbirdClient:
    """Client for interacting with Sunbird AI APIs."""
    
    BASE_URL = "https://api.sunbird.ai/v1"
    
    def __init__(self, api_token: Optional[str] = None):
        """Initialize with API token from environment or parameter."""
        self.api_token = api_token or os.getenv("SUNBIRD_API_TOKEN")
        if not self.api_token:
            raise ValueError("SUNBIRD_API_TOKEN environment variable not set")
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
    
    def transcribe(self, audio_file_path: str, language: str = "en") -> Dict[str, Any]:
        """
        Transcribe audio file to text using Speech-to-Text API.
        
        Args:
            audio_file_path: Path to audio file (mp3, wav, etc.)
            language: Language code (e.g., 'en' for English)
        
        Returns:
            Dict with transcription result
        """
        url = f"{self.BASE_URL}/speech-to-text"
        
        with open(audio_file_path, 'rb') as f:
            files = {'audio': f}
            data = {'language': language}
            
            response = requests.post(url, headers=self.headers, files=files, data=data)
            response.raise_for_status()
            
        return response.json()
    
    def summarize(self, text: str, language: str = "en") -> Dict[str, Any]:
        """
        Summarize text using Sunflower LLM.
        
        Args:
            text: Text to summarize
            language: Language code
        
        Returns:
            Dict with summary result
        """
        url = f"{self.BASE_URL}/sunflower-simple-inference"
        
        payload = {
            "text": text,
            "instruction": f"Summarize the following text concisely in {language}:\n\n{text}",
            "language": language
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        return response.json()
    
    def translate(self, text: str, target_language: str) -> Dict[str, Any]:
        """
        Translate text to a target language using Sunflower LLM.
        
        Args:
            text: Text to translate
            target_language: Target language (Luganda, Runyankole, Ateso, Lugbara, Acholi)
        
        Returns:
            Dict with translation result
        """
        url = f"{self.BASE_URL}/sunflower-simple-inference"
        
        payload = {
            "text": text,
            "instruction": f"Translate the following text to {target_language}:\n\n{text}",
            "language": target_language
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        return response.json()
    
    def text_to_speech(self, text: str, language: str = "en") -> Dict[str, Any]:
        """
        Generate audio from text using Text-to-Speech API.
        
        Args:
            text: Text to convert to speech
            language: Language code
        
        Returns:
            Dict with audio URL or base64 encoded audio
        """
        url = f"{self.BASE_URL}/text-to-speech"
        
        payload = {
            "text": text,
            "language": language
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        return response.json()
