# NovaTech Voice Agent - Backend

## Deployment to Render

### 1. Push to GitHub
First, push this backend folder to a GitHub repository.

### 2. Create Render Web Service
1. Go to [render.com](https://render.com) and sign up/login
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `novatech-voice-agent`
   - **Root Directory**: `backend` (if in subfolder)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3. Set Environment Variables
In Render dashboard, go to **Environment** and add:
- `GROQ_API_KEY` = your_groq_api_key
- `MODEL_NAME` = llama-3.3-70b-versatile

### 4. Add PDF Files
Upload your PDF files to the `data/` folder before deploying.

### Important Notes
- Never commit `.env` file to GitHub
- API keys are set as environment variables in Render dashboard
- Free tier may have cold start delays
