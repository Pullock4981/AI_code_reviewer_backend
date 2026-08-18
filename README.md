# AI Code Reviewer - Backend

This is the backend service for the AI Code Reviewer application. It provides REST APIs to analyze code snippets, GitHub files, and full GitHub repositories using powerful AI models (Groq and Gemini).

## Features
- **Multiple AI Providers:** Supports both Groq (Llama-3) and Google Gemini for flexible and fast code reviews.
- **GitHub Integration:** Fetches files and structures directly from GitHub repositories.
- **Lightning Fast Mode:** Analyzes repository structures and UI live links for extremely fast feedback.
- **Deterministic Scoring:** AI creativity/temperature is strictly controlled to ensure consistent grading.
- **MongoDB Storage:** Saves all reviews to a MongoDB database for history tracking.

## Project Structure
- `src/controllers/` - Contains the logic for handling incoming API requests.
- `src/routes/` - Express routing definitions.
- `src/services/` - Core business logic:
  - `ai/aiProvider.js` - Dynamic AI provider switching.
  - `github.service.js` - GitHub API integration.
  - `review.service.js` - Orchestrates the review process.
- `src/models/` - Mongoose database schemas.
- `src/utils/` - Helpers (e.g., logger, error classes, language detection).

## Setup & Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Rename `.env.example` to `.env` and fill in your API keys and MongoDB URI.
   ```bash
   cp .env.example .env
   ```
   # Gemini AI Configuration
    GEMINI_API_KEY=your_gemini_api_key_here
    GEMINI_MODEL=gemini-2.5-flash
    GEMINI_FALLBACK_MODEL=gemini-flash-latest

# Groq AI Configuration
    GROQ_API_KEY=your_groq_api_key_here
    GROQ_MODEL=llama-3.1-8b-instant

# Active AI Provider (e.g., groq or gemini)
  AI_PROVIDER=groq

# MongoDB Configuration
  MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database_name>?retryWrites=true&w=majority


3. **Start the Server:**
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000` by default.

## Deployment
This project can be easily deployed to Vercel or any Node.js hosting service. Ensure you add all variables from your `.env` to your hosting provider's environment variables settings.
