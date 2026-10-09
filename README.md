# E-Commerce Store

A full-stack ecommerce application with a Node.js/Express backend and a React + Vite frontend.

## Tech Stack

- Backend: Node.js, Express 5, MongoDB with Mongoose
- Frontend: React 19, Vite, React Router, TanStack Query
- Auth: JWT
- Payments: Razorpay
- Media: Cloudinary

## Local Setup

### 1. Backend

1. Open the backend folder:
   - `cd backend`
2. Copy the example environment file:
   - `copy .env.example .env`
3. Fill in your values for MongoDB, JWT, Cloudinary, email, and Razorpay.
4. Start the API:
   - `npm install`
   - `npm run dev`

### 2. Frontend

1. Open the frontend folder:
   - `cd frontend`
2. Copy the example environment file:
   - `copy .env.example .env`
3. Update `VITE_API_URL` to match your backend URL.
4. Start the app:
   - `npm install`
   - `npm run dev`

## Environment Variables

### Backend

- `PORT` — API port, default `8000`
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — signing secret for JWT tokens
- `JWT_EXPIRES_IN` — JWT lifetime, such as `7d`
- `FRONTEND_URL` — allowed frontend origin for CORS, comma-separated if needed
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret
- `RAZORPAY_KEY_ID` — Razorpay key ID
- `RAZORPAY_KEY_SECRET` — Razorpay key secret
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` — email settings

### Frontend

- `VITE_API_URL` — backend API base URL, e.g. `http://localhost:8000/api`

## Production Notes

- Keep private secrets in a real environment secret manager or deployment environment variables.
- Do not commit `.env` files to source control.
- Ensure your deployed frontend origin is included in `FRONTEND_URL` when using CORS.

## Common Commands

- Backend tests: `cd backend && npm test`
- Frontend build: `cd frontend && npm run build`
