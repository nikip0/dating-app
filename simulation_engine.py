"""
Simulation Engine for Dating App
Runs 100+ dating simulations between AI agents to test compatibility
"""

import anthropic
import json
from typing import Dict, List
from datetime import datetime
import os
import asyncio

class SimulationEngine:
    """Runs dating simulations between two AI agents"""
    
    # Simulation scenarios with prompts
    SCENARIOS = {
        "first_date_coffee": {
            "opening": "You're both at a cozy coffee shop for a first date. The atmosphere is relaxed and comfortable. Start the conversation naturally.",
            "turns": 15,
            "focus": ["chemistry", "conversation_flow", "initial_attraction"]
        },
        "values_discussion": {
            "opening": "You're having a deeper conversation about what matters most to you in life and relationships. Be authentic and open.",
            "turns": 20,
            "focus": ["value_alignment", "depth", "authenticity"]
        },
        "conflict_scenario": {
            "opening": "You're discussing where to live - one prefers the city for career opportunities, the other prefers suburbs for space and quiet. Navigate this difference.",
            "turns": 15,
            "focus": ["conflict_resolution", "respect", "compromise"]
        },
        "future_planning": {
            "opening": "You're talking about where you each see yourselves in 5 years - career, lifestyle, relationship goals.",
            "turns": 15,
            "focus": ["goal_alignment", "compatibility", "ambition"]
        },
        "stress_handling": {
            "opening": "One of you just had a terrible day at work - everything went wrong. The other is there to listen and support.",
            "turns": 12,
            "focus": ["emotional_support", "empathy", "reliability"]
        },
        "humor_test": {
            "opening": "You're both in a playful mood. Share jokes, funny stories, or just banter. See if your humor clicks.",
            "turns": 12,
            "focus": ["humor_compatibility", "playfulness", "wit"]
        },
        "vulnerability": {
            "opening": "You're sharing something you've struggled with - being emotionally open and vulnerable with each other.",
            "turns": 18,
            "focus": ["emotional_depth", "vulnerability", "trust"]
        },
        "daily_life": {
            "opening": "You're discussing your typical weekday and weekend routines - how you spend your time, what a normal day looks like.",
            "turns": 12,
            "focus": ["lifestyle_compatibility", "practical_alignment", "routine"]
        },
        "adventure_planning": {
            "opening": "You're planning a weekend trip together. Discuss what kind of activities and experiences you'd want to have.",
            "turns": 14,
            "focus": ["adventure_compatibility", "planning_style", "interests"]
        },
        "intellectual_discussion": {
            "opening": "You're having a stimulating conversation about a topic you both find interesting - current events, philosophy, or a shared interest.",
            "turns": 16,
            "focus": ["intellectual_compatibility", "curiosity", "engagement"]
        }
    }
    
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    async def run_simulation_batch(self, agent_a, agent_b, 
                                   num_simulations: int = 100) -> List[Dict]:
        """
        Run multiple simulations between two agents
        
        Args:
            agent_a: First user's AI agent
            agent_b: Second user's AI agent
            num_simulations: Number of simulations to run (default 100)
            
        Returns:
            List of simulation results
        """
        results = []
        scenarios = list(self.SCENARIOS.keys())
        
        # Distribute simulations across scenarios
        sims_per_scenario = num_simulations // len(scenarios)
        extra_sims = num_simulations % len(scenarios)
        
        for i, scenario in enumerate(scenarios):
            # Run base number plus one extra for first N scenarios
            count = sims_per_scenario + (1 if i < extra_sims else 0)
            
            print(f"Running {count} simulations for scenario: {scenario}")
            
            for sim_num in range(count):
                try:
                    result = await self.run_single_simulation(agent_a, agent_b, scenario)
                    results.append(result)
                    print(f"  Completed simulation {sim_num + 1}/{count}")
                except Exception as e:
                    print(f"  Error in simulation {sim_num + 1}: {e}")
        
        return results
    
    async def run_single_simulation(self, agent_a, agent_b, 
                                   scenario: str) -> Dict:
        """
        Run a single dating simulation
        
        Args:
            agent_a: First user's AI agent
            agent_b: Second user's AI agent
            scenario: Scenario type to simulate
            
        Returns:
            Simulation result with conversation and metrics
        """
        scenario_config = self.SCENARIOS[scenario]
        conversation = []
        
        # Initialize with scenario
        message = scenario_config["opening"]
        
        # Run conversation turns
        for turn in range(scenario_config["turns"]):
            # Agent A (User A) responds
            response_a = await agent_a.simulate_response(
                message,
                conversation,
                scenario
            )
            conversation.append({
                "turn": turn * 2 + 1,
                "speaker": "user_a",
                "message": response_a
            })
            
            # Agent B (User B) responds
            response_b = await agent_b.simulate_response(
                response_a,
                conversation,
                scenario
            )
            conversation.append({
                "turn": turn * 2 + 2,
                "speaker": "user_b",
                "message": response_b
            })
            
            message = response_b
        
        # Analyze simulation
        metrics = await self._analyze_simulation(
            conversation, 
            scenario, 
            scenario_config["focus"]
        )
        
        return {
            "scenario": scenario,
            "conversation": conversation,
            "metrics": metrics,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _analyze_simulation(self, conversation: List[Dict], 
                                 scenario: str, focus_areas: List[str]) -> Dict:
        """
        Analyze simulation quality and compatibility
        
        Args:
            conversation: The simulated conversation
            scenario: Scenario type
            focus_areas: Key areas to evaluate
            
        Returns:
            Metrics dictionary with scores
        """
        conversation_text = "\n".join([
            f"{msg['speaker']}: {msg['message']}" 
            for msg in conversation
        ])
        
        analysis_prompt = f"""Analyze this simulated dating conversation between two people.

Scenario: {scenario}
Focus Areas: {', '.join(focus_areas)}

Conversation:
{conversation_text}

Rate the following aspects on a scale of 0-10:

1. **Natural Flow & Chemistry**: Does the conversation flow naturally? Is there spark/chemistry?
2. **Value Alignment**: Do they seem to share similar core values?
3. **Emotional Connection**: Is there emotional resonance and understanding?
4. **Conflict Resolution**: How well do they handle disagreement or tension? (if applicable, otherwise estimate based on communication style)
5. **Humor Compatibility**: Do they make each other laugh? Is humor well-matched?
6. **Conversational Depth**: Does the conversation go beyond surface level?
7. **Mutual Engagement**: Are both people equally engaged and interested?
8. **Long-term Potential**: Based on this interaction, would this relationship have potential?

Scenario-Specific Evaluation for: {', '.join(focus_areas)}

Return your analysis as a JSON object with scores and brief reasoning:
{{
    "natural_flow": <0-10>,
    "value_alignment": <0-10>,
    "emotional_connection": <0-10>,
    "conflict_resolution": <0-10>,
    "humor_compatibility": <0-10>,
    "conversational_depth": <0-10>,
    "mutual_engagement": <0-10>,
    "long_term_potential": <0-10>,
    "overall_score": <0-10>,
    "summary": "Brief 2-3 sentence summary of the interaction quality",
    "strengths": ["strength1", "strength2"],
    "concerns": ["concern1", "concern2"] 
}}

Be objective and realistic. Look for genuine compatibility signals, not just politeness."""

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
            
            metrics = json.loads(analysis_text.strip())
            return metrics
            
        except Exception as e:
            print(f"Analysis error: {e}")
            # Return default scores on error
            return {
                "natural_flow": 5,
                "value_alignment": 5,
                "emotional_connection": 5,
                "conflict_resolution": 5,
                "humor_compatibility": 5,
                "conversational_depth": 5,
                "mutual_engagement": 5,
                "long_term_potential": 5,
                "overall_score": 5,
                "summary": "Analysis unavailable",
                "strengths": [],
                "concerns": ["Analysis error occurred"]
            }


class MatchingAlgorithm:
    """Calculates compatibility scores from simulation results"""
    
    @staticmethod
    def calculate_compatibility_score(simulation_results: List[Dict], 
                                     profile_a: Dict, profile_b: Dict) -> Dict:
        """
        Calculate overall compatibility score from all simulations
        
        Args:
            simulation_results: List of all simulation results
            profile_a: First user's profile
            profile_b: Second user's profile
            
        Returns:
            Compatibility analysis with score and breakdown
        """
        if not simulation_results:
            return {
                "overall_score": 0,
                "confidence": "low",
                "breakdown": {}
            }
        
        # Extract metrics from all simulations
        all_metrics = [sim["metrics"] for sim in simulation_results]
        
        # Calculate average scores across all simulations
        metric_keys = [
            "natural_flow",
            "value_alignment", 
            "emotional_connection",
            "conflict_resolution",
            "humor_compatibility",
            "conversational_depth",
            "mutual_engagement",
            "long_term_potential"
        ]
        
        avg_metrics = {}
        for key in metric_keys:
            scores = [m.get(key, 0) for m in all_metrics]
            avg_metrics[key] = round(sum(scores) / len(scores), 2) if scores else 0
        
        # Weighted scoring
        # More weight on: value alignment, emotional connection, long-term potential
        weights = {
            "natural_flow": 0.10,
            "value_alignment": 0.20,
            "emotional_connection": 0.18,
            "conflict_resolution": 0.12,
            "humor_compatibility": 0.10,
            "conversational_depth": 0.10,
            "mutual_engagement": 0.08,
            "long_term_potential": 0.12
        }
        
        weighted_score = sum(
            avg_metrics.get(key, 0) * weight 
            for key, weight in weights.items()
        )
        
        # Add profile alignment bonus (0-15 points)
        profile_bonus = MatchingAlgorithm._calculate_profile_alignment(
            profile_a, 
            profile_b
        )
        
        # Final score (0-100)
        final_score = min(100, round((weighted_score * 10) + profile_bonus, 1))
        
        # Determine confidence level
        confidence = MatchingAlgorithm._determine_confidence(
            len(simulation_results),
            profile_a.get("confidence_score", 0),
            profile_b.get("confidence_score", 0)
        )
        
        # Get top strengths and concerns
        all_strengths = []
        all_concerns = []
        for sim in simulation_results:
            all_strengths.extend(sim["metrics"].get("strengths", []))
            all_concerns.extend(sim["metrics"].get("concerns", []))
        
        # Count occurrences and get top items
        from collections import Counter
        strength_counts = Counter(all_strengths)
        concern_counts = Counter(all_concerns)
        
        top_strengths = [item for item, count in strength_counts.most_common(5)]
        top_concerns = [item for item, count in concern_counts.most_common(3)]
        
        return {
            "overall_score": final_score,
            "confidence": confidence,
            "simulation_count": len(simulation_results),
            "breakdown": avg_metrics,
            "profile_alignment_bonus": profile_bonus,
            "top_strengths": top_strengths,
            "top_concerns": top_concerns,
            "recommendation": MatchingAlgorithm._generate_recommendation(
                final_score,
                top_strengths,
                top_concerns
            )
        }
    
    @staticmethod
    def _calculate_profile_alignment(profile_a: Dict, profile_b: Dict) -> float:
        """
        Calculate bonus points for profile alignment
        
        Returns:
            Bonus score (0-15 points)
        """
        score = 0.0
        
        # Shared values (0-5 points)
        values_a = set(profile_a.get("values", []))
        values_b = set(profile_b.get("values", []))
        if values_a and values_b:
            shared_values = len(values_a & values_b)
            total_values = len(values_a | values_b)
            score += (shared_values / total_values) * 5 if total_values > 0 else 0
        
        # Shared interests (0-4 points)
        interests_a = set(profile_a.get("interests", []))
        interests_b = set(profile_b.get("interests", []))
        if interests_a and interests_b:
            shared_interests = len(interests_a & interests_b)
            total_interests = len(interests_a | interests_b)
            score += (shared_interests / total_interests) * 4 if total_interests > 0 else 0
        
        # Relationship goal alignment (0-4 points)
        goals_a = set(profile_a.get("relationship_goals", []))
        goals_b = set(profile_b.get("relationship_goals", []))
        if goals_a and goals_b:
            shared_goals = len(goals_a & goals_b)
            score += min(shared_goals * 2, 4)
        
        # Deal-breaker check (can subtract up to -3 points)
        dealbreakers_a = set(profile_a.get("deal_breakers", []))
        dealbreakers_b = set(profile_b.get("deal_breakers", []))
        # Simple check: if there are obvious conflicts in goals/values
        conflicting_values = dealbreakers_a & values_b
        if conflicting_values:
            score -= len(conflicting_values) * 1.5
        
        return max(0, min(15, round(score, 1)))
    
    @staticmethod
    def _determine_confidence(sim_count: int, conf_a: float, conf_b: float) -> str:
        """
        Determine confidence level in the match
        
        Returns:
            Confidence level: "low", "medium", "high"
        """
        # Need sufficient simulations and profile data
        profile_conf = (conf_a + conf_b) / 2
        
        if sim_count >= 80 and profile_conf >= 0.7:
            return "high"
        elif sim_count >= 50 and profile_conf >= 0.5:
            return "medium"
        else:
            return "low"
    
    @staticmethod
    def _generate_recommendation(score: float, strengths: List[str], 
                                concerns: List[str]) -> str:
        """Generate a recommendation based on compatibility score"""
        if score >= 80:
            return f"Excellent match! Strong compatibility across multiple dimensions. Key strengths: {', '.join(strengths[:3]) if strengths else 'great overall chemistry'}."
        elif score >= 65:
            return f"Promising match with good potential. Notable strengths: {', '.join(strengths[:2]) if strengths else 'solid connection'}. Areas to explore: {', '.join(concerns[:2]) if concerns else 'communication styles'}."
        elif score >= 50:
            return f"Moderate compatibility. Some alignment in {', '.join(strengths[:2]) if strengths else 'certain areas'}. Consider: {', '.join(concerns[:2]) if concerns else 'whether core values align'}."
        else:
            return f"Limited compatibility indicated. Consider whether {', '.join(concerns[:3]) if concerns else 'fundamental differences in values or communication'} are surmountable."
