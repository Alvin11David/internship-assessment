"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { gsap } from "gsap";

interface ProcessResult {
  pipeline: {
    transcript?: string;
    summary?: string;
    translation?: string;
    audio?: any;
  };
  warning?: string;
  timings?: {
    transcriptionTimeMs?: number;
    summaryTimeMs?: number;
    translationTimeMs?: number;
    ttsTimeMs?: number;
    totalTimeMs?: number;
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isTextareaActive, setIsTextareaActive] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".header", {
        y: -24,
        opacity: 0,
        duration: 0.7,
      })
        .from(
          ".main-content .card",
          {
            y: 36,
            opacity: 0,
            duration: 0.6,
            stagger: 0.12,
          },
          "-=0.35",
        )
        .from(
          ".button",
          {
            scale: 0.97,
            duration: 0.4,
          },
          "-=0.3",
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !result || result.error) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(".results .result-section", {
        y: 22,
        opacity: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: "power2.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, [result]);

  useEffect(() => {
    if (!containerRef.current || !dropdownOpen) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".dropdown-menu",
        { y: -8, opacity: 0, scaleY: 0.96, transformOrigin: "top center" },
        { y: 0, opacity: 1, scaleY: 1, duration: 0.22, ease: "power2.out" },
      );
      gsap.from(".dropdown-option", {
        x: -8,
        opacity: 0,
        stagger: 0.03,
        duration: 0.16,
        ease: "power1.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, [dropdownOpen]);

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  // Update localStorage when theme changes
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const languages = [
    { value: "luganda", label: "Luganda" },
    { value: "runyankole", label: "Runyankole" },
    { value: "ateso", label: "Ateso" },
    { value: "lugbara", label: "Lugbara" },
    { value: "acholi", label: "Acholi" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

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
    <div className="page-wrapper">
      <div className="container" ref={containerRef}>
        <div className="header">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <h1>🌻 Sunbird AI GenAI App</h1>
          <p>Text/Audio → Summarize → Translate → Audio Output</p>
        </div>

        <div className="main-content">
          {/* Input Section */}
          <div className="card input-card">
            <img
              src={
                inputType === "text" &&
                (isTextareaActive || textInput.trim().length > 0)
                  ? "/logo/typing.png"
                  : "/logo/AI_Robot.png"
              }
              alt="AI Robot"
              className="input-robot"
            />
            <h2>Input</h2>

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
                  onFocus={() => setIsTextareaActive(true)}
                  onBlur={() => setIsTextareaActive(false)}
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
                  <div className="file-name">
                    <span>📁 {audioFile.name}</span>
                    <button
                      className="file-delete-btn"
                      onClick={() => setAudioFile(null)}
                      title="Delete audio file"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="input-group">
              <label>Translate to:</label>
              <div className="custom-dropdown" ref={dropdownRef}>
                <button
                  className="dropdown-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  disabled={loading}
                >
                  {languages.find((l) => l.value === targetLanguage)?.label}
                  <span className="dropdown-arrow">▼</span>
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    {languages.map((lang) => (
                      <button
                        key={lang.value}
                        className={`dropdown-option ${
                          targetLanguage === lang.value ? "active" : ""
                        }`}
                        onClick={() => {
                          setTargetLanguage(lang.value);
                          setDropdownOpen(false);
                        }}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
            <h2>How it works</h2>
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

              <p
                style={{
                  marginTop: "15px",
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                }}
              >
                Powered by <strong>Sunbird AI</strong> APIs
              </p>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && !result.error && (
          <div className="results">
            {result.warning && (
              <div className="result-section">
                <h3>⚠️ Notice</h3>
                <div className="result-text">{result.warning}</div>
              </div>
            )}

            {result.timings && (
              <div className="result-section">
                <h3>⏱️ Timings</h3>
                <div className="result-text">
                  <div>
                    Transcription: {result.timings.transcriptionTimeMs ?? 0} ms
                  </div>
                  <div>Summary: {result.timings.summaryTimeMs ?? 0} ms</div>
                  <div>
                    Translation: {result.timings.translationTimeMs ?? 0} ms
                  </div>
                  <div>TTS: {result.timings.ttsTimeMs ?? 0} ms</div>
                  <div>Total: {result.timings.totalTimeMs ?? 0} ms</div>
                </div>
              </div>
            )}

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
      <footer className="page-footer">
        <img
          className="download-badge"
          src="/logo/download.png"
          alt="Download"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/logo/logo.png";
          }}
        />
      </footer>
    </div>
  );
}
