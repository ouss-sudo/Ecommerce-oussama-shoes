
import type { NormalizedLandmark } from "@mediapipe/pose";

// ── Exponential Moving Average Smoother ──────────────────────────────────────
export class Smoother {
    private value: number | null = null;
    private alpha: number;

    constructor(alpha = 0.2) {
        this.alpha = alpha;
    }

    update(newValue: number): number {
        if (this.value === null) { this.value = newValue; return newValue; }
        this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
        return this.value;
    }

    reset() { this.value = null; }
}

const getVis = (l: NormalizedLandmark | undefined) => (l?.visibility ?? 0);

export function getFootTransform(landmarks: NormalizedLandmark[]) {
    // MediaPipe Pose indices:
    //   27 = Left Ankle  |  28 = Right Ankle
    //   29 = Left Heel   |  30 = Right Heel
    //   31 = Left Toe    |  32 = Right Toe
    //   25 = Left Knee   |  26 = Right Knee

    const lAnkle = landmarks[27]; const lHeel = landmarks[29]; const lToe = landmarks[31];
    const rAnkle = landmarks[28]; const rHeel = landmarks[30]; const rToe = landmarks[32];

    const lKnee = landmarks[25];
    const rKnee = landmarks[26];

    // ── Lower threshold to improve detection rate ─────────────────────────
    const minConfidence = 0.25;

    // ── Robust Detection Score ───────────────────────────────────────────
    // Instead of average, check if we have enough key points.
    // We need at least Ankle and (Heel or Toe) to form a vector.

    // Check Left Foot
    const lVis = getVis(lAnkle) > minConfidence &&
        (getVis(lHeel) > minConfidence || getVis(lToe) > minConfidence);

    // Check Right Foot
    const rVis = getVis(rAnkle) > minConfidence &&
        (getVis(rHeel) > minConfidence || getVis(rToe) > minConfidence);

    if (!lVis && !rVis) return null;

    // ── Auto-select the most visible foot ────────────────────────────────
    // Prefer the one with better Ankle visibility
    // If only one is visible, pick that one.
    let isLeft = false;
    if (lVis && rVis) {
        isLeft = getVis(lAnkle) > getVis(rAnkle);
    } else if (lVis) {
        isLeft = true;
    } else {
        isLeft = false;
    }

    const ankle = isLeft ? lAnkle : rAnkle;
    const knee = isLeft ? lKnee : rKnee;
    let heel = isLeft ? lHeel : rHeel;
    let toe = isLeft ? lToe : rToe;

    // Safety check just in case
    if (!ankle) return null;

    // If heel or toe is completely missing (undefined/null), fail.
    // (Though with MediaPipe usually they exist but have low visibility, which we checked above)
    if (!heel || !toe) return null;

    // ── Sanity check ──────────────────────────────────────────────────────
    const dHeel = Math.hypot(heel.x - ankle.x, heel.y - ankle.y);
    const dToe = Math.hypot(toe.x - ankle.x, toe.y - ankle.y);
    if (dToe < dHeel) { const tmp = heel; heel = toe; toe = tmp; } // swap if inverted

    // ── Compute transform ─────────────────────────────────────────────────
    // STABILITY FIX (Retained): Use vector from Ankle -> Toe to determine direction.
    const dx = toe.x - ankle.x;
    const dy = toe.y - ankle.y;

    // Angle of the foot relative to the screen X-axis
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);

    // Use the ankle position as the anchor
    const cx = ankle.x;
    const cy = ankle.y;

    // Knee position for occlusion (optional)
    const kneePos = knee && getVis(knee) > minConfidence ? { x: knee.x, y: knee.y } : undefined;

    return { x: cx, y: cy, rotation: angle, scale: length, isLeft, knee: kneePos };
}
