# Deployment Guide - NovaTech Voice Agent

Deploy your voice agent using **Render** (backend) + **Vercel** (frontend).

---

## 🔧 Step 1: Prepare for Deployment

### Backend Checklist:
- [ ] PDF files added to `backend/data/` folder
- [ ] API key NOT in .env file (will set in Render dashboard)
- [ ] Code pushed to GitHub

### Frontend Checklist:
- [ ] Code pushed to GitHub
- [ ] Backend URL will be set as environment variable

---

## 🚀 Step 2: Deploy Backend on Render

1. **Go to** [render.com](https://render.com) → Sign up/Login

2. **Create New Web Service:**
   - Click **New** → **Web Service**
   - Connect your GitHub repository
   
3. **Configure Service:**
   | Setting | Value |
   |---------|-------|
   | Name | `novatech-voice-agent-api` |
   | Root Directory | `backend` |
   | Runtime | Python 3 |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

4. **Set Environment Variables** (in Render Dashboard → Environment):
   ```
   GROQ_API_KEY = gsk_your_actual_api_key
   MODEL_NAME = llama-3.3-70b-versatile
   ```

5. **Deploy** → Wait for build to complete

6. **Copy your Render URL** (e.g., `https://novatech-voice-agent-api.onrender.com`)

---

## 🌐 Step 3: Deploy Frontend on Vercel

1. **Go to** [vercel.com](https://vercel.com) → Sign up/Login

2. **Import Project:**
   - Click **Add New** → **Project**
   - Import your GitHub repository
   
3. **Configure:**
   | Setting | Value |
   |---------|-------|
   | Framework Preset | Vite |
   | Root Directory | `frontend` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

4. **Set Environment Variable:**
   ```
   VITE_WS_URL = wss://novatech-voice-agent-api.onrender.com
   ```
   ⚠️ Note: Use `wss://` (not `ws://`) for secure WebSocket on production!

5. **Deploy** → Wait for build to complete

---

## ✅ Step 4: Test Your Deployment

1. Open your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Click **Connect**
3. Test voice input and responses
4. Verify it answers only NovaTech-related questions

---

## 🔐 Security Notes

| ✅ Safe | ❌ Never Do |
|---------|------------|
| Set API keys in Render dashboard | Commit `.env` file to GitHub |
| Use `wss://` for production | Expose API keys in code |
| Keep `.gitignore` updated | Share Render environment variables |

---

## 🐛 Troubleshooting

**WebSocket Connection Failed:**
- Ensure backend is running on Render
- Check if using `wss://` (not `ws://`) for production
- Verify CORS settings allow your Vercel domain

**Backend Not Responding:**
- Free tier may sleep after 15 mins of inactivity
- First request after sleep takes 30-60 seconds

**Voice Not Working:**
- Use Chrome or Edge browser
- Allow microphone permissions
- HTTPS is required for Web Speech API (Vercel provides this)

---

## 📝 URLs After Deployment

| Service | URL |
|---------|-----|
| Backend (Render) | `https://your-app.onrender.com` |
| Frontend (Vercel) | `https://your-app.vercel.app` |
