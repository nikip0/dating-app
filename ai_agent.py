"""
AI Agent System for iMessage Dating App
Handles user conversations and profile building
"""

import anthropic
import json
from typing import Dict, List, Optional
from datetime import datetime
import os

class UserAIAgent:
    """Personal AI agent for each user that learns their personality through conversation"""
    
    def __init__(self, user_id: str, profile: Dict = None):
        self.user_id = user_id
        self.profile = profile or self._initialize_profile()
        self.conversation_history = []
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        
    def _initialize_profile(self) -> Dict:
        """Initialize empty profile structure"""
        return {
            "basic_info": {},
            "personality_traits": [],
            "values": [],
            "interests": [],
            "relationship_goals": [],
            "communication_style": {
                "formality": None,
                "emoji_usage": None,
                "response_length": None,
                "humor_style": None
            },
            "deal_breakers": [],
            "preferences": {},
            "emotional_intelligence_markers": [],
            "conversation_count": 0,
            "confidence_score": 0.0
        }
    
    def _build_system_prompt(self) -> str:
        """Build system prompt for the AI agent"""
        profile_summary = json.dumps(self.profile, indent=2)
        
        return f"""You are a personal AI dating agent having a natural, friendly conversation with a user.

Your Goals:
1. Build genuine rapport through warm, engaging conversation
2. Gradually learn about their personality, values, and what they're looking for in a relationship
3. Ask thoughtful questions that reveal compatibility factors (but don't interrogate)
4. Be authentic, supportive, and naturally curious
5. Make the conversation feel like talking to a perceptive friend, not a survey

Current Knowledge About User:
{profile_summary}

Conversation Guidelines:
- Keep responses conversational (2-4 sentences typically)
- Ask 1 question at a time maximum
- Show genuine interest and remember what they share
- Naturally explore: communication preferences, life goals, values, interests, relationship expectations, emotional depth
- Don't be formulaic - let conversation flow naturally
- Use appropriate humor and warmth
- If they seem hesitant, respect boundaries and shift topics

Focus Areas to Gradually Explore:
- What matters most to them in life and relationships
- How they handle conflict and stress
- Their communication style preferences  
- Future goals and lifestyle preferences
- What they find attractive in others (personality-wise)
- Their sense of humor and playfulness
- Emotional availability and depth
- Deal-breakers in relationships

Remember: You're building a psychological profile for matchmaking, but the conversation should feel natural and enjoyable, not like an interview."""

    async def chat(self, user_message: str) -> str:
        """
        Process user message and generate agent response
        
        Args:
            user_message: The message from the user
            
        Returns:
            Agent's response text
        """
        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        # Build conversation context
        system_prompt = self._build_system_prompt()
        
        # Call Claude API
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=system_prompt,
            messages=self.conversation_history
        )
        
        agent_response = response.content[0].text
        
        # Add agent response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": agent_response
        })
        
        # Update profile based on conversation
        await self._analyze_and_update_profile(user_message, agent_response)
        
        return agent_response
    
    async def _analyze_and_update_profile(self, user_message: str, agent_response: str):
        """
        Analyze conversation and extract profile information
        
        Args:
            user_message: Latest user message
            agent_response: Agent's response
        """
        # Every 3 messages, do a deeper profile analysis
        self.profile["conversation_count"] += 1
        
        if self.profile["conversation_count"] % 3 == 0:
            analysis_prompt = f"""Analyze this conversation segment and extract profile information.

Current Profile:
{json.dumps(self.profile, indent=2)}

Recent Exchange:
User: {user_message}
Agent: {agent_response}

Recent Conversation History (last 6 messages):
{json.dumps(self.conversation_history[-6:], indent=2)}

Extract any new information about:
1. Personality traits (e.g., introverted/extroverted, spontaneous/planner, optimistic/realistic)
2. Core values (e.g., family, career, adventure, stability, creativity, honesty)
3. Interests and hobbies
4. Relationship goals (casual, serious, marriage, kids, etc.)
5. Communication style (formal/casual, emoji usage, humor type, emotional expression)
6. Deal-breakers or important preferences
7. Emotional intelligence markers (empathy, self-awareness, conflict handling)

Return a JSON object with ONLY the NEW or UPDATED information. Use these exact keys:
{{
    "personality_traits": ["trait1", "trait2"],
    "values": ["value1", "value2"],
    "interests": ["interest1", "interest2"],
    "relationship_goals": ["goal1"],
    "communication_style": {{"aspect": "value"}},
    "deal_breakers": ["deal_breaker1"],
    "preferences": {{"preference_key": "value"}},
    "emotional_intelligence_markers": ["marker1"]
}}

Be specific and evidence-based. Only include information clearly expressed or strongly implied."""

            try:
                analysis_response = self.client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=800,
                    messages=[{"role": "user", "content": analysis_prompt}]
                )
                
                # Parse the analysis
                analysis_text = analysis_response.content[0].text
                # Extract JSON from response (handle markdown code blocks)
                if "```json" in analysis_text:
                    analysis_text = analysis_text.split("```json")[1].split("```")[0]
                elif "```" in analysis_text:
                    analysis_text = analysis_text.split("```")[1].split("```")[0]
                
                updates = json.loads(analysis_text.strip())
                
                # Merge updates into profile
                self._merge_profile_updates(updates)
                
            except Exception as e:
                print(f"Profile analysis error: {e}")
    
    def _merge_profile_updates(self, updates: Dict):
        """
        Merge profile updates into existing profile
        
        Args:
            updates: Dictionary with profile updates
        """
        # Merge lists (avoid duplicates)
        for key in ["personality_traits", "values", "interests", 
                    "relationship_goals", "deal_breakers", "emotional_intelligence_markers"]:
            if key in updates and updates[key]:
                existing = set(self.profile.get(key, []))
                new_items = set(updates[key])
                self.profile[key] = list(existing | new_items)
        
        # Merge dictionaries
        if "communication_style" in updates:
            self.profile["communication_style"].update(updates["communication_style"])
        
        if "preferences" in updates:
            self.profile["preferences"].update(updates["preferences"])
        
        # Update confidence score (increases with more data)
        self._update_confidence_score()
    
    def _update_confidence_score(self):
        """Calculate confidence score based on profile completeness"""
        weights = {
            "personality_traits": 0.2,
            "values": 0.25,
            "interests": 0.15,
            "relationship_goals": 0.2,
            "communication_style": 0.1,
            "deal_breakers": 0.05,
            "preferences": 0.05
        }
        
        score = 0.0
        
        # Personality traits (aim for 5+)
        trait_count = len(self.profile.get("personality_traits", []))
        score += weights["personality_traits"] * min(trait_count / 5, 1.0)
        
        # Values (aim for 4+)
        value_count = len(self.profile.get("values", []))
        score += weights["values"] * min(value_count / 4, 1.0)
        
        # Interests (aim for 5+)
        interest_count = len(self.profile.get("interests", []))
        score += weights["interests"] * min(interest_count / 5, 1.0)
        
        # Relationship goals (aim for 2+)
        goal_count = len(self.profile.get("relationship_goals", []))
        score += weights["relationship_goals"] * min(goal_count / 2, 1.0)
        
        # Communication style (check filled fields)
        comm_style = self.profile.get("communication_style", {})
        filled_fields = sum(1 for v in comm_style.values() if v is not None)
        score += weights["communication_style"] * min(filled_fields / 4, 1.0)
        
        # Deal breakers
        dealbreaker_count = len(self.profile.get("deal_breakers", []))
        score += weights["deal_breakers"] * min(dealbreaker_count / 2, 1.0)
        
        # Preferences
        pref_count = len(self.profile.get("preferences", {}))
        score += weights["preferences"] * min(pref_count / 3, 1.0)
        
        self.profile["confidence_score"] = round(score, 2)
    
    async def simulate_response(self, context_message: str, context: List[Dict], 
                               scenario: str) -> str:
        """
        Generate a response in a simulation scenario (representing the user)
        
        Args:
            context_message: The message to respond to
            context: Previous conversation context
            scenario: The simulation scenario type
            
        Returns:
            Simulated response as the user
        """
        profile_summary = json.dumps(self.profile, indent=2)
        context_str = json.dumps(context[-6:] if len(context) > 6 else context, indent=2)
        
        simulation_prompt = f"""You are simulating how a real person would respond in a dating scenario.

Person's Profile:
{profile_summary}

Scenario: {scenario}

Recent Conversation:
{context_str}

Latest Message to Respond To:
{context_message}

Generate a natural, authentic response that this person would give based on their personality, values, and communication style. 

Guidelines:
- Stay true to their personality traits and values
- Use their typical communication style
- Be realistic - include natural imperfections
- Show their sense of humor if appropriate
- React authentically based on their emotional intelligence
- Keep response 1-3 sentences (natural conversation length)

Generate ONLY the response text, nothing else."""

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{"role": "user", "content": simulation_prompt}]
        )
        
        return response.content[0].text
    
    def get_profile(self) -> Dict:
        """Return current profile"""
        return self.profile
    
    def get_profile_summary(self) -> str:
        """Generate human-readable profile summary"""
        profile = self.profile
        
        summary_parts = []
        
        if profile.get("personality_traits"):
            summary_parts.append(f"Personality: {', '.join(profile['personality_traits'][:5])}")
        
        if profile.get("values"):
            summary_parts.append(f"Values: {', '.join(profile['values'][:4])}")
        
        if profile.get("interests"):
            summary_parts.append(f"Interests: {', '.join(profile['interests'][:5])}")
        
        if profile.get("relationship_goals"):
            summary_parts.append(f"Looking for: {', '.join(profile['relationship_goals'])}")
        
        return "\n".join(summary_parts) if summary_parts else "Profile still building..."
