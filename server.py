from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.join(os.path.dirname(__file__), 'api'))
from pipeline import ProcessingPipeline
from werkzeug.utils import secure_filename
import tempfile

# Load environment variables
load_dotenv('.env.local')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Initialize the processing pipeline
pipeline = ProcessingPipeline()

@app.route('/api/process-text', methods=['POST'])
def process_text():
    """Process text input through the AI pipeline."""
    try:
        data = request.get_json()

        if not data or 'text' not in data or 'target_language' not in data:
            return jsonify({'error': 'Missing required fields: text, target_language'}), 400

        text = data['text']
        target_language = data['target_language']

        # Process through the pipeline
        result = pipeline.process_text_input(text, target_language)

        return jsonify(result)

    except Exception as e:
        print(f"Error processing text: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/process-audio', methods=['POST'])
def process_audio():
    """Process audio file through the AI pipeline."""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        target_language = request.form.get('target_language')

        if not target_language:
            return jsonify({'error': 'Missing target_language'}), 400

        if audio_file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Save uploaded file temporarily
        filename = secure_filename(audio_file.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        audio_file.save(temp_path)

        try:
            # Process through the pipeline
            result = pipeline.process_audio_input(temp_path, target_language)
            return jsonify(result)

        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        print(f"Error processing audio: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)