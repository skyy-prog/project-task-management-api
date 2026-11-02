# Project & Task Management API

A RESTful API where users can register, log in, manage projects and tasks, filter and paginate tasks, and view dashboard statistics.

## Overview

| Concern | Technology |
| --- | --- |
| Runtime / framework | Node.js (18+), Express 5 |
| Users and projects | MySQL (`mysql2`, parameterised queries, connection pool) |
| Tasks | MongoDB (Mongoose) |
| Authentication | JWT (`jsonwebtoken`), passwords hashed with `bcrypt` |
| Validation | Joi |
| Security | helmet, CORS, rate limiting, body size limit |

### Why two databases

Users and projects are relational data with strict integrity rules (unique email, a project always belongs to a user), so they live in MySQL with a foreign key and `ON DELETE CASCADE`. Tasks are document-style records that are filtered and aggregated frequently, so they live in MongoDB. A task stores `projectId` and `userId` as plain numbers that reference MySQL rows. Because a database cannot enforce a foreign key across engines, the service layer enforces it: a task can only be created in, or moved to, a project owned by the authenticated user, and deleting a project also deletes its tasks.

## Project structure

```
.
├── database/
│   └── schema.sql                MySQL tables
├── postman/
│   └── project-task-api.postman_collection.json
├── scripts/
│   └── setup-db.js               Creates the MySQL database and tables
├── src/
│   ├── config/                   env validation, MySQL pool, MongoDB connection
│   ├── constants/                statuses, priorities, pagination limits
│   ├── controllers/              HTTP layer: read request, call service, send response
│   ├── middleware/               auth, validation, rate limit, 404, centralized error handler
│   ├── models/                   MySQL data access (users, projects) and the Mongoose Task model
│   ├── routes/                   route definitions
│   ├── services/                 business logic and cross-database rules
│   ├── utils/                    ApiError, response helper, pagination, token helpers
│   ├── validators/               Joi schemas
│   ├── app.js                    Express app
│   └── server.js                 entry point, DB connections, graceful shutdown
├── .env.example
└── package.json
```

Request flow: `route -> rate limit -> authenticate -> validate -> controller -> service -> model -> database`. Errors thrown anywhere reach the centralized error middleware.

## Installation and setup

### 1. Prerequisites

- Node.js 18 or newer
- MySQL 8 (or MariaDB 10.5+)
- MongoDB 6 or newer (local, Docker, or MongoDB Atlas)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your real values. The app validates the environment on startup and exits with a clear message if something is missing.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | `development`, `production` or `test` |
| `PORT` | no | `5000` | HTTP port |
| `MYSQL_HOST` | yes | | MySQL host |
| `MYSQL_PORT` | no | `3306` | MySQL port |
| `MYSQL_USER` | yes | | MySQL user |
| `MYSQL_PASSWORD` | no | empty | MySQL password |
| `MYSQL_DATABASE` | yes | | MySQL database name |
| `MONGO_URI` | yes | | MongoDB connection string |
| `JWT_SECRET` | yes | | Secret for signing tokens, at least 32 characters |
| `JWT_EXPIRES_IN` | no | `1d` | Token lifetime, for example `1h` or `7d` |
| `BCRYPT_SALT_ROUNDS` | no | `12` | bcrypt cost factor (10 to 15) |
| `CORS_ORIGIN` | no | `*` | Comma-separated list of allowed origins |
| `RATE_LIMIT_WINDOW_MS` | no | `900000` | Rate limit window |
| `RATE_LIMIT_MAX` | no | `300` | Max requests per window per IP on `/api` |
| `AUTH_RATE_LIMIT_MAX` | no | `30` | Max login/register requests per window per IP |

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. MySQL setup

Option A, automatic (uses the credentials from `.env`):

```bash
npm run db:setup
```

Option B, manual:

```bash
mysql -u root -p -e "CREATE DATABASE project_task_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root -p project_task_db < database/schema.sql
```

Schema summary:

- `users`: `id`, `name`, `email` (unique), `password_hash`, timestamps
- `projects`: `id`, `user_id` (FK to `users`, `ON DELETE CASCADE`), `name`, `description`, `status` (`active`, `completed`, `archived`), timestamps. Indexed on `(user_id, status)` and `(user_id, created_at)`.

### 5. MongoDB setup

No manual schema is needed. Mongoose creates the `tasks` collection and its indexes on first start (index auto-creation is disabled when `NODE_ENV=production`).

Local MongoDB: `MONGO_URI=mongodb://localhost:27017/project_task_db`

Docker:

```bash
docker run -d --name mongo -p 27017:27017 mongo:7
```

Atlas: use the connection string from the Atlas dashboard, for example `mongodb+srv://<user>:<password>@<cluster>/project_task_db`.

Task documents:

