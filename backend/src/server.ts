import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';
import { UserProfile, ChatMessage } from './types';
import { validatePhotoFile, analyzePhotos } from './photoVerification';
import { runSimulations } from './simulations';
import { callLLM, LLMMessage } from './llm';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      cb(new Error(validation.error));
    } else {
      cb(null, true);
    }
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Profile endpoints
app.post('/api/profile', (req: Request, res: Response) => {
  try {
    const profileData = req.body;

    const profile: UserProfile = {
      id: uuidv4(),
      name: profileData.name,
      ageRange: profileData.ageRange,
      gender: profileData.gender,
      interestedIn: profileData.interestedIn,
      bio: profileData.bio,
      relationshipGoals: profileData.relationshipGoals,
      textingTone: {
        positivity: profileData.textingTone.positivity || 50,
        playfulness: profileData.textingTone.playfulness || 50,
        responseLength: profileData.textingTone.responseLength || 50
      },
      selfRatedAttractiveness: profileData.selfRatedAttractiveness,
      photos: [],
      createdAt: new Date()
    };

    storage.saveProfile(profile);

    // Add welcome message to chat
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      sender: 'agent',
      content: `Hey ${profile.name}! 👋 I'm your AI dating coach. I'm here to help you understand your dating vibe and give you personalized advice. Let's chat a bit so I can get to know you better! What brings you here today?`,
      timestamp: new Date()
    };
    storage.addMessage(welcomeMessage);

    res.json({ success: true, profile, welcomeMessage });
  } catch (error: any) {
    console.error('Error creating profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/profile', (req: Request, res: Response) => {
  const profile = storage.getProfile();
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }
  res.json({ success: true, profile });
});

// Photo upload endpoints
app.post('/api/photos', upload.array('photos', 3), async (req: Request, res: Response) => {
  try {
    const profile = storage.getProfile();
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found. Please complete onboarding first.' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    // Store photo paths
    const photoPaths = files.map(file => file.filename);
    storage.updateProfile({ photos: photoPaths });

    // Run verification
    const verification = await analyzePhotos(photoPaths);

    res.json({
      success: true,
      photos: photoPaths,
      verification
    });
  } catch (error: any) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/photos/verification', async (req: Request, res: Response) => {
  try {
    const profile = storage.getProfile();
    if (!profile || profile.photos.length === 0) {
      return res.status(404).json({ success: false, error: 'No photos found' });
    }

    const verification = await analyzePhotos(profile.photos);
    res.json({ success: true, verification });
  } catch (error: any) {
    console.error('Error verifying photos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chat endpoints
app.get('/api/chat/history', (req: Request, res: Response) => {
  const chatHistory = storage.getChatHistory();
  res.json({ success: true, messages: chatHistory });
});

app.post('/api/chat/message', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    const profile = storage.getProfile();
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    // Save user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      sender: 'user',
      content,
      timestamp: new Date()
    };
    storage.addMessage(userMessage);

    // Build context for LLM
    const chatHistory = storage.getChatHistory();
    const recentMessages = chatHistory.slice(-10); // Last 10 messages

    const systemPrompt = `You are an AI dating coach helping ${profile.name}. Your role is to:
- Analyze their texting style and personality
- Provide constructive, supportive feedback
- Ask thoughtful questions to understand them better
- Check in on their dating experiences
- Offer personalized coaching tips

User profile:
- Age: ${profile.ageRange}
- Bio: ${profile.bio}
- Relationship goals: ${profile.relationshipGoals}
- Texting style: ${profile.textingTone.positivity}% positive, ${profile.textingTone.playfulness}% playful

Be friendly, supportive, and conversational. Don't be overly formal.`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))
    ];

    // Get AI response
    const aiResponse = await callLLM(messages);

    // Save AI message
    const aiMessage: ChatMessage = {
      id: uuidv4(),
      sender: 'agent',
      content: aiResponse,
      timestamp: new Date()
    };
    storage.addMessage(aiMessage);

    res.json({ success: true, message: aiMessage });
  } catch (error: any) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simulation endpoints
app.post('/api/simulations/run', async (req: Request, res: Response) => {
  try {
    const profile = storage.getProfile();
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    const chatHistory = storage.getChatHistory();

    // Add a message indicating simulations are starting
    const startMessage: ChatMessage = {
      id: uuidv4(),
      sender: 'agent',
      content: `Great! I'm going to run 50 simulated dating scenarios based on your profile and our conversations. This will take about 30 seconds. I'll analyze how you might interact with different personality types and give you personalized insights!`,
      timestamp: new Date()
    };
    storage.addMessage(startMessage);

    // Run simulations (this happens in the background)
    const results = await runSimulations(profile, chatHistory);
    storage.saveSimulationResults(results);

    // Add completion message
    const completionMessage: ChatMessage = {
      id: uuidv4(),
      sender: 'agent',
      content: buildSimulationSummaryMessage(results),
      timestamp: new Date()
    };
    storage.addMessage(completionMessage);

    res.json({
      success: true,
      results,
      message: completionMessage
    });
  } catch (error: any) {
    console.error('Error running simulations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/simulations/results', (req: Request, res: Response) => {
  const results = storage.getSimulationResults();
  if (!results) {
    return res.status(404).json({ success: false, error: 'No simulation results found' });
  }
  res.json({ success: true, results });
});

// Helper function to build simulation summary message
function buildSimulationSummaryMessage(results: any): string {
  const { average_compatibility, top_archetypes, vibe_analysis, coaching_tips, suggested_openers } = results;

  return `🎉 Simulations complete! Here's what I learned:

**Your Overall Vibe:**
${vibe_analysis.overall_impression}

**Your Strengths:**
${vibe_analysis.strengths.map((s: string) => `✓ ${s}`).join('\n')}

**Top Compatible Archetypes:**
${top_archetypes.slice(0, 3).map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}

**Coaching Tips:**
${coaching_tips.slice(0, 3).map((tip: string, i: number) => `${i + 1}. ${tip}`).join('\n')}

**Suggested Openers:**
${suggested_openers.slice(0, 2).map((opener: string) => `• "${opener}"`).join('\n')}

${vibe_analysis.areas_to_improve.length > 0 ? `\n**Areas to Work On:**\n${vibe_analysis.areas_to_improve.map((a: string) => `→ ${a}`).join('\n')}` : ''}

Your average compatibility score was ${average_compatibility}/100! Want to dive deeper into any of these insights?`;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dating Agent Backend running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

export default app;
