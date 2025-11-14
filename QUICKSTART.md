# Quick Start Guide

## Already Running!

Your AI Dating Agent is currently running at:

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

## Open the App

Simply open your browser and go to:

**[http://localhost:5173](http://localhost:5173)**

## Using the App

### Step 1: Onboarding
- Fill out your profile information
- Adjust the texting style sliders to match your communication style
- Optional: Rate your attractiveness (1-5 scale)
- Click "Start My Journey"

### Step 2: Photo Upload (Optional)
- Upload 1-3 photos
- Click "Upload & Analyze Photos" to run basic verification
- You can skip this step if you prefer

### Step 3: Chat with Your AI Coach
- Start chatting with the AI dating coach
- Share your dating experiences and questions
- Ask for advice, tips, or just chat naturally
- The AI will analyze your texting style and personality

### Step 4: Run Simulations
- Click the "Run 50 Simulations" button in the chat
- Wait ~30 seconds while the AI runs simulated dating scenarios
- Review your results in the sidebar:
  - Compatibility score
  - Top matching archetypes
  - Strengths and areas to improve
  - Coaching tips and suggested openers

## Stopping the Servers

The servers are currently running in the background. To stop them:

1. In VSCode, go to the terminal where you ran the commands
2. Press `Ctrl+C` to stop each server

Or use this command to find and kill the processes:
```bash
pkill -f "tsx watch src/server.ts"
pkill -f "vite"
```

## Restarting the Servers

### Option 1: Quick Start Script
```bash
cd ~/dating-app
./start.sh
```

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd ~/dating-app/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd ~/dating-app/frontend
npm run dev
```

## Troubleshooting

### Port Already in Use
If you see an error about ports already in use, the servers might still be running from before. Kill them:
```bash
pkill -f "tsx watch"
pkill -f "vite"
```

### API Connection Failed
- Make sure the backend is running on port 3001
- Check the terminal for any error messages
- Verify the backend health: `curl http://localhost:3001/api/health`

### Frontend Won't Load
- Make sure the frontend is running on port 5173
- Clear your browser cache
- Try a hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

## Features to Try

1. **Personality Analysis**: Chat naturally and let the AI analyze your vibe
2. **Simulations**: Run 50 scenarios to see how you'd match with different personalities
3. **Photo Verification**: Upload photos to test the basic consistency check
4. **Coaching Tips**: Get personalized advice based on your profile and chat history
5. **Check-ins**: The AI will periodically ask how you're feeling about dating

## Next Steps

See [README.md](README.md) for:
- Full documentation
- How to integrate a real LLM (OpenAI, Anthropic)
- Customization options
- Database setup
- Production deployment

Enjoy your AI Dating Agent!
