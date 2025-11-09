"""
Backend Server for iMessage AI Dating App
Handles message webhooks, agent conversations, and matching system
"""

from flask import Flask, request, jsonify
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
import os
import json
import asyncio
from datetime import datetime
import redis
from ai_agent import UserAIAgent
from simulation_engine import SimulationEngine, MatchingAlgorithm

app = Flask(__name__)

# Initialize Twilio (for SMS/MMS - more accessible than iMessage Business)
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Initialize Redis for session management
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    decode_responses=True
)

# In-memory storage (replace with PostgreSQL in production)
user_agents = {}  # phone_number -> UserAIAgent
user_profiles = {}  # phone_number -> profile dict


def get_or_create_agent(phone_number: str) -> UserAIAgent:
    """Get existing agent or create new one for user"""
    if phone_number not in user_agents:
        # Try to load from Redis/DB
        profile_data = redis_client.get(f"profile:{phone_number}")
        profile = json.loads(profile_data) if profile_data else None
        
        user_agents[phone_number] = UserAIAgent(
            user_id=phone_number,
            profile=profile
        )
    
    return user_agents[phone_number]


def save_agent_profile(phone_number: str, agent: UserAIAgent):
    """Save agent profile to Redis/DB"""
    profile = agent.get_profile()
    redis_client.set(
        f"profile:{phone_number}",
        json.dumps(profile),
        ex=86400 * 30  # 30 day expiry
    )


@app.route('/webhook/sms', methods=['POST'])
def handle_sms():
    """
    Webhook endpoint for incoming SMS messages from Twilio
    """
    from_number = request.form.get('From')
    message_body = request.form.get('Body', '').strip()
    
    print(f"Received message from {from_number}: {message_body}")
    
    # Get or create AI agent for this user
    agent = get_or_create_agent(from_number)
    
    # Process message with agent
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    response_text = loop.run_until_complete(agent.chat(message_body))
    loop.close()
    
    # Save updated profile
    save_agent_profile(from_number, agent)
    
    # Send response via Twilio
    resp = MessagingResponse()
    resp.message(response_text)
    
    return str(resp)


@app.route('/api/profile/<phone_number>', methods=['GET'])
def get_profile(phone_number):
    """Get user profile"""
    agent = get_or_create_agent(phone_number)
    profile = agent.get_profile()
    
    return jsonify({
        "phone_number": phone_number,
        "profile": profile,
        "summary": agent.get_profile_summary()
    })


@app.route('/api/match/simulate', methods=['POST'])
def run_match_simulation():
    """
    Run simulation between two users
    Expects JSON: {"phone_a": "+1234567890", "phone_b": "+0987654321", "num_simulations": 100}
    """
    data = request.get_json()
    phone_a = data.get('phone_a')
    phone_b = data.get('phone_b')
    num_simulations = data.get('num_simulations', 100)
    
    if not phone_a or not phone_b:
        return jsonify({"error": "Both phone numbers required"}), 400
    
    # Get agents
    agent_a = get_or_create_agent(phone_a)
    agent_b = get_or_create_agent(phone_b)
    
    # Check profile readiness
    if agent_a.profile["confidence_score"] < 0.3:
        return jsonify({"error": "User A profile not ready (needs more conversation)"}), 400
    if agent_b.profile["confidence_score"] < 0.3:
        return jsonify({"error": "User B profile not ready (needs more conversation)"}), 400
    
    # Run simulations
    engine = SimulationEngine()
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    results = loop.run_until_complete(
        engine.run_simulation_batch(agent_a, agent_b, num_simulations)
    )
    loop.close()
    
    # Calculate compatibility
    compatibility = MatchingAlgorithm.calculate_compatibility_score(
        results,
        agent_a.profile,
        agent_b.profile
    )
    
    # Save results
    match_key = f"match:{phone_a}:{phone_b}"
    redis_client.set(
        match_key,
        json.dumps({
            "compatibility": compatibility,
            "simulation_results": results,
            "timestamp": datetime.utcnow().isoformat()
        }),
        ex=86400 * 7  # 7 day expiry
    )
    
    return jsonify({
        "status": "complete",
        "compatibility": compatibility,
        "num_simulations": len(results)
    })


@app.route('/api/match/results/<phone_a>/<phone_b>', methods=['GET'])
def get_match_results(phone_a, phone_b):
    """Get stored match results"""
    match_key = f"match:{phone_a}:{phone_b}"
    results = redis_client.get(match_key)
    
    if not results:
        # Try reverse order
        match_key = f"match:{phone_b}:{phone_a}"
        results = redis_client.get(match_key)
    
    if not results:
        return jsonify({"error": "No match results found"}), 404
    
    return jsonify(json.loads(results))


