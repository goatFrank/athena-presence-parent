# 🦉 Athena Presence

**Athena Presence** is an enterprise-grade attendance and presence management application. Designed with a robust microservices architecture, it seamlessly integrates a modern frontend with scalable backend services, ensuring high performance, security, and maintainability.

![Architecture: Microservices](https://img.shields.io/badge/Architecture-Microservices-blue.svg)
![Frontend: React + Vite](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB.svg)
![Backend: Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot-6DB33F.svg)
![Database: Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E.svg)
![Deployment: Docker](https://img.shields.io/badge/Deployment-Docker-2496ED.svg)

---

## 🏗 System Architecture

The application is distributed across decoupled microservices running inside a containerized environment (Docker):

1. **Frontend (`/frontend`)**: 
   - A lightning-fast **React / Vite** Single Page Application (SPA).
   - In **production**, it's served via an **Nginx** reverse proxy that simultaneously serves the static assets and routes API calls dynamically, preventing CORS issues.
   - In **development**, the Vite Dev Server acts as the proxy.

2. **Attendance Service (`/attendance-service`)**: 
   - A backend service built with **Spring Boot** (Java), running on port `8081`. 
   - Handles the core business logic related to attendance, organization departments, and employee presence tracking.

3. **Auth Service (`/auth-service`)**: 
   - A Spring Boot service running on port `8082`, responsible for authentication, user synchronization, or proxy logic extending the Identity layer.

4. **Redis Cache**: 
   - Used for fast, ephemeral data caching and session management between the microservices.

5. **Supabase (Database & Auth layer)**:
   - External PaaS integrating a PostgreSQL database, user management/authentication (JWT), and real-time subscriptions.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js (for optional local frontend development)
- Java 21+ & Maven (for optional local backend development)

### Environment Configuration

The repository uses a unified `.env` strategy to simplify configuration. Make sure you set up the environment variables:

1. **Frontend Environment**:  
   Ensure your variables are present in `frontend/.env`. This file is responsible for mapping public Supabase keys and dynamic backend API routing.

   ```env
   # ./frontend/.env
   VITE_SUPABASE_URL=YOUR_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   VITE_ATTENDANCE_API_URL=/api/attendance
   ```

2. **Root Environment**:  
   Create a root `.env` (passed natively to docker-compose) for your core backend secrets (Database URLs, Redis passwords, etc.).

### Running with Docker (Recommended)

To spin up the entire microservices ecosystem for production testing or isolated local use, run:

```bash
docker-compose up --build -d
```

**Services Exposed:**
- **Frontend / API Gateway (Nginx)**: `http://localhost:5173`
- **Attendance API (Direct)**: `http://localhost:8081`
- **Auth API (Direct)**: `http://localhost:8082`

All traffic mapped from the frontend to `http://localhost:5173/api/attendance/...` will be seamlessly proxied to the internal `attendance-service` without requiring complex cross-origin policies.

---

## 🛠 Local Development

If you prefer to run services natively on your host machine for debugging:

**1. Start Redis:**
```bash
docker run --name athena-redis -p 6379:6379 -d redis:alpine --requirepass "yourpassword"
```

**2. Start Backend Services (Java/Maven):**
```bash
# In another terminal window
cd attendance-service
./mvnw spring-boot:run
```

**3. Start Frontend Dev Server:**
```bash
cd frontend
npm install
npm run dev
```
Vite will automatically proxy requests headed to `/api/attendance` towards your local backend running on `8081`.

---

## 🔒 Nginx Reverse Proxy Implementation

Our deployment utilizes a custom **Nginx Configuration** to implement the API Gateway pattern. 

**Why?**
- Eliminates CORS preflights and restrictions.
- Hides internal service architecture mapping.
- Improves security by keeping the backend inside the Docker network.

In `frontend/nginx.conf`:
- `location /` serves the React static bundle compiled by Vite.
- `location /api/attendance/` is reverse-proxied to internal `http://attendance-service:8081/`. 

---

## 👨‍💻 Tech Stack Summary

- **UI**: React 18, Vite, Tailwind CSS, Framer Motion
- **API Client**: Axios (configured with relative paths `baseURL: import.meta.env.VITE_ATTENDANCE_API_URL`)
- **Backend Layers**: Java, Spring Boot web servers.
- **Data & Auth**: PostgreSQL via Supabase, Redis via Docker.
- **Containerization**: Docker Compose, Multi-stage Dockerfiles.
