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
import { ProductCard } from "../components/ProductCard";

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

    const { data: relatedProductsData, error: relatedProductsError } = useQuery({
        queryKey: ["related-products-v3"],
        queryFn: async () => {
             const res = await api.get<StrapiResponse<Product>>(
                 `/products?populate=*`
             );
             return res.data;
        }
    });
    // TEMPORAIRE: On ne filtre plus le produit exact pour vérifier 
    // si l'API retourne bien quelque chose (si vous n'avez qu'un seul produit en base)
    const relatedProducts = (relatedProductsData?.data || []).slice(0, 8);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [isTryOnOpen, setIsTryOnOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [miniRating, setMiniRating] = useState<{ avg: number; count: number } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showStickyBar, setShowStickyBar] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    // Show sticky bar after scrolling past the add-to-cart section
    useEffect(() => {
        const onScroll = () => {
            const hero = heroRef.current;
            if (hero) {
                const rect = hero.getBoundingClientRect();
                setShowStickyBar(rect.bottom < 0);
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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

            <div className="grid gap-12 md:grid-cols-2 lg:gap-20" ref={heroRef}>
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

                    {/* ── DESIGN PRIX "2026" ULTRA-PREMIUM ── */}
                    {(() => {
                        const parsePrice = (priceStr: string | null | undefined) => {
                            if (!priceStr) return 0;
                            const num = parseFloat(priceStr.replace(/[^0-9,.]/g, '').replace(',', '.'));
                            return isNaN(num) ? 0 : num;
                        };
                        const currentPrice = parsePrice(product.price_display);
                        const oldPrice = parsePrice(product.old_price);
                        const discount = oldPrice > currentPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;

                        return (
                            <div className={`flex flex-col gap-2 ${dir === 'rtl' ? 'items-end' : 'items-start'}`}>
                                {discount > 0 && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-full mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase text-red-600 tracking-widest">{language === 'ar' ? 'عرض خاص' : 'Offre Spéciale'}</span>
                                    </div>
                                )}
                                
                                <div className={`flex items-end gap-3 md:gap-5 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 drop-shadow-sm">
                                        {product.price_display}
                                    </span>
                                    
                                    {product.old_price && discount > 0 && (
                                        <div className={`flex items-center gap-2 mb-1`}>
                                            <span className="text-lg md:text-xl font-bold text-gray-300 line-through decoration-red-500/30 decoration-2">
                                                {product.old_price}
                                            </span>
                                            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black tracking-widest rounded-md transform -skew-x-12 shadow-lg">
                                                -{discount}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

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

            {/* ── Related Products Carousel ── */}
            <div className="mt-24 border-t border-gray-100 pt-16 pb-24">
                <h2 className={`text-2xl md:text-3xl font-black uppercase tracking-tight mb-8 ${dir === 'rtl' ? 'text-right' : ''}`}>
                    {language === 'ar' ? 'قد يعجبك أيضاً' : language === 'en' ? 'You might also like' : 'Vous aimerez aussi'}
                </h2>
                
                {relatedProductsError && (
                    <p className="text-red-500">Erreur de chargement des produits: {(relatedProductsError as Error).message}</p>
                )}

                {relatedProducts.length === 0 && !relatedProductsError && (
                    <p className="text-gray-500">Aucun produit similaire trouvé.</p>
                )}

                {relatedProducts.length > 0 && (
                    <div className="relative w-full overflow-hidden group bg-white py-4 mt-8">
                        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                        <div className="flex gap-6 animate-marquee w-max">
                            {/* Duplicate array 3 times for seamless infinite scroll */}
                            {[...relatedProducts, ...relatedProducts, ...relatedProducts, ...relatedProducts].map((p, index) => (
                                <div key={`${p.documentId}-${index}`} className="w-[200px] md:w-[240px] shrink-0">
                                    <ProductCard product={p} />
                                </div>
                            ))}
                        </div>

                        <style>{`
                            @keyframes marquee {
                                0% { transform: translateX(0); }
                                100% { transform: translateX(-25%); }
                            }
                            .animate-marquee {
                                animation: marquee 25s linear infinite;
                            }
                            .group:hover .animate-marquee {
                                animation-play-state: paused;
                            }
                        `}</style>
                    </div>
                )}
            </div>

            {/* ── Sticky Bottom Bar ── */}
            {showStickyBar && !isDeliveryModalOpen && !isTryOnOpen && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-2 duration-200">
                    <div className="container max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3 md:gap-6">
                        {/* Product thumb + info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            {(product.cover?.url || product.image?.[0]?.url) && (
                                <img
                                    src={getStrapiMedia(product.cover?.url || product.image?.[0]?.url || '') || ''}
                                    alt={product.name}
                                    className="h-12 w-12 object-cover rounded-lg shrink-0 border border-gray-100"
                                />
                            )}
                            <div className="min-w-0 hidden sm:block">
                                <p className="text-[11px] font-black uppercase tracking-widest text-black truncate">{product.name}</p>
                                <p className="text-[13px] font-black text-red-600">{product.price_display}</p>
                            </div>
                        </div>

                        {/* Size selector compact */}
                        {(() => {
                            let sizeList: string[] = [];
                            if (Array.isArray(product.sizes)) sizeList = product.sizes as string[];
                            else if (product.sizes && typeof product.sizes === 'object' && 'sizes' in product.sizes)
                                sizeList = (product.sizes as { sizes: string[] }).sizes || [];
                            if (sizeList.length === 0) sizeList = ['36','37','38','39','40','41','42','43','44','45'];

                            return (
                                <div className="flex items-center gap-2 shrink-0">
                                    <select
                                        value={selectedSize || ''}
                                        onChange={(e) => setSelectedSize(e.target.value)}
                                        className="border-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest focus:border-black focus:outline-none rounded-lg cursor-pointer min-w-[110px]"
                                    >
                                        <option value="" disabled>
                                            {language === 'ar' ? 'المقاس' : language === 'en' ? 'Size' : 'Taille'}
                                        </option>
                                        {sizeList.map(s => (
                                            <option key={s} value={s}>{selectedSize === s ? `✓ ${s}` : s}</option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })()}

                        {/* CTA Buttons */}
                        <button
                            onClick={() => {
                                if (!user) { navigate('/login'); return; }
                                setIsDeliveryModalOpen(true);
                            }}
                            className="shrink-0 bg-black text-white px-4 md:px-7 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 rounded-lg whitespace-nowrap"
                        >
                            {t.productDetail.addToCart}
                        </button>

                        <button
                            onClick={() => setIsTryOnOpen(true)}
                            className="shrink-0 hidden md:flex border-2 border-black bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-gray-50 transition-all active:scale-95 rounded-lg items-center gap-2 whitespace-nowrap"
                        >
                            {t.productDetail.virtualTryOn}
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
