import { useState, useEffect, useRef } from 'react';
import { chatAPI, simulationAPI } from '../api';
import type { ChatMessage, SimulationResults } from '../types';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await chatAPI.getHistory();
      if (response.success) {
        setMessages(response.messages);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending) return;

    const content = inputValue.trim();
    setInputValue('');
    setSending(true);

    try {
      const response = await chatAPI.sendMessage(content);
      if (response.success) {
        // Reload entire chat history to get both user and agent messages
        await loadChatHistory();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleRunSimulations = async () => {
    setRunningSimulation(true);

    try {
      const response = await simulationAPI.run();
      if (response.success) {
        setSimulationResults(response.results);
        // Reload chat to show simulation messages
        await loadChatHistory();
      }
    } catch (err) {
      console.error('Failed to run simulations:', err);
    } finally {
      setRunningSimulation(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.chatContainer}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>AI Dating Coach</h2>
            <p style={styles.headerSubtitle}>Your personal matchmaking assistant</p>
          </div>
          <button
            onClick={handleRunSimulations}
            disabled={runningSimulation}
            style={styles.simulationButton}
          >
            {runningSimulation ? 'Running Simulations...' : 'Run 50 Simulations'}
          </button>
        </div>

        {/* Messages */}
        <div style={styles.messagesContainer}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.messageWrapper,
                ...(message.sender === 'user' ? styles.messageWrapperUser : styles.messageWrapperAgent),
              }}
            >
              <div
                style={{
                  ...styles.messageBubble,
                  ...(message.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleAgent),
                }}
              >
                <div style={styles.messageContent}>{message.content}</div>
                <div style={styles.messageTime}>{formatTimestamp(message.timestamp)}</div>
              </div>
            </div>
          ))}
          {sending && (
            <div style={styles.messageWrapperAgent}>
              <div style={styles.messageBubbleAgent}>
                <div style={styles.typingIndicator}>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} style={styles.inputContainer}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            style={styles.input}
            disabled={sending}
          />
          <button
            type="submit"
            style={styles.sendButton}
            disabled={sending || !inputValue.trim()}
          >
            Send
          </button>
        </form>

        {/* Simulation Results Sidebar */}
        {simulationResults && (
          <div style={styles.resultsSidebar}>
            <h3 style={styles.resultsTitle}>Your Vibe Analysis</h3>

            <div style={styles.resultsSection}>
              <h4 style={styles.resultsSectionTitle}>Compatibility Score</h4>
              <div style={styles.scoreCircle}>
                <span style={styles.scoreValue}>{simulationResults.average_compatibility}</span>
                <span style={styles.scoreLabel}>/100</span>
              </div>
            </div>

            <div style={styles.resultsSection}>
              <h4 style={styles.resultsSectionTitle}>Top Match Archetypes</h4>
              <ul style={styles.resultsList}>
                {simulationResults.top_archetypes.slice(0, 3).map((archetype, index) => (
                  <li key={index} style={styles.resultsListItem}>
                    {archetype}
                  </li>
                ))}
              </ul>
            </div>

            <div style={styles.resultsSection}>
              <h4 style={styles.resultsSectionTitle}>Your Strengths</h4>
              <ul style={styles.resultsList}>
                {simulationResults.vibe_analysis.strengths.slice(0, 3).map((strength, index) => (
                  <li key={index} style={styles.resultsListItem}>
                    ✓ {strength}
                  </li>
                ))}
              </ul>
            </div>

            {simulationResults.vibe_analysis.areas_to_improve.length > 0 && (
              <div style={styles.resultsSection}>
                <h4 style={styles.resultsSectionTitle}>Areas to Improve</h4>
                <ul style={styles.resultsList}>
                  {simulationResults.vibe_analysis.areas_to_improve.map((area, index) => (
                    <li key={index} style={styles.resultsListItem}>
                      → {area}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  chatContainer: {
    background: 'white',
    borderRadius: '16px',
    maxWidth: '1200px',
    width: '100%',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    position: 'relative',
  },
  header: {
    padding: '24px',
    borderBottom: '2px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a202c',
    margin: 0,
  },
  headerSubtitle: {
    fontSize: '14px',
    color: '#718096',
    margin: '4px 0 0 0',
  },
  simulationButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  messageWrapper: {
    display: 'flex',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperAgent: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '12px',
    wordWrap: 'break-word',
  },
  messageBubbleUser: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  messageBubbleAgent: {
    background: '#f7fafc',
    color: '#1a202c',
  },
  messageContent: {
    fontSize: '16px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  messageTime: {
    fontSize: '12px',
    marginTop: '4px',
    opacity: 0.7,
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
  },
  inputContainer: {
    padding: '24px',
    borderTop: '2px solid #e2e8f0',
    display: 'flex',
    gap: '12px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
  },
  sendButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  resultsSidebar: {
    position: 'absolute',
    right: '0',
    top: '0',
    bottom: '0',
    width: '300px',
    background: 'white',
    borderLeft: '2px solid #e2e8f0',
    overflowY: 'auto',
    padding: '24px',
  },
  resultsTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '24px',
  },
  resultsSection: {
    marginBottom: '24px',
  },
  resultsSectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  scoreCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
  scoreValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: 'white',
  },
  scoreLabel: {
    fontSize: '14px',
    color: 'white',
    opacity: 0.9,
  },
  resultsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  resultsListItem: {
    fontSize: '14px',
    color: '#2d3748',
    padding: '8px 0',
    borderBottom: '1px solid #e2e8f0',
  },
};

export default Chat;
