# MOVO — Fitness App 🏋️‍♀️

> **React Native (Expo) · Spring Boot 3 · Supabase · Grok AI**
> Dark-themed fitness platform for trainers and athletes — gym, yoga & pilates.

---

## Project Structure

```
MovoApp/
├── movo-app/           # React Native / Expo frontend
├── movo-backend/       # Spring Boot 3 REST API
└── supabase-schema.sql # Supabase PostgreSQL schema + seed data
```

---

## 1️⃣ Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase-schema.sql`
   - Creates 8 tables with RLS, 9 routines, 66 exercises as seed data, and indexes
3. Collect the following from **Project Settings → API**:
   - `Project URL` → `EXPO_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
   - `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT Secret` (Settings → API → JWT Settings) → `SUPABASE_JWT_SECRET`
4. Collect from **Project Settings → Database → Connection string (URI)**:
   - Copy as JDBC and set `SUPABASE_DB_URL`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`
5. Enable **Email Auth** in Authentication → Providers

---

## 2️⃣ Backend Setup (Spring Boot)

### Prerequisites
- Java 17+
- Maven 3.8+

### Run

```bash
cd movo-backend

# Copy env and fill in values
copy .env.example .env

# Windows: set vars inline or use a .env loader like spring-dotenv
# Or set environment variables directly in your IDE (IntelliJ: Run → Edit Configurations)

mvn spring-boot:run
```

The API starts at **http://localhost:8080**  
Swagger UI: **http://localhost:8080/swagger-ui.html**

### Required environment variables

| Variable | Where to find |
|---|---|
| `SUPABASE_DB_URL` | Supabase → Settings → Database → URI (JDBC format) |
| `SUPABASE_DB_USER` | Usually `postgres` |
| `SUPABASE_DB_PASSWORD` | Your DB password |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_JWT_SECRET` | Supabase → Settings → API → JWT Secret |
| `GROK_API_KEY` | [console.x.ai](https://console.x.ai) |
| `JWT_SECRET` | Any 32+ character random string |

---

## 3️⃣ Frontend Setup (Expo)

### Prerequisites
- Node 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (or Android/iOS emulator)

### Run

```bash
cd movo-app

# Copy env and fill in values
copy .env.example .env

npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS).

### Required environment variables (.env)

| Variable | Value |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `EXPO_PUBLIC_API_BASE_URL` | `http://YOUR_LOCAL_IP:8080/api` (use your Wi-Fi IP, not localhost, for physical devices) |

> **Tip**: Find your local IP with `ipconfig` on Windows. Use something like `http://192.168.1.50:8080/api`.

---

## Architecture

```
[Expo App] ──Supabase Auth──► [Supabase]
     │                           │ PostgreSQL DB
     │ axios + JWT               ▼
     └──────────────► [Spring Boot API :8080]
                            │
                            ├── /api/auth/sync    (user registration sync)
                            ├── /api/users/me     (profile)
                            ├── /api/routines     (CRUD + filters)
                            ├── /api/exercises    (by routine)
                            ├── /api/sessions     (start/complete/stats)
                            ├── /api/ai/chat      (Grok AI coach)
                            └── /api/trainer      (clients + messages)
                                        │
                                        └── [Grok xAI API]
```

### Auth Flow
1. User signs up / logs in via **Supabase Auth** (frontend)
2. Supabase returns a **JWT** signed with the project's JWT secret
3. Frontend calls `POST /api/auth/sync` to sync the user into the backend DB
4. All subsequent requests include the Supabase JWT in `Authorization: Bearer <token>`
5. Spring Boot's `JwtAuthFilter` validates the JWT using the same secret

---

## Screens

### User App
| Screen | Description |
|---|---|
| Splash | Animated logo |
| Login | Email + password via Supabase |
| Register | 4-step wizard (role, data, goals, preferences) |
| Home | Dashboard with stats, today's routine, categories |
| Routines | Gym / Yoga / Pilates library with filters |
| AI Coach | Chat interface powered by Grok AI |
| Progress | Stats, weekly bar chart, session history |
| Profile | Personal info, goals, trainer notes |
| Routine Detail | Exercise list + start workout |
| Active Workout | Real-time set/rep counter, rest timer, vibration |

### Trainer App
| Screen | Description |
|---|---|
| Dashboard | Client overview + stats |
| Clients | Searchable client list |
| Client Detail | Profile, stats, editable trainer notes |
| Routines | Create and manage routines |
| Messages | Chat with each client |
| Profile | Trainer profile |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native, Expo SDK 51, TypeScript |
| State | Zustand |
| Forms | React Hook Form |
| Navigation | React Navigation 6 |
| Auth | Supabase Auth |
| Backend | Spring Boot 3.2, Java 17 |
| Security | JJWT (Supabase JWT validation) |
| ORM | Spring Data JPA + Hibernate |
| Database | Supabase (PostgreSQL 15) |
| AI | Grok (xAI) via REST API |
| API Docs | Springdoc OpenAPI / Swagger |

---

## Development Notes

- All screens use the dark `#0A0A0A` background with `#6C63FF` purple accent
- Spanish UI (target market: Spanish-speaking fitness community)
- The `GrokAIService` builds personalized system prompts with user context (sessions, inactivity alerts)
- RLS is enabled on all Supabase tables; the backend bypasses RLS via the service role key (set if needed)
- `ddl-auto: validate` — Hibernate validates schema against the DB; run the SQL first before starting the backend
