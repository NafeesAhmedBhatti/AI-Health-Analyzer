# 🏥 AI Health Analyzer

A futuristic AI-powered health analysis platform built with Next.js, Prisma, and OpenAI. Upload your lab reports and get instant AI-generated health insights, personalized nutrition plans, medication recommendations, mental health assessments, and more.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?logo=openai)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### 🔬 Core Analysis
- **Lab Report Upload & AI Analysis** — Upload PDF/TXT lab reports and get instant AI-powered health analysis with health scores, detected conditions, abnormal values, and clinical recommendations
- **Health Score** — Overall health score (0-100) calculated from lab values with visual ring chart
- **Report Comparison** — Compare two lab reports side-by-side with AI-generated summaries

### 💊 Health Modules (17 Pages)
- **Dashboard** — Real-time health overview with vitals, conditions, AI insights, and recommendations
- **AI Chat** — Conversational AI assistant powered by **Nafexa AI** using your health data
- **Lab Reports** — Upload, view, activate, and manage multiple lab reports
- **Trends** — Track health scores, vitals, and mental health over time with interactive charts
- **Compare** — Side-by-side comparison of two reports with AI analysis
- **Medications** — AI-recommended medications based on lab values with dosage, side effects, and monitoring info
- **Nutrition** — Personalized diet plans with calorie targets, macro splits, meal plans, weekly schedules, and **Nafexa AI** nutrition expert chat
- **Vitals Tracker** — Track heart rate, blood pressure, oxygen, temperature, weight, BMI with abnormal detection
- **Symptoms** — AI-powered symptom checker with severity assessment
- **Alerts** — Health alerts categorized as critical/warning/info based on lab analysis
- **Mental Health** — AI assessment of mood, anxiety, energy, and sleep based on lab values
- **Skin Analysis** — AI-powered skin condition analysis from uploaded images
- **Family History** — Track family medical conditions and hereditary risk
- **Reports** — Generate downloadable PDF health reports
- **Settings** — User profile and preferences

### 🤖 AI Features
- **Nafexa AI** — Your personal AI health companion & nutrition expert
- **Streaming Responses** — Real-time AI response streaming for chat interfaces
- **Multi-turn Conversations** — Context-aware follow-up questions
- **Personalized Advice** — AI references your actual conditions, vitals, and medications

### 🎨 Design
- Dark futuristic UI with neon accents
- Fully responsive (mobile + desktop)
- Smooth animations with Framer Motion
- Interactive charts with Recharts

---

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Database** | MySQL with Prisma ORM |
| **Authentication** | NextAuth.js (JWT + bcrypt) |
| **AI** | OpenAI API (Kimi K2.5 via proxy) |
| **Styling** | Tailwind CSS 4 |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Validation** | Zod |
| **PDF** | jsPDF + pdf-parse + unpdf |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- MySQL database
- OpenAI API key (or compatible endpoint)

### Installation

```bash
# Clone the repository
git clone https://github.com/NafeesAhmedBhatti/AI-Health-Analyzer.git
cd AI-Health-Analyzer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API credentials

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build

# Start the production server
npm start
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

---

## ⚙️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for JWT token signing | Yes |
| `NEXTAUTH_URL` | Base URL of your application | Yes |
| `OPENAI_API_KEY` | OpenAI-compatible API key | Yes |
| `OPENAI_BASE_URL` | OpenAI-compatible base URL | Yes |

See `.env.example` for the full template.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes (27 endpoints)
│   │   ├── auth/         # Authentication (NextAuth)
│   │   ├── chat/         # AI chat (streaming)
│   │   ├── dashboard/    # Dashboard data
│   │   ├── lab-reports/  # Lab report upload & management
│   │   ├── nutrition-chat/ # Nafexa AI nutrition expert
│   │   └── ...           # 20+ more API routes
│   ├── (auth)/           # Login & Register pages
│   ├── (dashboard)/      # Dashboard pages (17)
│   └── layout.tsx        # Root layout
├── components/
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities, auth, prisma, validations
└── types/                # TypeScript type definitions
```

---

## 🔒 Security

- Prisma ORM for all database queries (no SQL injection)
- bcrypt password hashing (12 salt rounds)
- JWT-based session management via NextAuth
- Zod input validation on all API endpoints
- No `dangerouslySetInnerHTML` usage
- Server-side session verification on all API routes
- No internal error details leaked in API responses

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This application provides AI-generated health insights for informational purposes only. It is **NOT** a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making any medical decisions.