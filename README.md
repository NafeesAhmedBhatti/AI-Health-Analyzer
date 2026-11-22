<div align="center">

# AI Health Analyzer

**Personal AI-powered health companion for lab report analysis, vitals tracking, and clinical insights.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-00d4ff?style=for-the-badge&logo=vercel)](https://ai-health-analyzer-phi.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

**[Open Live App →](https://ai-health-analyzer-phi.vercel.app/)** · **[Instant Demo Login →](https://ai-health-analyzer-phi.vercel.app/login)**

</div>

---

## Key Features

- **AI Lab Report Analyzer** — Upload PDF or TXT lab reports (CBC, Lipid Panel, HbA1c, Thyroid, Metabolic Panels) for instant AI clinical summaries, abnormal value flags, detected conditions, and health score calculation.
- **Context-Aware AI Health Chat** — Real-time clinical Q&A powered by Gemini/OpenAI with awareness of your health metrics and lab history.
- **Vitals & Health Trends** — Track heart rate, blood pressure, oxygen saturation, weight, BMI, and mood scores over 7d / 30d / 90d / 1y timelines.
- **Medications, Alerts & Nutrition** — Active medication tracking, severity-based health alerts, personalized meal guidance, and symptom/skin/mental-health check modules.
- **Responsive Dashboard** — Dark glassmorphic UI with desktop collapsible sidebar and mobile drawer navigation.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Styling & Charts:** Tailwind CSS 4, Framer Motion, Recharts, Lucide Icons
- **Auth & Data:** NextAuth.js, Prisma ORM (MySQL + stateless Vercel demo fallback)
- **AI Engine:** Google Gemini (`gemini-3.5-flash-lite` / `gemini-3.8-flash`) & OpenAI-compatible fallback

---

## Quick Start

```bash
git clone https://github.com/NafeesAhmedBhatti/AI-Health-Analyzer.git
cd AI-Health-Analyzer
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

Open `http://localhost:3000` and click **Try Instant Demo Account** on `/login` (`demo@aihealth.app` / `DemoPass123!`).

---

## Project Structure

```text
├── src/
│   ├── app/              # Next.js App Router pages & API routes
│   ├── components/       # Reusable UI & chart components
│   ├── hooks/            # Client hooks
│   └── lib/              # AI client, auth, Prisma & demo fallbacks
├── prisma/               # Prisma database schema
└── public/               # Static assets & demo video
```

---

## License

MIT © [Nafees Ahmed Bhatti](https://github.com/NafeesAhmedBhatti)
