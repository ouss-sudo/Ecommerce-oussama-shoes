import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getStrapiMedia } from "../lib/api";
import type { Product, StrapiResponse } from "../types";
import { Loader2, ArrowLeft, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { VirtualTryOn } from "../components/VirtualTryOn";
import { useAuth } from "../context/AuthContext";
import { DeliveryInfoModal } from "../components/DeliveryInfoModal";
import { useLanguage } from "../context/LanguageContext";
import { ProductRating } from "../components/ProductRating";

export default function ProductDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useAuth();
    const { language, t, dir } = useLanguage();
    const navigate = useNavigate();

    const { data: productsData, isLoading } = useQuery({
        queryKey: ["product", slug],
        queryFn: async () => {
            const res = await api.get<StrapiResponse<Product>>(
                `/products?filters[$or][0][slug][$eq]=${slug}&filters[$or][1][documentId][$eq]=${slug}&populate=*`
            );
            return res.data;
        },
        enabled: !!slug,
    });

    const product = productsData?.data?.[0];

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [isTryOnOpen, setIsTryOnOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [miniRating, setMiniRating] = useState<{ avg: number; count: number } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (product) {
            // Priorité: cover > image[0] > gallery[0] > model3D
            setSelectedImage(
                product.cover?.url ||
                product.image?.[0]?.url ||
                product.gallery?.[0]?.url ||
                product.model3D?.url ||
                null
            );
            // Charger le mini rating
            api.get(`/reviews?filters[product][documentId][$eq]=${product.documentId}&fields[0]=rating&pagination[pageSize]=100`)
                .then((res) => {
                    const data = res.data?.data || [];
                    if (data.length > 0) {
                        const avg = data.reduce((s: number, r: any) => s + r.rating, 0) / data.length;
                        setMiniRating({ avg, count: data.length });
                    } else {
                        setMiniRating(null);
                    }
                })
                .catch(() => setMiniRating(null));
        }
    }, [product]);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-black" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-black uppercase">{t.productDetail.notFound}</h1>
                <Link to="/products" className="text-black font-bold uppercase hover:underline">
                    {t.productDetail.back}
                </Link>
            </div>
        );
    }

    // Fusionne cover + image[] + gallery + model3D en une seule galerie sans doublons
    const allImages = [
        product.cover,
        ...(product.image || []),
        ...(product.gallery || []),
        product.model3D
    ].filter((img, idx, arr): img is typeof img & { url: string } =>
        !!img?.url && arr.findIndex(i => i?.url === img.url) === idx
    );


    return (
        <div className="container py-8 md:py-12 lg:py-24">
            <Link
                to="/products"
                className={`mb-12 inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
            >
                <ArrowLeft className={`h-4 w-4 ${dir === 'rtl' ? 'ml-3' : 'mr-3'}`} />
                {t.productDetail.back}
            </Link>

            <div className="grid gap-12 md:grid-cols-2 lg:gap-20">
                <div className="flex flex-col gap-6">
                    <div className="relative aspect-square overflow-hidden bg-white border border-gray-100 shadow-2xl group">
                        {allImages.length > 0 ? (
                            <>
                                <div
                                    ref={scrollRef}
                                    className="flex h-full w-full overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
                                    onScroll={(e) => {
                                        const el = e.currentTarget;
                                        const index = Math.round(el.scrollLeft / el.clientWidth);
                                        if (allImages[index]) {
                                            setSelectedImage(allImages[index].url);
                                        }
                                    }}
                                >
                                    {allImages.map((img, i) => (
                                        <div key={i} className="h-full w-full flex-shrink-0 snap-center">
                                            <img
                                                src={getStrapiMedia(img.url) || ""}
                                                alt={`${product.name} - ${i + 1}`}
                                                className="h-full w-full object-cover transition-transform duration-700"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Arrows */}
                                {allImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => {
                                                if (scrollRef.current) {
                                                    scrollRef.current.scrollBy({ left: -scrollRef.current.clientWidth, behavior: 'smooth' });
                                                }
                                            }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white"
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (scrollRef.current) {
                                                    scrollRef.current.scrollBy({ left: scrollRef.current.clientWidth, behavior: 'smooth' });
                                                }
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white"
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                                {t.productDetail.noImage}
                            </div>
                        )}
                    </div>
                    {allImages.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {allImages.map((img, index) => (
                                <button
                                    key={`${img.documentId}-${index}`}
                                    onClick={() => {
                                        setSelectedImage(img.url);
                                        // Scroll le carrousel principal
                                        if (scrollRef.current) {
                                            scrollRef.current.scrollTo({ left: scrollRef.current.clientWidth * index, behavior: 'smooth' });
                                        }
                                        // Synchroniser avec la couleur
                                        const linkedImages = [
                                            ...(product.image || []),
                                            ...(product.gallery || []),
                                        ];
                                        const colorIdx = linkedImages.findIndex(li => li.url === img.url);
                                        if (colorIdx !== -1) {
                                            setSelectedColor(colorIdx);
                                        }
                                    }}
                                    className={`relative aspect-square h-24 w-24 shrink-0 overflow-hidden border-2 transition-all ${selectedImage === img.url ? "border-black scale-95 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                                        }`}
                                >
                                    <img
                                        src={getStrapiMedia(img.url) || ""}
                                        alt={`View ${index + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-8">
                    <div className={dir === 'rtl' ? 'text-right' : ''}>
                        <div className={`mb-3 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 ${dir === 'rtl' ? 'flex-row-reverse justify-end' : ''}`}>
                            {product.brand && <span className="text-black">{product.brand.name}</span>}
                            {product.categories && product.categories.length > 0 && (
                                <>
                                    <span>/</span>
                                    <span>{product.categories[0].name}</span>
                                </>
                            )}
                            {/* Mini rating style Adidas */}
                            {miniRating && (
                                <span className={`flex items-center gap-1 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className="h-3 w-3"
                                            fill={s <= Math.round(miniRating.avg) ? '#f59e0b' : 'none'}
                                            stroke={s <= Math.round(miniRating.avg) ? '#f59e0b' : '#d1d5db'}
                                            strokeWidth={1.5}
                                        />
                                    ))}
                                    <span className="ml-1 text-[10px] font-bold text-gray-500 underline cursor-pointer"
                                        onClick={() => document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth' })}>
                                        {miniRating.count}
                                    </span>
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none mb-4">
                            {product.name}
                        </h1>
                    </div>

                    <div className={`flex items-baseline gap-4 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                        <span className="text-4xl font-black tracking-tight text-red-600">
                            {product.price_display}
                        </span>
                        {product.old_price && (
                            <span className="text-xl font-bold text-gray-300 line-through decoration-gray-200">
                                {product.old_price}
                            </span>
                        )}
                    </div>

                    <div className={`space-y-4 ${dir === 'rtl' ? 'text-right' : ''}`}>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{language === 'ar' ? 'الوصف' : 'Description'}</p>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            {product.description}
                        </p>
                    </div>

                    {/* Couleurs disponibles — reliées aux photos par index */}
                    {(() => {
                        // Normalise le champ colors
                        let colorList: string[] = [];
                        if (Array.isArray(product.colors)) {
                            colorList = product.colors as string[];
                        } else if (product.colors && typeof product.colors === 'object' && 'colors' in product.colors) {
                            colorList = (product.colors as { colors: string[] }).colors || [];
                        }
                        if (colorList.length === 0) return null;

                        // Images disponibles dans l'ordre: image[] puis gallery[]
                        const linkedImages = [
                            ...(product.image || []),
                            ...(product.gallery || []),
                        ];

                        // Map couleur → code CSS
                        const colorMap: Record<string, string> = {
                            rouge: '#ef4444', red: '#ef4444',
                            bleu: '#3b82f6', blue: '#3b82f6',
                            vert: '#22c55e', green: '#22c55e',
                            noir: '#111111', black: '#111111',
                            blanc: '#f9fafb', white: '#f9fafb',
                            gris: '#9ca3af', gray: '#9ca3af', grey: '#9ca3af',
                            beige: '#d4b896',
                            marron: '#92400e', brown: '#92400e',
                            orange: '#f97316',
                            jaune: '#eab308', yellow: '#eab308',
                            violet: '#a855f7', purple: '#a855f7',
                            rose: '#ec4899', pink: '#ec4899',
                            bordeaux: '#881337',
                            marine: '#1e3a5f', navy: '#1e3a5f',
                            camel: '#c09060',
                        };

                        return (
                            <div className={`space-y-3 ${dir === 'rtl' ? 'text-right' : ''}`}>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                    {language === 'ar' ? 'الألوان المتاحة' : language === 'en' ? 'Available Colors' : 'Couleurs disponibles'}
                                    {selectedColor !== null && (
                                        <span className="ml-2 text-black normal-case">
                                            — {colorList[selectedColor]}
                                        </span>
                                    )}
                                </p>
                                <div className={`flex flex-wrap gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                    {colorList.map((color, i) => {
                                        const key = color.toLowerCase().trim();
                                        const cssColor = colorMap[key] || '#999';
                                        const isLight = ['blanc', 'white', 'beige', 'jaune', 'yellow'].includes(key);
                                        const linkedImg = linkedImages[i];
                                        const isActive = selectedColor === i;

                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                title={color}
                                                onClick={() => {
                                                    setSelectedColor(i);
                                                    if (linkedImg?.url) {
                                                        setSelectedImage(linkedImg.url);
                                                        // Défiler le carrousel vers cette image
                                                        if (scrollRef.current) {
                                                            const imgIndex = allImages.findIndex(img => img.url === linkedImg.url);
                                                            if (imgIndex !== -1) {
                                                                scrollRef.current.scrollTo({
                                                                    left: scrollRef.current.clientWidth * imgIndex,
                                                                    behavior: 'smooth'
                                                                });
                                                            }
                                                        }
                                                    }
                                                }}
                                                style={{
                                                    padding: 0,
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    outline: 'none',
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'transform 0.2s',
                                                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                                                }}>
                                                    {/* Miniature photo si disponible, sinon pastille couleur */}
                                                    <div style={{
                                                        width: '52px',
                                                        height: '52px',
                                                        borderRadius: '6px',
                                                        overflow: 'hidden',
                                                        border: isActive ? '2.5px solid #111' : '2px solid #e5e7eb',
                                                        boxShadow: isActive ? '0 0 0 2px #111' : '0 1px 4px rgba(0,0,0,0.10)',
                                                        transition: 'border 0.2s, box-shadow 0.2s',
                                                        backgroundColor: cssColor,
                                                        flexShrink: 0,
                                                    }}>
                                                        {linkedImg?.url ? (
                                                            <img
                                                                src={getStrapiMedia(linkedImg.url) || ''}
                                                                alt={color}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            /* Pas de photo → cercle couleur centré */
                                                            <div style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}>
                                                                <span style={{
                                                                    width: '26px',
                                                                    height: '26px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: cssColor,
                                                                    border: isLight ? '1.5px solid #d1d5db' : 'none',
                                                                    display: 'inline-block',
                                                                }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Nom de la couleur */}
                                                    <span style={{
                                                        fontSize: '9px',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.08em',
                                                        color: isActive ? '#111' : '#9ca3af',
                                                        transition: 'color 0.2s',
                                                        maxWidth: '52px',
                                                        textAlign: 'center',
                                                        lineHeight: 1.2,
                                                    }}>
                                                        {color}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Sélection des Tailles style Adidas */}
                    {(() => {
                        let sizeList: string[] = [];
                        if (Array.isArray(product.sizes)) {
                            sizeList = product.sizes as string[];
                        } else if (product.sizes && typeof product.sizes === 'object' && 'sizes' in product.sizes) {
                            sizeList = (product.sizes as { sizes: string[] }).sizes || [];
                        }

                        // Fallback pour la démo si vide
                        if (sizeList.length === 0) {
                            sizeList = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
                        }

                        return (
                            <div className={`mt-6 space-y-4 ${dir === 'rtl' ? 'text-right' : ''}`}>
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-black">
                                        {language === 'ar' ? 'المقاسات' : language === 'en' ? 'Select Size' : 'Tailles'}
                                    </p>
                                    <button className="text-[10px] font-bold uppercase underline text-gray-400 hover:text-black transition-colors">
                                        {language === 'ar' ? 'دليل المقاسات' : language === 'en' ? 'Size Guide' : 'Guide des tailles'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {sizeList.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`py-4 text-[13px] font-bold transition-all border ${selectedSize === size
                                                ? "bg-black text-white border-black"
                                                : "bg-gray-50 text-black border-transparent hover:border-gray-200"
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    <div className="mt-8 flex flex-col gap-4">
                        <button
                            onClick={() => {
                                if (!user) {
                                    navigate("/login");
                                    return;
                                }
                                setIsDeliveryModalOpen(true);
                            }}
                            className="w-full bg-black text-white px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 md:max-w-xs"
                        >
                            {t.productDetail.addToCart}
                        </button>

                        <button
                            onClick={() => setIsTryOnOpen(true)}
                            className="w-full border-2 border-black bg-white px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-gray-50 active:scale-95 md:max-w-xs flex items-center justify-center gap-3"
                        >
                            {t.productDetail.virtualTryOn}
                        </button>
                    </div>
                </div>
            </div>

            {isTryOnOpen && (
                <VirtualTryOn
                    overlayUrl={
                        product.tryon_overlay?.url ||
                        product.cover?.url ||
                        product.image?.[0]?.url ||
                        product.gallery?.[0]?.url ||
                        ""
                    }
                    settings={product.tryon_settings}
                    onClose={() => setIsTryOnOpen(false)}
                />
            )}

            <DeliveryInfoModal
                isOpen={isDeliveryModalOpen}
                onClose={() => setIsDeliveryModalOpen(false)}
            />

            <div id="product-reviews">
                <ProductRating
                    productDocumentId={product.documentId}
                    language={language as "fr" | "en" | "ar"}
                    onRatingChange={(avg, count) => setMiniRating(count > 0 ? { avg, count } : null)}
                />
            </div>

        </div>
    );
}
