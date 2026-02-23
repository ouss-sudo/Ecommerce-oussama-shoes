
import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Camera as CameraIcon, X, Info } from "lucide-react";
import type { TryOnSettings } from "../types";
import { Smoother, getFootTransform } from "../lib/tryon";
import { getStrapiMedia } from "../lib/api";

interface VirtualTryOnProps {
    overlayUrl: string | null;
    settings?: TryOnSettings;
    onClose?: () => void;
}

const loadScript = (src: string): Promise<void> =>
    new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement("script");
        s.src = src; s.crossOrigin = "anonymous";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed: ${src}`));
        document.body.appendChild(s);
    });

export function VirtualTryOn({ overlayUrl, settings, onClose }: VirtualTryOnProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Off-screen canvases for compositing
    const bgCanvas = useRef<HTMLCanvasElement>(document.createElement("canvas"));
    const shoeCanvas = useRef<HTMLCanvasElement>(document.createElement("canvas"));
    const segCanvas = useRef<HTMLCanvasElement>(document.createElement("canvas"));

    const imgRef = useRef<HTMLImageElement | null>(null);
    const imgReady = useRef(false);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const smX = useRef(new Smoother(0.18));
    const smY = useRef(new Smoother(0.18));
    const smSc = useRef(new Smoother(0.10));
    const smRot = useRef(new Smoother(0.15));
    const smKneeX = useRef(new Smoother(0.18));
    const smKneeY = useRef(new Smoother(0.18));

    // Pre-load shoe image
    useEffect(() => {
        imgReady.current = false;
        imgRef.current = null;
        if (!overlayUrl) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = getStrapiMedia(overlayUrl) ?? "";
        img.onload = () => { imgRef.current = img; imgReady.current = true; };
    }, [overlayUrl]);

    const onResults = useCallback((results: any) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const W = canvas.width, H = canvas.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Sync off-screen canvas sizes
        [bgCanvas.current, shoeCanvas.current, segCanvas.current].forEach(c => {
            c.width = W; c.height = H;
        });

        // ── LAYER 0: camera background ─────────────────────────
        const bgCtx = bgCanvas.current.getContext("2d")!;
        bgCtx.clearRect(0, 0, W, H);
        bgCtx.drawImage(results.image, 0, 0, W, H);

        // ── LAYER 1: shoe overlay ───────────────────────────────
        const shoeCtx = shoeCanvas.current.getContext("2d")!;
        shoeCtx.clearRect(0, 0, W, H);

        let sX = 0, sY = 0, sKneeXVal = 0, sKneeYVal = 0;
        let shoeVisible = false;

        if (results.poseLandmarks && imgReady.current && imgRef.current) {
            const tr = getFootTransform(results.poseLandmarks);
            if (tr) {
                shoeVisible = true;
                sX = smX.current.update(tr.x * W);
                sY = smY.current.update(tr.y * H);
                const sSc = smSc.current.update(tr.scale * W);
                const sR = smRot.current.update(tr.rotation);

                // Track knee for occlusion (if visible)
                if (tr.knee) {
                    sKneeXVal = smKneeX.current.update(tr.knee.x * W);
                    sKneeYVal = smKneeY.current.update(tr.knee.y * H);
                } else {
                    smKneeX.current.reset(); smKneeY.current.reset();
                }

                // ALIGNMENT FIX: 
                // We anchor at the Ankle. The shoe image is usually centered. 
                // We need to shift the shoe so the "Ankle Opening" of the shoe aligns with the detected Ankle.
                // Generally: Shift Forward (towards toe) and Down (towards sole).

                // ALIGNMENT FIX: 
                // We anchor at the Ankle. The shoe image is usually centered. 
                // We need to shift the shoe so the "Ankle Opening" of the shoe aligns with the detected Ankle.
                // Generally: Shift Forward (towards toe) and Down (towards sole).

                const baseScale = settings?.scale ?? 2.2;
                const baseRot = (settings?.rotation ?? 0) * (Math.PI / 180);
                const offX = (settings?.offsetX ?? 0) * sSc;
                const offY = (settings?.offsetY ?? 0.05) * sSc;

                const w = sSc * baseScale;
                const ar = imgRef.current.naturalWidth / imgRef.current.naturalHeight;
                const h = w / ar;

                // Direction fix (+PI)
                let finalRot = sR + baseRot + Math.PI;
                while (finalRot > Math.PI) finalRot -= 2 * Math.PI;
                while (finalRot <= -Math.PI) finalRot += 2 * Math.PI;
                const flip = Math.abs(finalRot) > Math.PI / 2;

                shoeCtx.save();

                // Contact shadow
                const sg = shoeCtx.createRadialGradient(sX, sY + h * 0.42, 0, sX, sY + h * 0.42, w * 0.5);
                sg.addColorStop(0, "rgba(0,0,0,0.40)");
                sg.addColorStop(1, "rgba(0,0,0,0.00)");
                shoeCtx.save();
                shoeCtx.scale(1, 0.25);
                shoeCtx.fillStyle = sg;
                shoeCtx.beginPath();
                shoeCtx.ellipse(sX, (sY + h * 0.5) * 4, w * 0.5, w * 0.5, 0, 0, Math.PI * 2);
                shoeCtx.fill();
                shoeCtx.restore();

                // Draw shoe with drop-shadow
                shoeCtx.shadowColor = "rgba(0,0,0,0.55)";
                shoeCtx.shadowBlur = 20;
                shoeCtx.shadowOffsetY = 8;

                if (flip) {
                    shoeCtx.translate(sX, sY);
                    shoeCtx.scale(1, -1);
                    shoeCtx.translate(-sX, -sY);
                }
                shoeCtx.translate(sX + offX, sY + offY);
                shoeCtx.rotate(sR + baseRot + Math.PI);
                shoeCtx.drawImage(imgRef.current, -w / 2, -h / 2, w, h);

                shoeCtx.restore();
            }
        }

        // ── LAYER 2: Leg Occlusion Mask ──────────────────────────────
        // We want to draw the person (leg) ON TOP of the shoe, but *only* the leg part.
        // This makes the foot appear INSIDE the shoe (shoe covers foot, leg covers shoe ankle).

        const segCtx = segCanvas.current.getContext("2d")!;
        segCtx.clearRect(0, 0, W, H);

        const hasValidKnee = sKneeXVal !== 0 && sKneeYVal !== 0;

        if (shoeVisible && results.segmentationMask && hasValidKnee) {
            segCtx.save();

            // 1. Create the shape of the "Leg Area" (from ankle upwards to knee)
            segCtx.beginPath();

            // Vector from Ankle to Knee
            const dx = sKneeXVal - sX;
            const dy = sKneeYVal - sY;
            const legLen = Math.hypot(dx, dy);

            if (legLen > 1) {
                // Perpendicular vector
                const perpX = -dy / legLen;
                const perpY = dx / legLen;
                const width = legLen * 0.6; // Wide enough to cover the leg thickness

                // Define a polygon that starts at the ankle and goes up past the knee
                // We start slightly "up" the leg to allow the shoe tongue to show? 
                // Or start exactly at ankle? Let's start at ankle.

                segCtx.moveTo(sX - perpX * width, sY - perpY * width);
                segCtx.lineTo(sX + perpX * width, sY + perpY * width);
                segCtx.lineTo(sKneeXVal + perpX * width, sKneeYVal + perpY * width);
                segCtx.lineTo(sKneeXVal - perpX * width, sKneeYVal - perpY * width);
                segCtx.closePath();

                // 2. Clip to this leg area
                segCtx.clip();

                // 3. Draw the segmentation mask inside this area
                segCtx.drawImage(results.segmentationMask, 0, 0, W, H);

                // 4. Composite the person image into the mask
                segCtx.globalCompositeOperation = "source-in";
                segCtx.drawImage(results.image, 0, 0, W, H);
            }

            segCtx.restore();
        }

        // ── COMPOSITE final output ──────────────────────────────────────
        ctx.clearRect(0, 0, W, H);
        // 1. Background (camera frame)
        ctx.drawImage(bgCanvas.current, 0, 0);
        // 2. Shoe (Now visible ON TOP of the foot)
        ctx.drawImage(shoeCanvas.current, 0, 0);
        // 3. Leg Occlusion (Leg covers the top of the shoe, creating depth)
        ctx.drawImage(segCanvas.current, 0, 0);

    }, [settings]);

    useEffect(() => {
        let camera: any = null, pose: any = null;

        const init = async () => {
            if (!videoRef.current || !canvasRef.current) return;
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: true });
                s.getTracks().forEach(t => t.stop());

                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js");
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");

                // @ts-ignore
                const PoseClass = window.Pose;
                // @ts-ignore
                const CameraClass = window.Camera;
                if (!PoseClass || !CameraClass) throw new Error("MediaPipe failed to load.");

                pose = new PoseClass({
                    locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
                });

                pose.setOptions({
                    modelComplexity: 1,
                    smoothLandmarks: true,
                    enableSegmentation: true,       // KEY: needed for occlusion
                    smoothSegmentation: true,
                    minDetectionConfidence: 0.35,
                    minTrackingConfidence: 0.45,
                });

                pose.onResults(onResults);

                camera = new CameraClass(videoRef.current, {
                    onFrame: async () => { if (pose) await pose.send({ image: videoRef.current }); },
                    width: 640, height: 480,
                });

                await camera.start();
                setIsLoading(false);
            } catch (err: any) {
                const msg =
                    err?.name === "NotAllowedError" ? "Accès caméra refusé." :
                        err?.name === "NotFoundError" ? "Aucune caméra trouvée." :
                            err?.message ?? "Erreur caméra.";
                setError(msg);
                setIsLoading(false);
            }
        };

        init();
        return () => { camera?.stop(); pose?.close(); };
    }, [onResults]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-black shadow-2xl border border-zinc-800">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent px-4 py-3">
                    <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                        <CameraIcon className="w-4 h-4 text-purple-400" />
                        Virtual Try-On
                        <span className="text-[9px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-500/30">
                            Smart Occlusion
                        </span>
                    </h3>
                    <button onClick={onClose} className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/25 transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Viewport */}
                <div className="relative aspect-[4/3] w-full bg-zinc-950">
                    <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-0" playsInline muted />
                    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" width={640} height={480} />

                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
                            <div className="relative mb-5">
                                <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                                <div className="absolute inset-0 animate-ping rounded-full bg-purple-500/15" />
                            </div>
                            <p className="text-sm tracking-widest text-zinc-400 uppercase font-medium">Initialisation IA…</p>
                            <p className="text-xs text-zinc-600 mt-1">Chargement du modèle</p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-8 text-center">
                            <Info className="h-10 w-10 text-red-500 mb-4" />
                            <p className="text-sm font-medium text-white mb-5">{error}</p>
                            <button onClick={onClose} className="px-8 py-2 bg-white text-black rounded-full font-bold text-sm">Fermer</button>
                        </div>
                    )}

                    {!isLoading && !error && (
                        <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
                            <p className="text-white/60 text-xs bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
                                👟 Pointez la caméra vers vos pieds
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-zinc-950 px-4 py-2.5 flex items-center justify-between border-t border-zinc-800/60">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                        <p className="text-zinc-500 text-xs">Suivi du pied en temps réel activé</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
