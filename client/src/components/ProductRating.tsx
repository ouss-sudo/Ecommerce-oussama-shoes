import { useState, useEffect, useRef } from "react";
import { Star, Send, Loader2, LogIn } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Review {
    id: number;
    documentId: string;
    rating: number;
    comment: string | null;
    username: string | null;
    createdAt: string;
    user: {
        id: number;
        username: string;
    } | null;
}

interface ProductRatingProps {
    productDocumentId: string;
    language?: "fr" | "en" | "ar";
    onRatingChange?: (avg: number, count: number) => void;
}

const i18n = {
    fr: {
        title: "Avis clients",
        loginPrompt: "Connectez-vous pour laisser un avis",
        loginBtn: "Se connecter",
        yourRating: "Votre note",
        commentLabel: "Commentaire (optionnel)",
        commentPlaceholder: "Partagez votre expérience avec ce produit...",
        submit: "Publier l'avis",
        submitting: "Envoi...",
        alreadyReviewed: "Vous avez déjà noté ce produit",
        success: "Votre avis a été publié !",
        noReviews: "Aucun avis pour le moment. Soyez le premier !",
        average: "Moyenne",
        reviews: "avis",
        anonymous: "Anonyme",
        errorRequired: "Veuillez sélectionner une note.",
        errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
        errorDuplicate: "Vous avez déjà noté ce produit.",
    },
    en: {
        title: "Customer Reviews",
        loginPrompt: "Log in to leave a review",
        loginBtn: "Log In",
        yourRating: "Your Rating",
        commentLabel: "Comment (optional)",
        commentPlaceholder: "Share your experience with this product...",
        submit: "Post Review",
        submitting: "Submitting...",
        alreadyReviewed: "You have already reviewed this product",
        success: "Your review has been published!",
        noReviews: "No reviews yet. Be the first!",
        average: "Average",
        reviews: "reviews",
        anonymous: "Anonymous",
        errorRequired: "Please select a rating.",
        errorGeneric: "An error occurred. Please try again.",
        errorDuplicate: "You have already reviewed this product.",
    },
    ar: {
        title: "آراء العملاء",
        loginPrompt: "سجل دخولك لترك تقييم",
        loginBtn: "تسجيل الدخول",
        yourRating: "تقييمك",
        commentLabel: "تعليق (اختياري)",
        commentPlaceholder: "شارك تجربتك مع هذا المنتج...",
        submit: "نشر التقييم",
        submitting: "جاري الإرسال...",
        alreadyReviewed: "لقد قيّمت هذا المنتج بالفعل",
        success: "تم نشر تقييمك!",
        noReviews: "لا توجد تقييمات بعد. كن أول من يقيّم!",
        average: "المتوسط",
        reviews: "تقييمات",
        anonymous: "مجهول",
        errorRequired: "يرجى اختيار تقييم.",
        errorGeneric: "حدث خطأ. يرجى المحاولة مرة أخرى.",
        errorDuplicate: "لقد قيّمت هذا المنتج بالفعل.",
    },
};

function StarRating({
    value,
    onChange,
    readonly = false,
    size = 24,
}: {
    value: number;
    onChange?: (v: number) => void;
    readonly?: boolean;
    size?: number;
}) {
    const [hover, setHover] = useState(0);

    return (
        <div className="rating-stars" style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => !readonly && onChange?.(star)}
                    onMouseEnter={() => !readonly && setHover(star)}
                    onMouseLeave={() => !readonly && setHover(0)}
                    style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: readonly ? "default" : "pointer",
                        transition: "transform 0.15s ease",
                        transform:
                            !readonly && (hover >= star || value >= star)
                                ? "scale(1.2)"
                                : "scale(1)",
                    }}
                    aria-label={`${star} star`}
                >
                    <Star
                        size={size}
                        fill={
                            (hover || value) >= star ? "#f59e0b" : "transparent"
                        }
                        stroke={
                            (hover || value) >= star ? "#f59e0b" : "#d1d5db"
                        }
                        strokeWidth={1.5}
                    />
                </button>
            ))}
        </div>
    );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <span style={{ width: "16px", textAlign: "right", color: "#6b7280", fontWeight: 700 }}>{label}</span>
            <Star size={11} fill="#f59e0b" stroke="#f59e0b" />
            <div style={{ flex: 1, height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
                <div
                    style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                        borderRadius: "3px",
                        transition: "width 0.6s ease",
                    }}
                />
            </div>
            <span style={{ width: "20px", color: "#9ca3af", fontSize: "11px" }}>{count}</span>
        </div>
    );
}

