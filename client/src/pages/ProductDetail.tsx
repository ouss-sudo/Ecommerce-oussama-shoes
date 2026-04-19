import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getStrapiMedia } from "../lib/api";
import type { Product, StrapiResponse } from "../types";
import { Loader2, ArrowLeft, Star, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { VirtualTryOn } from "../components/VirtualTryOn";
import { useAuth } from "../context/AuthContext";
import { DeliveryInfoModal } from "../components/DeliveryInfoModal";
import { useLanguage } from "../context/LanguageContext";
import { ProductRating } from "../components/ProductRating";
import { ProductCard } from "../components/ProductCard";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useAuth();
    const { language, t, dir } = useLanguage();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const { data: bannerConfig } = useQuery({
        queryKey: ["banner-config-detail"],
        queryFn: async () => {
            const res = await api.get("/banner-config");
            return res.data.data;
        },
    });

    const isDeliveryEnabled = bannerConfig?.isDeliveryEnabled ?? false;

    const { data: productsData, isLoading } = useQuery({
        queryKey: ["product", slug],
        queryFn: async () => {
            // Strapi 5: Simplify query and ensure populate is correct
            const res = await api.get<StrapiResponse<Product>>(
                `/products?filters[$or][0][slug][$eq]=${slug}&filters[$or][1][documentId][$eq]=${slug}`
            );
            return res.data;
        },
        enabled: !!slug,
        staleTime: 30000,
    });

    const product = productsData?.data?.[0];

    const { data: relatedProductsData } = useQuery({
        queryKey: ["related-products-v3"],
        queryFn: async () => {
             const res = await api.get<StrapiResponse<Product>>(
                 `/products?populate[0]=cover&populate[1]=image&populate[2]=gallery&populate[3]=categories&pagination[limit]=10&sort=createdAt:desc`
             );
             return res.data;
        },
        staleTime: 300000,
    });
    const relatedProducts = (relatedProductsData?.data || []).slice(0, 8);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [isTryOnOpen, setIsTryOnOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [miniRating, setMiniRating] = useState<{ avg: number; count: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showStickyBar, setShowStickyBar] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

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
            setSelectedImage(
                product.cover?.url ||
                (product.image && product.image[0]?.url) ||
                (product.gallery && product.gallery[0]?.url) ||
                null
            );
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

    const allImages = ([
        product.cover,
        ...(product.image || []),
        ...(product.gallery || []),
        product.model3D
    ].filter((img): img is any => !!img?.url)) as any[];

    const getCurrentStock = () => {
        if (!product) return 0;
        if (!product.variants || product.variants.length === 0) return product.stock || 0;

        let colorName = "";
        if (selectedColor !== null && product.colors && typeof product.colors === 'object' && 'colors' in product.colors) {
            colorName = (product.colors as { colors: string[] }).colors[selectedColor] || "";
        }

        const variant = product.variants.find((v: any) => {
            const vSize = v.size_link?.name || v.size;
            const vColor = v.color_link?.name || v.color;
            return String(vSize) === String(selectedSize) &&
                   (!vColor || vColor.toLowerCase() === colorName.toLowerCase());
        });

        // Graceful fallback: If variants exist but admin missed configuring this exact mix,
        // use global product stock avoiding accidental blocking.
        return variant ? (variant.stock || 0) : (product.stock || 0);
    };

    const stockCount = getCurrentStock();
    const isOutOfStock = !!((selectedSize || selectedColor !== null) && stockCount <= 0);

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
                                        if (scrollRef.current) {
                                            scrollRef.current.scrollTo({ left: scrollRef.current.clientWidth * index, behavior: 'smooth' });
                                        }
                                        const linkedImages = [
                                            ...(product.image || []),
                                            ...(product.gallery || []),
                                        ];
                                        const colorIdx = linkedImages.findIndex(li => li?.url === img.url);
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

                    {/* PRICE */}
                    {(() => {
                        const parsePrice = (priceStr: string | null | undefined) => {
                            if (!priceStr) return 0;
                            const num = parseFloat(priceStr.replace(/[^0-9,.]/g, '').replace(',', '.'));
                            return isNaN(num) ? 0 : num;
                        };
                        const currentPriceParsed = parsePrice(product.price_display);
                        const oldPriceParsed = parsePrice(product.old_price);
                        const discount = oldPriceParsed > currentPriceParsed ? Math.round(((oldPriceParsed - currentPriceParsed) / oldPriceParsed) * 100) : 0;

                        return (
                            <div className={`flex flex-col gap-2 ${dir === 'rtl' ? 'items-end' : 'items-start'}`}>
                                {discount > 0 && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-full mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase text-red-600 tracking-widest">{language === 'ar' ? 'عرض خاص' : 'Offre Spéciale'}</span>
                                    </div>
                                )}
                                
                                <div className={`flex items-end gap-3 md:gap-5 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-4xl md:text-5xl font-black tracking-tighter text-red-600 flex items-baseline gap-2">
                                        {product.price_display} <span className="text-black">TND</span> <span className="text-sm md:text-base font-bold text-gray-400">TTC</span>
                                    </span>
                                    
                                    {product.old_price && discount > 0 && (
                                        <div className={`flex items-center gap-2 mb-1`}>
                                            <span className="text-lg md:text-xl font-bold text-gray-300 line-through decoration-red-500/30 decoration-2">
                                                {product.old_price} <span className="text-black/30 ml-1 text-sm">TND</span>
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

                    {/* COLORS */}
                    {(() => {
                        let colorList: string[] = [];
                        if (Array.isArray(product.colors)) colorList = product.colors;
                        else if (product.colors && typeof product.colors === 'object' && 'colors' in product.colors)
                            colorList = (product.colors as { colors: string[] }).colors || [];
                        if (colorList.length === 0) return null;

                        const linkedImages = ([
                            product.cover,
                            ...(product.image || []),
                            ...(product.gallery || [])
                        ].filter((img): img is any => !!img?.url)) as any[];

                        const colorMap: Record<string, string> = {
                            rouge: '#ef4444', red: '#ef4444', 
                            bleu: '#3b82f6', blue: '#3b82f6',
                            vert: '#22c55e', green: '#22c55e', 
                            noir: '#111111', black: '#111111',
                            blanc: '#f9fafb', white: '#f9fafb', 
                            gris: '#9ca3af', gray: '#9ca3af', grey: '#9ca3af',
                            beige: '#d4b896',
                            jaune: '#eab308', yellow: '#eab308',
                            marron: '#92400e', brown: '#92400e',
                            orange: '#f97316',
                            brique: '#F7630C', brick: '#F7630C',
                            violet: '#a855f7', purple: '#a855f7',
                            rose: '#ec4899', pink: '#ec4899',
                            marine: '#000080', navy: '#000080',
                            camel: '#C19A6B',
                            bronze: '#CD7F32',
                            doré: '#D4AF37', dore: '#D4AF37', gold: '#D4AF37',
                            argent: '#C0C0C0', silver: '#C0C0C0',
                            bordeaux: '#800000', burgundy: '#800000',
                            turquoise: '#40E0D0',
                            kaki: '#C3B091', khaki: '#C3B091',
                        };

                        return (
                            <div className={`space-y-4 ${dir === 'rtl' ? 'text-right' : ''}`}>
                                <div className={`flex items-center justify-between ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                        {language === 'ar' ? 'اختر اللون' : 'Choisir une couleur'}
                                    </p>
                                    {selectedColor !== null && (
                                        <span className="text-[11px] font-black uppercase tracking-widest text-black border-b-2 border-black pb-0.5">
                                            {colorList[selectedColor]}
                                        </span>
                                    )}
                                </div>
                                <div className={`flex flex-wrap gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                    {colorList.map((color, i) => {
                                        const key = color.toLowerCase();
                                        const cssColor = colorMap[key] || '#999999';
                                        const isActive = selectedColor === i;
                                        const isLight = ['blanc', 'white', 'beige', 'jaune', 'yellow', '#f9fafb', '#eab308', '#d4b896'].includes(key) || cssColor === '#f9fafb';

                                        return (
                                            <button
                                                key={i}
                                                title={color}
                                                onClick={() => {
                                                    setSelectedColor(i);
                                                    if (linkedImages[i]?.url) {
                                                        setSelectedImage(linkedImages[i].url);
                                                        if (scrollRef.current) {
                                                            const idx = allImages.findIndex(img => img.url === linkedImages[i].url);
                                                            if (idx !== -1) scrollRef.current.scrollTo({ left: scrollRef.current.clientWidth * idx, behavior: 'smooth' });
                                                        }
                                                    }
                                                }}
                                                className={`relative flex flex-col items-center gap-2 group transition-all duration-300 ${isActive ? 'scale-105' : 'hover:scale-105'}`}
                                            >
                                                {/* Color Circle with inner shadow and ring */}
                                                <div
                                                    className={`w-12 h-12 rounded-full shadow-md transition-all duration-300 flex items-center justify-center relative overflow-hidden
                                                        ${isActive 
                                                            ? 'ring-4 ring-offset-2 ring-black shadow-xl' 
                                                            : 'ring-2 ring-offset-1 ring-gray-200 hover:ring-gray-400'
                                                        }`}
                                                    style={{ backgroundColor: cssColor }}
                                                >
                                                    {/* Shine effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10 pointer-events-none" />
                                                    {/* Checkmark when selected */}
                                                    {isActive && (
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 ${isLight ? 'bg-black' : 'bg-white'}`}>
                                                            <svg viewBox="0 0 12 12" className={`w-3 h-3 ${isLight ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <polyline points="1.5,6 4.5,9 10.5,3" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Color name label */}
                                                <span className={`text-[9px] font-black uppercase tracking-wider text-center leading-none transition-colors ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-700'}`}>
                                                    {color}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* SIZES */}
                    {(() => {
                        let sizeList: string[] = [];
                        if (Array.isArray(product.sizes)) sizeList = product.sizes;
                        else if (product.sizes && typeof product.sizes === 'object' && 'sizes' in product.sizes)
                            sizeList = (product.sizes as { sizes: string[] }).sizes || [];
                        if (sizeList.length === 0) sizeList = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

                        return (
                            <div className={`mt-6 space-y-4 ${dir === 'rtl' ? 'text-right' : ''}`}>
                                <p className="text-[11px] font-black uppercase tracking-widest text-black">
                                    {language === 'ar' ? 'المقاسات' : 'Tailles'}
                                </p>
                                <div className="grid grid-cols-5 gap-2">
                                    {sizeList.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`py-4 text-[13px] font-bold border ${selectedSize === size ? "bg-black text-white border-black" : "bg-gray-50 text-black border-transparent hover:border-gray-200"}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* ADD TO CART & ERROR & STOCK */}
                    <div className="mt-8 flex flex-col gap-4">
                        {error && (
                          <div className={`flex items-center gap-3 p-4 bg-red-50 border-l-4 border-red-600 animate-shake ${dir === 'rtl' ? 'flex-row-reverse text-right' : ''}`}>
                             <div className="flex-shrink-0">
                               <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                               </svg>
                             </div>
                             <p className="text-[12px] font-black uppercase tracking-widest text-red-600">
                               {error}
                             </p>
                          </div>
                        )}

                        {isOutOfStock && (
                            <div className={`p-4 bg-orange-50 border-l-4 border-orange-500 flex items-center gap-3 ${dir === 'rtl' ? 'flex-row-reverse text-right' : ''}`}>
                                <Package className="h-5 w-5 text-orange-600" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                                    {language === 'ar' ? 'نفدت الكمية لهذه المقاس/اللون' : 'Rupture de stock pour cette taille/couleur'}
                                </p>
                            </div>
                        )}

                        <button
                            disabled={isOutOfStock || success !== null}
                            onClick={() => { 
                                if (!user) { navigate("/login"); return; }
                                if (!selectedSize) { setError(language === 'ar' ? 'يرجى اختيار المقاس' : 'Veuillez choisir une taille'); return; }
                                if (selectedColor === null && (product.colors && typeof product.colors === 'object' && (product.colors as { colors: string[] }).colors?.length > 0)) {
                                  setError(language === 'ar' ? 'يرجى اختيار اللون' : 'Veuillez choisir une couleur'); return;
                                }

                                if (isDeliveryEnabled) {
                                    let colorName = "";
                                    if (selectedColor !== null && product.colors && typeof product.colors === 'object' && 'colors' in product.colors) {
                                        colorName = (product.colors as { colors: string[] }).colors[selectedColor] || "";
                                    }
                                    addToCart(product, 1, selectedImage || product.cover?.url, selectedSize, colorName);
                                    
                                    setSuccess(language === 'ar' ? 'تمت الإضافة بنجاح!' : 'Ajouté au panier ! ✅');
                                    setTimeout(() => setSuccess(null), 3000);
                                } else {
                                    setIsDeliveryModalOpen(true); 
                                }
                            }}
                            className={`w-full px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 md:max-w-xs ${
                                isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 
                                success ? 'bg-green-600 text-white border-transparent' : 
                                'bg-black text-white hover:bg-gray-800'
                            }`}
                        >
                            {isOutOfStock ? (language === 'ar' ? 'غير متوفر' : 'Épuisé') : success ? success : t.productDetail.addToCart}
                        </button>

                        <button
                            onClick={() => setIsTryOnOpen(true)}
                            className="w-full border-2 border-black bg-white px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-gray-50 active:scale-95 md:max-w-xs flex items-center justify-center gap-3"
                        >
                            {t.productDetail.virtualTryOn}
                        </button>
                    </div>

                    <style>{`
                      @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                      }
                      .animate-shake {
                        animation: shake 0.4s ease-in-out;
                      }
                    `}</style>
                </div>
            </div>

            {isTryOnOpen && (
                <VirtualTryOn
                    overlayUrl={
                        product.tryon_overlay?.url || 
                        selectedImage || 
                        product.cover?.url || 
                        (product.image && product.image[0]?.url) || 
                        ""
                    }
                    settings={product.tryon_settings}
                    onClose={() => setIsTryOnOpen(false)}
                />
            )}

            <DeliveryInfoModal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} />

            <div id="product-reviews" className="mt-20">
                <ProductRating
                    productDocumentId={product.documentId}
                    language={language as "fr" | "en" | "ar"}
                    onRatingChange={(avg, count) => setMiniRating(count > 0 ? { avg, count } : null)}
                />
            </div>

            {/* RELATED */}
            <div className="mt-24 border-t border-gray-100 pt-16 pb-24">
                <h2 className={`text-2xl md:text-3xl font-black uppercase tracking-tight mb-8 ${dir === 'rtl' ? 'text-right' : ''}`}>
                    {language === 'ar' ? 'قد يعجبك أيضاً' : 'Vous aimerez aussi'}
                </h2>
                {relatedProducts && relatedProducts.length > 0 && (
                    <div className="relative w-full overflow-hidden group bg-white py-4 mt-8">
                        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                        <div className="flex gap-6 animate-marquee w-max">
                            {[...relatedProducts, ...relatedProducts, ...relatedProducts].map((p, index) => (
                                <div key={`${p.documentId}-${index}`} className="w-[200px] md:w-[240px] shrink-0">
                                    <ProductCard product={p} />
                                </div>
                            ))}
                        </div>
                        <style>{`
                            @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }
                            .animate-marquee { animation: marquee 25s linear infinite; }
                            .group:hover .animate-marquee { animation-play-state: paused; }
                        `}</style>
                    </div>
                )}
            </div>

            {/* STICKY */}
            {showStickyBar && !isDeliveryModalOpen && !isTryOnOpen && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-2 duration-200">
                    <div className="container max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3 md:gap-6">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            {(product.cover?.url || (product.image && product.image[0]?.url)) && (
                                <img
                                    src={getStrapiMedia(product.cover?.url || (product.image && product.image[0]?.url) || '') || ''}
                                    alt={product.name}
                                    className="h-12 w-12 object-cover rounded-lg shrink-0 border border-gray-100"
                                />
                            )}
                            <div className="min-w-0 hidden sm:block">
                                <p className="text-[11px] font-black uppercase tracking-widest text-black truncate">{product.name}</p>
                                <p className="text-[13px] font-black text-red-600 flex items-baseline gap-1">
                                    {product.price_display} <span className="text-black ml-1">TND</span> <span className="text-[8px] text-gray-400">TTC</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <select
                                value={selectedSize || ''}
                                onChange={(e) => setSelectedSize(e.target.value)}
                                className="border-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest focus:border-black focus:outline-none rounded-lg min-w-[110px]"
                            >
                                <option value="" disabled>{language === 'ar' ? 'المقاس' : 'Taille'}</option>
                                {["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button
                                disabled={isOutOfStock}
                                onClick={() => { 
                                  if (!user) { navigate("/login"); return; }
                                  if (!selectedSize) { setError(language === 'ar' ? 'يرجى اختيار المقاس' : 'Veuillez choisir une taille'); return; }
                                  if (selectedColor === null && (product.colors && typeof product.colors === 'object' && (product.colors as { colors: string[] }).colors?.length > 0)) {
                                    setError(language === 'ar' ? 'يرجى اختيار اللون' : 'Veuillez choisir une couleur'); return;
                                  }

                                  if (isDeliveryEnabled) {
                                      let colorName = "";
                                      if (selectedColor !== null && product.colors && typeof product.colors === 'object' && 'colors' in product.colors) {
                                          colorName = (product.colors as { colors: string[] }).colors[selectedColor] || "";
                                      }
                                      addToCart(product, 1, selectedImage || product.cover?.url, selectedSize, colorName);
                                      navigate("/cart");
                                  } else {
                                      setIsDeliveryModalOpen(true); 
                                  }
                                }}
                                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg rounded-lg ${isOutOfStock ? 'bg-gray-300 text-gray-500' : 'bg-black text-white'}`}
                            >
                                {isOutOfStock ? (language === 'ar' ? 'إنتظم' : 'Épuisé') : t.productDetail.addToCart.split(' ')[0]}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
