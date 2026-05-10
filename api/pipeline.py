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
    
    # Supported target languages for translation
    SUPPORTED_LANGUAGES = {
        "luganda": "Luganda",
        "runyankole": "Runyankole",
        "ateso": "Ateso",
        "lugbara": "Lugbara",
        "acholi": "Acholi"
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
            # Step 1: Summarize
            print(f"Summarizing text...")
            summary_response = self.client.summarize(text)
            summary = summary_response.get("summary", summary_response.get("text", text[:100]))
            results["pipeline"]["summary"] = summary
            
            # Step 2: Translate
            print(f"Translating to {target_language}...")
            translation_response = self.client.translate(summary, target_language)
            translated = translation_response.get("translation", translation_response.get("text", summary))
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
            transcript = transcription_response.get("transcription", transcription_response.get("text", ""))
            results["pipeline"]["transcript"] = transcript
            
            # Step 2: Summarize
            print(f"Summarizing transcript...")
            summary_response = self.client.summarize(transcript)
            summary = summary_response.get("summary", summary_response.get("text", transcript[:100]))
            results["pipeline"]["summary"] = summary
            
            # Step 3: Translate
            print(f"Translating to {target_language}...")
            translation_response = self.client.translate(summary, target_language)
            translated = translation_response.get("translation", translation_response.get("text", summary))
            results["pipeline"]["translation"] = translated
            
            # Step 4: Text-to-Speech
            print(f"Generating audio...")
            tts_response = self.client.text_to_speech(translated, target_language)
            results["pipeline"]["audio"] = tts_response
            
        except Exception as e:
            results["error"] = str(e)
        
        return results
