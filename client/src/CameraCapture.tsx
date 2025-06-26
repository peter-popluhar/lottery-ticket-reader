import React, { useRef, useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  loading: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanFeedback, setScanFeedback] = useState({
    isPositioned: false,
    confidence: 0,
    message: 'Position ticket within the frame',
  });
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);
  const animationFrameRef = useRef<number | null>(null);
  const autoCaptureTimeoutRef = useRef<number | null>(null);
  const lastAutoCaptureRef = useRef<number>(0);
  const lastAnalysisTimeRef = useRef<number>(0);

  console.log(123)

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } } });
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (autoCaptureTimeoutRef.current) {
      clearTimeout(autoCaptureTimeoutRef.current);
      autoCaptureTimeoutRef.current = null;
    }
  };

  const toggleCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    stopCamera();
    await startCamera(newMode);
  };

  // Real-time image analysis for positioning feedback (throttled with requestAnimationFrame)
  const analyzeImage = useCallback(() => {
    if (!videoRef.current || !analysisCanvasRef.current || !streaming) return;
    const now = performance.now();
    if (now - lastAnalysisTimeRef.current < 120) {
      animationFrameRef.current = window.requestAnimationFrame(analyzeImage);
      return;
    }
    lastAnalysisTimeRef.current = now;
    const video = videoRef.current;
    const canvas = analysisCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    // Downscale for analysis
    const analysisWidth = 640;
    const analysisHeight = 480;
    canvas.width = analysisWidth;
    canvas.height = analysisHeight;
    ctx.drawImage(video, 0, 0, analysisWidth, analysisHeight);
    const imageData = ctx.getImageData(0, 0, analysisWidth, analysisHeight);
    const data = imageData.data;
    let edgeCount = 0;
    let totalPixels = 0;
    let darkPixels = 0;
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const brightness = (r + g + b) / 3;
      if (brightness < 100) darkPixels++;
      totalPixels++;
      if (i > 4 && i < data.length - 4) {
        const prevR = data[i - 4] ?? 0;
        const prevG = data[i - 3] ?? 0;
        const prevB = data[i - 2] ?? 0;
        const prevBrightness = (prevR + prevG + prevB) / 3;
        if (Math.abs(brightness - prevBrightness) > 30) {
          edgeCount++;
        }
      }
    }
    const edgeDensity = edgeCount / (totalPixels || 1);
    const contrastRatio = darkPixels / (totalPixels || 1);
    const confidence = Math.min(100, (edgeDensity * 1000 + contrastRatio * 100) / 2);
    const isPositioned = confidence > 15 && contrastRatio > 0.1 && edgeDensity > 0.01;
    let message = 'Position ticket within the frame';
    if (confidence > 30) {
      message = 'Great! Hold steady...';
    } else if (confidence > 15) {
      message = 'Getting closer...';
    } else if (confidence > 5) {
      message = 'Move ticket into frame';
    }
    setScanFeedback(prev => {
      // Only update if changed to avoid unnecessary renders
      if (
        prev.isPositioned !== isPositioned ||
        Math.abs(prev.confidence - confidence) > 1 ||
        prev.message !== message
      ) {
        return { isPositioned, confidence, message };
      }
      return prev;
    });
    // Only trigger auto-capture once per good positioning event
    if (isPositioned && confidence > 25 && autoCaptureEnabled) {
      const now = Date.now();
      if (now - lastAutoCaptureRef.current > 2000) {
        lastAutoCaptureRef.current = now;
        if (autoCaptureTimeoutRef.current) {
          clearTimeout(autoCaptureTimeoutRef.current);
        }
        autoCaptureTimeoutRef.current = window.setTimeout(() => {
          captureImage();
        }, 800);
      }
    } else {
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
        autoCaptureTimeoutRef.current = null;
      }
    }
    // Continue the loop
    animationFrameRef.current = window.requestAnimationFrame(analyzeImage);
  }, [streaming, autoCaptureEnabled]);

  // Start/stop analysis loop
  useEffect(() => {
    if (streaming) {
      animationFrameRef.current = window.requestAnimationFrame(analyzeImage);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
        autoCaptureTimeoutRef.current = null;
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
        autoCaptureTimeoutRef.current = null;
      }
    };
  }, [streaming, analyzeImage]);

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
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, maxWidth: 400 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Camera Capture</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        {!streaming ? (
          <Button onClick={() => startCamera()} variant="contained" fullWidth>Start Camera</Button>
        ) : (
          <Button onClick={stopCamera} variant="contained" color="secondary" fullWidth>Stop Camera</Button>
        )}
        <Button onClick={toggleCamera} variant="outlined" fullWidth disabled={streaming}>
          Switch to {facingMode === 'environment' ? 'Front' : 'Rear'} Camera
        </Button>
      </Box>
      <Box sx={{ mb: 1 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={autoCaptureEnabled}
            onChange={(e) => setAutoCaptureEnabled(e.target.checked)}
          />
          <Typography variant="body2">Auto-capture when positioned</Typography>
        </label>
      </Box>
      <Box sx={{ position: 'relative', mb: 1, borderRadius: 2, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', display: streaming ? 'block' : 'none', borderRadius: 8 }}
        />
        <canvas ref={analysisCanvasRef} style={{ display: 'none' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {streaming && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
          }}>
            {/* Scanning frame */}
            <Box sx={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '80%',
              height: '80%',
              border: `2px solid ${scanFeedback.isPositioned ? '#4CAF50' : '#FF9800'}`,
              borderRadius: 2,
              boxShadow: '0 0 10px rgba(0,0,0,0.3)',
            }} />
            {/* Corner indicators */}
            {[
              { top: '8%', left: '8%' },
              { top: '8%', right: '8%' },
              { bottom: '8%', left: '8%' },
              { bottom: '8%', right: '8%' },
            ].map((pos, i) => (
              <Box key={i} sx={{
                position: 'absolute',
                ...pos,
                width: 20,
                height: 20,
                border: `3px solid ${scanFeedback.isPositioned ? '#4CAF50' : '#FF9800'}`,
                borderTop: 'none',
                borderLeft: 'none',
                transform: `rotate(${i * 90}deg)`,
              }} />
            ))}
            {/* Feedback message */}
            <Box sx={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 2,
              fontSize: 14,
              textAlign: 'center',
            }}>
              {scanFeedback.message}
            </Box>
            {/* Confidence indicator */}
            <Box sx={{
              position: 'absolute',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: 12,
            }}>
              {Math.round(scanFeedback.confidence)}% confidence
            </Box>
          </Box>
        )}
      </Box>
      {streaming && (
        <Button
          onClick={captureImage}
          variant="contained"
          fullWidth
          sx={{
            mb: 1,
            backgroundColor: scanFeedback.isPositioned ? '#4CAF50' : '#FF9800',
            color: 'white',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: scanFeedback.isPositioned ? '#388E3C' : '#F57C00',
            },
          }}
        >
          {scanFeedback.isPositioned ? 'Capture Now' : 'Capture Anyway'}
        </Button>
      )}
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
};

export default CameraCapture; 
