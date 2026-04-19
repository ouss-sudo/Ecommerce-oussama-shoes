import { useState, useEffect } from 'react';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface CountdownTimerProps {
    targetDate: string;
    onExpire?: () => void;
}

export function CountdownTimer({ targetDate, onExpire }: CountdownTimerProps) {
    const calculateTimeLeft = (): TimeLeft => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
            onExpire?.();
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const TimeUnit = ({ value, label }: { value: number, label: string }) => (
        <div className="flex flex-col items-center">
            <div className="bg-black text-white w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-xl shadow-2xl mb-2">
                <span className="text-xl md:text-3xl font-black tabular-nums">{value.toString().padStart(2, '0')}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</span>
        </div>
    );

    return (
        <div className="flex gap-3 md:gap-6 animate-in zoom-in-95 duration-700">
            <TimeUnit value={timeLeft.days} label="Jours" />
            <TimeUnit value={timeLeft.hours} label="Heures" />
            <TimeUnit value={timeLeft.minutes} label="Min" />
            <TimeUnit value={timeLeft.seconds} label="Sec" />
        </div>
    );
}
