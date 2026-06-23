"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Camera, Keyboard, AlertTriangle } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [manualInput, setManualInput] = useState("");
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const lastCodeRef = useRef<string>("");
  const lastCodeTimeRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);

        const { default: Quagga } = await import("@ericblade/quagga2");

        Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              target: videoRef.current as any,
              constraints: {
                facingMode: "environment",
              },
            },
            decoder: {
              readers: [
                "ean_reader",
                "ean_8_reader",
                "code_128_reader",
                "code_39_reader",
                "upc_reader",
                "upc_e_reader",
                "codabar_reader",
              ],
            },
            locate: true,
          },
          (err) => {
            if (err) {
              console.error("Quagga init error:", err);
              setError("Camera initialized but barcode detection unavailable. Use manual input.");
              stopCamera();
              setCameraAvailable(false);
              return;
            }
            Quagga.start();
          }
        );

        Quagga.onDetected((result) => {
          if (!result || !result.codeResult) return;
          const code = result.codeResult.code;
          if (!code) return;
          const now = Date.now();
          if (code === lastCodeRef.current && now - lastCodeTimeRef.current < 2000) {
            return;
          }
          lastCodeRef.current = code;
          lastCodeTimeRef.current = now;
          Quagga.stop();
          stopCamera();
          onScan(code);
        });
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraAvailable(false);
      setError("Camera not available. Please use manual input below.");
    }
  }, [onScan, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      try {
        import("@ericblade/quagga2").then((m) => m.default.stop());
      } catch {}
    };
  }, []);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
    }
  }

  function handleClose() {
    stopCamera();
    try {
      import("@ericblade/quagga2").then((m) => m.default.stop());
    } catch {}
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-[#2a2a3a] bg-[#111118] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2a2a3a] px-5 py-4">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-[#d4a843]" />
            <h3 className="text-base font-semibold text-[#f0f0f5]">Scan Barcode</h3>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#606070] hover:bg-[#1c1c28] hover:text-[#f0f0f5]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/10 p-3 text-sm text-[#f59e0b]">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {cameraAvailable && (
            <div className="mb-4 overflow-hidden rounded-xl border border-[#2a2a3a]">
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-1/2 w-3/4 rounded-lg border-2 border-dashed border-[#d4a843]/60" />
                </div>
                {scanning && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-[#d4a843] backdrop-blur-sm">
                      Scanning...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-[#2a2a3a] pt-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-[#9090a0]">
              <Keyboard size={14} />
              <span>Or enter barcode manually</span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Type or paste barcode/SKU..."
                autoFocus
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="btn btn-primary shrink-0"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
