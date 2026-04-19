import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { api, getStrapiMedia } from "../lib/api";
import type { Product, StrapiResponse } from "../types";
import { useAuth } from "../context/AuthContext";

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    products?: Product[];
}

type ChatMode = 'start' | 'normal' | 'reclamation_subject' | 'reclamation_message';

export function ChatAssistant() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<ChatMode>('start');
    const [complaintData, setComplaintData] = useState({ subject: '', message: '' });
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Bienvenue chez Oussama Shoes ! Veuillez choisir votre langue / Welcome! Choose your language / مرحبا بك! اختر لغتك", sender: 'bot' }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const selectLanguage = (lang: string) => {
        setMessages(prev => [...prev, 
            { id: Date.now(), text: lang, sender: 'user' },
            { id: Date.now() + 1, text: lang === 'Tunisien 🇹🇳' 
                ? "عسلامة ! كيفاش نجم نعاونك اليوم ؟ نجم نلوجلك على صباط، قياس، ولا تعمل réclamation." 
                : lang === 'English 🇬🇧'
                ? "Hello! How can I help you today? I can help you find products, sizes or handle a complaint."
                : lang === 'العربية 🇸🇦'
                ? "مرحبا! كيف يمكنني مساعدتك؟ يمكنني مساعدتك في العثور على المنتجات أو تقديم شكوى."
                : "Parfait ! Comment puis-je vous aider ? Je peux chercher un produit, une taille ou prendre une réclamation.", 
              sender: 'bot' }
        ]);
        setMode('normal');
    };

    useEffect(() => {
        api.get<StrapiResponse<Product>>("/products?populate[0]=categories&pagination[pageSize]=100")
            .then(res => setAllProducts(res.data.data))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput("");
        setIsTyping(true);

        setTimeout(async () => {
            let botResponse: { text: string; products?: Product[] };

            if (mode === 'reclamation_subject') {
                setComplaintData(prev => ({ ...prev, subject: currentInput }));
                botResponse = { text: "Très bien. Quel est le contenu de votre réclamation ? (Détails, numéro de commande, etc.)" };
                setMode('reclamation_message');
            } else if (mode === 'reclamation_message') {
                setIsTyping(true);
                const finalData = { ...complaintData, message: currentInput };
                
                try {
                    const contactData = {
                        fullName: user?.username || "Anonyme (Chat)",
                        email: user?.email || "anon@chat.com",
                        message: [
                            {
                                type: "paragraph",
                                children: [{ type: "text", text: `SUJET: ${finalData.subject}\n\nMESSAGE: ${finalData.message}` }]
                            }
                        ]
                    };
                    
                    await api.post("/contact-requests", { data: contactData });
                    
                    await fetch("https://formsubmit.co/ajax/oussama21072000@gmail.com", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({
                            ...contactData,
                            _subject: `RÉCLAMATION CHAT: ${finalData.subject}`,
                            _autoresponse: "Nous avons bien reçu votre réclamation via le chat."
                        })
                    }).catch(console.error);

                    botResponse = { text: "C'est envoyé ! ✅ Votre réclamation a été enregistrée. Nous vous répondrons très rapidement." };
                } catch (err) {
                    botResponse = { text: "Désolé, une erreur technique est survenue. Veuillez réessayer ou utiliser la page contact habituelle." };
                }
                setMode('normal');
            } else {
                botResponse = processQuery(currentInput);
            }

            setMessages(prev => [...prev, { id: Date.now() + 1, ...botResponse, sender: 'bot' }]);
            setIsTyping(false);
        }, 1000);
    };

    const processQuery = (query: string): { text: string; products?: Product[] } => {
        const q = query.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s\u0600-\u06FF]/gi, '');

        // ── 0. CHANGE LANGUAGE ──
        if (q.match(/\b(chang|beddel|langu|langa|lough|logh|لغة|لغتي)\b/)) {
            setMode('start');
            return { text: "Choisissez votre langue / Choose your language / أختار اللغة :" };
        }

        // ── 1. GREETINGS ──
        if (q.match(/\b(bonj|salu|hello|hi|hey|marh|asl|ahl|sbeh|صباح|أهل|مرحب)/)) {
            return { text: "Salut ! Je suis l'assistant Oussama Shoes. Je peux vous aider à trouver une pointure, une couleur, ou répondre à vos questions sur nos magasins et livraisons ! 😊" };
        }
        
        // ── 2. RECLAMATION ──
        if (q.match(/\b(recl|plain|prob|issu|moch|mosh|mokh|مشك|شكوى|problem|khra)/)) {
            setMode('reclamation_subject');
            return { text: "Je suis désolé d'apprendre ça. 🛠️ Quel est le SUJET de votre problème ? (ex: commande, article défectueux, retard...)" };
        }

        // ── 3. STORE LOCATIONS ──
        if (q.match(/\b(ou|where|win|fin|magas|bouti|store|shop|local|adress|blasa|محل|متجر|عنوان)/)) {
            return { text: "Nos boutiques (9h-21h, 7j/7) :\n\n📍 Kélibia : 8090 Avenue du Hammadi Gharbi\n🔗 https://maps.app.goo.gl/kmDScJPyEhvueG6C9\n\n📍 Nabeul : Rt Beni Khiar (Près Maison Hyundai)\n🔗 https://maps.app.goo.gl/MwQCbCryxAGPxGHL9\n\n📞 Tél: +216 22 616 088" };
        }

        // ── 4. DELIVERY ──
        if (q.match(/\b(livr|deliv|taws|aws|waqt|temps|delai|prix liv|gratuit|وصل|وقت)/)) {
            return { text: "La livraison se fait en 24h/48h partout en Tunisie. 🚚 Elle est GRATUITE dès 150 DT d'achat !" };
        }

        // ── 5. PAYMENT ──
        if (q.match(/\b(pay|paiem|flous|money|cache|carte|edinar|prix|kifech|دفع|فلوس)/)) {
            return { text: "Vous pouvez payer en Espèces à la livraison (Cash on Delivery) ou par Carte Bancaire/E-Dinar sur le site. 💳" };
        }

        // ── 6. RETURNS / EXCHANGE ──
        if (q.match(/\b(retour|chang|echan|return|baddal|beddel|rajja|رجوع|تبديل)/)) {
            return { text: "Vous avez 7 jours pour échanger votre article s'il ne vous convient pas. L'article doit être dans son emballage d'origine. 🔄" };
        }

        // ── 7. PRODUCT SEARCH (MULTILINGUAL & ROBUST) ──
        const sizeMatch = q.match(/\b(3[4-9]|4[0-8])\b/);
        const size = sizeMatch ? sizeMatch[0] : null;

        const isHomme = q.match(/\b(hom|man|men|rje|رجالي)\b/);
        const isFemme = q.match(/\b(fem|wom|nsa|nis|نسائي)\b/);
        const isEnfant = q.match(/\b(enf|kid|sgh|atf|أطفال|طفل)\b/);

        const colors = [
            { key: 'noir', variations: ['noir', 'black', 'akhal', 'khala', 'أسود'] },
            { key: 'blanc', variations: ['blanc', 'white', 'abyad', 'bayda', 'أبيض'] },
            { key: 'rouge', variations: ['rouge', 'red', 'ahmar', 'hamra', 'أحمر'] },
            { key: 'bleu', variations: ['bleu', 'blue', 'azraq', 'zarqa', 'أزرق'] },
            { key: 'marron', variations: ['marron', 'brown', 'qahwi', 'قهوي', 'بني'] }
        ];
        
        const foundColorObj = colors.find(c => c.variations.some(v => q.includes(v)));

        let results = allProducts;
        
        // Size Filter
        if (size) results = results.filter(p => JSON.stringify(p.sizes || "").includes(size));
        
        // Color Filter (Cross-language variation matching)
        if (foundColorObj) {
            results = results.filter(p => {
                const pColors = JSON.stringify(p.colors || "").toLowerCase();
                return foundColorObj.variations.some(v => pColors.includes(v));
            });
        }

        // Category Filter (Expanded)
        if (isHomme) results = results.filter(p => p.categories?.some(c => {
            const n = c.name?.toLowerCase() || '';
            const s = c.slug?.toLowerCase() || '';
            return n.includes('hom') || n.includes('man') || n.includes('men') || n.includes('رجال') || s.includes('hom') || s.includes('man');
        }));
        if (isFemme) results = results.filter(p => p.categories?.some(c => {
            const n = c.name?.toLowerCase() || '';
            const s = c.slug?.toLowerCase() || '';
            return n.includes('fem') || n.includes('wom') || n.includes('nsa') || n.includes('نساء') || s.includes('fem') || s.includes('wom');
        }));
        if (isEnfant) results = results.filter(p => p.categories?.some(c => {
            const n = c.name?.toLowerCase() || '';
            const s = c.slug?.toLowerCase() || '';
            return n.includes('enf') || n.includes('fil') || n.includes('gar') || n.includes('kid') || n.includes('طفل') || s.includes('enf') || s.includes('kid');
        }));

        if (results.length > 0 && (size || foundColorObj || isHomme || isFemme || isEnfant)) {
            return { text: "Voici ce que j'ai trouvé pour vous :", products: results.slice(0, 5) };
        }

        return { text: "Je suis un assistant spécialisé Oussama Shoes. 👟 Posez-moi une question sur : nos boutiques, la livraison, les retours, ou cherchez un modèle (ex: '42 noir homme')." };
    };

    const resetChat = () => {
        setMessages([{ id: 1, text: "Bienvenue ! Veuillez choisir votre langue.", sender: 'bot' }]);
        setMode('start');
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-[100] h-14 w-14 rounded-full bg-black text-white shadow-2xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center group ${isOpen ? "rotate-90" : ""}`}
            >
                {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 z-[100] w-[310px] md:w-[340px] h-[450px] bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    <div className="p-4 bg-black text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-wider">Assistant Oussama</h3>
                                <p className="text-[7px] font-bold text-gray-500 uppercase">En ligne</p>
                            </div>
                        </div>
                        <button onClick={resetChat} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <RefreshCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 scrollbar-hide">
                        {messages.map((m, idx) => (
                            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-[10px] font-semibold leading-relaxed shadow-sm ${
                                    m.sender === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-black border border-gray-100 rounded-tl-none'
                                }`}>
                                    {m.text}
                                </div>
                                {mode === 'start' && m.sender === 'bot' && idx === messages.length - 1 && (
                                    <div className="mt-3 grid grid-cols-2 gap-2 w-full">
                                        {['Français 🇫🇷', 'English 🇬🇧', 'العربية 🇸🇦', 'Tunisien 🇹🇳'].map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => selectLanguage(lang)}
                                                className="py-2.5 px-3 bg-white border border-gray-100 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
                                            >
                                                {lang}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {m.products && (
                                    <div className="mt-2 w-full flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                        {m.products.map((p, pIdx) => (
                                            <Link key={pIdx} to={`/products/${p.slug || p.documentId}`} className="w-24 shrink-0 bg-white border border-gray-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                <div className="aspect-square p-1.5 flex items-center justify-center bg-white">
                                                    <img src={getStrapiMedia(p.cover?.url || p.image?.[0]?.url || '') || ''} className="w-full h-full object-contain" alt="" />
                                                </div>
                                                <div className="p-1.5 border-t border-gray-50">
                                                    <p className="text-[7px] font-black truncate uppercase">{p.name}</p>
                                                    <p className="text-[8px] font-bold text-red-600">{p.price_display}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex items-center gap-2 text-gray-400 pl-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="text-[8px] font-black uppercase">...</span>
                            </div>
                        )}
                        {mode !== 'normal' && mode !== 'start' && (
                            <div className="py-2 px-3 bg-red-50 border border-red-100 rounded-xl text-[8px] font-black text-red-600 uppercase text-center">
                                Mode Réclamation
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="relative flex items-center gap-2">
                            <input 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Message..."
                                className="flex-1 bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-[10px] font-semibold focus:ring-1 focus:ring-black"
                            />
                            <button onClick={handleSend} className="absolute right-1.5 p-2 bg-black text-white rounded-lg">
                                <Send className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
