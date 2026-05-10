# Part 2: Sunbird AI GenAI Application

## 🎯 Project Overview

This is a web application that processes text or audio files through a sophisticated AI pipeline powered by **Sunbird AI APIs**.

### Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER INPUT                              │
│                      (Text or Audio File)                        │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ├─ TEXT INPUT                    ├─ AUDIO INPUT
           │    │                            │    │
           │    ▼                            │    ▼
           │ [Summarize]                    │ [Speech-to-Text]
           │    │                            │    │
           │    ▼                            │    ▼
           │ [Translate]  ←──────────────────┤ [Summarize]
           │    │                            │    │
           │    ▼                            │    ▼
           │ [Text-to-Speech]               │ [Translate]
           │    │                            │    │
           └────┼────────────────────────────┘    ▼
                │                           [Text-to-Speech]
                │                                  │
                └──────────────────┬───────────────┘
                                   ▼
                          ┌──────────────────┐
                          │   OUTPUT SHOWN   │
                          │ • Transcript     │
                          │ • Summary        │
                          │ • Translation    │
                          │ • Audio Player   │
                          └──────────────────┘
```

### Supported Languages for Translation

- **Luganda**
- **Runyankole**
- **Ateso**
- **Lugbara**
- **Acholi**

## 🚀 Getting Started Locally

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Git

### Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/<your-username>/internship-assessment.git
   cd internship-assessment
   ```

2. **Get a Sunbird AI API Token**
   - Sign up at [Sunbird AI Portal](https://app.sunbird.ai/)
   - Create a new API token
   - Copy your token

3. **Set up environment variables**

   ```bash
   # Copy the example file
   cp .env.example .env.local

   # Edit .env.local and add your Sunbird API token
   # NEXT_PUBLIC_SUNBIRD_API_TOKEN=your_token_here
   ```

4. **Install Node.js dependencies**

   ```bash
   npm install
   ```

5. **Install Python dependencies**

   ```bash
   pip install -r requirements.txt
   ```

6. **Run the development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## 📋 Environment Variables

### Required Variables

| Variable              | Description                                               | Example                 |
| --------------------- | --------------------------------------------------------- | ----------------------- |
| `SUNBIRD_API_TOKEN`   | Your Sunbird AI API authentication token                  | `sk_...`                |
| `NEXT_PUBLIC_API_URL` | Frontend API endpoint (defaults to http://localhost:3000) | `http://localhost:3000` |

### Getting Your API Token

1. Go to [Sunbird AI Dashboard](https://app.sunbird.ai/)
2. Navigate to **API Keys** section
3. Click **Create New Key**
4. Copy the token and store it securely

## 💻 Usage

### Via Web UI

1. **Open the application** at `http://localhost:3000`

2. **Choose input type**
   - Select **Text** to paste/type content
   - Select **Audio** to upload an audio file (max 5 minutes)

3. **Select target language** from the dropdown (Luganda, Runyankole, etc.)

4. **Click "Process"** button

5. **View results**
   - See transcript (if audio input)
   - See summary
   - See translation in target language
   - Play the generated audio

### Example Usage Flow

**Text Input Example:**

```
Input: "Climate change is affecting global weather patterns..."
↓
Target Language: Luganda
↓
Output:
- Summary: "Ikiwandiiko kya ssanyu... [summary in English]"
- Translation: "Enkyukakyuka y'emiwendo... [translated to Luganda]"
- Audio: [Playable audio in Luganda]
```

**Audio Input Example:**

```
Input: [Upload speech_en.mp3]
↓
Transcript: "The weather is getting warmer..."
↓
Target Language: Runyankole
↓
Output:
- Transcript: "The weather is getting warmer..."
- Summary: "Weather patterns changing..."
- Translation: "Habari..."[in Runyankole]
- Audio: [Playable audio in Runyankole]
```

## 🏗️ Architecture

### Directory Structure

```
.
├── app/                      # Next.js frontend (React components)
│   ├── page.tsx             # Main UI component
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Styles
├── api/                      # Python backend (Vercel serverless functions)
│   ├── index.py             # Main API handler & routing
│   ├── sunbird_client.py    # Sunbird AI API wrapper
│   └── pipeline.py          # Processing pipeline orchestrator
├── package.json             # Node.js dependencies
├── requirements.txt         # Python dependencies
├── next.config.ts           # Next.js configuration
├── vercel.json              # Vercel deployment config
├── .env.example             # Environment variables template
└── README.md                # This file
```

### Backend Stack

- **Framework**: Python with serverless handlers for Vercel
- **APIs**: Sunbird AI (STT, TTS, Summarization, Translation)
- **Deployment**: Vercel Serverless Functions

### Frontend Stack

- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **Styling**: CSS (responsive, modern UI)
- **HTTP Client**: Axios

### API Endpoints

| Endpoint             | Method | Description                          |
| -------------------- | ------ | ------------------------------------ |
| `/api/process-text`  | POST   | Process text input through pipeline  |
| `/api/process-audio` | POST   | Process audio input through pipeline |
| `/api/health`        | GET    | Health check endpoint                |

## 📦 Dependencies

### Frontend (package.json)

- `next` - React framework
- `react` - UI library
- `axios` - HTTP client for API calls

### Backend (requirements.txt)

- `requests` - HTTP library for API calls
- `python-dotenv` - Environment variable management

## ⚙️ Sunbird AI APIs Used

1. **Speech-to-Text (STT)**
   - Endpoint: `/speech-to-text`
   - Transcribes audio files to text
   - Supported formats: mp3, wav, ogg, etc.

2. **Summarization & Translation**
   - Endpoint: `/sunflower-simple-inference`
   - Uses Sunflower LLM for both summarization and translation
   - Supports multiple languages

3. **Text-to-Speech (TTS)**
   - Endpoint: `/text-to-speech`
   - Generates audio from text
   - Multiple language support

**API Reference**: [Sunbird AI Docs](https://docs.sunbird.ai/)

## 🔒 Security Notes

- **Never commit your API token** to Git
- Always use `.env` files with `SUNBIRD_API_TOKEN`
- The `.env` file is listed in `.gitignore`
- When deploying, add tokens as platform secrets (Vercel environment variables)

## 🐛 Error Handling

The application handles errors gracefully:

- **Empty input**: Shows validation error
- **File too large**: Rejects audio > 5 minutes
- **API failures**: Displays user-friendly error messages
- **Network issues**: Shows connection errors

Example error messages:

```
"Audio file too large. Maximum 5 minutes (~50MB)."
"Please enter some text"
"API request failed - check your token"
```

## ⚠️ Known Limitations

1. **Audio Duration Cap**: Audio files longer than 5 minutes are rejected
2. **Supported Languages**: Only the 5 Ugandan languages listed above
3. **File Upload**: Multipart file uploads require proper backend handling
4. **Rate Limiting**: Subject to Sunbird AI API rate limits
5. **Browser Support**: Requires modern browser with audio support (Chrome, Firefox, Safari, Edge)

## 🚢 Deployment (Part 3)

See the main [README.md](../README.md) for deployment instructions to Vercel.

---

**Last Updated**: May 9, 2026  
**Status**: ✅ Development Complete - Ready for Deployment
