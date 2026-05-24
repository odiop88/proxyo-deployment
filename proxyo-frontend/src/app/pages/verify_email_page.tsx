/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import Header from "../components/header";
import { verifyEmail } from "../services/auth_api";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token manquant dans l'URL.");
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus("success");
      })
      .catch((err: Error) => {
        setStatus("error");
        setMessage(err.message || "Token invalide ou expiré.");
      });
  }, [token]);

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'DM Sans', sans-serif", background: "radial-gradient(ellipse at 60% 0%, #ede9f6 0%, #f0f0f3 40%, #e8e8ec 100%)" }}
    >
      <Header />

      <div className="flex flex-col items-center justify-center px-4 py-24">
        <div
          className="w-full max-w-md bg-white rounded-2xl p-10 text-center"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
        >

          {/* LOADING */}
          {status === "loading" && (
            <>
              <div className="flex justify-center mb-6">
                <Loader size={36} className="animate-spin text-gray-300" />
              </div>
              <h1 className="text-lg font-bold text-gray-800 mb-2">Vérification en cours...</h1>
              <p className="text-sm text-gray-400">Merci de patienter.</p>
            </>
          )}

          {/* SUCCESS */}
          {status === "success" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(126,50,133,0.08)" }}>
                  <CheckCircle size={30} style={{ color: "#7e3285" }} />
                </div>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-3">Email vérifié !</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                Votre compte est maintenant actif. Vous pouvez vous connecter.
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#7e3285" }}
              >
                Se connecter
              </button>
            </>
          )}

          {/* ERROR */}
          {status === "error" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-50">
                  <XCircle size={30} className="text-red-400" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-3">Lien invalide</h1>
              <p className="text-sm text-gray-400 mb-8">{message}</p>
              <button
                onClick={() => navigate("/auth")}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#7e3285" }}
              >
                Retour à la connexion
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}