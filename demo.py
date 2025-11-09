"""
Demo Script - iMessage AI Dating App
Demonstrates the full flow: conversation, profiling, simulation, matching
"""

import asyncio
import json
from ai_agent import UserAIAgent
from simulation_engine import SimulationEngine, MatchingAlgorithm


async def demo_conversation(agent: UserAIAgent, user_name: str):
    """Simulate a conversation with the AI agent"""
    print(f"\n{'='*60}")
    print(f"CONVERSATION WITH {user_name.upper()}")
    print(f"{'='*60}\n")
    
    # Sample conversation messages
    messages = [
        "Hey! I'm excited to try this out",
        "I'm really passionate about my career in tech, but I also value work-life balance. I love hiking on weekends and trying new restaurants",
        "I'd say I'm pretty introverted but I enjoy deep one-on-one conversations. Large parties aren't really my thing",
        "Family is super important to me. I'm close with my siblings and I definitely want kids someday",
        "I appreciate when someone can make me laugh but also have serious conversations about life. And I'm attracted to ambition and kindness",
        "I'd want someone who's emotionally mature and can communicate well, especially during disagreements"
    ]
    
    for msg in messages:
        print(f"User: {msg}")
        response = await agent.chat(msg)
        print(f"Agent: {response}\n")
        await asyncio.sleep(0.5)  # Slight delay for readability
    
    # Show profile
    print(f"\n{'='*60}")
    print(f"EXTRACTED PROFILE FOR {user_name.upper()}")
    print(f"{'='*60}")
    print(json.dumps(agent.get_profile(), indent=2))
    print(f"\nProfile Confidence: {agent.get_profile()['confidence_score']}")


async def demo_simulation(agent_a: UserAIAgent, agent_b: UserAIAgent):
    """Run a sample simulation between two agents"""
    print(f"\n{'='*60}")
    print("RUNNING DATING SIMULATIONS")
    print(f"{'='*60}\n")
    
    engine = SimulationEngine()
    
    # Run just a few simulations for demo (not full 100)
    print("Running 10 sample simulations across different scenarios...\n")
    results = await engine.run_simulation_batch(agent_a, agent_b, num_simulations=10)
    
    # Show one sample conversation
    sample_sim = results[0]
    print(f"\n{'='*60}")
    print(f"SAMPLE SIMULATION: {sample_sim['scenario'].upper()}")
    print(f"{'='*60}\n")
    
    for turn in sample_sim['conversation'][:6]:  # Show first 6 turns
        speaker = "User A" if turn['speaker'] == 'user_a' else "User B"
        print(f"{speaker}: {turn['message']}\n")
    
    print("...")
    print(f"\nSimulation Metrics:")
    print(json.dumps(sample_sim['metrics'], indent=2))
    
    return results


async def demo_matching(results, agent_a, agent_b):
    """Calculate and display match compatibility"""
    print(f"\n{'='*60}")
    print("CALCULATING COMPATIBILITY")
    print(f"{'='*60}\n")
    
    compatibility = MatchingAlgorithm.calculate_compatibility_score(
        results,
        agent_a.get_profile(),
        agent_b.get_profile()
    )
    
    print(f"Overall Compatibility Score: {compatibility['overall_score']}/100")
    print(f"Confidence Level: {compatibility['confidence']}")
    print(f"Number of Simulations: {compatibility['simulation_count']}")
    
    print(f"\nScore Breakdown:")
    for metric, score in compatibility['breakdown'].items():
        print(f"  {metric.replace('_', ' ').title()}: {score}/10")
    
    print(f"\nProfile Alignment Bonus: +{compatibility['profile_alignment_bonus']} points")
    
    print(f"\nTop Strengths:")
    for strength in compatibility['top_strengths']:
        print(f"  ✓ {strength}")
    
    if compatibility['top_concerns']:
        print(f"\nAreas to Consider:")
        for concern in compatibility['top_concerns']:
            print(f"  ⚠ {concern}")
    
    print(f"\nRecommendation:")
    print(f"  {compatibility['recommendation']}")


async def main():
    """Run the full demo"""
    print("\n" + "="*60)
    print("IMESSAGE AI DATING APP - FULL SYSTEM DEMO")
    print("="*60)
    
    # Create two users with different profiles
    print("\n🚀 Initializing two users...\n")
    
    user_a = UserAIAgent(user_id="user_a")
    user_b = UserAIAgent(user_id="user_b")
    
    # User A: Tech professional, introverted, family-oriented
    print("👤 USER A: Alex")
    await demo_conversation(user_a, "Alex")
    
    # User B: Creative professional, extroverted, adventurous
    print("\n👤 USER B: Jordan")
    
    messages_b = [
        "Hi! This is interesting",
        "I'm a graphic designer and I love what I do. I'm always working on side projects and creative stuff",
        "I'm definitely an extrovert - I get energy from being around people. I love going to concerts and art shows",
        "Family matters to me but I'm also very independent. I want to travel more before settling down",
        "I like someone who can keep up with my energy and spontaneity. Life's an adventure!",
        "I value honesty and openness. I don't like playing games - just say what you mean"
    ]
    
    for msg in messages_b:
        print(f"User: {msg}")
        response = await user_b.chat(msg)
        print(f"Agent: {response}\n")
        await asyncio.sleep(0.5)
    
    print(f"\n{'='*60}")
    print(f"EXTRACTED PROFILE FOR JORDAN")
    print(f"{'='*60}")
    print(json.dumps(user_b.get_profile(), indent=2))
    print(f"\nProfile Confidence: {user_b.get_profile()['confidence_score']}")
    
    # Run simulations
    simulation_results = await demo_simulation(user_a, user_b)
    
    # Calculate match
    await demo_matching(simulation_results, user_a, user_b)
    
    print("\n" + "="*60)
    print("DEMO COMPLETE!")
    print("="*60)
    print("\nThis demonstrates:")
    print("✓ AI agents learning about users through natural conversation")
    print("✓ Psychological profile extraction from conversations")
    print("✓ Running multiple dating simulations to test compatibility")
    print("✓ Comprehensive compatibility scoring and match recommendations")
    print("\nIn production, this would run:")
    print("• Throughout the week as users chat with their AI agents")
    print("• 100 simulations per user pair on Sunday nights")
    print("• Match notifications sent Monday mornings via iMessage/SMS")


if __name__ == "__main__":
    # Run the demo
    asyncio.run(main())
