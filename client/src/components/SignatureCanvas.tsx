import { useRef, forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import SignaturePad from 'react-signature-canvas';

interface SignatureCanvasProps {
  onEnd?: () => void;
}

export interface SignatureCanvasRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ onEnd }, ref) => {
    const sigPadRef = useRef<SignaturePad>(null);
    const [savedSignature, setSavedSignature] = useState<string | null>(null);

    // Save signature data when drawing ends
    const handleEnd = useCallback(() => {
      if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
        const dataUrl = sigPadRef.current.toDataURL('image/png');
        setSavedSignature(dataUrl);
      }
      onEnd?.();
    }, [onEnd]);

    // Restore signature when canvas becomes visible again (after scroll/resize)
    useEffect(() => {
      const restoreSignature = () => {
        if (savedSignature && sigPadRef.current) {
          // Check if canvas is empty but we have saved data
          if (sigPadRef.current.isEmpty()) {
            sigPadRef.current.fromDataURL(savedSignature, {
              width: sigPadRef.current.getCanvas().width,
              height: sigPadRef.current.getCanvas().height,
            });
          }
        }
      };

      // Restore on visibility change
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          setTimeout(restoreSignature, 100);
        }
      };

      // Restore on scroll (for mobile browsers that clear canvas on scroll)
      const handleScroll = () => {
        setTimeout(restoreSignature, 50);
      };

      // Restore on resize
      const handleResize = () => {
        setTimeout(restoreSignature, 100);
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize);

      // Initial restore
      restoreSignature();

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }, [savedSignature]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        sigPadRef.current?.clear();
        setSavedSignature(null);
      },
      isEmpty: () => {
        // Check both canvas and saved signature
        return (sigPadRef.current?.isEmpty() ?? true) && !savedSignature;
      },
      toDataURL: () => {
        // Return saved signature if canvas is empty but we have saved data
        if (sigPadRef.current?.isEmpty() && savedSignature) {
          return savedSignature;
        }
        return sigPadRef.current?.toDataURL('image/png') ?? savedSignature ?? '';
      },
    }));

    return (
      <div className="relative">
        <div className="signature-canvas overflow-hidden">
          <SignaturePad
            ref={sigPadRef}
            canvasProps={{
              className: 'w-full h-40 bg-white',
              style: { width: '100%', height: '160px' },
            }}
            onEnd={handleEnd}
            penColor="#1a1a1a"
            minWidth={1.5}
            maxWidth={3}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            sigPadRef.current?.clear();
            setSavedSignature(null);
          }}
          className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
          aria-label="מחק חתימה"
        >
          ✕
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          חתום באצבע או בעכבר
        </p>
      </div>
    );
  }
);

SignatureCanvas.displayName = 'SignatureCanvas';

export default SignatureCanvas;
