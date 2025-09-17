import React, { useState, useRef, useCallback, useEffect } from 'react';
import { QrCode, X, Camera, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

const QRScannerPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scannedUrl, setScannedUrl] = useState(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      await videoRef.current.play();
      setIsCameraOpen(true);
      setIsLoading(false);

      scanQRCode();
    } catch (err) {
      console.error('Camera error:', err);
      setError('Failed to access camera');
      setIsLoading(false);
    }
  }, []);

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

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

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

    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Gradient overlay */}
      <div 
        className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(206,122,122,0.15)_0%,rgba(255,255,255,0)_70%] pointer-events-none"
        aria-hidden="true"
      />

    <div className="container mx-auto p-4 max-w-2xl h-screen flex flex-col">
      <div className="bg-white rounded-lg shadow-lg flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <QrCode className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-semibold">Scan QR</h1>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Reset camera">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Camera and Scanning */}
        <div className="flex-1 flex flex-col">
          <div className="relative flex-1 bg-black">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${isCameraOpen ? 'block' : 'hidden'}`}
              autoPlay
              muted
              playsInline
              controls={false}
            />

            {error && (
              <div className="absolute inset-0 h-full flex items-center justify-center">
                <div className="text-center text-white p-6">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                  <p className="mb-4">{error}</p>
                  <button onClick={startCamera} disabled={isLoading} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
                    {isLoading ? 'Loading...' : 'Try Again'}
                  </button>
                </div>
              </div>
            )}

            {!isCameraOpen && !error && !scannedUrl && (
              <div className="absolute inset-0 h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h2 className="text-xl mb-2">Ready to open camera</h2>
                  <button onClick={startCamera} disabled={isLoading} className="px-6 py-3 bg-primary text-white rounded-lg">
                    {isLoading ? '⏳ Loading camera...' : '📷 Open Camera'}
                  </button>
                </div>
              </div>
            )}

            {scannedUrl && (
              <div className="absolute inset-0 h-full flex items-center justify-center bg-black bg-opacity-75 text-white p-6">
                <div className="text-center">
                  <p className="mb-4 break-all">Scanned URL: {scannedUrl.toLowerCase()}</p>
                  <button
                    onClick={() => {
                      const url = scannedUrl.startsWith('http://') || scannedUrl.startsWith('https://')
                        ? scannedUrl
                        : `https://${scannedUrl}`;
                      window.open(url, '_blank');
                    }}
                    className="px-6 py-3 bg-primary text-white rounded-lg mr-4"
                  >
                    Open in Browser
                  </button>

                  <button onClick={() => setScannedUrl(null)} className="px-6 py-3 bg-gray-600 text-white rounded-lg">
                    Scan Again
                  </button>
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
