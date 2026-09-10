# 🚀 Pocket Mentor – Production Deployment Guide

This guide walks you step-by-step through deploying **Pocket Mentor** to production.

Pocket Mentor is architected to support **two primary deployment models**:
1. **Unified Single-Service (Recommended)**: Express serves the production React SPA (`frontend/dist`), the REST API (`/api`), and real-time WebSockets (`/socket.io`) together on a single domain and port. Zero CORS setup needed!
2. **Split-Service**: React frontend hosted on Vercel/Netlify, and Node.js backend hosted on Render/Railway.

---

## 📋 Prerequisites

Before deploying to any cloud provider, make sure you have:
1. **GitHub Account**: Push this repository to your GitHub.
2. **MongoDB Atlas (Free Database)**:
   - Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
   - Create a free **M0 Sandbox Cluster**.
   - Under **Database Access**, create a user (e.g. `pocketadmin`) and copy the password.
   - Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere (`0.0.0.0/0`)** so cloud hosts can connect.
   - Click **Connect** -> **Drivers** -> Copy the connection string:
     ```text
     mongodb+srv://pocketadmin:<password>@cluster0.xxxxx.mongodb.net/pocket-mentor?retryWrites=true&w=majority
     ```
3. **Google Gemini API Key (Optional)**:
   - Get a free API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
   - *Note*: Pocket Mentor has built-in offline NLP fallbacks, so study materials will generate even without an API key!

---

## 🌟 Method 1: Render.com (Recommended – Free & Easiest)

Render can build both the frontend and backend together into a single web service on their free tier.

### Steps:
1. Push your code to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit with production deployment setup"
   git branch -M main
   git remote add origin https://github.com/<your-username>/pocket-mentor.git
   git push -u origin main
   ```
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** -> **Web Service**.
4. Select **Build and deploy from a Git repository** and connect your `pocket-mentor` repo.
5. Configure the service settings:
   - **Name**: `pocket-mentor`
   - **Runtime**: `Node`
   - **Region**: Nearest to your users (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`
6. Scroll down to **Environment Variables** and add:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables React static file serving & optimizations |
   | `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | `generate-a-long-random-string-here` | Secret used for student tokens |
   | `GEMINI_API_KEY` | `your-gemini-key` | *(Optional)* Google AI Key |
7. Click **Create Web Service**.
8. Render will run `npm run build` (installing dependencies and compiling the Vite bundle) and launch the Node.js server.
9. Your app will be live at `https://pocket-mentor.onrender.com`! 🎉

---

## 🚂 Method 2: Railway.app (Unified or Split)

Railway automatically detects Node.js and builds the repository cleanly.

1. Go to [railway.app](https://railway.app) and click **New Project** -> **Deploy from GitHub repo**.
2. Select your `pocket-mentor` repository.
3. In **Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `5000` *(or let Railway auto-assign)*
   - `MONGO_URI` = Your MongoDB Atlas string *(or add a free Railway MongoDB plugin)*
   - `JWT_SECRET` = A strong secret
   - `GEMINI_API_KEY` = Your key *(optional)*
4. Under **Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
5. Click **Generate Domain**. Your application is live!

---

## ⚡ Method 3: Split Deployment (Vercel Frontend + Render Backend)

If you prefer hosting the React client separately on Vercel's global CDN:

### Part A: Deploy Backend to Render
1. In Render, create a Web Service pointing to your repo.
2. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = Your MongoDB Atlas URI
   - `JWT_SECRET` = Your secret
   - `CLIENT_URL` = `https://your-pocket-mentor.vercel.app` *(add this after Vercel gives you a URL)*
4. Note your backend URL, e.g. `https://pocket-mentor-api.onrender.com`.

### Part B: Deploy Frontend to Vercel
1. Log in to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Import your GitHub repository.
3. In the project configuration:
   - **Root Directory**: Click edit and select `frontend`.
   - **Framework Preset**: `Vite`
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://pocket-mentor-api.onrender.com`
   - `VITE_SOCKET_URL` = `https://pocket-mentor-api.onrender.com`
5. Click **Deploy**.
6. Copy your Vercel URL and update the `CLIENT_URL` variable in your Render backend settings so CORS allows requests.

> **💡 SPA Page Refresh Fix Included**:
> [`frontend/vercel.json`](frontend/vercel.json) is included with `rewrites` configured to route all paths to `/index.html`. When you refresh the page on any route (like `/notes`, `/quiz`, `/progress`, `/dashboard`), Vercel will serve the application properly without showing `404: NOT_FOUND`.

---

## 🖥️ Method 4: Manual Deployment on Any VPS / Server (Ubuntu, Debian, EC2, DigitalOcean)

If you prefer deploying manually to your own server using standard Node.js and PM2:

### 1. Connect to your server & install Node.js:
```bash
# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone the repository and install dependencies:
```bash
git clone https://github.com/<your-username>/pocket-mentor.git
cd pocket-mentor

# Install all backend & frontend packages and build the frontend:
npm run build
```

### 3. Configure backend environment:
```bash
cd backend
cp .env.example .env
nano .env   # Update PORT, NODE_ENV=production, MONGO_URI, and JWT_SECRET
cd ..
```

### 4. Start the server manually or with PM2 (Process Manager):
```bash
# Install PM2 globally for 24/7 uptime & auto-restart on reboot:
sudo npm install -g pm2

# Start the application in production mode:
pm2 start backend/server.js --name "pocket-mentor" --env NODE_ENV=production

# Save PM2 process list to auto-start on server reboot:
pm2 save
pm2 startup
```

### 5. Access your application:
Your full-stack application will be live at `http://<your-server-ip>:5000`.

*(Optional)* You can put Nginx or Caddy in front of port 5000 for your custom domain and free SSL:
```text
pocketmentor.yourdomain.com {
    reverse_proxy localhost:5000
}
```

---

## 🛡️ Production Verification Checklist

- [x] **Static Assets**: Frontend bundles are minified with code splitting (`vendor-react`, `vendor-ui`, `index`).
- [x] **Security Headers**: `helmet` is active with Content Security Policies allowing avatars from Dicebear and Google Fonts.
- [x] **Rate Limiting**: Brute-force protection enabled on `/api/auth` (100 requests per 15-minute window).
- [x] **Gzip Compression**: `compression` middleware compresses JSON payloads and static assets.
- [x] **Graceful Shutdown**: Node.js listens to `SIGTERM` and `SIGINT` to safely disconnect MongoDB and WebSocket clients without dropping connections.
- [x] **Dynamic CORS**: Backend accepts requests from localhost, staging, and custom domains defined in `CLIENT_URL`.
- [x] **File Uploads**: `backend/uploads` directory is auto-created on startup so file uploads never throw `ENOENT`.
- [x] **Git Hygiene**: `.gitignore` protects all secret `.env` files, build directories, and node_modules from being committed.

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `MongoServerSelectionError` | Cloud host IP blocked by MongoDB Atlas | In MongoDB Atlas Network Access, ensure `0.0.0.0/0` (allow all) is whitelisted. |
| `CORS Error: Origin not allowed` | Split deployment domain mismatch | Set `CLIENT_URL=https://your-frontend-url.com` in backend environment variables. |
| `Cannot find module dist/index.html` | Frontend was not built before backend started | Ensure your build command is `npm run build` so Vite compiles `frontend/dist` first. |
| `Port in use (EADDRINUSE)` | Another process occupies port 5000 | Stop the existing process or set `PORT=5001` in your `.env`. |
