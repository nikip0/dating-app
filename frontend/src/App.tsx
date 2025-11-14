import { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import PhotoUpload from './components/PhotoUpload';
import Chat from './components/Chat';
import type { AppStep } from './types';
import { profileAPI } from './api';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('onboarding');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[App] Component mounted');
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    console.log('[App] Checking for existing profile...');
    try {
      const response = await profileAPI.get();
      console.log('[App] Profile response:', response);
      if (response.success && response.profile) {
        // Profile exists, skip to chat
        setCurrentStep('chat');
      }
    } catch (err) {
      // No profile exists, stay on onboarding
      console.log('[App] No existing profile found', err);
    } finally {
      console.log('[App] Setting loading to false');
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setCurrentStep('photos');
  };

  const handlePhotosComplete = () => {
    setCurrentStep('chat');
  };

  const handlePhotosSkip = () => {
    setCurrentStep('chat');
  };

  if (loading) {
    console.log('[App] Rendering loading state...');
    return (
      <div style={styles.loading}>
        <div style={styles.loadingSpinner}>Loading Dating App...</div>
      </div>
    );
  }

  console.log('[App] Rendering current step:', currentStep);
  return (
    <>
      {currentStep === 'onboarding' && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
      {currentStep === 'photos' && (
        <PhotoUpload onComplete={handlePhotosComplete} onSkip={handlePhotosSkip} />
      )}
      {currentStep === 'chat' && <Chat />}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  loadingSpinner: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
  },
};

export default App;
