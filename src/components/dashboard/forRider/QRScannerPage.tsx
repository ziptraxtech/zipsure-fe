import React, { useState, useRef, useCallback, useEffect } from 'react';
import {X, Camera, AlertCircle, SwitchCamera } from 'lucide-react';
import jsQR from 'jsqr';
import { useIsMobile } from '@/hooks/use-mobile';

const QRScannerPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scannedUrl, setScannedUrl] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back camera, 'user' = front camera
  const [availableCameras, setAvailableCameras] = useState([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check available cameras on component mount
    checkAvailableCameras();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const checkAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
    } catch (err) {
      console.error('Error checking cameras:', err);
    }
  };

  const startCamera = useCallback(async (requestedFacingMode = facingMode) => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop existing camera first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: requestedFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      await videoRef.current.play();
      setIsCameraOpen(true);
      setIsLoading(false);
      setFacingMode(requestedFacingMode);

      scanQRCode();
    } catch (err) {
      console.error('Camera error:', err);
      setError(`Failed to access ${requestedFacingMode === 'environment' ? 'back' : 'front'} camera`);
      setIsLoading(false);
    }
  }, [facingMode]);

  const toggleCamera = useCallback(async () => {
    if (!isCameraOpen || availableCameras.length < 2) return;
    
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    await startCamera(newFacingMode);
  }, [isCameraOpen, facingMode, availableCameras.length, startCamera]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current._eventListeners) {
      const { handleLoadedMetadata, handleCanPlay, handleError } = videoRef.current._eventListeners || {};
      if (handleLoadedMetadata) videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (handleCanPlay) videoRef.current.removeEventListener('canplay', handleCanPlay);
      if (handleError) videoRef.current.removeEventListener('error', handleError);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
    setIsLoading(false);
    setScannedUrl(null);
  }, []);

  const scanQRCode = () => {
    const scan = () => {
      if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scan);
        return;
      }

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const factor = isMobile ? 0.8 : 0.6;
      const boxSize = Math.floor(Math.min(canvas.width, canvas.height) * factor);
      const roiX = Math.floor((canvas.width - boxSize) / 2);
      const roiY = Math.floor((canvas.height - boxSize) / 2);
      const imageData = ctx.getImageData(roiX, roiY, boxSize, boxSize);

      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        if (code.data !== scannedUrl) {
          setScannedUrl(code.data);
        }
      }

      requestAnimationFrame(scan);
    };

    requestAnimationFrame(scan);
  };

  const handleClose = () => {
    stopCamera();
    setError(null);
  };

  return (
    <div className="relative h-full overflow-hidden bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Gradient overlay */}
      <div 
        className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(206,122,122,0.15)_0%,rgba(255,255,255,0)_70%] pointer-events-none"
        aria-hidden="true"
      />

      <div className="container mx-auto p-4 max-w-2xl h-full flex flex-col overflow-hidden">
        <div className="bg-white rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-bold mb-4">Scan QR</h1>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Reset camera">
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Camera and Scanning */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="relative flex-1 bg-black overflow-hidden">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${isCameraOpen ? 'block' : 'hidden'}`}
                autoPlay
                muted
                playsInline
                controls={false}
              />

              {/* Camera Toggle Button */}
              {isCameraOpen &&  !scannedUrl && (
                <button
                  onClick={toggleCamera}
                  className="absolute top-4 right-4 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all duration-200 z-10"
                  title={`Switch to ${facingMode === 'environment' ? 'front' : 'back'} camera`}
                  disabled={isLoading}
                >
                  <SwitchCamera className="h-5 w-5 text-white" />
                </button>
              )}

              {error && (
                <div className="absolute inset-0 h-full flex items-center justify-center">
                  <div className="text-center text-white p-6">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                    <p className="mb-4">{error}</p>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => startCamera(facingMode)} disabled={isLoading} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
                        {isLoading ? 'Loading...' : 'Try Again'}
                      </button>
                      {availableCameras.length > 1 && (
                        <button 
                          onClick={() => startCamera(facingMode === 'environment' ? 'user' : 'environment')} 
                          disabled={isLoading} 
                          className="px-6 py-3 bg-green-600 text-white rounded-lg"
                        >
                          Try {facingMode === 'environment' ? 'Front' : 'Back'} Camera
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!isCameraOpen && !error && !scannedUrl && (
                <div className="absolute inset-0 h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-xl mb-2">Ready to open camera</h2>
                    <p className="text-sm text-gray-300 mb-4">
                      {availableCameras.length > 1 ? `${availableCameras.length} cameras available` : 'Camera ready'}
                    </p>
                    <button onClick={() => startCamera()} disabled={isLoading} className="px-6 py-3 bg-primary text-white rounded-lg">
                      {isLoading ? '⏳ Loading camera...' : '📷 Open Camera'}
                    </button>
                  </div>
                </div>
              )}

              {isCameraOpen && !scannedUrl && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className="relative aspect-square w-[80%] md:w-[60%] max-w-[600px] rounded-xl"
                    style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' }}
                  >
                    {/* Frame */}
                    <div className="absolute inset-0 rounded-xl border-2 border-white/80" />
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                    
                  </div>
                </div>
              )}

              {scannedUrl && (
                <div className="absolute inset-0 h-full flex items-center justify-center bg-black bg-opacity-75 text-white p-6">
                  <div className="text-center">
                    <p className="mb-4 break-all">Scanned URL: {scannedUrl.toLowerCase()}</p>
                    <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          const url = scannedUrl.startsWith('http://') || scannedUrl.startsWith('https://')
                            ? scannedUrl
                            : `https://${scannedUrl}`;
                          window.open(url, '_blank');
                        }}
                        className="px-6 py-3 bg-primary text-white rounded-lg w-full sm:w-auto"
                      >
                        Open in Browser
                      </button>
                      <button onClick={() => setScannedUrl(null)} className="px-6 py-3 bg-gray-600 text-white rounded-lg w-full sm:w-auto">
                        Scan Again
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;