export function ProductRating({ productDocumentId, language = "fr", onRatingChange }: ProductRatingProps) {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const T = i18n[language] || i18n.fr;

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRating, setSelectedRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);
    // Une fois noté, cette valeur ne repasse JAMAIS à false
    const lockedRef = useRef(false);

    const fetchReviews = async (skipLockCheck = false) => {
        try {
            setLoading(true);
            const res = await api.get(
                `/reviews?filters[product][documentId][$eq]=${productDocumentId}&populate[user][fields][0]=username&sort=createdAt:desc&pagination[pageSize]=50`
            );
            const data: Review[] = res.data?.data || [];
            setReviews(data);
            // Notifier le parent avec avg + count
            if (data.length > 0) {
                const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
                onRatingChange?.(avg, data.length);
            } else {
                onRatingChange?.(0, 0);
            }
            // Ne jamais remettre à false si déjà noté (lockedRef ou détection API)
            if (lockedRef.current && !skipLockCheck) {
                setAlreadyReviewed(true);
                return;
            }
            if (user) {
                const mine = data.find(
                    (r) => r.user?.id === user.id || r.username === user.username
                );
                if (mine) {
                    lockedRef.current = true;
                    setAlreadyReviewed(true);
                } else if (!lockedRef.current) {
                    setAlreadyReviewed(false);
                }
            } else {
                if (!lockedRef.current) setAlreadyReviewed(false);
            }
        } catch {
            // fail silently
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Reset lock quand on change de produit
        lockedRef.current = false;
        setAlreadyReviewed(false);
        if (productDocumentId) fetchReviews();
    }, [productDocumentId, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (selectedRating === 0) {
            setError(T.errorRequired);
            return;
        }

        setSubmitting(true);
        try {
            await api.post(
                "/reviews",
                {
                    data: {
                        rating: selectedRating,
                        comment: comment.trim() || null,
                        product: productDocumentId,
                    },
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            // Verrouiller définitivement le formulaire
            lockedRef.current = true;
            setAlreadyReviewed(true);
            setSuccessMsg(T.success);
            setSelectedRating(0);
            setComment("");
            await fetchReviews();
        } catch (err: any) {
            const msg = (err?.response?.data?.error?.message || "").toLowerCase();
            if (
                msg.includes("already reviewed") ||
                msg.includes("already rated") ||
                msg.includes("déjà")
            ) {
                lockedRef.current = true;
                setAlreadyReviewed(true);
                setError(T.errorDuplicate);
                await fetchReviews();
            } else if (err?.response?.status === 400) {
                setError(T.errorGeneric);
            } else {
                setError(T.errorGeneric);
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Stats
    const total = reviews.length;
    const avgRating = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const dist = [5, 4, 3, 2, 1].map((s) => ({
        star: s,
        count: reviews.filter((r) => r.rating === s).length,
    }));

    const isRTL = language === "ar";

    return (
        <div
            className="product-rating-section"
            style={{
                marginTop: "64px",
                borderTop: "2px solid #f3f4f6",
                paddingTop: "48px",
                direction: isRTL ? "rtl" : "ltr",
            }}
        >
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h2
                    style={{
                        fontSize: "11px",
                        fontWeight: 900,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "#9ca3af",
                        marginBottom: "8px",
                    }}
                >
                    {T.title}
                </h2>

                {total > 0 && (
                    <div
                        style={{
                            display: "flex",
                            gap: "32px",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            marginTop: "16px",
                        }}
                    >
                        {/* Average score */}
                        <div style={{ textAlign: isRTL ? "right" : "left" }}>
                            <div
                                style={{
                                    fontSize: "56px",
                                    fontWeight: 900,
                                    lineHeight: 1,
                                    letterSpacing: "-2px",
                                }}
                            >
                                {avgRating.toFixed(1)}
                            </div>
                            <StarRating value={Math.round(avgRating)} readonly size={18} />
                            <div
                                style={{
                                    marginTop: "4px",
                                    fontSize: "11px",
                                    color: "#9ca3af",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                {total} {T.reviews}
                            </div>
                        </div>

                        {/* Distribution bars */}
                        <div style={{ flex: 1, maxWidth: "280px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            {dist.map((d) => (
                                <RatingBar key={d.star} label={String(d.star)} count={d.count} total={total} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Write review form */}
            <div
                style={{
                    background: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)",
                    border: "1px solid #e5e7eb",
                    padding: "24px",
                    marginBottom: "40px",
                }}
            >
                {!user ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "16px",
                            flexWrap: "wrap",
                        }}
                    >
                        <p
                            style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 600,
                            }}
                        >
                            {T.loginPrompt}
                        </p>
                        <button
                            onClick={() => navigate("/login")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "#000",
                                color: "#fff",
                                border: "none",
                                padding: "10px 20px",
                                fontSize: "10px",
                                fontWeight: 900,
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#333")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#000")}
                        >
                            <LogIn size={14} />
                            {T.loginBtn}
                        </button>
                    </div>
                ) : alreadyReviewed ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#16a34a",
                            fontSize: "13px",
                            fontWeight: 700,
                        }}
                    >
                        <Star size={16} fill="#16a34a" stroke="#16a34a" />
                        {T.alreadyReviewed}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Star selection */}
                        <div style={{ marginBottom: "16px" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "10px",
                                    fontWeight: 900,
                                    letterSpacing: "0.15em",
                                    textTransform: "uppercase",
                                    color: "#6b7280",
                                    marginBottom: "8px",
                                }}
                            >
                                {T.yourRating}
                            </label>
                            <StarRating value={selectedRating} onChange={setSelectedRating} size={28} />
                        </div>

                        {/* Comment */}
                        <div style={{ marginBottom: "16px" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "10px",
                                    fontWeight: 900,
                                    letterSpacing: "0.15em",
                                    textTransform: "uppercase",
                                    color: "#6b7280",
                                    marginBottom: "8px",
                                }}
                            >
                                {T.commentLabel}
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={T.commentPlaceholder}
                                rows={3}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border: "1px solid #d1d5db",
                                    background: "#fff",
                                    fontSize: "13px",
                                    resize: "vertical",
                                    outline: "none",
                                    fontFamily: "inherit",
                                    boxSizing: "border-box",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "#000")}
                                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                            />
                        </div>

                        {error && (
                            <p
                                style={{
                                    color: "#dc2626",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    marginBottom: "12px",
                                }}
                            >
                                {error}
                            </p>
                        )}

                        {successMsg && (
                            <p
                                style={{
                                    color: "#16a34a",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    marginBottom: "12px",
                                }}
                            >
                                {successMsg}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                background: submitting ? "#6b7280" : "#000",
                                color: "#fff",
                                border: "none",
                                padding: "12px 24px",
                                fontSize: "10px",
                                fontWeight: 900,
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                cursor: submitting ? "not-allowed" : "pointer",
                                transition: "transform 0.15s, background 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                if (!submitting) e.currentTarget.style.transform = "scale(1.02)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            {submitting ? (
                                <Loader2 size={14} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                            ) : (
                                <Send size={14} />
                            )}
                            {submitting ? T.submitting : T.submit}
                        </button>
                    </form>
                )}
            </div>

            {/* Reviews list */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
                    <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "#9ca3af" }} />
                </div>
            ) : reviews.length === 0 ? (
                <div
                    style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: "#9ca3af",
                        fontSize: "13px",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                    }}
                >
                    {T.noReviews}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            style={{
                                borderBottom: "1px solid #f3f4f6",
                                paddingBottom: "24px",
                                animation: "fadeIn 0.4s ease",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                    flexWrap: "wrap",
                                    gap: "8px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    {/* Avatar */}
                                    <div
                                        style={{
                                            width: "36px",
                                            height: "36px",
                                            borderRadius: "50%",
                                            background: "linear-gradient(135deg, #000 0%, #444 100%)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#fff",
                                            fontSize: "13px",
                                            fontWeight: 900,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {(review.username || review.user?.username || T.anonymous).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "13px", fontWeight: 800 }}>
                                            {review.username || review.user?.username || T.anonymous}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                                            {new Date(review.createdAt).toLocaleDateString(
                                                language === "ar" ? "ar-TN" : language === "fr" ? "fr-FR" : "en-US",
                                                { year: "numeric", month: "long", day: "numeric" }
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <StarRating value={review.rating} readonly size={16} />
                            </div>
                            {review.comment && (
                                <p
                                    style={{
                                        fontSize: "13px",
                                        color: "#4b5563",
                                        lineHeight: 1.6,
                                        marginTop: "8px",
                                        paddingLeft: isRTL ? 0 : "48px",
                                        paddingRight: isRTL ? "48px" : 0,
                                    }}
                                >
                                    {review.comment}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
