import React, { useState } from 'react';
import { photoAPI } from '../api';
import type { PhotoVerification } from '../types';

interface PhotoUploadProps {
  onComplete: () => void;
  onSkip: () => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onComplete, onSkip }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [verification, setVerification] = useState<PhotoVerification | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files).slice(0, 3); // Max 3 photos
    setSelectedFiles(fileArray);

    // Generate previews
    const previewUrls = fileArray.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);

    // Clear previous verification
    setVerification(null);
    setError('');
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Create FileList-like object
      const dataTransfer = new DataTransfer();
      selectedFiles.forEach(file => dataTransfer.items.add(file));
      const fileList = dataTransfer.files;

      const response = await photoAPI.upload(fileList);

      if (response.success) {
        setVerification(response.verification);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    onComplete();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Upload Your Photos</h1>
        <p style={styles.subtitle}>
          Upload 1-3 photos so I can help verify consistency. This is optional but recommended!
        </p>

        <div style={styles.uploadSection}>
          <label style={styles.uploadLabel}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              multiple
              onChange={handleFileChange}
              style={styles.fileInput}
            />
            <div style={styles.uploadButton}>
              Choose Photos (Max 3)
            </div>
          </label>

          {previews.length > 0 && (
            <div style={styles.previewContainer}>
              {previews.map((preview, index) => (
                <div key={index} style={styles.previewItem}>
                  <img src={preview} alt={`Preview ${index + 1}`} style={styles.previewImage} />
                </div>
              ))}
            </div>
          )}

          {selectedFiles.length > 0 && !verification && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={styles.analyzeButton}
            >
              {uploading ? 'Analyzing Photos...' : 'Upload & Analyze Photos'}
            </button>
          )}

          {verification && (
            <div style={{
              ...styles.verificationBox,
              ...(verification.status === 'success' ? styles.verificationSuccess :
                  verification.status === 'inconclusive' ? styles.verificationWarning :
                  styles.verificationError)
            }}>
              <h3 style={styles.verificationTitle}>
                {verification.status === 'success' ? '✓ Verification Complete' :
                 verification.status === 'inconclusive' ? '⚠ Inconclusive' :
                 '✗ Verification Failed'}
              </h3>
              <p style={styles.verificationMessage}>{verification.message}</p>
              <p style={styles.verificationConfidence}>
                Confidence: {verification.confidence}%
              </p>
              <small style={styles.verificationDisclaimer}>
                Note: This is a basic consistency check, not true identity verification.
              </small>
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}
        </div>

        <div style={styles.actions}>
          {verification && (
            <button onClick={handleContinue} style={styles.continueButton}>
              Continue to Chat →
            </button>
          )}
          <button onClick={onSkip} style={styles.skipButton}>
            Skip for Now
          </button>
        </div>

        <div style={styles.info}>
          <h3 style={styles.infoTitle}>Why upload photos?</h3>
          <ul style={styles.infoList}>
            <li>Helps verify photo consistency (basic check only)</li>
            <li>All processing happens locally on the server</li>
            <li>Photos are NOT shared with anyone</li>
            <li>This is NOT a replacement for real identity verification</li>
          </ul>
        </div>
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
    maxWidth: '700px',
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
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '32px',
  },
  uploadLabel: {
    cursor: 'pointer',
  },
  fileInput: {
    display: 'none',
  },
  uploadButton: {
    padding: '20px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#667eea',
    background: 'white',
    border: '3px dashed #667eea',
    borderRadius: '12px',
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  previewContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  previewItem: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    aspectRatio: '1',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  analyzeButton: {
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
  verificationBox: {
    padding: '24px',
    borderRadius: '12px',
    border: '2px solid',
  },
  verificationSuccess: {
    background: '#f0fdf4',
    borderColor: '#22c55e',
  },
  verificationWarning: {
    background: '#fffbeb',
    borderColor: '#f59e0b',
  },
  verificationError: {
    background: '#fef2f2',
    borderColor: '#ef4444',
  },
  verificationTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  verificationMessage: {
    fontSize: '16px',
    marginBottom: '8px',
  },
  verificationConfidence: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '12px',
  },
  verificationDisclaimer: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  error: {
    padding: '12px',
    background: '#fed7d7',
    color: '#c53030',
    borderRadius: '8px',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  continueButton: {
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  skipButton: {
    padding: '12px',
    fontSize: '16px',
    color: '#667eea',
    background: 'transparent',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  info: {
    background: '#f7fafc',
    padding: '20px',
    borderRadius: '8px',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '12px',
  },
  infoList: {
    fontSize: '14px',
    color: '#4a5568',
    lineHeight: '1.6',
    paddingLeft: '20px',
  },
};

export default PhotoUpload;
