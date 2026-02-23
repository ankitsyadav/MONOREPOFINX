# WhatsApp Campaign Manager SaaS

A multi-tenant B2B WhatsApp Campaign Manager built with Node.js, Express, Prisma, Supabase PostgreSQL, React (Vite), and Material UI.

## Project Structure

```
FINXMONOREPO/
├── backend/               # Node.js + Express API
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── config/        # Prisma client
│       ├── middleware/    # Auth, Error, Validation
│       ├── modules/       # Feature modules
│       │   ├── auth/
│       │   ├── credential/
│       │   ├── campaign/
│       │   ├── webhook/
│       │   └── dashboard/
│       ├── utils/         # asyncHandler, crypto
│       ├── app.js
│       └── server.js
├── frontend/              # React + Vite + MUI
│   └── src/
│       ├── api/           # Axios API calls
│       ├── context/       # Auth & Snackbar context
│       ├── components/    # Shared components
│       ├── layouts/       # MainLayout (Drawer + AppBar)
│       ├── pages/         # Login, Signup, Dashboard, Campaigns, CampaignDetail, Settings
│       └── utils/         # formatters
└── .github/
    └── workflows/
        └── ci.yml
```

---

## Prerequisites

- Node.js >= 18
- A [Supabase](https://supabase.com) project (or any PostgreSQL database)
- Meta WhatsApp Business API credentials (WABA ID, Phone Number ID, Access Token)

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
ENCRYPTION_SECRET=64_hex_chars_for_aes256  # generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
WEBHOOK_VERIFY_TOKEN=any_random_string
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Generate `ENCRYPTION_SECRET` (must be 64 hex chars = 32 bytes):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Install dependencies and set up database:

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Install dependencies:

```bash
npm install
```

---

## Running Locally

### Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Server runs at `http://localhost:5000`

### Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

App runs at `http://localhost:5173`

---

## API Endpoints

### Auth
| Method | Path           | Auth | Description       |
|--------|----------------|------|-------------------|
| POST   | /auth/signup   | No   | Register new user |
| POST   | /auth/login    | No   | Login             |

### Credentials
| Method | Path          | Auth | Description              |
|--------|---------------|------|--------------------------|
| POST   | /credentials  | Yes  | Save/update WABA creds   |
| GET    | /credentials  | Yes  | Get stored credentials   |

### Campaigns
| Method | Path              | Auth | Description           |
|--------|-------------------|------|-----------------------|
| POST   | /campaigns        | Yes  | Create campaign       |
| GET    | /campaigns        | Yes  | List all campaigns    |
| GET    | /campaigns/:id    | Yes  | Get campaign details  |
| DELETE | /campaigns/:id    | Yes  | Delete campaign       |

### Dashboard
| Method | Path              | Auth | Description     |
|--------|-------------------|------|-----------------|
| GET    | /dashboard/stats  | Yes  | Get stats       |

### Webhook
| Method | Path            | Auth | Description                   |
|--------|-----------------|------|-------------------------------|
| GET    | /webhook/meta   | No   | Webhook verification          |
| POST   | /webhook/meta   | No   | Receive delivery status hooks |

---

## How Scheduling Works

1. Create a campaign with a `scheduledAt` datetime — status becomes `SCHEDULED`
2. A `node-cron` job runs every minute on the server
3. Due campaigns are picked up → status changes to `PROCESSING`
4. Messages are sent in batches of 10 via WhatsApp Cloud API
5. Status updates to `COMPLETED` or `FAILED` when done

---

## Deployment

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start`
4. Add all environment variables from `.env.example` in Render's environment settings

### Frontend → Vercel

1. Import your GitHub repo on [vercel.com](https://vercel.com)
2. Set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
3. Add environment variable:
   - `VITE_API_URL` = your Render backend URL (e.g. `https://your-app.onrender.com`)

---

## Security Notes

- Access tokens are encrypted with AES-256-CBC before storage
- Passwords are hashed with bcrypt (cost factor 12)
- JWT tokens expire in 7 days
- Rate limiting: 200 requests per 15 minutes
- Helmet.js for security headers
- CORS restricted to `FRONTEND_URL`

---

## Webhook Setup (Meta)

1. In Meta App Dashboard → WhatsApp → Configuration
2. Set Callback URL: `https://your-backend.onrender.com/webhook/meta`
3. Set Verify Token: same value as `WEBHOOK_VERIFY_TOKEN` in your `.env`
4. Subscribe to: `messages`
