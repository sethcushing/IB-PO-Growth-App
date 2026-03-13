# PO Growth Assessment Tool

A self-assessment tool for Product Owners to measure and grow their skills across 8 key competency dimensions.

## Features

- **Open Assessment**: No login required - just enter your name and start
- **20 Questions**: Across 8 dimensions (Strategy, Customer, Backlog, Delivery, Stakeholder Management, Execution, Data, Governance)
- **Instant Results**: Get your growth score, dimension breakdown, and personalized coaching recommendations
- **Admin Dashboard**: Password-protected analytics view at `/admin`

## Tech Stack

- **Frontend**: React, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python 3.11
- **Database**: MongoDB

---

## Deployment to Koyeb

### Prerequisites

1. A [Koyeb account](https://www.koyeb.com/)
2. A MongoDB database (recommend [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)

### Step 1: Set Up MongoDB Atlas

1. Create a free MongoDB Atlas cluster at https://www.mongodb.com/atlas
2. Create a database user with read/write permissions
3. Whitelist all IPs (0.0.0.0/0) for Koyeb access
4. Get your connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)

### Step 2: Deploy to Koyeb

#### Option A: Deploy via GitHub

1. Push this code to a GitHub repository
2. In Koyeb dashboard, click "Create App"
3. Select "GitHub" and connect your repository
4. Configure the service:
   - **Name**: `po-growth-assessment`
   - **Builder**: Dockerfile
   - **Port**: 8000

5. Add environment variables:
   ```
   MONGO_URL=mongodb+srv://your-connection-string
   DB_NAME=po_growth_assessment
   CORS_ORIGINS=*
   JWT_SECRET=your-secure-random-string
   ```

6. Click "Deploy"

#### Option B: Deploy via Docker Registry

1. Build and push the image:
   ```bash
   docker build -t your-registry/po-growth:latest .
   docker push your-registry/po-growth:latest
   ```

2. In Koyeb, select "Docker" and enter your image URL
3. Add the same environment variables as above
4. Deploy

### Step 3: Initialize the Database

After deployment, the database will be automatically initialized when the first assessment is submitted. 

To seed demo questions (if not already present), you can call:
```
POST https://your-app.koyeb.app/api/seed-demo
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `DB_NAME` | Database name | `po_growth_assessment` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `*` or `https://yourdomain.com` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secure-random-string` |
| `PORT` | Server port (set by Koyeb) | `8000` |

---

## Admin Access

- **URL**: `/admin`
- **Password**: `admin123`

> ⚠️ For production, change the admin password in `/app/frontend/src/pages/AdminPage.js`

---

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/assessment/questions` | Get all questions |
| POST | `/api/assessment/submit` | Submit assessment |
| GET | `/api/admin/submissions` | Get all submissions |
| GET | `/api/admin/stats` | Get statistics |
| POST | `/api/seed-demo` | Seed demo data |

---

## License

MIT License - Feel free to use and modify for your organization.
