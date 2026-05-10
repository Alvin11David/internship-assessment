"""
Vercel Python API handler - main entry point for serverless functions.
Routes requests to appropriate handlers.
"""
import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from pipeline import ProcessingPipeline


class handler(BaseHTTPRequestHandler):
    """Handler for Vercel serverless functions."""
    
    def do_POST(self):
        """Handle POST requests."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid JSON"}).encode())
            return
        
        path = urlparse(self.path).path
        
        # Route: /api/process-text
        if path == '/api/process-text':
            return self.process_text(data)
        
        # Route: /api/process-audio
        elif path == '/api/process-audio':
            return self.process_audio(data)
        
        # Route not found
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode())
    
    def do_GET(self):
        """Handle GET requests (health check, etc)."""
        path = urlparse(self.path).path
        
        if path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy"}).encode())
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def process_text(self, data):
        """Process text input through the pipeline."""
        try:
            text = data.get('text')
            target_language = data.get('target_language', 'luganda')
            
            if not text:
                raise ValueError("Text input is required")
            
            pipeline = ProcessingPipeline()
            result = pipeline.process_text_input(text, target_language)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def process_audio(self, data):
        """Process audio input through the pipeline."""
        try:
            # Note: In production, you'd handle file uploads differently
            # This is a placeholder for the audio processing endpoint
            raise NotImplementedError("Audio upload handling requires multipart/form-data support")
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
