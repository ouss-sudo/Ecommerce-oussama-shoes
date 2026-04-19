import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useLanguage } from "../context/LanguageContext";

interface ContactForm {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export default function Contact() {
    const { t, dir } = useLanguage();
    const [formData, setFormData] = useState<ContactForm>({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const mutation = useMutation({
        mutationFn: async (data: ContactForm) => {
            const contactData = {
                fullName: data.name,
                email: data.email,
                message: [
                    {
                        type: "paragraph",
                        children: [{ type: "text", text: `SUJET: ${data.subject}\n\n${data.message}` }]
                    }
                ]
            };
            const strapiPromise = api.post("/contact-requests", { data: contactData });
            const emailPromise = fetch("https://formsubmit.co/ajax/oussama21072000@gmail.com", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    subject: data.subject,
                    message: data.message,
                    _subject: `Nouveau message de ${data.name}: ${data.subject}`,
                    _template: "table",
                    _cc: data.email,
                    _autoresponse: "Merci pour votre réclamation. Votre demande a été approuvée et nous vous répondrons dans les plus brefs délais.",
                    _captcha: "false"
                })
            });

            await Promise.allSettled([strapiPromise, emailPromise]);
        },
        onSuccess: () => {
            setSuccess(true);
            setError("");
            setFormData({ name: "", email: "", subject: "", message: "" });
        },
        onError: (err: any) => {
            console.error(err);
            setError(t.contact.error);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="container flex flex-col items-center py-8 md:py-12 lg:py-24">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[600px]">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tighter uppercase">{t.contact.title}</h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">
                        {t.contact.subtitle}
                    </p>
                </div>
                <div className="grid gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500" htmlFor="name">
                                    {t.contact.name}
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={t.contact.namePlaceholder}
                                    type="text"
                                    disabled={mutation.isPending}
                                    required
                                    className={`flex h-12 w-full border-2 border-gray-100 bg-gray-50 px-4 py-2 text-sm font-bold focus:border-black focus:outline-none transition-all placeholder:text-gray-300 ${dir === 'rtl' ? 'text-right' : ''}`}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500" htmlFor="email">
                                    {t.contact.email}
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder={t.contact.emailPlaceholder}
                                    type="email"
                                    disabled={mutation.isPending}
                                    required
                                    className={`flex h-12 w-full border-2 border-gray-100 bg-gray-50 px-4 py-2 text-sm font-bold focus:border-black focus:outline-none transition-all placeholder:text-gray-300 ${dir === 'rtl' ? 'text-right' : ''}`}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500" htmlFor="subject">
                                    {t.contact.subject}
                                </label>
                                <input
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder={t.contact.subjectPlaceholder}
                                    type="text"
                                    disabled={mutation.isPending}
                                    required
                                    className={`flex h-12 w-full border-2 border-gray-100 bg-gray-50 px-4 py-2 text-sm font-bold focus:border-black focus:outline-none transition-all placeholder:text-gray-300 ${dir === 'rtl' ? 'text-right' : ''}`}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500" htmlFor="message">
                                    {t.contact.message}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder={t.contact.messagePlaceholder}
                                    rows={5}
                                    disabled={mutation.isPending}
                                    required
                                    className={`flex min-h-[120px] w-full border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold focus:border-black focus:outline-none transition-all placeholder:text-gray-300 ${dir === 'rtl' ? 'text-right' : ''}`}
                                />
                            </div>
                            <button
                                disabled={mutation.isPending}
                                className={cn(
                                    "inline-flex items-center justify-center bg-black text-white hover:bg-gray-800 h-14 px-8 text-[11px] font-black uppercase tracking-[0.2em] transition-all",
                                    mutation.isPending && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {mutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {t.contact.send}
                            </button>
                        </div>
                    </form>
                    {success && (
                        <div className="text-center p-6 bg-green-50 border-2 border-green-100 rounded-xl space-y-2 animate-in fade-in zoom-in duration-300">
                            <p className="font-black text-green-700 uppercase tracking-widest text-xs">{t.contact.success}</p>
                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">{t.contact.successSub}</p>
                        </div>
                    )}
                    {error && (
                        <div className="text-center p-4 bg-red-50 border-2 border-red-100 rounded-xl">
                            <p className="text-[11px] font-black text-red-600 uppercase tracking-widest">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
