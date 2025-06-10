import React, { useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  loading: boolean
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch {
      setError('Unable to access camera.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  };

  const toggleCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    stopCamera();
    await startCamera(newMode);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured.png', { type: 'image/png' });
            onCapture(file);
          }
        }, 'image/png');
      }
    }
    stopCamera();
  };

  return (
    <div style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: 400 }}>
      <h2>Camera Capture</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        {!streaming ? (
          <button onClick={() => startCamera()} style={{ flex: 1 }}>Start Camera</button>
        ) : (
          <button onClick={stopCamera} style={{ flex: 1 }}>Stop Camera</button>
        )}
        <button onClick={toggleCamera} style={{ flex: 1 }} disabled={streaming}>
          Switch to {facingMode === 'environment' ? 'Front' : 'Rear'} Camera
        </button>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: streaming ? 'block' : 'none', borderRadius: '8px' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      {streaming && (
        <button onClick={captureImage} style={{ marginBottom: '10px', width: '100%' }}>Capture Photo</button>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default CameraCapture; 
