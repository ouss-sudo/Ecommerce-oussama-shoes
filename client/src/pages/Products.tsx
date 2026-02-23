import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Product, StrapiResponse } from "../types";
import { ProductCard } from "../components/ProductCard";
import { ProductFilters } from "../components/ProductFilters";
import { Loader2, LayoutGrid, SlidersHorizontal, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";


export default function Products() {
    const [searchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get("category");
    const searchFromUrl = searchParams.get("search");
    const [selectedCategory, setSelectedCategory] = useState<string | "all">(categoryFromUrl || "all");
    const { t, dir } = useLanguage();

    // Filtering & Sorting states
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [sortBy, setSortBy] = useState<string>("createdAt:desc");
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

    // Sync state with URL
    useEffect(() => {
        if (categoryFromUrl) {
            setSelectedCategory(categoryFromUrl);
        } else {
            setSelectedCategory("all");
        }
    }, [categoryFromUrl]);

    // Fetch all products
    const { data: productsData, isLoading } = useQuery({
        queryKey: ["all-products"],
        queryFn: async () => {
            const res = await api.get<StrapiResponse<Product>>("/products?populate=*&pagination[limit]=100");
            return res.data;
        },
    });

    const allFetchedProducts = productsData?.data || [];

    // Client-side filtering logic
    const filteredProducts = allFetchedProducts.filter(product => {
        // 1. Category Filter
        if (selectedCategory !== "all") {
            const hasCategory = product.categories?.some(cat => cat.name === selectedCategory);
            if (!hasCategory) return false;
        }

        // 2. Search Filter
        if (searchFromUrl) {
            const searchLower = searchFromUrl.toLowerCase();
            const matchesSearch = product.name.toLowerCase().includes(searchLower) ||
                product.description?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }

        // 3. Size Filter
        if (selectedSizes.length > 0) {
            // Normalise les tailles du produit (JSON)
            let productSizes: string[] = [];
            if (Array.isArray(product.sizes)) {
                productSizes = product.sizes.map(String);
            } else if (product.sizes && typeof product.sizes === 'object' && 'sizes' in product.sizes) {
                productSizes = (product.sizes as { sizes: any[] }).sizes.map(String);
            }

            const hasMatch = selectedSizes.some(s => productSizes.includes(s));
            if (!hasMatch) return false;
        }

        // 4. Color Filter
        if (selectedColors.length > 0) {
            // Normalise les couleurs du produit (JSON)
            let productColors: string[] = [];
            if (Array.isArray(product.colors)) {
                productColors = product.colors.map(c => String(c).toLowerCase());
            } else if (product.colors && typeof product.colors === 'object' && 'colors' in product.colors) {
                productColors = (product.colors as { colors: any[] }).colors.map(c => String(c).toLowerCase());
            }

            const hasMatch = selectedColors.some(c => productColors.includes(c.toLowerCase()));
            if (!hasMatch) return false;
        }

        // 5. Product Type Filter (Basket, Ballerine, etc.)
        if (selectedTypes.length > 0) {
            const nameLower = product.name.toLowerCase();
            const descLower = product.description?.toLowerCase() || "";

            const hasMatch = selectedTypes.some(type => {
                if (type === 'basket') return nameLower.includes('basket') || nameLower.includes('sneak') || descLower.includes('basket') || descLower.includes('sneak');
                if (type === 'ballerine') return nameLower.includes('ballerine') || descLower.includes('ballerine');
                if (type === 'sandale') return nameLower.includes('sandale') || nameLower.includes('cendel') || descLower.includes('sandale') || descLower.includes('cendel');
                if (type === 'claquette') return nameLower.includes('claquette') || descLower.includes('claquette');
                if (type === 'talon') return nameLower.includes('talon') || nameLower.includes('heel') || descLower.includes('talon') || descLower.includes('heel');
                if (type === 'talon-soiree') return (nameLower.includes('talon') && nameLower.includes('soir')) || (descLower.includes('talon') && descLower.includes('soir'));
                if (type === 'boot') return nameLower.includes('boot') || nameLower.includes('botte') || descLower.includes('boot') || descLower.includes('botte');
                if (type === 'chaussures') return nameLower.includes('chaussure') || nameLower.includes('classic') || descLower.includes('chaussure') || descLower.includes('classic');
                return false;
            });

            if (!hasMatch) return false;
        }

        // 6. Price Filter
        const priceNum = parseInt(product.price_display?.replace(/\D/g, '') || "0");
        if (priceNum < priceRange[0] || priceNum > priceRange[1]) return false;

        return true;
    });

    // Client-side sorting
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === "price:asc") {
            const priceA = parseInt(a.price_display?.replace(/\D/g, '') || "0");
            const priceB = parseInt(b.price_display?.replace(/\D/g, '') || "0");
            return priceA - priceB;
        }
        if (sortBy === "price:desc") {
            const priceA = parseInt(a.price_display?.replace(/\D/g, '') || "0");
            const priceB = parseInt(b.price_display?.replace(/\D/g, '') || "0");
            return priceB - priceA;
        }
        if (sortBy === "createdAt:desc") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
    });

    const products = sortedProducts;

    const toggleSize = (size: string) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const toggleColor = (color: string) => {
        setSelectedColors(prev =>
            prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
        );
    };

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const clearAllFilters = () => {
        setSelectedSizes([]);
        setSelectedColors([]);
        setSelectedTypes([]);
        setPriceRange([0, 1000]);
        setSortBy("createdAt:desc");
    };

    const handleApply = () => {
        setIsFilterSidebarOpen(false);
    };

    return (
        <div className="container py-8 md:py-16 relative overflow-x-hidden">
            {/* Simple Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 px-4">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                        {selectedCategory === "all" ? t.products.title : (t.categories[selectedCategory as keyof typeof t.categories] || selectedCategory)}
                    </h1>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        {products.length} {t.products.found}
                    </p>
                </div>

                <button
                    onClick={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
                    className="flex items-center justify-center gap-3 px-10 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest group hover:bg-gray-800 transition-all duration-300 shadow-xl"
                >
                    <SlidersHorizontal className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
                    {isFilterSidebarOpen ? t.products.close : t.products.filter}
                </button>
            </div>

            <div className="flex gap-12">
                {/* Sidebar Drawer */}
                <aside
                    className={`fixed inset-y-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} z-[100] w-full sm:w-[450px] bg-white transform transition-transform duration-500 ease-in-out ${isFilterSidebarOpen ? "translate-x-0" : (dir === 'rtl' ? "-translate-x-full" : "translate-x-full")
                        } shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)]`}
                >
                    <div className="h-full relative overflow-y-auto">
                        <button
                            onClick={() => setIsFilterSidebarOpen(false)}
                            className={`absolute top-8 ${dir === 'rtl' ? 'left-8' : 'right-8'} z-20 p-2 hover:bg-gray-50 rounded-full transition-colors border border-gray-100`}
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <ProductFilters
                            selectedCategory={selectedCategory}
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
                            itemCount={products.length}
                            onApply={handleApply}
                        />
                    </div>
                </aside>

                {/* Overlay */}
                {isFilterSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-white/60 backdrop-blur-md z-[90] animate-in fade-in duration-500"
                        onClick={() => setIsFilterSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <div className="flex-1 px-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-black" />
                            <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">{t.products.loading}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center py-40 text-center gap-8 bg-gray-50/50 rounded-3xl">
                                    <LayoutGrid className="h-20 w-20 text-gray-100" />
                                    <div>
                                        <p className="text-2xl font-black uppercase tracking-tighter mb-2">{t.products.noResult}</p>
                                    </div>
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-10 py-4 hover:bg-gray-800 transition-colors"
                                    >
                                        {t.products.reset}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
