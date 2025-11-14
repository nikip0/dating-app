# AI Dating Agent

A complete full-stack application that acts as your personal AI dating coach. This app analyzes your texting style, runs simulated dating scenarios, and provides personalized coaching tips to help you succeed in the dating world.

## Features

### 1. Onboarding
- Collect user profile information (name, age, gender, interests, bio)
- Self-reported texting style analysis (positivity, playfulness, response length)
- Optional self-rated attractiveness scale
- Relationship goals tracking

### 2. Photo Upload & Verification
- Upload 1-3 photos
- Basic photo consistency verification (mock implementation)
- File type and size validation
- Privacy-focused (all processing happens locally)

### 3. AI Chat Coach
- Interactive chatbot interface
- Analyzes your vibe and texting tone from conversations
- Asks reflective questions to understand your dating style
- Regular check-ins about your dating experiences
- Provides real-time coaching and feedback

### 4. Simulation Engine
- Runs 50 simulated dating scenarios based on your profile
- Tests compatibility with different personality archetypes
- Analyzes how you come across to potential matches
- Generates personalized coaching tips
- Suggests effective opener messages
- Identifies ideal match types

### 5. Vibe Analysis
- Overall impression summary
- Identifies your strengths
- Highlights areas for improvement
- Compatibility scoring (0-100)
- Top matching personality archetypes

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **File Upload**: Multer
- **Storage**: In-memory (easily replaceable with a database)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Styling**: Inline CSS (React CSSProperties)

## Project Structure

```
dating-app/
├── backend/
│   ├── src/
│   │   ├── server.ts           # Express server & API routes
│   │   ├── types.ts            # TypeScript type definitions
│   │   ├── storage.ts          # In-memory data storage
│   │   ├── llm.ts              # LLM helper (mock implementation)
│   │   ├── simulations.ts      # Simulation engine
│   │   └── photoVerification.ts # Photo upload & verification
│   ├── uploads/                # Uploaded photos directory
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Onboarding.tsx  # Onboarding form
│   │   │   ├── PhotoUpload.tsx # Photo upload interface
│   │   │   └── Chat.tsx        # Chat interface
│   │   ├── App.tsx             # Main app component
│   │   ├── api.ts              # API client
│   │   ├── types.ts            # TypeScript types
│   │   └── index.css           # Global styles
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd ~/dating-app
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

You need to run both the backend and frontend servers simultaneously.

#### Terminal 1 - Backend Server
```bash
cd ~/dating-app/backend
npm run dev
```

The backend will start on [http://localhost:3001](http://localhost:3001)

#### Terminal 2 - Frontend Server
```bash
cd ~/dating-app/frontend
npm run dev
```

The frontend will start on [http://localhost:5173](http://localhost:5173)

### Access the Application

Open your browser and navigate to [http://localhost:5173](http://localhost:5173)

## API Endpoints

### Profile
- `POST /api/profile` - Create user profile
- `GET /api/profile` - Get user profile

### Photos
- `POST /api/photos` - Upload photos (multipart/form-data)
- `GET /api/photos/verification` - Get photo verification status

### Chat
- `GET /api/chat/history` - Get chat message history
- `POST /api/chat/message` - Send a chat message

### Simulations
- `POST /api/simulations/run` - Run 50 dating simulations
- `GET /api/simulations/results` - Get simulation results

## LLM Integration

The app uses a **mock LLM implementation** by default. To integrate a real LLM (OpenAI, Anthropic, etc.):

1. **Install the appropriate SDK:**
   ```bash
   cd backend
   npm install openai
   # or
   npm install @anthropic-ai/sdk
   ```

2. **Set your API key as an environment variable:**
   ```bash
   export OPENAI_API_KEY="your-key-here"
   # or
   export ANTHROPIC_API_KEY="your-key-here"
   ```

3. **Update [backend/src/llm.ts](backend/src/llm.ts):**

   Replace the mock `callLLM()` function with actual API calls. Example for OpenAI:

   ```typescript
   import OpenAI from 'openai';

   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
   });

   export async function callLLM(messages: LLMMessage[]): Promise<string> {
     const response = await openai.chat.completions.create({
       model: 'gpt-4',
       messages: messages,
     });

     return response.choices[0].message.content || '';
   }
   ```

## How It Works

### 1. Onboarding Flow
- User fills out profile information
- System captures texting style preferences via sliders
- Profile is saved to storage

### 2. Photo Upload (Optional)
- User uploads 1-3 photos
- Basic validation checks file type and size
- Mock verification checks photo consistency
- Results displayed with confidence score

### 3. Chat Experience
- AI coach greets user and references their profile
- User can chat naturally about dating experiences
- AI analyzes texting patterns and personality
- Coach asks reflective questions
- Regular check-ins on dating progress

### 4. Simulation Engine
- User triggers "Run 50 Simulations" button
- System generates 50 hypothetical match scenarios
- Each scenario includes:
  - Match personality archetype
  - Simulated initial message
  - Expected user response
  - Compatibility score
  - Potential issues
- Results are analyzed and summarized
- Coaching tips and openers are generated

### 5. Results Display
- Vibe analysis sidebar appears after simulations
- Shows compatibility score
- Lists top matching archetypes
- Highlights strengths and areas to improve
- All results integrated into chat conversation

## Customization

### Adding Real Database
Replace [backend/src/storage.ts](backend/src/storage.ts) with a real database implementation:
- PostgreSQL with Prisma
- MongoDB with Mongoose
- SQLite with TypeORM

### Styling
- All styles use inline React CSS
- Easy to migrate to CSS modules, Tailwind CSS, or styled-components
- Update individual component styles in their respective files

### Simulation Logic
Modify [backend/src/simulations.ts](backend/src/simulations.ts) to:
- Adjust number of simulations
- Change archetype definitions
- Customize coaching tip generation
- Fine-tune compatibility scoring

## Privacy & Security Notes

- **No external services**: All processing happens locally
- **No data sharing**: User data stays in-memory (or your local database)
- **Mock verification**: Photo verification is simulated, not real identity verification
- **Local photos**: Uploaded photos stored locally in `backend/uploads/`
- **API keys**: Never commit API keys to version control

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses tsx watch for hot reloading
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite provides HMR
```