@app.route('/api/match/notify', methods=['POST'])
def notify_match():
    """
    Send match notification to user
    Expects JSON: {"phone_number": "+1234567890", "match_phone": "+0987654321"}
    """
    data = request.get_json()
    phone_number = data.get('phone_number')
    match_phone = data.get('match_phone')
    
    # Get match results
    match_key = f"match:{phone_number}:{match_phone}"
    results = redis_client.get(match_key)
    
    if not results:
        match_key = f"match:{match_phone}:{phone_number}"
        results = redis_client.get(match_key)
    
    if not results:
        return jsonify({"error": "No match results found"}), 404
    
    results_data = json.loads(results)
    compatibility = results_data["compatibility"]
    
    # Get match agent for profile summary
    match_agent = get_or_create_agent(match_phone)
    match_summary = match_agent.get_profile_summary()
    
    # Build notification message
    score = compatibility["overall_score"]
    recommendation = compatibility["recommendation"]
    
    message = f"""🎯 Your Weekly Match!

Compatibility Score: {score}/100
Confidence: {compatibility['confidence']}

{recommendation}

Profile Snapshot:
{match_summary}

Top Compatibility Strengths:
{chr(10).join('• ' + s for s in compatibility['top_strengths'][:3])}

Reply "YES" if you're interested in connecting, or "PASS" to see your next match."""

    # Send via Twilio
    twilio_client.messages.create(
        body=message,
        from_=TWILIO_PHONE_NUMBER,
        to=phone_number
    )
    
    return jsonify({"status": "notification_sent"})


@app.route('/api/weekly-matching', methods=['POST'])
def run_weekly_matching():
    """
    Run weekly matching for all active users
    This would be called by a cron job every Sunday night
    """
    # Get all active users from Redis
    all_profiles = redis_client.keys("profile:*")
    active_users = [key.replace("profile:", "") for key in all_profiles]
    
    if len(active_users) < 2:
        return jsonify({"error": "Not enough users for matching"}), 400
    
    results = []
    
    # For each user, find their best matches
    for user_phone in active_users:
        user_agent = get_or_create_agent(user_phone)
        
        # Skip if profile not ready
        if user_agent.profile["confidence_score"] < 0.4:
            continue
        
        # Get potential matches (all other users)
        candidates = [p for p in active_users if p != user_phone]
        
        best_matches = []
        
        # Run simulations with each candidate
        for candidate_phone in candidates[:10]:  # Limit to top 10 for demo
            # Check if we already have results
            match_key = f"match:{user_phone}:{candidate_phone}"
            existing = redis_client.get(match_key)
            
            if existing:
                match_data = json.loads(existing)
                compatibility = match_data["compatibility"]
            else:
                # Run new simulation
                candidate_agent = get_or_create_agent(candidate_phone)
                
                if candidate_agent.profile["confidence_score"] < 0.4:
                    continue
                
                engine = SimulationEngine()
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                sim_results = loop.run_until_complete(
                    engine.run_simulation_batch(user_agent, candidate_agent, 100)
                )
                loop.close()
                
                compatibility = MatchingAlgorithm.calculate_compatibility_score(
                    sim_results,
                    user_agent.profile,
                    candidate_agent.profile
                )
                
                # Save results
                redis_client.set(
                    match_key,
                    json.dumps({
                        "compatibility": compatibility,
                        "simulation_results": sim_results,
                        "timestamp": datetime.utcnow().isoformat()
                    }),
                    ex=86400 * 7
                )
            
            best_matches.append({
                "phone": candidate_phone,
                "score": compatibility["overall_score"],
                "compatibility": compatibility
            })
        
        # Sort by score and get top match
        best_matches.sort(key=lambda x: x["score"], reverse=True)
        
        if best_matches:
            top_match = best_matches[0]
            
            # Send notification
            notify_match_internal(user_phone, top_match["phone"])
            
            results.append({
                "user": user_phone,
                "match": top_match["phone"],
                "score": top_match["score"]
            })
    
    return jsonify({
        "status": "complete",
        "matches_sent": len(results),
        "results": results
    })


def notify_match_internal(phone_number: str, match_phone: str):
    """Internal function to send match notification"""
    match_key = f"match:{phone_number}:{match_phone}"
    results = redis_client.get(match_key)
    
    if not results:
        match_key = f"match:{match_phone}:{phone_number}"
        results = redis_client.get(match_key)
    
    if not results:
        return
    
    results_data = json.loads(results)
    compatibility = results_data["compatibility"]
    
    match_agent = get_or_create_agent(match_phone)
    match_summary = match_agent.get_profile_summary()
    
    score = compatibility["overall_score"]
    recommendation = compatibility["recommendation"]
    
    message = f"""🎯 Your Weekly Match!

Compatibility Score: {score}/100
Confidence: {compatibility['confidence']}

{recommendation}

Profile Snapshot:
{match_summary}

Top Compatibility Strengths:
{chr(10).join('• ' + s for s in compatibility['top_strengths'][:3])}

Reply "YES" if you're interested in connecting, or "PASS" to see your next match."""

    try:
        twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )
    except Exception as e:
        print(f"Error sending message to {phone_number}: {e}")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})


if __name__ == '__main__':
    # Run Flask app
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('DEBUG', 'false').lower() == 'true'
    )
