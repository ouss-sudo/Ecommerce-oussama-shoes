import { useState, SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await api.post("/auth/forgot-password", {
                email,
            });
            setSuccess(true);
        } catch (err: any) {
            console.error("Forgot password error:", err);
            if (err.response?.data?.error?.message) {
                setError(err.response.data.error.message);
            } else {
                setError("Une erreur est survenue. Veuillez réessayer.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-lg rounded-xl text-center">
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">Email Envoyé</h2>
                    <p className="mt-2 text-gray-600">
                        Si un compte existe avec cette adresse email, vous recevrez un lien pour réinitialiser votre mot de passe.
                    </p>
                    <div className="mt-6">
                        <Link to="/login" className="font-medium text-black hover:underline uppercase font-bold text-xs tracking-wider">
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-lg rounded-xl">
                <div>
                    <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-black mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                    </Link>
                    <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900 uppercase">
                        Mot de passe oublié
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-md border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 bg-gray-50"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md bg-black px-3 py-3 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider transition-colors"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Envoyer le lien"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