| Field | Type | Notes |
| --- | --- | --- |
| `title` | String | required, max 200 |
| `description` | String | max 2000, default empty |
| `status` | String | `todo` (default), `in_progress`, `completed` |
| `priority` | String | `low`, `medium` (default), `high` |
| `projectId` | Number | MySQL `projects.id`, required |
| `userId` | Number | MySQL `users.id` of the owner, set by the server |
| `dueDate` | Date | optional |
| `createdAt`, `updatedAt` | Date | automatic |

Indexes: `{ userId, createdAt }` and `{ userId, projectId, status, priority }`.

### 6. Run

```bash
npm run dev
npm start
```

Health check: `GET /health`

## Response format

Success:

```json
{
  "success": true,
  "message": "Projects fetched successfully",
  "data": {},
  "pagination": {}
}
```

`pagination` appears only on list endpoints.

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "email must be a valid email" }
  ]
}
```

`errors` appears only when there are field-level details.

### Status codes

| Code | Meaning |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 400 | Validation failed, invalid id, malformed JSON |
| 401 | Missing, invalid or expired token, wrong credentials |
| 404 | Resource does not exist, or belongs to another user |
| 409 | Duplicate email |
| 413 | Request body too large |
| 429 | Rate limit exceeded |
| 500 | Unexpected server or database error (details are never leaked) |

A resource owned by another user returns `404`, not `403`, so the API does not reveal whether someone else's record exists.

## API reference

All endpoints except register, login and `/health` require the header:

```
Authorization: Bearer <token>
```

### Authentication

#### POST /api/auth/register

Password rules: 8 to 72 characters with at least one letter and one number. Email is trimmed and lowercased.

```json
{
  "name": "Aakash Prajapati",
  "email": "aakash@example.com",
  "password": "Secret123"
}
```

`201 Created`

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Aakash Prajapati",
      "email": "aakash@example.com",
      "createdAt": "2026-11-02T12:00:00.000Z",
      "updatedAt": "2026-11-02T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

`409 Conflict` when the email already exists:

```json
{ "success": false, "message": "Email is already registered" }
```

#### POST /api/auth/login

```json
{ "email": "aakash@example.com", "password": "Secret123" }
```

`200 OK` returns the same shape as register. Wrong email or password returns `401` with the same message for both cases.

#### GET /api/auth/me

`200 OK`

```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "Aakash Prajapati",
      "email": "aakash@example.com",
      "createdAt": "2026-11-02T12:00:00.000Z",
      "updatedAt": "2026-11-02T12:00:00.000Z"
    }
  }
}
```

#### PUT /api/auth/profile

Send any of `name`, `email`, `password`. Changing the password also requires `currentPassword`. Only the authenticated user's own profile can be updated.

```json
{
  "name": "Aakash P.",
  "currentPassword": "Secret123",
  "password": "NewSecret456"
}
```

`200 OK` returns the updated `user`. A wrong `currentPassword` returns `400`, and an email taken by another user returns `409`.

### Projects

Statuses: `active` (default), `completed`, `archived`.

#### POST /api/projects

```json
{
  "name": "Website Redesign",
  "description": "Redesign the marketing website",
  "status": "active"
}
```

`201 Created`

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": 1,
      "userId": 1,
      "name": "Website Redesign",
      "description": "Redesign the marketing website",
      "status": "active",
      "createdAt": "2026-11-02T12:05:00.000Z",
      "updatedAt": "2026-11-02T12:05:00.000Z"
    }
  }
}
```

#### GET /api/projects

Query parameters: `page` (default 1), `limit` (default 10, max 100), `status`, `search` (matches name or description).

```
GET /api/projects?page=1&limit=10&status=active&search=website
```

`200 OK`

```json
{
  "success": true,
  "message": "Projects fetched successfully",
  "data": { "projects": [ { "id": 1, "userId": 1, "name": "Website Redesign", "description": "Redesign the marketing website", "status": "active", "createdAt": "...", "updatedAt": "..." } ] },
  "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false }
}
```

#### GET /api/projects/:id

Returns `{ "project": { ... } }`. Returns `404` if the project does not exist or is not yours, and `400` if `:id` is not a positive integer.

#### PUT /api/projects/:id

Accepts any subset of `name`, `description`, `status` (at least one).

```json
{ "status": "completed" }
```

#### DELETE /api/projects/:id

Deletes the project and all of its tasks.

```json
{
  "success": true,
  "message": "Project deleted successfully",
  "data": { "deletedTasks": 4 }
}
```

### Tasks

Statuses: `todo` (default), `in_progress`, `completed`. Priorities: `low`, `medium` (default), `high`.

#### POST /api/tasks

`projectId` must belong to the authenticated user, otherwise `404 Project not found`.

