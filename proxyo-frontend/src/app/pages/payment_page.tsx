import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Shield, CheckCircle2, Briefcase,
  AlertCircle, Lock, User, Mail,
} from "lucide-react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements, PaymentElement, useStripe, useElements,
} from "@stripe/react-stripe-js";
import Header from "../components/header";
import { fetchWithAuth } from "../services/auth_api";

const API_URL = "http://127.0.0.1:8000/api/";

interface PaymentDetail {
  id: number;
  mission_id: number;
  mission_title: string;
  client_name: string;
  prestataire_name: string;
  proposed_price: string;
  tva_rate: string;
  tva_amount: string;
  platform_fee: string;
  prestataire_receives: string;
  total_client_pays: string;
  status: string;
  status_label: string;
  created_at: string;
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
}

// ── Formulaire Stripe ──────────────────────────────────────
function StripeForm({
  totalClientPays,
  billingName,
  billingEmail,
  onSuccess,
}: {
  totalClientPays: number;
  billingName: string;
  billingEmail: string;
  onSuccess: () => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error,  setError]  = useState("");

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true);
    setError("");
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
        payment_method_data: {
          billing_details: { name: billingName, email: billingEmail },
        },
      },
      redirect: "if_required",
    });
    if (result.error) {
      setError(result.error.message || "Erreur lors du paiement.");
      setPaying(false);
    } else {
      onSuccess();
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
      <button
        onClick={handlePay}
        disabled={!stripe || paying}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
        style={{ background: "#7e3285" }}
      >
        {paying ? (
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <><Lock size={14} /> Payer {fmt(totalClientPays)} €</>
        )}
      </button>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────
export default function PaymentPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate      = useNavigate();

  const [payment,       setPayment]       = useState<PaymentDetail | null>(null);
  const [clientSecret,  setClientSecret]  = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState("");
  const [showForm,      setShowForm]      = useState(false);

  const storedCompany = localStorage.getItem("company");
  const defaultName   = storedCompany ? JSON.parse(storedCompany)?.name         || "" : "";
  const defaultEmail  = storedCompany ? JSON.parse(storedCompany)?.contact_email || "" : "";
  const [billingName,  setBillingName]  = useState(defaultName);
  const [billingEmail, setBillingEmail] = useState(defaultEmail);
  const [infoError,    setInfoError]    = useState("");

  useEffect(() => {
    if (!paymentId) return;
    fetchWithAuth(`${API_URL}payments/${paymentId}/`)
      .then(r => { if (!r.ok) throw new Error("Paiement introuvable"); return r.json(); })
      .then(async (data: PaymentDetail) => {
        setPayment(data);
        if (data.status !== "pending") { setLoading(false); return; }
        const res = await fetchWithAuth(`${API_URL}stripe/checkout/${paymentId}/`, { method: "POST" });
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Erreur Stripe."); }
        const sd = await res.json();
        setClientSecret(sd.client_secret);
        setStripePromise(loadStripe(sd.publishable_key));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [paymentId]);

  function handleNext() {
    if (!billingName.trim())  { setInfoError("Le nom est requis."); return; }
    if (!billingEmail.trim()) { setInfoError("L'email est requis."); return; }
    setInfoError("");
    setShowForm(true);
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <div className="flex justify-center py-32">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error && !payment) return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <div className="flex flex-col items-center justify-center py-32">
        <AlertCircle size={40} className="text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">{error}</p>
        <button onClick={() => navigate("/dashboard")} className="mt-4 text-sm hover:underline" style={{ color: "#7e3285" }}>Retour</button>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement réussi !</h1>
        <p className="text-sm text-gray-400 mb-8">
          Les fonds sont sécurisés. La mission démarre maintenant.
        </p>
        {payment && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 text-left" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <p className="text-sm font-semibold text-gray-800 mb-1">{payment.mission_title}</p>
            <p className="text-xs text-gray-400 mb-3">Prestataire : {payment.prestataire_name}</p>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Montant sécurisé</span>
              <span className="text-sm font-bold text-green-600">{fmt(Number(payment.total_client_pays))} €</span>
            </div>
          </div>
        )}
        <button onClick={() => navigate("/dashboard")}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#7e3285" }}>
          Retour au dashboard
        </button>
      </div>
    </div>
  );

  const totalClientPays = payment ? Number(payment.total_client_pays) : 0;
  const alreadyPaid     = payment?.status !== "pending";

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-10">

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8">
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── COLONNE GAUCHE — Formulaire ── */}
          <div className="flex-1 space-y-5">

            {alreadyPaid ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <CheckCircle2 size={26} className="text-green-500" />
                </div>
                <p className="text-base font-bold text-gray-900 mb-1">Ce paiement a déjà été effectué</p>
                <p className="text-sm text-gray-400">Statut : {payment?.status_label}</p>
              </div>
            ) : (
              <>
                {/* Infos de facturation */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <h2 className="text-sm font-bold text-gray-800 mb-5">Informations de facturation</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-1.5">
                        <User size={11} /> Nom / Raison sociale
                      </label>
                      <input
                        type="text"
                        value={billingName}
                        onChange={e => { setBillingName(e.target.value); setInfoError(""); }}
                        disabled={showForm}
                        placeholder="Nom de l'entreprise"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-1.5">
                        <Mail size={11} /> Email de facturation
                      </label>
                      <input
                        type="email"
                        value={billingEmail}
                        onChange={e => { setBillingEmail(e.target.value); setInfoError(""); }}
                        disabled={showForm}
                        placeholder="exemple@domaine.fr"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>
                    {infoError && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                        <p className="text-xs text-red-600">{infoError}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Formulaire carte Stripe */}
                {showForm && clientSecret && stripePromise && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                    <h2 className="text-sm font-bold text-gray-800 mb-5">Moyen de paiement</h2>
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripeForm
                        totalClientPays={totalClientPays}
                        billingName={billingName}
                        billingEmail={billingEmail}
                        onSuccess={() => setSuccess(true)}
                      />
                    </Elements>
                  </div>
                )}

                {/* Sécurité */}
                <div className="flex items-start gap-3 px-1">
                  <Shield size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Paiement sécurisé par Stripe. Les fonds sont bloqués en escrow et versés au prestataire uniquement après validation de la mission.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ── COLONNE DROITE — Récapitulatif ── */}
          {payment && (
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

                <div className="px-6 py-5 border-b border-gray-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Récapitulatif</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(126,50,133,0.08)" }}>
                      <Briefcase size={16} style={{ color: "#7e3285" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{payment.mission_title}</p>
                      <p className="text-xs text-gray-400">Prestataire : {payment.prestataire_name}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Prix proposé</span>
                    <span className="font-medium text-gray-800">{fmt(Number(payment.proposed_price))} €</span>
                  </div>
                  {Number(payment.tva_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">TVA ({payment.tva_rate}%)</span>
                      <span className="font-medium text-gray-800">{fmt(Number(payment.tva_amount))} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Commission (10%)</span>
                    <span className="font-medium text-gray-800">{fmt(Number(payment.platform_fee))} €</span>
                  </div>
                  <div className="flex justify-between text-sm pt-3 border-t border-dashed border-gray-100">
                    <span className="text-gray-400 text-xs">Prestataire recevra</span>
                    <span className="text-sm text-gray-500">{fmt(Number(payment.prestataire_receives))} €</span>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold" style={{ color: "#7e3285" }}>
                      {fmt(totalClientPays)} €
                    </span>
                  </div>
                  {!alreadyPaid && !showForm && (
                    <button onClick={handleNext}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                      style={{ background: "#7e3285" }}>
                      Payer maintenant
                    </button>
                  )}
                  {alreadyPaid && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 size={15} />
                      <span className="text-sm font-semibold">Payé</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
