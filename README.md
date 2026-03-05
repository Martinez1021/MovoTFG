<div align="center">

# MOVO

### Plataforma fitness para entrenadores y deportistas

[![React Native](https://img.shields.io/badge/React_Native-0.81-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.3-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)

> Plataforma fitness con temática oscura que conecta entrenadores y deportistas — gimnasio, yoga y pilates — con un entrenador virtual IA basado en Llama 3.3 70B a través de Groq.


<img width="1280" height="720" alt="El Nuevo Dron de México que Dejó a EE UU  Sin Palabras (3)" src="https://github.com/user-attachments/assets/f51805d0-e2eb-4796-87cc-0ee3c149c4de" />

</div>

---

## Índice

- [Funcionalidades](#-funcionalidades)
- [Stack tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Primeros pasos](#-primeros-pasos)
  - [1. Supabase](#1️⃣-supabase)
  - [2. Backend](#2️⃣-backend-spring-boot)
  - [3. Frontend](#3️⃣-frontend-expo)
- [Variables de entorno](#-variables-de-entorno)
- [Referencia de la API](#-referencia-de-la-api)
- [Pantallas](#-pantallas)
- [Flujo de autenticación](#-flujo-de-autenticación)
- [Licencia](#-licencia)

---

## ✨ Funcionalidades

**Para deportistas**
- 📋 Rutinas personalizadas de gimnasio, yoga y pilates con niveles de dificultad
- 🏃 Entrenamiento en tiempo real — contador de series/reps, temporizador de descanso, feedback háptico
- 🤖 Entrenador IA con **Llama 3.3 70B** (Groq) — contextual, motivador, en español
- 📊 Panel de progreso — gráfica semanal, historial de sesiones, estadísticas personales
- 🔔 Notificaciones push para recordatorios de entrenamiento y mensajes del entrenador

**Para entrenadores**
- 👥 Gestión completa de clientes — perfiles, estadísticas, notas personalizadas
- 📝 Creación y asignación de rutinas por cliente
- 💬 Mensajería directa con cada deportista
- 🏆 Seguimiento del progreso con alertas de inactividad

**General**
- 🔐 Autenticación JWT segura con Supabase — sin necesidad de volver a iniciar sesión
- 🌙 Interfaz oscura (`#0A0A0A` fondo, acento morado `#6C63FF`)
- 🇪🇸 Interfaz completamente en español

---

## 🛠 Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Móvil | React Native + Expo | RN 0.81 / SDK 54 |
| Lenguaje | TypeScript | 5.9 |
| Estado global | Zustand | 5.0 |
| Formularios | React Hook Form | 7.x |
| Navegación | React Navigation | 7.x |
| Autenticación | Supabase Auth | 2.x |
| Cliente HTTP | Axios | 1.x |
| Backend | Spring Boot | 3.2.3 |
| Lenguaje | Java | 17 |
| Seguridad | JJWT (validación JWT de Supabase) | 0.12.5 |
| ORM | Spring Data JPA + Hibernate | — |
| Base de datos | Supabase (PostgreSQL 15) | — |
| IA | Groq — Llama 3.3 70B Versatile (Meta) | — |
| Docs API | Springdoc OpenAPI / Swagger UI | 2.3.0 |

---

## 🏗 Arquitectura

```
┌──────────────────────────────────────────────────────┐
│                   Expo (React Native)                │
│  Auth mediante Supabase SDK ────────────────────────►│
│  Llamadas API mediante Axios + token JWT Bearer      │
└────────────────────────┬─────────────────────────────┘
                         │ HTTP + JWT
                         ▼
┌──────────────────────────────────────────────────────┐
│              Spring Boot API  :8080                  │
│                                                      │
│  POST  /api/auth/sync          Registro de usuario   │
│  GET   /api/users/me           Perfil                │
│  CRUD  /api/routines           Biblioteca de rutinas │
│  GET   /api/exercises          Ejercicios por rutina │
│  POST  /api/sessions           Sesiones de entreno   │
│  GET   /api/sessions/stats     Estadísticas          │
│  POST  /api/ai/chat            Entrenador IA         │
│  GET   /api/trainer/clients    Gestión de clientes   │
│  POST  /api/trainer/messages   Mensajería            │
└──────┬──────────────────────────┬────────────────────┘
       │ JDBC                     │ HTTPS
       ▼                          ▼
┌─────────────┐        ┌─────────────────────────────┐
│  Supabase   │        │  Groq API                   │
│  PostgreSQL │        │  llama-3.3-70b-versatile    │
│  (8 tablas) │        │  api.groq.com               │
└─────────────┘        └─────────────────────────────┘
```

---

## 📁 Estructura del proyecto

```
MovoApp/
├── movo-app/                    # Frontend React Native / Expo
│   ├── src/
│   │   ├── components/ui/       # Componentes reutilizables
│   │   ├── navigation/          # Configuración de React Navigation
│   │   ├── screens/
│   │   │   ├── auth/            # Login, Registro, Splash
│   │   │   ├── user/            # Home, Rutinas, Coach IA, Progreso, Perfil
│   │   │   ├── trainer/         # Panel entrenador, clientes, mensajes
│   │   │   └── shared/          # Entreno activo, Detalle de rutina
│   │   ├── services/            # Cliente Supabase, API, notificaciones
│   │   ├── store/               # Stores Zustand (auth, rutinas, IA)
│   │   ├── types/               # Interfaces TypeScript
│   │   └── utils/               # Constantes y helpers
│   └── package.json
│
├── movo-backend/                # API REST Spring Boot 3
│   └── src/main/java/com/movo/
│       ├── config/              # Configuración de seguridad
│       ├── controller/          # Controladores REST
│       ├── model/               # Entidades JPA
│       ├── repository/          # Repositorios Spring Data
│       ├── security/            # Filtro JWT
│       └── service/             # Lógica de negocio + IA Groq
│
└── supabase-schema.sql          # Esquema completo, políticas RLS y datos iniciales
```

---

## 🚀 Primeros pasos

### Requisitos previos

| Herramienta | Versión |
|---|---|
| Node.js | 18+ |
| Java JDK | 17+ |
| Maven | 3.8+ |
| Expo Go | Última (iOS/Android) |
| Cuenta en Supabase | — |
| Clave API de Groq | [console.groq.com](https://console.groq.com) (capa gratuita disponible) |

---

### 1️⃣ Supabase

1. Crea un nuevo proyecto en [supabase.com](https://supabase.com)
2. Abre el **Editor SQL** y ejecuta el contenido completo de `supabase-schema.sql`
   - Crea **8 tablas** con Row Level Security, 9 rutinas de ejemplo, 66 ejercicios de ejemplo e índices de rendimiento
3. Recoge las credenciales desde **Configuración del proyecto → API**:

   | Valor | Variable |
   |---|---|
   | URL del proyecto | `EXPO_PUBLIC_SUPABASE_URL`, `SUPABASE_URL` |
   | Clave pública `anon` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
   | JWT Secret (Configuración → API → JWT) | `SUPABASE_JWT_SECRET` |

4. Obtén la **cadena de conexión JDBC** desde Configuración → Base de datos → Cadena de conexión → JDBC
   - Configura `SUPABASE_DB_URL`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`
5. Activa **Email Auth** en Autenticación → Proveedores

---

### 2️⃣ Backend (Spring Boot)

```bash
cd movo-backend

# Copia la plantilla de entorno y rellena tus valores
copy .env.example .env

# Arranca el servidor
mvn spring-boot:run
```

> 💡 En **IntelliJ**, añade las variables de entorno en Ejecutar → Editar configuraciones → Variables de entorno para evitar usar el archivo `.env`.

Una vez en marcha:
- **API REST** → `http://localhost:8080/api`
- **Swagger UI** → `http://localhost:8080/swagger-ui.html`

---

### 3️⃣ Frontend (Expo)

```bash
cd movo-app

# Copia la plantilla de entorno y rellena tus valores
copy .env.example .env

npm install
npx expo start
```

Escanea el código QR con **Expo Go** (Android) o la app de Cámara (iOS).

> ⚠️ En dispositivos físicos, usa la IP Wi-Fi de tu máquina en lugar de `localhost`. Ejecuta `ipconfig` para encontrarla — p.ej. `http://192.168.1.50:8080/api`.

---

## 🔑 Variables de entorno

### Backend — `movo-backend/.env`

| Variable | Descripción | Dónde obtenerla |
|---|---|---|
| `SUPABASE_DB_URL` | Cadena de conexión JDBC | Supabase → Configuración → Base de datos |
| `SUPABASE_DB_USER` | Usuario de la BD (normalmente `postgres`) | Supabase → Configuración → Base de datos |
| `SUPABASE_DB_PASSWORD` | Contraseña de la BD | Supabase → Configuración → Base de datos |
| `SUPABASE_URL` | URL del proyecto | Supabase → Configuración → API |
| `SUPABASE_JWT_SECRET` | Secreto de firma JWT | Supabase → Configuración → API → JWT |
| `GROQ_API_KEY` | Clave API de Groq (`gsk_…`) | [console.groq.com](https://console.groq.com) |
| `JWT_SECRET` | Cadena aleatoria de 32+ caracteres | Genérala tú mismo |

### Frontend — `movo-app/.env`

| Variable | Ejemplo |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` |
| `EXPO_PUBLIC_API_BASE_URL` | `http://192.168.1.50:8080/api` |

---

## 📡 Referencia de la API

Documentación interactiva completa en **`http://localhost:8080/swagger-ui.html`** con el backend en marcha.

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/auth/sync` | Sincronizar usuario de Supabase en la BD del backend | ✅ |
| `GET` | `/api/users/me` | Obtener perfil del usuario actual | ✅ |
| `PUT` | `/api/users/me` | Actualizar perfil | ✅ |
| `GET` | `/api/routines` | Listar rutinas (filtrar por categoría/dificultad) | ✅ |
| `POST` | `/api/routines` | Crear rutina | ✅ |
| `GET` | `/api/exercises` | Obtener ejercicios por rutina | ✅ |
| `POST` | `/api/sessions` | Iniciar sesión de entrenamiento | ✅ |
| `PUT` | `/api/sessions/{id}/complete` | Completar sesión | ✅ |
| `GET` | `/api/sessions/stats` | Estadísticas de entrenamiento | ✅ |
| `POST` | `/api/ai/chat` | Chat con el entrenador IA | ✅ |
| `GET` | `/api/trainer/clients` | Lista de clientes del entrenador | ✅ Entrenador |
| `GET` | `/api/trainer/clients/{id}` | Perfil y estadísticas de un cliente | ✅ Entrenador |
| `POST` | `/api/trainer/messages` | Enviar mensaje a un cliente | ✅ Entrenador |

---

## 📱 Pantallas

### 👤 Deportista

| Pantalla | Descripción |
|---|---|
| Splash | Logo animado al arrancar |
| Inicio de sesión | Email/contraseña mediante Supabase Auth |
| Registro | Asistente de 4 pasos: rol → datos personales → objetivos → preferencias |
| Inicio | Panel: rutina del día, estadísticas semanales, accesos directos por categoría |
| Rutinas | Biblioteca filtrable por gimnasio / yoga / pilates y dificultad |
| Detalle de rutina | Lista de ejercicios con series, reps y descripciones |
| Entreno activo | Contador en vivo de series/reps, temporizador de descanso, feedback háptico |
| Coach IA | Chat conversacional — contextual, motivador, en español |
| Progreso | Gráfica semanal, número de sesiones, tiempo total, récords personales |
| Perfil | Foto, objetivos, medidas corporales, notas del entrenador |
| Ajustes | Notificaciones, preferencias, cuenta |

### 🏋️ Entrenador

| Pantalla | Descripción |
|---|---|
| Panel principal | Vista general de todos los clientes y su actividad |
| Clientes | Lista de clientes con búsqueda y ordenación |
| Detalle de cliente | Perfil completo, historial de sesiones, notas editables |
| Rutinas | Crear, editar y asignar rutinas |
| Mensajes | Chat en tiempo real con cada cliente |
| Perfil | Biografía, especialidades y certificaciones del entrenador |

---

## 🔐 Flujo de autenticación

```
Usuario ──► Supabase Auth (email/contraseña)
                  │
                  ▼
           JWT de Supabase (ES256, firmado con el JWT secret del proyecto)
                  │
                  ├──► El frontend guarda el token (AsyncStorage)
                  │
                  └──► POST /api/auth/sync  (el backend recibe el JWT)
                                │
                                ▼
                         JwtAuthFilter valida el JWT
                         con el mismo JWT secret de Supabase
                                │
                                ▼
                         SecurityContextHolder poblado
                         Todos los endpoints protegidos accesibles
```

---

## 🗄 Base de datos

La base de datos en Supabase contiene **8 tablas**:

| Tabla | Descripción |
|---|---|
| `users` | Cuentas de usuario + rol (`user` / `trainer`) |
| `user_profiles` | Medidas corporales, objetivos y preferencias |
| `routines` | Rutinas con categoría, dificultad y duración |
| `exercises` | Ejercicios vinculados a rutinas (series, reps, descripciones) |
| `workout_sessions` | Registro de sesiones con duración y estado de completado |
| `session_exercises` | Seguimiento del completado de cada ejercicio dentro de una sesión |
| `trainer_clients` | Asignaciones entrenador ↔ cliente |
| `messages` | Mensajes de chat entre entrenadores y clientes |

Todas las tablas tienen **Row Level Security (RLS)** activado. El backend se conecta directamente mediante JDBC con credenciales de nivel de servicio.

---

## 🤖 Entrenador IA

El coach virtual está impulsado por el modelo **Llama 3.3 70B Versatile de Meta** servido a través de la plataforma de inferencia **Groq**.

- **Frontend**: llamadas directas a `https://api.groq.com/openai/v1/chat/completions` desde `aiStore.ts`
- **Backend**: `GroqAIService.java` construye prompts de sistema contextuales usando el perfil del usuario, sesiones recientes y detección de inactividad
- **Prompt del sistema** incluye: nombre del usuario, rol, info del último entrenamiento y alertas de inactividad (> 3 días)
- **Historial de conversación**: se mantienen los últimos 20 mensajes en memoria por sesión

---

## 📝 Notas de desarrollo

- `ddl-auto: validate` — Hibernate valida el esquema contra la BD al arrancar. Ejecuta siempre `supabase-schema.sql` antes de iniciar el backend por primera vez.
- El RLS está activo en todas las tablas; el backend lo omite mediante credenciales JDBC directas.
- `GroqAIService` mantiene el historial de conversación en memoria por `conversationId`. Para producción, sustitúyelo por una entidad `AIConversation` respaldada por BD.
- Toda la interfaz usa el fondo oscuro `#0A0A0A` con acento morado `#6C63FF` — definidos en `constants.ts`.

---

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT**.

---

<div align="center">

Hecho con ❤️ por Ernesto Martínez Magraner

</div>
