import { X, ChevronDown, MoveRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface ProductFiltersProps {
    selectedCategory: string;
    selectedSizes: string[];
    onSizeChange: (size: string) => void;
    selectedColors: string[];
    onColorChange: (color: string) => void;
    priceRange: [number, number];
    onPriceChange: (range: [number, number]) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    onClearAll: () => void;
    itemCount: number;
    onApply: () => void;
    selectedTypes: string[];
    onTypeChange: (type: string) => void;
}

const MEN_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49"];
const WOMEN_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
const KIDS_SIZES = ["16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35"];

export function ProductFilters({
    selectedCategory,
    selectedSizes,
    onSizeChange,
    selectedColors,
    onColorChange,
    priceRange,
    onPriceChange,
    sortBy,
    onSortChange,
    onClearAll,
    itemCount,
    onApply,
    selectedTypes,
    onTypeChange
}: ProductFiltersProps) {
    const { t, language, dir } = useLanguage();
    const hasFilters = selectedSizes.length > 0 || selectedColors.length > 0 || selectedTypes.length > 0 || selectedCategory !== "all";

    const isKids = selectedCategory === "ENFANTS" || selectedCategory === "KIDS";
    const isWomen = selectedCategory === "FEMME";
    const isMen = selectedCategory === "HOMME";

    let sizesToDisplay = MEN_SIZES;
    if (isKids) {
        sizesToDisplay = KIDS_SIZES;
    } else if (isWomen) {
        sizesToDisplay = WOMEN_SIZES;
    } else if (isMen || selectedCategory === "NOUVEAUTES" || selectedCategory === "NOUVEAUTÉS" || selectedCategory === "NEW") {
        sizesToDisplay = MEN_SIZES;
    } else if (selectedCategory === "all" || selectedCategory === "OFFRE") {
        sizesToDisplay = [...KIDS_SIZES, ...MEN_SIZES];
    } else {
        sizesToDisplay = MEN_SIZES;
    }

    const COLORS = [
        { name: language === 'en' ? "Black" : (language === 'ar' ? 'أسود' : 'Noir'), hex: "#000000" },
        { name: language === 'en' ? "White" : (language === 'ar' ? 'أبيض' : 'Blanc'), hex: "#FFFFFF" },
        { name: language === 'en' ? "Red" : (language === 'ar' ? 'أحمر' : 'Rouge'), hex: "#FF0000" },
        { name: language === 'en' ? "Blue" : (language === 'ar' ? 'أزرق' : 'Bleu'), hex: "#0000FF" },
        { name: language === 'en' ? "Green" : (language === 'ar' ? 'أخضر' : 'Vert'), hex: "#00FF00" },
        { name: language === 'en' ? "Grey" : (language === 'ar' ? 'رمادي' : 'Gris'), hex: "#808080" },
        { name: language === 'en' ? "Beige" : (language === 'ar' ? 'بيج' : 'Beige'), hex: "#F5F5DC" },
        { name: language === 'en' ? "Brown" : (language === 'ar' ? 'بني' : 'Marron'), hex: "#8B4513" },
        { name: language === 'en' ? "Pink" : (language === 'ar' ? 'وردي' : 'Rose'), hex: "#FFC0CB" },
        { name: language === 'en' ? "Navy" : (language === 'ar' ? 'كحلي' : 'Bleu Marine'), hex: "#000080" },
        { name: language === 'en' ? "Orange" : (language === 'ar' ? 'برتقالي' : 'Orange'), hex: "#FFA500" },
        { name: language === 'en' ? "Yellow" : (language === 'ar' ? 'أصفر' : 'Jaune'), hex: "#FFFF00" },
        { name: language === 'en' ? "Purple" : (language === 'ar' ? 'بنفسجي' : 'Violet'), hex: "#800080" },
        { name: language === 'en' ? "Gold" : (language === 'ar' ? 'ذهبي' : 'Doré'), hex: "#D4AF37" },
        { name: language === 'en' ? "Silver" : (language === 'ar' ? 'فضي' : 'Argenté'), hex: "#C0C0C0" },
        { name: language === 'en' ? "Burgundy" : (language === 'ar' ? 'عنابي' : 'Bordeaux'), hex: "#800000" },
        { name: language === 'en' ? "Turquoise" : (language === 'ar' ? 'فيروزي' : 'Turquoise'), hex: "#40E0D0" },
        { name: language === 'en' ? "Khaki" : (language === 'ar' ? 'خاكي' : 'Kaki'), hex: "#C3B091" },
        { name: language === 'en' ? "Camel" : (language === 'ar' ? 'جملي' : 'Camel'), hex: "#C19A6B" },
        { name: language === 'en' ? "Lime" : (language === 'ar' ? 'ليموني' : 'Citron Vert'), hex: "#32CD32" },
        { name: language === 'en' ? "Teal" : (language === 'ar' ? 'تيلي' : 'Sarcelle'), hex: "#008080" },
        { name: language === 'en' ? "Indigo" : (language === 'ar' ? 'نيلي' : 'Indigo'), hex: "#4B0082" },
        { name: language === 'en' ? "Brick" : (language === 'ar' ? 'قرميدي' : 'Brique'), hex: "#F7630C" },
        { name: language === 'en' ? "Bronze" : (language === 'ar' ? 'برونزي' : 'Bronze'), hex: "#CD7F32" },
        { name: language === 'en' ? "Taupe" : (language === 'ar' ? 'رمادي داكن' : 'Taupe'), hex: "#483C32" },
        { name: language === 'en' ? "Multicolor" : (language === 'ar' ? 'متعدد الألوان' : 'Multicolore'), hex: "multicolor" },
    ];

    const ALL_SHOE_TYPES = [
        { id: 'basket', name: language === 'ar' ? 'حذاء رياضي' : (language === 'en' ? 'Sneakers' : 'Basket') },
        { id: 'ballerine', name: language === 'ar' ? 'باليرينا' : (language === 'en' ? 'Ballerinas' : 'Ballerine') },
        { id: 'sandale', name: language === 'ar' ? 'صندل' : (language === 'en' ? 'Sandals' : 'Sandale') },
        { id: 'claquette', name: language === 'ar' ? 'سليبر' : (language === 'en' ? 'Slides' : 'Claquette') },
        { id: 'talon', name: language === 'ar' ? 'كعب' : (language === 'en' ? 'Heels' : 'Talon') },
        { id: 'talon-soiree', name: language === 'ar' ? 'كعب سهرة' : (language === 'en' ? 'Evening Heels' : 'Talon Soirée') },
        { id: 'boot', name: language === 'ar' ? 'بوت' : (language === 'en' ? 'Boots' : 'Boot') },
        { id: 'chaussures', name: language === 'ar' ? 'حذاء كلاسيكي' : (language === 'en' ? 'Shoes' : 'Chaussures') }
    ];

    let SHOE_TYPES = ALL_SHOE_TYPES;
    if (isMen) {
        SHOE_TYPES = ALL_SHOE_TYPES.filter(t => ['basket', 'claquette', 'chaussures', 'boot'].includes(t.id));
    } else if (isWomen) {
        SHOE_TYPES = ALL_SHOE_TYPES.filter(t => ['basket', 'ballerine', 'sandale', 'claquette', 'talon', 'talon-soiree', 'boot'].includes(t.id));
    } else if (isKids) {
        SHOE_TYPES = ALL_SHOE_TYPES.filter(t => ['basket', 'ballerine', 'sandale', 'claquette'].includes(t.id));
    }

    const sortOptions = [
        { label: t.products.sortOptions.lowHigh, value: "price:asc" },
        { label: t.products.sortOptions.newest, value: "createdAt:desc" },
        { label: t.products.sortOptions.bestseller, value: "popularity:desc" },
        { label: t.products.sortOptions.highLow, value: "price:desc" },
    ];

    return (
        <div className={`flex flex-col h-full overflow-y-auto bg-white border-l border-gray-100 p-6 min-w-[320px] ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{t.products.filter}</h2>
                <button
                    onClick={onClearAll}
                    className="text-[10px] font-black uppercase tracking-widest underline underline-offset-8 decoration-2 hover:text-gray-400 transition-colors"
                >
                    {t.products.clearAll}
                </button>
            </div>

            {/* Applied Filters */}
            {hasFilters && (
                <div className="mb-10 animate-in fade-in duration-500">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{t.products.appliedFilters}</h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedCategory !== "all" && (
                            <div className="flex items-center gap-2 border-2 border-black px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-black text-white">
                                <span>{(t.categories as any)[selectedCategory] || selectedCategory}</span>
                            </div>
                        )}
                        {selectedSizes.map(size => (
                            <div key={size} className="flex items-center gap-2 border-2 border-black px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                                <button onClick={() => onSizeChange(size)} className="flex items-center gap-2">
                                    <X className="h-3 w-3" /> {size}
                                </button>
                            </div>
                        ))}
                        {selectedTypes.map(typeId => {
                            const type = SHOE_TYPES.find(t => t.id === typeId);
                            return (
                                <div key={typeId} className="flex items-center gap-2 border-2 border-black px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-gray-100">
                                    <button onClick={() => onTypeChange(typeId)} className="flex items-center gap-2">
                                        <X className="h-3 w-3" /> {type?.name || typeId}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Sorting */}
            <div className="border-t border-gray-100 py-8">
                <div className="flex items-center justify-between mb-6 group cursor-pointer">
                    <h3 className="text-[10px] font-black uppercase tracking-widest">{t.products.sortBy}</h3>
                    <ChevronDown className="h-3 w-3" />
                </div>
                <div className="space-y-4">
                    {sortOptions.map((option) => (
                        <label key={option.value} className="flex items-center gap-4 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="radio"
                                    name="sort"
                                    className="sr-only"
                                    checked={sortBy === option.value}
                                    onChange={() => onSortChange(option.value)}
                                />
                                <div className={`h-6 w-6 rounded-full border-2 transition-all ${sortBy === option.value ? "border-black scale-110" : "border-gray-200 group-hover:border-black"
                                    }`} />
                                {sortBy === option.value && <div className="absolute h-3 w-3 rounded-full bg-black animate-in zoom-in duration-300" />}
                            </div>
                            <span className={`text-xs font-black uppercase tracking-tight transition-colors ${sortBy === option.value ? "text-black" : "text-gray-400 group-hover:text-black"}`}>{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Filter */}
            <div className="border-t border-gray-100 py-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-8">{t.products.price}</h3>
                <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={priceRange[1]}
                    onChange={(e) => onPriceChange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black mb-6"
                />
                <div className="flex justify-between text-xs font-black tracking-widest">
                    <span>{priceRange[0]} DT</span>
                    <span className="text-gray-400">{priceRange[1]} DT</span>
                </div>
            </div>

            {/* Sizes */}
            <div className="border-t border-gray-100 py-8 transition-all">
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-6">{t.products.sizes}</h3>
                <div className="grid grid-cols-4 gap-2">
                    {sizesToDisplay.map((size) => (
                        <button
                            key={size}
                            onClick={() => onSizeChange(size)}
                            className={`h-11 text-[10px] font-black transition-all duration-300 border-2 ${selectedSizes.includes(size)
                                ? "bg-black text-white border-black scale-95 shadow-lg"
                                : "bg-white text-black border-gray-100 hover:border-black"
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Types Filter */}
            <div className="border-t border-gray-100 py-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-6">
                    {language === 'ar' ? 'نوع الحذاء' : (language === 'en' ? 'Shoe Type' : 'Type de chaussure')}
                </h3>
                <div className="flex flex-wrap gap-2">
                    {SHOE_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => onTypeChange(type.id)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${selectedTypes.includes(type.id)
                                ? "bg-black text-white border-black scale-95"
                                : "bg-white text-black border-gray-100 hover:border-black"
                                }`}
                        >
                            {type.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Colors */}
            <div className="border-t border-gray-100 py-8 mb-32">
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-6">{t.products.colors}</h3>
                <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => {
                        const isMulti = color.hex === 'multicolor';
                        const isLight = color.hex === '#FFFFFF' || color.hex === '#FFFF00' || color.hex === '#F5F5DC';
                        return (
                            <button
                                key={color.name}
                                onClick={() => onColorChange(color.name)}
                                title={color.name}
                                className={`group relative h-10 w-10 border-2 transition-all duration-300 overflow-hidden rounded-sm ${
                                    selectedColors.includes(color.name)
                                        ? 'border-black scale-110 shadow-lg'
                                        : 'border-gray-200 hover:border-black'
                                }`}
                                style={isMulti ? {
                                    background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
                                } : {
                                    backgroundColor: color.hex
                                }}
                            >
                                <span className="sr-only">{color.name}</span>
                                {selectedColors.includes(color.name) && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                        <div className={`h-2 w-2 rounded-full ${isLight ? 'bg-black' : 'bg-white'}`} />
                                    </div>
                                )}
                                {/* Tooltip on hover */}
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase tracking-wider px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    {color.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer Apply Button (Adidas Style) */}
            <div className={`absolute bottom-0 left-0 right-0 p-8 bg-white border-t border-gray-100 z-10 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-gray-400">{itemCount} {t.products.found}</p>
                <button
                    onClick={onApply}
                    className="w-full bg-black text-white px-8 py-5 flex items-center justify-between font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]"
                >
                    <span>{t.products.apply}</span>
                    <MoveRight className={`h-5 w-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                </button>
            </div>
        </div>
    );
}
