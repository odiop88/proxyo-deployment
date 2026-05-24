import { useState } from "react";
import { useLocation} from "react-router-dom";
import { CheckCircle, Mail } from "lucide-react";
import Header from "../components/header";
import { resendVerification } from "../services/auth_api";

export default function VerifyEmailSentPage() {
  const location = useLocation();


  const email: string = location.state?.email || localStorage.getItem("pending_email") || "";

  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleResend() {
    if (!email) return;
    setResendStatus("loading");
    try {
      await resendVerification(email);
      setResendStatus("sent");
    } catch {
      setResendStatus("error");
    }
  }

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
          {/* Icône succès */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(126,50,133,0.08)" }}>
              <CheckCircle size={30} style={{ color: "#7e3285" }} />
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-xl font-bold text-gray-900 mb-3">
            Inscription réussie !
          </h1>

          {/* Message */}
          <p className="text-sm text-gray-500 leading-relaxed mb-2">
            Votre compte a bien été créé. Pour l'activer, veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation.
          </p>

          {email && (
            <p className="text-sm font-semibold mt-3 mb-1" style={{ color: "#7e3285" }}>
              {email}
            </p>
          )}

          <p className="text-xs text-gray-400 mb-8">
            Pensez à vérifier vos spams si vous ne trouvez pas l'email.
          </p>
          {/* Séparateur */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs text-gray-400 mb-3">Vous n'avez pas reçu l'email ?</p>

            {resendStatus === "sent" ? (
              <div className="flex items-center justify-center gap-2 text-sm font-medium" style={{ color: "#7e3285" }}>
                <Mail size={14} />
                Email renvoyé avec succès
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendStatus === "loading"}
                className="text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ color: "#7e3285" }}
              >
                {resendStatus === "loading" ? "Envoi en cours..." : "Renvoyer l'email de vérification"}
              </button>
            )}

            {resendStatus === "error" && (
              <p className="text-xs text-red-400 mt-2">Erreur lors du renvoi. Réessayez.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}