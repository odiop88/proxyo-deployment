import { Clock, Mail, LogOut } from "lucide-react";
import { useAuth } from "../context/auth_context";

export default function PendingActivationPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">

        <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-purple-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Compte en attente d'activation
        </h1>

        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Bonjour <span className="font-semibold text-gray-700">{user?.first_name}</span>,
          votre entreprise est en cours de vérification par notre équipe.
          Vous recevrez un email dès que votre compte sera activé.
        </p>

        <div className="bg-purple-50 rounded-xl p-4 flex items-start gap-3 text-left mb-8">
          <Mail className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
          <p className="text-sm text-purple-800">
            Un email de confirmation sera envoyé à{" "}
            <span className="font-semibold">{user?.email}</span>
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 mx-auto text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>

      </div>
    </div>
  );
}
