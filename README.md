# Sunbird AI Internship Assessment Exercise


This assessment consists of 3 parts:

1. ✅ **Programming exercises** — implement `collatz()` and `distinct_numbers()` functions
2. ✅ **Build a GenAI Application with Sunbird AI** — Next.js + Python backend web app
3. 🚀 **Documentation & Deployment** — Deploy to Vercel

## Quick Status

| Part                                 | Status             | Notes                                      |
| ------------------------------------ | ------------------ | ------------------------------------------ |
| Part 1: Programming Exercises        | ✅ **Complete**    | All tests passing (5/5)                    |
| Part 2: GenAI App (Next.js + Python) | ✅ **Complete**    | See [PROJECT_README.md](PROJECT_README.md) |
| Part 3: Deployment                   | 📋 **In Progress** | See deployment steps below                 |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Git

### Initial Setup

1. **Fork & Clone**

   ```bash
   git clone https://github.com/<your-username>/internship-assessment.git
   cd internship-assessment
   ```

2. **Create & Activate Python Virtual Environment**
   - Linux/Mac: `python -m venv venv && source venv/bin/activate`
   - Windows: `python -m venv venv && venv\Scripts\activate.bat`

3. **Install Dependencies**

   ```bash
   # Python packages
   pip install -r requirements.txt

   # Node.js packages (for Part 2)
   npm install
   ```

