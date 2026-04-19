import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Navigate } from "react-router-dom";
import type { Product, StrapiResponse, FlashSale, StrapiSingleResponse } from "../types";
import { ProductCard } from "../components/ProductCard";
import { CountdownTimer } from "../components/CountdownTimer";
import { ProductFilters } from "../components/ProductFilters";
import { Loader2, Sparkles, ShoppingBag, SlidersHorizontal, X, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function SpecialOffers() {
    const { t, dir, language } = useLanguage();
    
    // Filtering & Sorting states
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [sortBy, setSortBy] = useState<string>("createdAt:desc");
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

    const { data: flashSaleData, isLoading: isFlashLoading } = useQuery({
        queryKey: ["flash-sale"],
        queryFn: async () => {
            const res = await api.get<StrapiSingleResponse<FlashSale>>("/flash-sale");
            return res.data.data;
        },
    });

    const { data: productsData, isLoading: isProductsLoading } = useQuery({
        queryKey: ["sale-products"],
        queryFn: async () => {
            const res = await api.get<StrapiResponse<Product>>("/products?populate[0]=cover&populate[1]=image&populate[2]=gallery&populate[3]=categories&filters[categories][name][$eq]=OFFRE&pagination[limit]=100");
            return res.data.data;
        },
    });

    if (isFlashLoading || isProductsLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-black" />
            </div>
        );
    }

    const flashSale = flashSaleData;
    const allProducts = productsData || [];

    if (!flashSale?.isActive) {
        return <Navigate to="/" replace />;
    }

    const now = new Date();
    const start = flashSale.startAt ? new Date(flashSale.startAt) : null;
    const hasStarted = !start || now >= start;

    // Client-side filtering logic
    const filteredProducts = allProducts.filter(product => {
        if (selectedSizes.length > 0) {
            let productSizes: string[] = [];
            if (Array.isArray(product.sizes)) {
                productSizes = product.sizes.map(String);
            } else if (product.sizes && typeof product.sizes === 'object' && 'sizes' in product.sizes) {
                productSizes = (product.sizes as { sizes: any[] }).sizes.map(String);
            }
            if (!selectedSizes.some(s => productSizes.includes(s))) return false;
        }
        if (selectedColors.length > 0) {
            let productColors: string[] = [];
            if (Array.isArray(product.colors)) {
                productColors = product.colors.map(c => String(c).toLowerCase());
            } else if (product.colors && typeof product.colors === 'object' && 'colors' in product.colors) {
                productColors = (product.colors as { colors: any[] }).colors.map(c => String(c).toLowerCase());
            }
            if (!selectedColors.some(c => productColors.includes(c.toLowerCase()))) return false;
        }
        if (selectedTypes.length > 0) {
            const nameLower = product.name.toLowerCase();
            const descLower = product.description?.toLowerCase() || "";
            const hasMatch = selectedTypes.some(type => {
                if (type === 'basket') return nameLower.includes('basket') || nameLower.includes('sneak') || descLower.includes('basket') || descLower.includes('sneak');
                if (type === 'ballerine') return nameLower.includes('ballerine') || descLower.includes('ballerine');
                if (type === 'sandale') return nameLower.includes('sandale') || nameLower.includes('cendel') || descLower.includes('sandale') || descLower.includes('cendel');
                if (type === 'claquette') return nameLower.includes('claquette') || descLower.includes('claquette');
                if (type === 'talon') return nameLower.includes('talon') || nameLower.includes('heel') || descLower.includes('talon') || descLower.includes('heel');
                if (type === 'boot') return nameLower.includes('boot') || nameLower.includes('botte') || descLower.includes('boot') || descLower.includes('botte');
                return false;
            });
            if (!hasMatch) return false;
        }
        const priceNum = parseFloat(String(product.price_display).replace(',', '.') || "0");
        if (priceNum < priceRange[0] || priceNum > priceRange[1]) return false;
        return true;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const priceA = parseInt(a.price_display?.replace(/\D/g, '') || "0");
        const priceB = parseInt(b.price_display?.replace(/\D/g, '') || "0");
        if (sortBy === "price:asc") return priceA - priceB;
        if (sortBy === "price:desc") return priceB - priceA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const toggleSize = (size: string) => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    const toggleColor = (color: string) => setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
    const toggleType = (type: string) => setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    const clearAllFilters = () => {
        setSelectedSizes([]);
        setSelectedColors([]);
        setSelectedTypes([]);
        setPriceRange([0, 1000]);
        setSortBy("createdAt:desc");
    };

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative w-full py-16 md:py-24 bg-black overflow-hidden">
                <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                    <span className="text-[30vw] font-black italic uppercase select-none text-white whitespace-nowrap">FLASH SALE</span>
                </div>
                <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 animate-pulse">
                        <Sparkles className="h-3 w-3" />
                        {t.flashSale.limited}
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-6">{flashSale?.title || t.promotions.title}</h1>
                    <p className="max-w-2xl text-gray-400 text-sm md:text-base font-medium mb-12">{flashSale?.description || t.promotions.subtitle}</p>
                    {(() => {
                        const targetDate = hasStarted ? flashSale.endAt : flashSale.startAt!;
                        const label = hasStarted ? t.flashSale.endsIn : t.flashSale.startsIn;

                        return (
                            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-3xl mb-12">
                                {flashSale.startAt && (
                                    <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-12 mb-8 pb-8 border-b border-white/10">
                                        <div className="flex flex-col items-center">
                                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{t.flashSale.startDate}</p>
                                            <p className="text-white text-lg font-black">{new Date(flashSale.startAt).toLocaleDateString(language, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                        <div className="hidden md:flex items-center text-red-600">
                                            <Sparkles className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{t.flashSale.endDate}</p>
                                            <p className="text-white text-lg font-black">{new Date(flashSale.endAt).toLocaleDateString(language, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                )}
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">{label}</p>
                                <CountdownTimer targetDate={targetDate} />
                            </div>
                        );
                    })()}
                    {hasStarted && (
                        <button
                            onClick={() => setIsFilterSidebarOpen(true)}
                            className="flex items-center gap-4 bg-white text-black px-12 py-5 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all duration-300 shadow-2xl"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            {t.products.filter}
                        </button>
                    )}
                </div>
            </section>

            {/* Content Container */}
            <section className="container mx-auto px-6 py-20">
                <div className="flex gap-12">
                    {hasStarted ? (
                        <>
                            {/* Sidebar Drawer */}
                            <aside className={`fixed inset-y-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} z-[100] w-full sm:w-[450px] bg-white transform transition-transform duration-500 ease-in-out ${isFilterSidebarOpen ? "translate-x-0" : (dir === 'rtl' ? "-translate-x-full" : "translate-x-full")} shadow-2xl`}>
                                <div className="h-full relative overflow-y-auto">
                                    <button onClick={() => setIsFilterSidebarOpen(false)} className={`absolute top-8 ${dir === 'rtl' ? 'left-8' : 'right-8'} z-20 p-2 hover:bg-gray-50 rounded-full transition-colors border border-gray-100`}><X className="h-6 w-6" /></button>
                                    <ProductFilters
                                        selectedCategory="OFFRE"
                                        selectedSizes={selectedSizes}
                                        onSizeChange={toggleSize}
                                        selectedColors={selectedColors}
                                        onColorChange={toggleColor}
                                        selectedTypes={selectedTypes}
                                        onTypeChange={toggleType}
                                        priceRange={priceRange}
                                        onPriceChange={setPriceRange}
                                        sortBy={sortBy}
                                        onSortChange={setSortBy}
                                        onClearAll={clearAllFilters}
                                        itemCount={sortedProducts.length}
                                        onApply={() => setIsFilterSidebarOpen(false)}
                                    />
                                </div>
                            </aside>

                            {isFilterSidebarOpen && <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[90] animate-in fade-in duration-500" onClick={() => setIsFilterSidebarOpen(false)} />}

                            <main className="flex-1">
                                <div className="flex items-center justify-between mb-12 border-b-[3px] border-black pb-6">
                                    <div className="flex items-center gap-4">
                                        <ShoppingBag className="h-6 w-6" />
                                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">{t.flashSale.itemsTitle}</h2>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                                        {sortedProducts.length} {t.flashSale.models}
                                    </span>
                                </div>

                                {sortedProducts.length === 0 ? (
                                    <div className="text-center py-32 space-y-6 bg-gray-50 rounded-3xl">
                                        <LayoutGrid className="mx-auto h-16 w-16 text-gray-200" />
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs uppercase">{t.promotions.noPromo}</p>
                                        <button onClick={clearAllFilters} className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-8 py-3 hover:bg-gray-800 transition-colors uppercase">{t.products.reset}</button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                                        {sortedProducts.map((p) => (
                                            <ProductCard key={p.documentId} product={p} />
                                        ))}
                                    </div>
                                )}
                            </main>
                        </>
                    ) : (
                        <div className="flex-1 text-center py-32 space-y-8 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                           <div className="relative inline-block">
                                <ShoppingBag className="mx-auto h-20 w-20 text-gray-200" />
                                <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-red-600 animate-pulse" />
                           </div>
                           <div className="space-y-4">
                                <h3 className="text-2xl font-black uppercase tracking-tighter">{t.flashSale.backSoon}</h3>
                                <p className="text-gray-400 font-medium max-w-md mx-auto">{t.promotions.subtitle}</p>
                           </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
