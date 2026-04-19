
import { useMemo } from 'react';
import { Award, Crown, Zap, ShieldCheck, Heart } from 'lucide-react';

interface UserBadgeProps {
    createdAt: string;
    userName: string;
    avatarUrl?: string;
    showLabel?: boolean;
}

export function UserBadge({ createdAt, userName, avatarUrl, showLabel = true }: UserBadgeProps) {
    const badgeInfo = useMemo(() => {
        const joinDate = new Date(createdAt);
        const now = new Date();
        const diffInMonths = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());

        if (diffInMonths >= 24) return { 
            name: "Légende", 
            color: "from-purple-600 to-indigo-700", 
            icon: <Crown className="w-3 h-3 text-white" />,
            glow: "shadow-[0_0_15px_rgba(124,58,237,0.5)] border-indigo-200",
            message: "Légende vivante d'Oussama Shoes ! Merci infiniment."
        };
        if (diffInMonths >= 12) return { 
            name: "Platine", 
            color: "from-slate-300 via-white to-slate-400", 
            icon: <ShieldCheck className="w-3 h-3 text-slate-700" />,
            glow: "shadow-[0_0_15px_rgba(255,255,255,0.4)] border-white",
            message: "1 an ! Une année de confiance mutuelle."
        };
        if (diffInMonths >= 6) return { 
            name: "VIP Or", 
            color: "from-yellow-300 via-amber-500 to-yellow-600", 
            icon: <Award className="w-3 h-3 text-amber-900" />,
            glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)] border-amber-200",
            message: "6 mois ! Vous êtes l'un de nos membres précieux."
        };
        if (diffInMonths >= 3) return { 
            name: "Ambassadeur", 
            color: "from-slate-100 to-slate-400", 
            icon: <Zap className="w-3 h-3 text-slate-600" />,
            glow: "shadow-[0_0_10px_rgba(148,163,184,0.3)] border-slate-200",
            message: "3 mois de fidélité ! Vous êtes au top."
        };
        if (diffInMonths >= 1) return { 
            name: "Fidèle", 
            color: "from-orange-400 to-red-600", 
            icon: <Heart className="w-3 h-3 text-white" />,
            glow: "shadow-[0_0_10px_rgba(234,88,12,0.3)] border-orange-200",
            message: "1 mois de style avec nous. Merci !"
        };
        
        return { 
            name: "Bienvenue", 
            color: "from-zinc-900 via-zinc-800 to-black", 
            icon: <Zap className="w-3 h-3 text-emerald-400" />,
            glow: "shadow-[0_0_10px_rgba(52,211,153,0.2)] border-zinc-800",
            message: "Bienvenue dans la famille Oussama Shoes !"
        };
    }, [createdAt]);

    return (
        <div className="flex items-center gap-3">
            <div className={`relative group`}>
                {/* Decorative outer ring - Contained to avoid overflow */}
                <div className={`absolute inset-0 bg-gradient-to-tr ${badgeInfo.color} rounded-full opacity-60 blur-[1px] ${badgeInfo.glow}`} />
                
                {/* Profile Image Container */}
                <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-zinc-900 bg-black flex items-center justify-center z-10">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-white font-black text-xs">{userName.charAt(0).toUpperCase()}</span>
                    )}
                </div>

                {/* Badge Icon Overlay */}
                {badgeInfo.icon && (
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full bg-gradient-to-tr ${badgeInfo.color} shadow-lg border border-black/20 flex items-center justify-center transform group-hover:scale-110 transition-transform`}>
                        {badgeInfo.icon}
                    </div>
                )}

                {/* Tooltip on Hover - Positioned with safety margin */}
                <div className="absolute bottom-full mb-3 right-0 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300 pointer-events-none z-[100] whitespace-nowrap translate-x-1 lg:translate-x-0">
                    <div className="bg-black/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 relative">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">{badgeInfo.message}</p>
                        {/* Tooltip Arrow - Aligned to the badge icon */}
                        <div className="absolute top-full right-3 border-8 border-transparent border-t-black/95" />
                    </div>
                </div>
            </div>

            {showLabel && (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none mb-1">{userName}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-sm bg-gradient-to-tr ${badgeInfo.color} text-black inline-block w-max`}>
                        Membre {badgeInfo.name}
                    </span>
                </div>
            )}
        </div>
    );
}
