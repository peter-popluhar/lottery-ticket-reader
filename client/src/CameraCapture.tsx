import React, { useRef, useState } from 'react';

const CameraCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL('image/png'));
      }
    }
    stopCamera();
  };

  return (
    <div style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: 400 }}>
      <h2>Camera Capture</h2>
      {!streaming ? (
        <button onClick={startCamera} style={{ marginBottom: '10px' }}>Start Camera</button>
      ) : (
        <button onClick={stopCamera} style={{ marginBottom: '10px' }}>Stop Camera</button>
      )}
      <div style={{ marginBottom: '10px' }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: streaming ? 'block' : 'none', borderRadius: '8px' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      {streaming && (
        <button onClick={captureImage} style={{ marginBottom: '10px' }}>Capture Photo</button>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {capturedImage && (
        <div style={{ marginTop: '10px' }}>
          <h3>Captured Image:</h3>
          <img src={capturedImage} alt="Captured" style={{ width: '100%', borderRadius: '8px' }} />
        </div>
      )}
    </div>
  );
};

export default CameraCapture; 