4. **Get Your Sunbird AI API Token**
   - Go to [Sunbird AI Portal](https://app.sunbird.ai/)
   - Create an account or sign in
   - Generate a new API token
   - Copy the token

5. **Configure Environment**

   ```bash
   # Copy the example file
   cp .env.example .env.local

   # Edit .env.local and add your Sunbird API token
   # NEXT_PUBLIC_SUNBIRD_API_TOKEN=sk_...
   ```

---

## Part 1: Programming Exercises ✅

**Status**: All tests passing!

### Completed Functions

**`collatz(n: int) -> List[int]`**  
Implements the Collatz conjecture: repeatedly divide even numbers by 2, multiply odd numbers by 3 and add 1, until reaching 1. Returns the sequence of all values.

```python
def collatz(n: int) -> List[int]:
    result = []
    while n != 1:
        result.append(n)
        if n % 2 == 0:
            n = n // 2
        else:
            n = n * 3 + 1
    result.append(1)
    return result
```

**`distinct_numbers(numbers: List[int]) -> int`**  
Counts unique values in a list using Python's `set()`.

```python
def distinct_numbers(numbers: List[int]) -> int:
    return len(set(numbers))
```

### Running Tests

```bash
pytest tests/test_basics.py -v
# Output: 5 passed in 0.23s ✅
```

---

## Part 2: GenAI Application with Sunbird AI ✅

**Status**: Application ready for local testing and deployment!

### Architecture

**Frontend**: Next.js 14 (React 18, TypeScript)  
**Backend**: Python serverless functions (Vercel runtime)  
**APIs**: Sunbird AI (STT, Summarization, Translation, TTS)

### Pipeline

```
User Input (Text/Audio)
    ↓
[STT if audio] → [Summarize] → [Translate] → [TTS]
    ↓
Display Results (Transcript, Summary, Translation, Audio)
```

### Features Implemented

- ✅ Text input support
- ✅ Audio file upload (max 5 minutes)
- ✅ 5 Ugandan language support (Luganda, Runyankole, Ateso, Lugbara, Acholi)
- ✅ Real-time processing pipeline
- ✅ Error handling & validation
- ✅ Responsive UI with modern styling
- ✅ Audio player for output

### Running Locally

```bash
# Start development server
npm run dev

# Open browser
# http://localhost:3000
```

For detailed setup, see [PROJECT_README.md](PROJECT_README.md)

### Project Structure

```
.
├── app/                      # Next.js Frontend
│   ├── page.tsx             # Main UI component
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Styles
├── api/                      # Python Backend (Vercel Serverless)
│   ├── index.py             # API routing
│   ├── sunbird_client.py    # Sunbird AI wrapper
│   └── pipeline.py          # Processing pipeline
├── exercises/               # Part 1 (Programming exercises)
│   └── basics.py
├── tests/                   # Part 1 tests
│   └── test_basics.py
├── package.json             # Node.js dependencies
├── requirements.txt         # Python dependencies
├── next.config.js           # Next.js config
├── vercel.json              # Vercel deployment config
├── .env.example             # Environment template
├── PROJECT_README.md        # Part 2 documentation
└── README.md                # This file
```

---

## Part 3: Deployment 🚀

### Option A: Deploy to Vercel (Recommended for Next.js)

Vercel is the official Next.js hosting platform and supports both Next.js frontend and Python backend functions.

#### Step 1: Prepare Your Code

Ensure all files are committed to Git:

```bash
git add .
git commit -m "Complete internship assessment parts 1-3"
git push origin main
```

#### Step 2: Create Vercel Account & Link Project

```bash
# Install Vercel CLI
npm i -g vercel@latest

# Login to Vercel (creates account if needed)
vercel login

# Link project
vercel link
```

When prompted:

- **Found existing project**: Say No (to create new)
- **Project name**: `internship-assessment`
- **Directory**: `.` (current)

#### Step 3: Add Environment Variables

```bash
# Add Sunbird API token as secret
vercel env add SUNBIRD_API_TOKEN

# You'll be prompted for:
# 1. Enter value for SUNBIRD_API_TOKEN: sk_...
# 2. Select environments: Choose "Development", "Preview", "Production"
```

#### Step 4: Deploy

```bash
# Preview deployment (staging)
vercel

# Production deployment
vercel --prod
```

Vercel will:

1. Build Next.js frontend
2. Install Python dependencies from `requirements.txt`
3. Deploy Python API functions to serverless runtime
4. Provide a live URL: `https://internship-assessment-xxxxx.vercel.app`

#### Step 5: Test Live App

Visit the provided URL and test the full pipeline with text/audio inputs.

---

### Option B: Deploy to Hugging Face Spaces (For Streamlit/Gradio)

If you prefer a simpler UI framework, Hugging Face Spaces is excellent:

#### For Streamlit or Gradio:

1. Create account: https://huggingface.co/join
2. Create new Space: https://huggingface.co/new-space
   - Choose **Streamlit** or **Gradio**
   - Set to **Public**
3. Add secret: Space settings → Variables and secrets → New secret
   - Name: `SUNBIRD_API_TOKEN`
   - Value: Your Sunbird API token
4. Push code:
   ```bash
   git remote add space https://huggingface.co/spaces/your-username/your-space
   git push space main
   ```

---

## Submission Checklist ✅

- [ ] Part 1: All 5 tests passing
- [ ] Part 2: Application code complete (Next.js + Python backend)
- [ ] Part 3: Updated README with setup instructions
- [ ] Part 3: Environment variables documented in `.env.example`
- [ ] Part 3: Code deployed and live (Vercel or Hugging Face)
- [ ] Part 3: Deployment link added to this README

---

## Environment Variables Reference

| Variable              | Required | Example                 | Notes                                 |
| --------------------- | -------- | ----------------------- | ------------------------------------- |
| `SUNBIRD_API_TOKEN`   | Yes      | `sk_...`                | Your Sunbird AI API token             |
| `NEXT_PUBLIC_API_URL` | No       | `http://localhost:3000` | Frontend API endpoint (auto-detected) |

---

## API Endpoints

| Endpoint             | Method | Purpose                        |
| -------------------- | ------ | ------------------------------ |
| `/api/process-text`  | POST   | Process text through pipeline  |
| `/api/process-audio` | POST   | Process audio through pipeline |
| `/api/health`        | GET    | Health check                   |

---

## Troubleshooting

### "Module not found" errors

```bash
# Reinstall dependencies
pip install -r requirements.txt
npm install
```

### "SUNBIRD_API_TOKEN not set"

```bash
# Check .env.local file exists
cat .env.local

# Verify token is set
echo $NEXT_PUBLIC_SUNBIRD_API_TOKEN  # Linux/Mac
echo %NEXT_PUBLIC_SUNBIRD_API_TOKEN%  # Windows
```

### Tests failing

```bash
# Run tests with verbose output
pytest tests/ -v

# Make sure venv is activated and requirements.txt installed
```

### Build errors on Vercel

- Ensure `requirements.txt` is in project root
- Check `package.json` exists with correct build script
- Verify `api/` directory has Python files

---

## Resources

- [Sunbird AI Docs](https://docs.sunbird.ai/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Python API Handlers on Vercel](https://vercel.com/docs/functions/runtimes/python)

---

## Additional Documentation

For detailed information on Part 2 (application features, usage, architecture):  
👉 **See [PROJECT_README.md](PROJECT_README.md)**

---

**Last Updated**: May 9, 2026  
**Assessment Status**: 🟢 In Progress (Parts 1 & 2 Complete, Part 3 Pending Deployment)
