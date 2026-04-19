import { Link } from "react-router-dom";
import type { Product } from "../types";
import { getStrapiMedia } from "../lib/api";
import { cn } from "../lib/utils";
import { useLanguage } from "../context/LanguageContext";
import { useState, useMemo, memo } from "react";

interface ProductCardProps {
    product: Product;
    className?: string;
    width?: number;
    height?: number;
}

export const ProductCard = memo(function ProductCard({
    product,
    className,
}: ProductCardProps) {
    const { language, t, dir } = useLanguage();
    const [activeIndex, setActiveIndex] = useState(0);

    // Rassembler toutes les images disponibles sans recalculer à chaque render
    const allImages = useMemo(() => {
        return [
            product.cover,
            ...(product.image || []),
            ...(product.gallery || [])
        ].filter((img, idx, arr) =>
            !!img?.url && arr.findIndex(i => i?.url === img.url) === idx
        );
    }, [product.cover, product.image, product.gallery]);

    const productLink = product.slug ? `/products/${product.slug}` : `/products/${product.documentId}`;
    const categoryName = product.categories?.[0]?.name;
    const translatedCategory = categoryName ? ((t.categories as any)[categoryName] || categoryName) : "";

    return (
        <div className={cn("group block", className)}>
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm transition-all duration-700 group-hover:shadow-2xl group-hover:-translate-y-2">
                {/* Sale / New Badge */}
                {categoryName === "NOUVEAUTÉS" && (
                    <div className={`absolute top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} bg-black text-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest z-20`}>
                        {translatedCategory}
                    </div>
                )}
                {product.old_price && (
                    <div className={`absolute top-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} bg-red-600 text-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest z-20`}>
                        {language === 'ar' ? 'تخفيض' : (language === 'en' ? 'SALE' : 'PROMO')}
                    </div>
                )}

                {/* Zone de survol (Scrubbing) - z-30 pour être au-dessus du prix et du badge */}
                <div className="absolute inset-0 z-30 flex">
                    {allImages.map((_, i) => (
                        <div
                            key={i}
                            className="h-full flex-1"
                            onMouseEnter={() => setActiveIndex(i)}
                        >
                            <Link to={productLink} className="block w-full h-full" />
                        </div>
                    ))}
                </div>

                {/* Affichage de l'image (instantané) */}
                <div className="absolute inset-0 z-10">
                    {allImages.length > 0 ? (
                        <img
                            src={getStrapiMedia(allImages[activeIndex], 'small') || getStrapiMedia(allImages[activeIndex]) || ""}
                            alt={product.name}
                            className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                            {t.productDetail.noImage}
                        </div>
                    )}
                </div>

                {/* Barrettes de progression (Style Zara/H&M) - z-40 pour être au-dessus du survol */}
                {allImages.length > 1 && (
                    <div className="absolute bottom-4 left-4 right-4 flex gap-1 z-40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        {allImages.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-[2px] flex-1 transition-all duration-300",
                                    activeIndex === i ? "bg-red-600" : "bg-white/30"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Link to={productLink} className={`mt-5 space-y-2 block ${dir === 'rtl' ? 'text-right' : ''}`}>
                <h3 className="text-[13px] font-black uppercase tracking-widest leading-none text-black group-hover:text-red-600 transition-colors">
                    {product.name}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                    {translatedCategory}
                </p>

                {/* ── Premium Price Section ── */}
                <div className={`flex items-center gap-2 pt-1 flex-wrap ${dir === 'rtl' ? 'flex-row-reverse justify-end' : ''}`}>
                    {/* Current Price */}
                    <div className="relative">
                        <span className="text-[20px] font-black tracking-tighter text-red-600 leading-none flex items-baseline gap-1">
                            {product.price_display} <span className="text-black">TND</span> <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">TTC</span>
                        </span>
                        {/* Red underline accent */}
                        <span className="absolute -bottom-0.5 left-0 h-[3px] w-full bg-gradient-to-r from-red-600 to-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>

                    {product.old_price && (
                        <>
                            {/* Old price strikethrough */}
                            <span className="text-[12px] font-bold text-gray-300 line-through decoration-gray-200">
                                {product.old_price} <span className="text-black/30 ml-1">TND</span>
                            </span>

                            {/* Discount % pill */}
                            {(() => {
                                const current = parseFloat(String(product.price_display).replace(/[^0-9.]/g, ''));
                                const old = parseFloat(String(product.old_price).replace(/[^0-9.]/g, ''));
                                if (old > current) {
                                    const pct = Math.round((1 - current / old) * 100);
                                    return (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-red-600 text-white uppercase tracking-wide shadow-sm shadow-red-200 animate-pulse">
                                            -{pct}%
                                        </span>
                                    );
                                }
                                return null;
                            })()}
                        </>
                    )}
                </div>
            </Link>
        </div>
    );
});
