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

        [bgCanvas.current, shoeCanvas.current, segCanvas.current].forEach(c => {
            c.width = W; c.height = H;
        });

        // LAYER 0: Background
        const bgCtx = bgCanvas.current.getContext("2d")!;
        bgCtx.drawImage(results.image, 0, 0, W, H);

        const shoeCtx = shoeCanvas.current.getContext("2d")!;
        shoeCtx.clearRect(0, 0, W, H);

        let sX = 0, sY = 0, shoeVisible = false;
        let sKneeXVal = 0, sKneeYVal = 0;

        if (results.poseLandmarks && imgReady.current && imgRef.current) {
            const tr = getFootTransform(results.poseLandmarks);
            if (tr) {
                shoeVisible = true;
                sX = smX.current.update(tr.x * W);
                sY = smY.current.update(tr.y * H);
                const sSc = smSc.current.update(tr.scale * W);
                const sR = smRot.current.update(tr.rotation);

                if (tr.knee) {
                    sKneeXVal = smKneeX.current.update(tr.knee.x * W);
                    sKneeYVal = smKneeY.current.update(tr.knee.y * H);
                }

                const baseScale = settings?.scale ?? 2.2;
                const baseRot = (settings?.rotation ?? 0) * (Math.PI / 180);
                const offX = (settings?.offsetX ?? 0) * sSc;
                const offY = (settings?.offsetY ?? 0.05) * sSc;

                const w = sSc * baseScale;
                const ar = imgRef.current.naturalWidth / imgRef.current.naturalHeight;
                const h = w / ar;

                let finalRot = sR + baseRot + Math.PI;
                while (finalRot > Math.PI) finalRot -= 2 * Math.PI;
                while (finalRot <= -Math.PI) finalRot += 2 * Math.PI;
                const flip = Math.abs(finalRot) > Math.PI / 2;

                shoeCtx.save();
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

        const segCtx = segCanvas.current.getContext("2d")!;
        segCtx.clearRect(0, 0, W, H);
        if (shoeVisible && results.segmentationMask && sKneeXVal !== 0) {
            segCtx.save();
            segCtx.beginPath();
            const dx = sKneeXVal - sX, dy = sKneeYVal - sY;
            const legLen = Math.hypot(dx, dy);
            if (legLen > 1) {
                const px = -dy/legLen, py = dx/legLen, wd = legLen * 0.6;
                segCtx.moveTo(sX - px*wd, sY - py*wd);
                segCtx.lineTo(sX + px*wd, sY + py*wd);
                segCtx.lineTo(sKneeXVal + px*wd, sKneeYVal + py*wd);
                segCtx.lineTo(sKneeXVal - px*wd, sKneeYVal - py*wd);
                segCtx.closePath(); segCtx.clip();
                segCtx.drawImage(results.segmentationMask, 0, 0, W, H);
                segCtx.globalCompositeOperation = "source-in";
                segCtx.drawImage(results.image, 0, 0, W, H);
            }
            segCtx.restore();
        }

        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(bgCanvas.current, 0, 0);
        ctx.drawImage(shoeCanvas.current, 0, 0);
        ctx.drawImage(segCanvas.current, 0, 0);

    }, [settings]);

    useEffect(() => {
        let camera: any = null, pose: any = null;
        const init = async () => {
            if (!videoRef.current || !canvasRef.current) return;
            try {
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js");
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
                // @ts-ignore
                const PoseClass = window.Pose;
                // @ts-ignore
                const CameraClass = window.Camera;
                pose = new PoseClass({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
                pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, enableSegmentation: true, minDetectionConfidence: 0.5 });
                pose.onResults(onResults);
                camera = new CameraClass(videoRef.current, {
                    onFrame: async () => { if (pose) await pose.send({ image: videoRef.current }); },
                    width: 640, height: 480,
                });
                await camera.start();
                setIsLoading(false);
            } catch (err: any) {
                setError(err?.message ?? "Erreur caméra.");
                setIsLoading(false);
            }
        };
        init();
        return () => { camera?.stop(); pose?.close(); };
    }, [onResults]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-black shadow-2xl">
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-4 py-3">
                    <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                        <CameraIcon className="w-4 h-4 text-purple-400" />
                        Virtual Try-On
                    </h3>
                    <button onClick={onClose} className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative aspect-[4/3] w-full bg-zinc-950">
                    <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-0" playsInline muted />
                    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" width={640} height={480} />
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Initialisation IA...</p>
                        </div>
                    )}
                </div>

                <div className="bg-black px-6 py-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Suivi du pied actif</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
