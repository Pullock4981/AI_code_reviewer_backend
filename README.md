# AI Code Reviewer — Backend

Node.js + Express + Mongoose + Gemini AI

---

## Setup

```bash
npm install
npm run dev
```

Server starts at: http://localhost:5000

---

## Auth Header (সব request এ দিতে হবে)

```
Key:   Authorization
Value: Bearer AICR_sk_9X2mK7nPqR3wZ8tYv2026
```

---

## API Endpoints

### 1. Health Check
```
GET http://localhost:5000/health
```
No auth needed.

---

### 2. Code Paste Review
```
POST http://localhost:5000/api/v1/reviews
Content-Type: application/json
Authorization: Bearer AICR_sk_9X2mK7nPqR3wZ8tYv2026

{
  "code": "function add(a, b) { return a + b; } console.log(add(2,3))",
  "language": "javascript",
  "reviewParameters": {
    "studentLevel": "BEGINNER",
    "reviewDepth": "STANDARD",
    "strictnessLevel": "STANDARD",
    "focusAreas": ["LOGIC", "STYLE"],
    "assignmentContext": "Student was asked to write a simple addition function",
    "customInstructions": ""
  }
}
```

---

### 3. GitHub File Review
```
POST http://localhost:5000/api/v1/reviews/github/file
Content-Type: application/json
Authorization: Bearer AICR_sk_9X2mK7nPqR3wZ8tYv2026

{
  "githubUrl": "https://github.com/username/repo/blob/main/index.js",
  "reviewParameters": {
    "studentLevel": "INTERMEDIATE",
    "reviewDepth": "DETAILED",
    "strictnessLevel": "STRICT"
  }
}
```

---

### 4. GitHub Repo Review
```
POST http://localhost:5000/api/v1/reviews/github/repo
Content-Type: application/json
Authorization: Bearer AICR_sk_9X2mK7nPqR3wZ8tYv2026

{
  "repositoryUrl": "https://github.com/username/repo",
  "maxFiles": 10,
  "reviewParameters": {
    "studentLevel": "BEGINNER",
    "reviewDepth": "STANDARD",
    "strictnessLevel": "STANDARD"
  }
}
```

---

### 5. Get Saved Review by ID
```
GET http://localhost:5000/api/v1/reviews/<review_id>
Authorization: Bearer AICR_sk_9X2mK7nPqR3wZ8tYv2026
```

---

## Environment Variables (.env)

```
PORT=5000
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.0-flash
MONGO_URI=your_mongodb_uri
API_AUTH_KEY=AICR_sk_9X2mK7nPqR3wZ8tYv2026
AI_PROVIDER=gemini
```

---

## ⚠️ Security Reminder
- Never push `.env` to GitHub
- Rotate API keys and MongoDB password after sharing