### Building for Production

**Backend:**
```bash
cd backend
npm run build  # Compiles TypeScript to dist/
npm start      # Runs compiled JS
```

**Frontend:**
```bash
cd frontend
npm run build  # Creates optimized production build
npm run preview # Preview production build
```

## Troubleshooting

### Port Already in Use
If port 3001 (backend) or 5173 (frontend) is already in use:

**Backend**: Edit [backend/src/server.ts](backend/src/server.ts) and change `PORT = 3001`

**Frontend**: Vite will automatically try the next available port

### CORS Issues
The backend is configured to allow all origins. For production, update CORS settings in [backend/src/server.ts](backend/src/server.ts):

```typescript
app.use(cors({
  origin: 'https://your-production-domain.com'
}));
```

### File Upload Errors
- Check that `backend/uploads/` directory exists and is writable
- Verify file size limits (currently 5MB max)
- Ensure file types are correct (JPEG, PNG, WebP)

## Future Enhancements

- [ ] Real LLM integration (OpenAI/Anthropic)
- [ ] Persistent database (PostgreSQL/MongoDB)
- [ ] User authentication
- [ ] Multiple user support
- [ ] Real face detection API integration
- [ ] Export simulation results as PDF
- [ ] Progress tracking over time
- [ ] Email/SMS check-in reminders
- [ ] More detailed analytics dashboard
- [ ] A/B testing different profile approaches

## License

MIT License - feel free to use this project however you'd like!

## Contributing

This is a demo project, but contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share feedback

---

**Built with ❤️ using Node.js, Express, React, and TypeScript**
