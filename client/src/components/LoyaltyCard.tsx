import { useLanguage } from "../context/LanguageContext";
import { CreditCard, Award, Zap, QrCode, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface LoyaltyCardProps {
    points: number;
    level: "BRONZE" | "SILVER" | "GOLD";
    userName: string;
    memberSince: string;
}

export function LoyaltyCard({ points, level, userName, memberSince }: LoyaltyCardProps) {
    const { t, dir } = useLanguage();

    const getLevelConfig = () => {
        switch (level) {
            case "GOLD":
                return {
                    bg: "bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600",
                    badge: t.loyalty.gold,
                    icon: <Award className="h-6 w-6 text-white" />,
                    accent: "bg-yellow-100/20",
                    benefit: t.loyalty.benefits.gold
                };
            case "SILVER":
                return {
                    bg: "bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500",
                    badge: t.loyalty.silver,
                    icon: <Zap className="h-6 w-6 text-white" />,
                    accent: "bg-slate-100/20",
                    benefit: t.loyalty.benefits.silver
                };
            default:
                return {
                    bg: "bg-gradient-to-br from-orange-400 via-orange-500 to-red-600",
                    badge: t.loyalty.bronze,
                    icon: <Sparkles className="h-6 w-6 text-white" />,
                    accent: "bg-orange-100/20",
                    benefit: t.loyalty.benefits.bronze
                };
        }
    };

    const config = getLevelConfig();
    const progress = (points % 500) / 500 * 100;
    const nextRewardPoints = 500 - (points % 500);

    return (
        <div className={`w-full max-w-md ${dir === 'rtl' ? 'ml-auto' : 'mx-auto'}`}>
            {/* The Virtual Card */}
            <motion.div 
                initial={{ rotateY: 20, rotateX: 5, opacity: 0 }}
                animate={{ rotateY: 0, rotateX: 0, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`relative aspect-[1.6/1] w-full rounded-[2rem] p-8 text-white shadow-2xl overflow-hidden ${config.bg} group`}
                style={{ direction: dir === 'rtl' ? 'rtl' : 'ltr' }}
            >
                {/* Decorative Circles */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl" />

                <div className="relative h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">{t.loyalty.exclusive}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black uppercase tracking-tighter italic">Oussama Shoes</span>
                            </div>
                        </div>
                        <div className={`p-3 rounded-2xl ${config.accent} backdrop-blur-md`}>
                            {config.icon}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-end justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                        <QrCode className="h-10 w-10 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-3xl font-black tracking-tighter">{points}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{t.loyalty.points}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`text-right flex flex-col ${dir === 'rtl' ? 'items-start' : 'items-end'}`}>
                                <span className="block text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t.loyalty.cardHolder}</span>
                                <span className="text-lg font-black uppercase tracking-tight truncate max-w-[150px] mb-2">{userName}</span>
                                <span className="block text-[8px] font-bold uppercase tracking-widest opacity-40">{t.loyalty.memberSince} {memberSince}</span>
                            </div>
                        </div>

                        <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ delay: 0.5, duration: 1.5 }}
                                className={`h-full bg-white ${dir === 'rtl' ? 'float-right' : 'float-left'}`}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Info Section */}
            <div className={`mt-8 space-y-6 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-center justify-between ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-black">{t.loyalty.level}</h4>
                        <span className="text-2xl font-black text-red-600 uppercase italic tracking-tighter">{config.badge}</span>
                    </div>
                    <div className={dir === 'rtl' ? 'text-left' : 'text-right'}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.loyalty.nextReward}</h4>
                        <span className="text-lg font-black text-black">{nextRewardPoints} pts</span>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-600 italic">
                        " {config.benefit} "
                    </p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{t.loyalty.howItWorks}</h5>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <CreditCard className="h-4 w-4 text-red-600" />
                            </div>
                            <span className="text-[11px] font-black">{t.loyalty.gainRule}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                <Award className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="text-[11px] font-black">{t.loyalty.benefitRule}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
