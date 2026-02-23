import { useState, SyntheticEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Strapi sends the code as a query parameter named 'code'
    const code = searchParams.get("code");

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== passwordConfirmation) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (!code) {
            setError("Code de réinitialisation manquant.");
            return;
        }

        setLoading(true);

        try {
            await api.post("/auth/reset-password", {
                code,
                password,
                passwordConfirmation,
            });

            // Redirect to login with a success message (could be handled via state/query param, but simple redirect for now)
            navigate("/login");
        } catch (err: any) {
            console.error("Reset password error:", err);
            if (err.response?.data?.error?.message) {
                setError(err.response.data.error.message);
            } else {
                setError("Une erreur est survenue. Le lien a peut-être expiré.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!code) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-red-600">Lien invalide</h2>
                    <p className="mt-2 text-gray-600">Le code de réinitialisation est manquant.</p>
                    <Link to="/forgot-password" className="mt-4 inline-block text-black hover:underline font-bold">
                        Renvoyer un email
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-lg rounded-xl">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 uppercase">
                        Nouveau mot de passe
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div className="mb-4">
                            <label htmlFor="password" className="sr-only">
                                Nouveau mot de passe
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="relative block w-full rounded-md border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 bg-gray-50"
                                placeholder="Nouveau mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="passwordConfirmation" className="sr-only">
                                Confirmer le mot de passe
                            </label>
                            <input
                                id="passwordConfirmation"
                                name="passwordConfirmation"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="relative block w-full rounded-md border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 bg-gray-50"
                                placeholder="Confirmer le mot de passe"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
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
                                "Réinitialiser le mot de passe"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