```json
{
  "title": "Design landing page",
  "description": "Hero section and pricing table",
  "status": "todo",
  "priority": "high",
  "projectId": 1,
  "dueDate": "2026-12-31T00:00:00.000Z"
}
```

`201 Created`

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "title": "Design landing page",
      "description": "Hero section and pricing table",
      "status": "todo",
      "priority": "high",
      "projectId": 1,
      "userId": 1,
      "dueDate": "2026-12-31T00:00:00.000Z",
      "createdAt": "2026-11-02T12:10:00.000Z",
      "updatedAt": "2026-11-02T12:10:00.000Z",
      "id": "6720a1f2c3d4e5f607182930"
    }
  }
}
```

#### GET /api/tasks

Filtering and pagination. Every filter is optional and scoped to the authenticated user.

| Parameter | Description |
| --- | --- |
| `page` | page number, default 1 |
| `limit` | page size, default 10, max 100 |
| `status` | `todo`, `in_progress`, `completed` |
| `priority` | `low`, `medium`, `high` |
| `projectId` | project id |

```
GET /api/tasks?page=1&limit=10&status=todo&priority=high&projectId=1
```

`200 OK`

```json
{
  "success": true,
  "message": "Tasks fetched successfully",
  "data": {
    "tasks": [
      {
        "title": "Design landing page",
        "description": "Hero section and pricing table",
        "status": "todo",
        "priority": "high",
        "projectId": 1,
        "userId": 1,
        "dueDate": "2026-12-31T00:00:00.000Z",
        "createdAt": "2026-11-02T12:10:00.000Z",
        "updatedAt": "2026-11-02T12:10:00.000Z",
        "id": "6720a1f2c3d4e5f607182930"
      }
    ]
  },
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

Tasks are sorted newest first.

#### GET /api/tasks/:id

Returns `{ "task": { ... } }`. A malformed id returns `400`, and a well-formed id that does not exist (or is not yours) returns `404`.

#### PUT /api/tasks/:id

Accepts any subset of `title`, `description`, `status`, `priority`, `projectId`, `dueDate` (at least one). Moving a task to another project requires owning that project.

```json
{ "status": "in_progress", "priority": "medium" }
```

#### DELETE /api/tasks/:id

```json
{ "success": true, "message": "Task deleted successfully", "data": null }
```

### Dashboard

#### GET /api/dashboard

Project counts come from MySQL and task counts from a MongoDB aggregation, fetched in parallel.

```json
{
  "success": true,
  "message": "Dashboard statistics fetched successfully",
  "data": {
    "totalProjects": 3,
    "activeProjects": 2,
    "completedProjects": 1,
    "totalTasks": 12,
    "pendingTasks": 8,
    "completedTasks": 4,
    "highPriorityTasks": 5
  }
}
```

Definitions: `pendingTasks` are tasks that are `todo` or `in_progress`. `highPriorityTasks` counts every task with priority `high`, regardless of status.

## Testing

Import `postman/project-task-api.postman_collection.json` into Postman or Thunder Client, make sure the server is running, and run the collection in order. It stores the token, project id and task id automatically and covers:

- register, duplicate email, invalid input, login, wrong password, `me`, profile update, password change
- project CRUD, invalid and non-existent ids
- task CRUD, project ownership check, invalid priority, invalid and non-existent ids
- pagination and filtering
- dashboard
- unauthorized access without a token

The `baseUrl` collection variable defaults to `http://localhost:5000`.

Quick check with curl:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Secret123"}'
```

## Design decisions

- **Layered architecture.** Controllers only translate HTTP to service calls, services hold business rules, models are the only code that touches a database.
- **Ownership is part of every query.** Projects and tasks are always looked up by id and owner together, so one user can never read or modify another user's data.
- **Mass-assignment protection.** Validation strips unknown fields, and `userId` is always taken from the token, never from the request body.
- **Account safety.** Passwords are hashed with bcrypt, login compares against a dummy hash for unknown emails to reduce timing differences, and the password hash is never returned. Auth endpoints have a stricter rate limit.
- **Duplicate emails** are checked up front and also caught from the database unique-key error, so concurrent registrations still return `409`.
- **Project deletion** removes the project first and then its tasks. If the task cleanup failed after the project was removed, orphaned tasks would remain; this was chosen over deleting tasks first, which could destroy tasks of a project that still exists.
- **Errors.** A single error middleware maps validation, JWT, Mongoose, MySQL and body-parser errors to consistent responses. Internal details are never sent to the client, and stack traces appear only in development.
- **Tokens** are stateless JWTs. Logout is handled client-side by discarding the token, and an existing token is rejected if its user no longer exists.

## Submission notes

`node_modules` and `.env` are excluded through `.gitignore`. Only `.env.example` with placeholder values is committed.
