# API Documentation for URL Shortener Backend

## Introduction

This API provides a URL shortening service with integrated Google authentication, analytics, and rate-limiting features. It is built using Node.js, Express, Prisma (PostgreSQL), Redis, and MongoDB for session management.

## Base URL

`http://<your-hostname>`

---

## Middleware

### Rate Limiting

Limits each client to 100 requests per 3-minute window. If the limit is exceeded, a `429 Too Many Requests` response is sent.

### Session Management

Sessions are stored in MongoDB using `connect-mongo`. The session secret is a environmental variable `SESSION_SECRET`.

### Authentication

Google OAuth 2.0 is used for authentication. The authenticated user session is managed via Passport.js.

---

## Authentication Routes

### 1. `GET /auth/google`

Initiates Google OAuth authentication.

**Response:** Redirects to Google for authentication.

---

### 2. `GET /auth/google/callback`

Handles the callback from Google after authentication.

**Query Parameters:**

- None

**Response:**

- `200 OK` if successful.
- Redirects to `/auth/status` on success or failure.

---

### 3. `GET /auth/status`

Checks the authentication status of the user.

**Middleware:**

- Rate limiting

**Response:**

- `200 OK` if the user is authenticated.
- `401 Unauthorized` if the user is not authenticated.

---

## API Routes

### 1. `POST /api/shorten`

Shortens a given URL.

**Request Body:**

```json
{
  "longUrl": "https://example.com",
  "customAlias": "optionalAlias",
  "topic": "optionalTopic"
}
```

**Response:**

- `201 Created`: Short URL and metadata.

```json
{
  "shortUrl": "http://<hostname>/api/shorten/<shortUrl>",
  "alias": "customAlias",
  "createdAt": "<timestamp>"
}
```

- `400 Bad Request`: Invalid request body.
- `401 Unauthorized`: User not authenticated.
- `409 Conflict`: Alias or short URL already exists.

---

### 2. `GET /api/shorten/:alias`

Redirects to the original long URL associated with the alias.

**Path Parameters:**

- `alias`: The custom alias or short URL.

**Response:**

- Redirects to the long URL if found.
- `404 Not Found`: If the alias does not exist.
- `500 Internal Server Error`: On server error.

---

### 3. `GET /api/analytics/:alias`

Provides analytics for a specific short URL.

**Path Parameters:**

- `alias`: The custom alias.

**Response:**

- `200 OK`: Analytics data.

```json
{
  "totalClicks": 123,
  "OsData": [
    { "os": "Windows", "uniqueUsers": 10, "requests": 50 },
    { "os": "MacOS", "uniqueUsers": 5, "requests": 30 }
  ],
  "DeviceData": [
    { "device": "desktop", "uniqueUsers": 12, "requests": 60 },
    { "device": "mobile", "uniqueUsers": 3, "requests": 20 }
  ],
  "DateSortedData": [
    { "date": "2025-01-01", "requests": 10 },
    { "date": "2025-01-02", "requests": 15 }
  ]
}
```

- `401 Unauthorized`: User not authenticated.
- `404 Not Found`: No data found.
- `500 Internal Server Error`: On server error.

---

### 4. `GET /api/analytics/topic/:topic`

Provides analytics for all URLs under a specific topic.

**Path Parameters:**

- `topic`: The topic name.

**Response:**

- `200 OK`: Analytics data.
- `401 Unauthorized`: User not authenticated.
- `404 Not Found`: No data found.
- `500 Internal Server Error`: On server error.

---

### 5. `GET /api/analytics/overall`

Provides overall analytics for all URLs created by the authenticated user.

**Response:**

- `200 OK`: Overall analytics data.
- `401 Unauthorized`: User not authenticated.
- `500 Internal Server Error`: On server error.

---

## Error Codes

- `400 Bad Request`: Invalid input or malformed request.
- `401 Unauthorized`: User not authenticated.
- `404 Not Found`: Resource not found.
- `409 Conflict`: Resource conflict.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Server error.

## Notes

### Environment Variables

- **Environment Variables:**
  - `HOSTNAME`: Base URL for short URLs.
  - `DATABASE_URL` : PostgreSQL database connection URL.
  - `GOOGLE_CLIENT_ID` : OAuth 2.0 Client ID for Google Sign-In.
  - `GOOGLE_CLIENT_SECRET` : OAuth 2.0 Client Secret for Google Sign-In.
  - `MONGO_URL`:MongoDB connection URL for data storage.
  - `REDIS_CLIENT_URL` : Redis connection URL for caching and session management.
  - `SESSION_SECRET`: Secret key for encrypting session data.
- **Libraries Used:**
  - Express, Passport.js, Prisma, Redis, and others.

---

## Security

- All sensitive data is securely stored.
- Rate limiting is applied to prevent abuse.
- User authentication and session management are enforced.
