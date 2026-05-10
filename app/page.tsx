"use client";

import { useState } from "react";
import axios from "axios";

interface ProcessResult {
  pipeline: {
    transcript?: string;
    summary?: string;
    translation?: string;
    audio?: any;
  };
  error?: string;
}

export default function Home() {
  const [inputType, setInputType] = useState<"text" | "audio">("text");
  const [textInput, setTextInput] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("luganda");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const languages = [
    { value: "luganda", label: "Luganda" },
    { value: "runyankole", label: "Runyankole" },
    { value: "ateso", label: "Ateso" },
    { value: "lugbara", label: "Lugbara" },
    { value: "acholi", label: "Acholi" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      // Check file size (5 minutes ≈ ~5MB depending on bitrate)
      if (file.size > 50 * 1024 * 1024) {
        setError("Audio file too large. Maximum 5 minutes (~50MB).");
        return;
      }
      setAudioFile(file);
      setError(null);
    }
  };

  const handleProcess = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      if (inputType === "text") {
        if (!textInput.trim()) {
          throw new Error("Please enter some text");
        }

        const response = await axios.post("/api/process-text", {
          text: textInput,
          target_language: targetLanguage,
        });

        setResult(response.data);
      } else {
        if (!audioFile) {
          throw new Error("Please select an audio file");
        }

        const formData = new FormData();
        formData.append("audio", audioFile);
        formData.append("target_language", targetLanguage);

        const response = await axios.post("/api/process-audio", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setResult(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🌻 Sunbird AI GenAI App</h1>
        <p>Text/Audio → Summarize → Translate → Audio Output</p>
      </div>

      <div className="main-content">
        {/* Input Section */}
        <div className="card">
          <h2>📝 Input</h2>

          <div className="input-group">
            <label>Choose Input Type:</label>
            <div className="tabs">
              <button
                className={`tab-button ${inputType === "text" ? "active" : ""}`}
                onClick={() => setInputType("text")}
              >
                Text
              </button>
              <button
                className={`tab-button ${inputType === "audio" ? "active" : ""}`}
                onClick={() => setInputType("audio")}
              >
                Audio
              </button>
            </div>
          </div>

          {inputType === "text" ? (
            <div className="input-group">
              <label htmlFor="text">Enter text to process:</label>
              <textarea
                id="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste or type your text here..."
                disabled={loading}
              />
            </div>
          ) : (
            <div className="input-group">
              <label htmlFor="audio">Upload audio file (max 5 min):</label>
              <div className="file-input-wrapper">
                <input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <label htmlFor="audio" className="file-input-label">
                  Click to select audio file
                </label>
              </div>
              {audioFile && (
                <div className="file-name">📁 {audioFile.name}</div>
              )}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="language">Translate to:</label>
            <select
              id="language"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              disabled={loading}
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <button
            className="button"
            onClick={handleProcess}
            disabled={
              loading ||
              (!textInput.trim() && inputType === "text") ||
              (!audioFile && inputType === "audio")
            }
          >
            {loading ? (
              <>
                <span className="loading"></span> Processing...
              </>
            ) : (
              "▶ Process"
            )}
          </button>

          {error && <div className="error">❌ {error}</div>}
        </div>

        {/* Information Section */}
        <div className="card">
          <h2>ℹ️ How it works</h2>
          <div style={{ lineHeight: "1.8", color: "var(--text-secondary)" }}>
            <h4 style={{ color: "var(--text-primary)", marginTop: "10px" }}>
              Text Input Pipeline:
            </h4>
            <p>1. Summarize the text</p>
            <p>2. Translate summary to selected language</p>
            <p>3. Generate audio of translation</p>

            <h4 style={{ color: "var(--text-primary)", marginTop: "15px" }}>
              Audio Input Pipeline:
            </h4>
            <p>1. Transcribe audio to text</p>
            <p>2. Summarize transcript</p>
            <p>3. Translate summary to selected language</p>
            <p>4. Generate audio of translation</p>

            <h4 style={{ color: "var(--text-primary)", marginTop: "15px" }}>
              Supported Languages:
            </h4>
            <p>Luganda, Runyankole, Ateso, Lugbara, Acholi</p>

            <p style={{ marginTop: "15px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Powered by <strong>Sunbird AI</strong> APIs
            </p>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && !result.error && (
        <div className="results">
          {result.pipeline.transcript && (
            <div className="result-section">
              <h3>🎤 Transcript</h3>
              <div className="result-text">{result.pipeline.transcript}</div>
            </div>
          )}

          {result.pipeline.summary && (
            <div className="result-section">
              <h3>📋 Summary</h3>
              <div className="result-text">{result.pipeline.summary}</div>
            </div>
          )}

          {result.pipeline.translation && (
            <div className="result-section">
              <h3>🌐 Translation</h3>
              <div className="result-text">{result.pipeline.translation}</div>
            </div>
          )}

          {result.pipeline.audio && (
            <div className="result-section">
              <h3>🔊 Audio Output</h3>
              <div className="audio-player">
                {result.pipeline.audio.audio_url ? (
                  <audio controls>
                    <source
                      src={result.pipeline.audio.audio_url}
                      type="audio/mpeg"
                    />
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <p style={{ color: "#999" }}>
                    Audio generated (check console for details)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
