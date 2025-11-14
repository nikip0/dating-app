import React, { useState } from 'react';
import { profileAPI } from '../api';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    ageRange: '25-34',
    gender: '',
    interestedIn: '',
    bio: '',
    relationshipGoals: 'unsure',
    textingTone: {
      positivity: 50,
      playfulness: 50,
      responseLength: 50,
    },
    selfRatedAttractiveness: 3,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      textingTone: {
        ...prev.textingTone,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.gender || !formData.interestedIn || !formData.bio) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.bio.length < 20) {
      setError('Bio should be at least 20 characters');
      return;
    }

    setLoading(true);

    try {
      await profileAPI.create(formData);
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome to AI Dating Agent</h1>
        <p style={styles.subtitle}>
          I'm your personal dating coach. Let's get to know you!
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Basic Info */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Basic Info</h2>

            <div style={styles.field}>
              <label style={styles.label}>Name / Nickname *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="What should I call you?"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Age Range *</label>
              <select
                name="ageRange"
                value={formData.ageRange}
                onChange={handleInputChange}
                style={styles.select}
              >
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55+">55+</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Gender *</label>
              <input
                type="text"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="e.g., Man, Woman, Non-binary"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Interested In *</label>
              <input
                type="text"
                name="interestedIn"
                value={formData.interestedIn}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="e.g., Women, Men, Everyone"
              />
            </div>
          </div>

          {/* About You */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>About You</h2>

            <div style={styles.field}>
              <label style={styles.label}>Bio *</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                style={styles.textarea}
                placeholder="Tell me a bit about yourself..."
                rows={4}
              />
              <small style={styles.hint}>{formData.bio.length} characters (min 20)</small>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Relationship Goals</label>
              <select
                name="relationshipGoals"
                value={formData.relationshipGoals}
                onChange={handleInputChange}
                style={styles.select}
              >
                <option value="casual">Casual dating</option>
                <option value="serious">Serious relationship</option>
                <option value="unsure">Not sure yet</option>
                <option value="friends">Friends first</option>
              </select>
            </div>
          </div>

          {/* Texting Style */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Your Texting Style</h2>

            <div style={styles.field}>
              <label style={styles.label}>
                Positivity: {formData.textingTone.positivity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.textingTone.positivity}
                onChange={(e) => handleSliderChange('positivity', Number(e.target.value))}
                style={styles.slider}
              />
              <div style={styles.sliderLabels}>
                <span>Neutral/Serious</span>
                <span>Very Positive</span>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Playfulness: {formData.textingTone.playfulness}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.textingTone.playfulness}
                onChange={(e) => handleSliderChange('playfulness', Number(e.target.value))}
                style={styles.slider}
              />
              <div style={styles.sliderLabels}>
                <span>Straightforward</span>
                <span>Very Playful</span>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Response Length: {formData.textingTone.responseLength}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.textingTone.responseLength}
                onChange={(e) => handleSliderChange('responseLength', Number(e.target.value))}
                style={styles.slider}
              />
              <div style={styles.sliderLabels}>
                <span>Short & Concise</span>
                <span>Long & Detailed</span>
              </div>
            </div>
          </div>

          {/* Self-Rating */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Optional</h2>

            <div style={styles.field}>
              <label style={styles.label}>
                Self-rated Attractiveness (optional)
              </label>
              <div style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, selfRatedAttractiveness: rating }))}
                    style={{
                      ...styles.ratingButton,
                      ...(formData.selfRatedAttractiveness === rating ? styles.ratingButtonActive : {}),
                    }}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <small style={styles.hint}>
                This is completely optional and self-reported. It helps me understand your confidence level.
              </small>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? 'Creating Profile...' : 'Start My Journey →'}
          </button>
        </form>
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
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#718096',
    textAlign: 'center',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '8px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#4a5568',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  select: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#718096',
  },
  ratingContainer: {
    display: 'flex',
    gap: '8px',
  },
  ratingButton: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    fontWeight: '500',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  ratingButtonActive: {
    background: '#667eea',
    color: 'white',
    borderColor: '#667eea',
  },
  hint: {
    fontSize: '12px',
    color: '#a0aec0',
  },
  error: {
    padding: '12px',
    background: '#fed7d7',
    color: '#c53030',
    borderRadius: '8px',
    fontSize: '14px',
  },
  submitButton: {
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
};

export default Onboarding;
