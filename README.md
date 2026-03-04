<div align="center">

# MOVO

### Fitness platform for trainers and athletes

[![React Native](https://img.shields.io/badge/React_Native-0.81-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.3-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)

> Dark-themed fitness platform connecting trainers and athletes — gym, yoga & pilates — with an integrated AI coach powered by Llama 3.3 70B via Groq.

</div>

---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [1. Supabase Setup](#1️⃣-supabase)
  - [2. Backend Setup](#2️⃣-backend-spring-boot)
  - [3. Frontend Setup](#3️⃣-frontend-expo)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Screens Overview](#-screens-overview)
- [Auth Flow](#-auth-flow)
- [License](#-license)

---

## ✨ Features

**For Athletes**
- 📋 Personalized routines across gym, yoga, and pilates with difficulty levels
- 🏃 Real-time active workout tracker — set/rep counter, rest timer, haptic feedback
- 🤖 AI Coach powered by **Llama 3.3 70B** (Groq) — context-aware, motivational, Spanish-first
- 📊 Progress dashboard — weekly bar chart, session history, personal stats
- 🔔 Push notifications for workout reminders and trainer messages

**For Trainers**
- 👥 Full client management — profiles, stats, custom trainer notes
- 📝 Routine creation and assignment per client
- 💬 Direct messaging with each athlete
- 🏆 Client progress monitoring with inactivity alerts

**General**
- 🔐 Secure JWT auth via Supabase — no re-login on app restart
- 🌙 Dark-themed UI (`#0A0A0A` background, `#6C63FF` purple accent)
- 🇪🇸 Spanish-first interface

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Mobile | React Native + Expo | RN 0.81 / SDK 54 |
| Language | TypeScript | 5.9 |
| State Management | Zustand | 5.0 |
| Forms | React Hook Form | 7.x |
| Navigation | React Navigation | 7.x |
| Auth | Supabase Auth | 2.x |
| HTTP Client | Axios | 1.x |
| Backend | Spring Boot | 3.2.3 |
| Language | Java | 17 |
| Security | JJWT (Supabase JWT validation) | 0.12.5 |
| ORM | Spring Data JPA + Hibernate | — |
| Database | Supabase (PostgreSQL 15) | — |
| AI | Groq — Llama 3.3 70B Versatile (Meta) | — |
| API Docs | Springdoc OpenAPI / Swagger UI | 2.3.0 |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Expo (React Native)                │
│  Auth via Supabase SDK ─────────────────────────────►│
│  API calls via Axios + JWT Bearer token             │
└────────────────────────┬─────────────────────────────┘
                         │ HTTP + JWT
                         ▼
┌──────────────────────────────────────────────────────┐
│              Spring Boot API  :8080                  │
│                                                      │
│  POST  /api/auth/sync          User registration     │
│  GET   /api/users/me           Profile               │
│  CRUD  /api/routines           Routine library       │
│  GET   /api/exercises          Exercises by routine  │
│  POST  /api/sessions           Workout sessions      │
│  GET   /api/sessions/stats     User statistics       │
│  POST  /api/ai/chat            AI Coach              │
│  GET   /api/trainer/clients    Client management     │
│  POST  /api/trainer/messages   Trainer messaging     │
└──────┬──────────────────────────┬────────────────────┘
       │ JDBC                     │ HTTPS
       ▼                          ▼
┌─────────────┐        ┌─────────────────────────────┐
│  Supabase   │        │  Groq API                   │
│  PostgreSQL │        │  llama-3.3-70b-versatile    │
│  (8 tables) │        │  api.groq.com               │
└─────────────┘        └─────────────────────────────┘
```

---

## 📁 Project Structure

```
MovoApp/
├── movo-app/                    # React Native / Expo frontend
│   ├── src/
│   │   ├── components/ui/       # Reusable UI components
│   │   ├── navigation/          # React Navigation setup
│   │   ├── screens/
│   │   │   ├── auth/            # Login, Register, Splash
│   │   │   ├── user/            # Home, Routines, AI Coach, Progress, Profile
│   │   │   ├── trainer/         # Trainer dashboard, clients, messages
│   │   │   └── shared/          # Active Workout, Routine Detail
│   │   ├── services/            # Supabase client, API service, notifications
│   │   ├── store/               # Zustand stores (auth, routines, AI)
│   │   ├── types/               # TypeScript interfaces
│   │   └── utils/               # Constants, helpers
│   └── package.json
│
├── movo-backend/                # Spring Boot 3 REST API
│   └── src/main/java/com/movo/
│       ├── config/              # Security configuration
│       ├── controller/          # REST controllers
│       ├── model/               # JPA entities
│       ├── repository/          # Spring Data repositories
│       ├── security/            # JWT filter
│       └── service/             # Business logic + Groq AI
│
└── supabase-schema.sql          # Full DB schema, RLS policies, seed data
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| Java JDK | 17+ |
| Maven | 3.8+ |
| Expo Go | Latest (iOS/Android) |
| Supabase account | — |
| Groq API key | [console.groq.com](https://console.groq.com) (free tier available) |

---

### 1️⃣ Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the full contents of `supabase-schema.sql`
   - Creates **8 tables** with Row Level Security, 9 seed routines, 66 seed exercises, and performance indexes
3. Collect credentials from **Project Settings → API**:

   | Value | Maps to |
   |---|---|
   | Project URL | `EXPO_PUBLIC_SUPABASE_URL`, `SUPABASE_URL` |
   | `anon` public key | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
   | JWT Secret (Settings → API → JWT Settings) | `SUPABASE_JWT_SECRET` |

4. Get the **JDBC connection string** from Settings → Database → Connection string → JDBC
   - Set `SUPABASE_DB_URL`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`
5. Enable **Email Auth** under Authentication → Providers

---

### 2️⃣ Backend (Spring Boot)

```bash
cd movo-backend

# Copy env template and fill in your values
copy .env.example .env

# Run
mvn spring-boot:run
```

> 💡 In **IntelliJ**, add env vars under Run → Edit Configurations → Environment Variables to avoid using a .env file.

Once running:
- **REST API** → `http://localhost:8080/api`
- **Swagger UI** → `http://localhost:8080/swagger-ui.html`

---

### 3️⃣ Frontend (Expo)

```bash
cd movo-app

# Copy env template and fill in your values
copy .env.example .env

npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS).

> ⚠️ On physical devices, use your machine's Wi-Fi IP instead of `localhost`. Run `ipconfig` to find it — e.g. `http://192.168.1.50:8080/api`.

---

## 🔑 Environment Variables

### Backend — `movo-backend/.env`

| Variable | Description | Where to get it |
|---|---|---|
| `SUPABASE_DB_URL` | JDBC connection string | Supabase → Settings → Database |
| `SUPABASE_DB_USER` | DB user (usually `postgres`) | Supabase → Settings → Database |
| `SUPABASE_DB_PASSWORD` | DB password | Supabase → Settings → Database |
| `SUPABASE_URL` | Project URL | Supabase → Settings → API |
| `SUPABASE_JWT_SECRET` | JWT signing secret | Supabase → Settings → API → JWT |
| `GROQ_API_KEY` | Groq API key (`gsk_…`) | [console.groq.com](https://console.groq.com) |
| `JWT_SECRET` | Any 32+ char random string | Generate yourself |

### Frontend — `movo-app/.env`

| Variable | Example |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` |
| `EXPO_PUBLIC_API_BASE_URL` | `http://192.168.1.50:8080/api` |

---

## 📡 API Reference

Full interactive docs available at **`http://localhost:8080/swagger-ui.html`** when the backend is running.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/sync` | Sync Supabase user into backend DB | ✅ |
| `GET` | `/api/users/me` | Get current user profile | ✅ |
| `PUT` | `/api/users/me` | Update profile | ✅ |
| `GET` | `/api/routines` | List routines (filter by category/difficulty) | ✅ |
| `POST` | `/api/routines` | Create routine | ✅ |
| `GET` | `/api/exercises` | Get exercises by routine | ✅ |
| `POST` | `/api/sessions` | Start a workout session | ✅ |
| `PUT` | `/api/sessions/{id}/complete` | Complete a session | ✅ |
| `GET` | `/api/sessions/stats` | User workout statistics | ✅ |
| `POST` | `/api/ai/chat` | Chat with AI coach | ✅ |
| `GET` | `/api/trainer/clients` | Trainer's client list | ✅ Trainer |
| `GET` | `/api/trainer/clients/{id}` | Client profile + stats | ✅ Trainer |
| `POST` | `/api/trainer/messages` | Send message to client | ✅ Trainer |

---

## 📱 Screens Overview

### 👤 Athlete

| Screen | Description |
|---|---|
| Splash | Animated logo on launch |
| Login | Email/password via Supabase Auth |
| Register | 4-step wizard: role → personal data → goals → preferences |
| Home | Dashboard: today's routine, weekly stats, category shortcuts |
| Routines | Browsable library filtered by gym / yoga / pilates + difficulty |
| Routine Detail | Exercise list with sets, reps, and descriptions |
| Active Workout | Live set/rep counter, rest timer, haptic feedback on completion |
| AI Coach | Conversational AI chat — context-aware, Spanish-first |
| Progress | Weekly bar chart, session count, total time, personal records |
| Profile | Photo, goals, body stats, trainer notes |
| Settings | Notifications, preferences, account |

### 🏋️ Trainer

| Screen | Description |
|---|---|
| Dashboard | Overview of all clients and their activity |
| Clients | Searchable, sortable client list |
| Client Detail | Full profile, session history, editable trainer notes |
| Routines | Create, edit, and assign routines |
| Messages | Real-time chat with each client |
| Profile | Trainer bio, specialties, certifications |

---

## 🔐 Auth Flow

```
User ──► Supabase Auth (email/password)
              │
              ▼
         Supabase JWT (ES256, signed with project JWT secret)
              │
              ├──► Frontend stores token (AsyncStorage)
              │
              └──► POST /api/auth/sync  (backend receives JWT)
                          │
                          ▼
                   JwtAuthFilter validates JWT
                   using same Supabase JWT secret
                          │
                          ▼
                   SecurityContextHolder populated
                   All protected endpoints accessible
```

---

## 🗄 Database Schema

The Supabase database contains **8 tables**:

| Table | Description |
|---|---|
| `users` | User accounts + role (`user` / `trainer`) |
| `user_profiles` | Body stats, goals, preferences |
| `routines` | Workout routines with category, difficulty, duration |
| `exercises` | Exercises linked to routines (sets, reps, descriptions) |
| `workout_sessions` | Session logs with duration and completion status |
| `session_exercises` | Per-exercise completion tracking within a session |
| `trainer_clients` | Trainer ↔ client assignments |
| `messages` | Chat messages between trainers and clients |

All tables have **Row Level Security (RLS)** enabled. The backend connects via a direct JDBC connection using service-level credentials.

---

## 🤖 AI Coach

The AI coach is powered by **Meta's Llama 3.3 70B Versatile** model served via the **Groq** inference platform.

- **Frontend**: direct calls to `https://api.groq.com/openai/v1/chat/completions` from `aiStore.ts`
- **Backend**: `GroqAIService.java` builds context-aware system prompts using the user's profile, recent sessions, and inactivity detection
- **System prompt** includes: user name, role, last workout info, and inactivity alerts (> 3 days)
- **Conversation history**: last 20 messages kept in memory per session

---

## 📝 Development Notes

- `ddl-auto: validate` — Hibernate validates the schema against the DB at startup. Always run `supabase-schema.sql` before starting the backend for the first time.
- RLS is active on all tables; the backend bypasses it via direct JDBC credentials.
- The `GroqAIService` keeps conversation history in-memory per `conversationId`. For production, replace with a DB-backed `AIConversation` entity.
- All UI uses `#0A0A0A` dark background with `#6C63FF` purple accent — hardcoded in `constants.ts`.

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

Built with ❤️ for the Spanish-speaking fitness community

</div>
