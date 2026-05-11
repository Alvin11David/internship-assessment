"""
Pipeline orchestrator: handles the full AI processing pipeline.
Input → STT → Summarize → Translate → TTS → Output
"""
import os
import tempfile
from typing import Optional, Dict, Any
from sunbird_client import SunbirdClient


class ProcessingPipeline:
    """Orchestrates the AI processing pipeline."""
    
    # Supported target languages for translation (name -> code)
    SUPPORTED_LANGUAGES = {
        "luganda": "lug",
        "runyankole": "nyn",
        "ateso": "teo",
        "lugbara": "lgg",
        "acholi": "ach"
    }
    
    MAX_AUDIO_DURATION_SECONDS = 300  # 5 minutes
    
    def __init__(self, api_token: Optional[str] = None):
        """Initialize the pipeline with Sunbird client."""
        self.client = SunbirdClient(api_token)
    
    def validate_audio_file(self, audio_file_path: str) -> Dict[str, Any]:
        """
        Validate audio file (check duration, format, etc).
        
        Args:
            audio_file_path: Path to audio file
        
        Returns:
            Dict with validation result
        """
        if not os.path.exists(audio_file_path):
            return {"valid": False, "error": "File not found"}
        
        # TODO: Implement actual duration check using librosa or similar
        # For now, just check file exists and is not empty
        file_size = os.path.getsize(audio_file_path)
        if file_size == 0:
            return {"valid": False, "error": "Audio file is empty"}
        
        return {"valid": True}
    
    def _extract_text_response(self, response: Dict[str, Any], fallback: str = "") -> str:
        """
        Extracts text from an inference API response.
        Supports common response shapes from Sunbird and similar model endpoints.
        """
        if not isinstance(response, dict):
            return fallback

        # Handle STT response format: {"output": {"text": "...", "language": "..."}}
        output = response.get("output")
        if isinstance(output, dict) and output.get("text"):
            return output["text"]

        for key in ("translation", "summary", "text", "result", "response"):
            if response.get(key):
                return response.get(key)

        if isinstance(response.get("data"), list) and response["data"]:
            first = response["data"][0]
            if isinstance(first, dict):
                for key in ("translation", "summary", "text", "result", "response"):
                    if first.get(key):
                        return first.get(key)
            elif isinstance(first, str):
                return first

        if isinstance(response.get("choices"), list) and response["choices"]:
            first_choice = response["choices"][0]
            if isinstance(first_choice, dict) and first_choice.get("text"):
                return first_choice.get("text")

        return fallback

    def process_text_input(self, text: str, target_language: str) -> Dict[str, Any]:
        """
        Process text input through pipeline: Summarize → Translate → TTS.
        
        Args:
            text: Input text
            target_language: Target language for translation
        
        Returns:
            Dict with processing results at each stage
        """
        if not text or len(text.strip()) == 0:
            raise ValueError("Input text cannot be empty")
        
        if target_language.lower() not in self.SUPPORTED_LANGUAGES:
            raise ValueError(f"Unsupported language: {target_language}")
        
        results = {
            "input": text,
            "target_language": target_language,
            "pipeline": {}
        }
        
        try:
            # Step 1: Summarize (skip for short text < 100 chars)
            if len(text) > 100:
                print(f"Summarizing text...")
                summary_response = self.client.summarize(text)
                summary = self._extract_text_response(summary_response, text[:100])
                results["pipeline"]["summary"] = summary
            else:
                print(f"Text is short, skipping summarization...")
                summary = text
                results["pipeline"]["summary"] = summary
            
            # Step 2: Translate
            print(f"Translating to {target_language}...")
            translation_response = self.client.translate(summary, target_language)
            translated = self._extract_text_response(translation_response, summary)
            results["pipeline"]["translation"] = translated
            
            # Step 3: Text-to-Speech
            print(f"Generating audio...")
            tts_response = self.client.text_to_speech(translated, target_language)
            results["pipeline"]["audio"] = tts_response
            
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def process_audio_input(self, audio_file_path: str, target_language: str) -> Dict[str, Any]:
        """
        Process audio input through full pipeline:
        STT → Summarize → Translate → TTS.
        
        Args:
            audio_file_path: Path to audio file
            target_language: Target language for translation
        
        Returns:
            Dict with processing results at each stage
        """
        # Validate audio
        validation = self.validate_audio_file(audio_file_path)
        if not validation["valid"]:
            raise ValueError(validation["error"])
        
        if target_language.lower() not in self.SUPPORTED_LANGUAGES:
            raise ValueError(f"Unsupported language: {target_language}")
        
        results = {
            "input_type": "audio",
            "target_language": target_language,
            "pipeline": {}
        }
        
        try:
            # Step 1: Transcribe
            print(f"Transcribing audio...")
            transcription_response = self.client.transcribe(audio_file_path)
            transcript = self._extract_text_response(transcription_response, "")
            results["pipeline"]["transcript"] = transcript
            
            # Step 2: Summarize
            print(f"Summarizing transcript...")
            summary_response = self.client.summarize(transcript)
            summary = self._extract_text_response(summary_response, transcript[:100])
            results["pipeline"]["summary"] = summary
            
            # Step 3: Translate
            print(f"Translating to {target_language}...")
            translation_response = self.client.translate(summary, target_language)
            translated = self._extract_text_response(translation_response, summary)
            results["pipeline"]["translation"] = translated
            
            # Step 4: Text-to-Speech
            print(f"Generating audio...")
            tts_response = self.client.text_to_speech(translated, target_language)
            results["pipeline"]["audio"] = tts_response
            
        except Exception as e:
            results["error"] = str(e)
        
        return results
