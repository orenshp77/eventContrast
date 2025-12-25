import { useRef, forwardRef, useImperativeHandle } from 'react';
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

    useImperativeHandle(ref, () => ({
      clear: () => {
        sigPadRef.current?.clear();
      },
      isEmpty: () => {
        return sigPadRef.current?.isEmpty() ?? true;
      },
      toDataURL: () => {
        return sigPadRef.current?.toDataURL('image/png') ?? '';
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
            onEnd={onEnd}
            penColor="#1a1a1a"
            minWidth={1.5}
            maxWidth={3}
          />
        </div>
        <button
          type="button"
          onClick={() => sigPadRef.current?.clear()}
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
