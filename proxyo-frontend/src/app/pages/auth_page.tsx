import { useState } from "react";
import { Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import { login, register } from "../services/auth_api";
import { useAuth } from "../context/auth_context";

const SECTOR_CHOICES = [
  { value: "it",           label: "IT / Informatique" },
  { value: "secretariat",  label: "Secrétariat / Assistanat" },
  { value: "photographie", label: "Photographie / Vidéo" },
  { value: "jardinage",    label: "Jardinage" },
  { value: "manutention",  label: "Manutention / Déménagement" },
  { value: "securite",     label: "Sécurité / Gardiennage" },
  { value: "restauration", label: "Restauration" },
  { value: "nettoyage",    label: "Nettoyage / Ménage" },
  { value: "autre",        label: "Autre" },
];

interface LoginData { email: string; password: string; }
interface Step1Data {
  company_name: string; siret: string; contact_email: string;
  phone: string; sector: string; address: string; city: string; postal_code: string;
}
interface Step2Data {
  owner_first_name: string; owner_last_name: string;
  owner_email: string; owner_tel: string;
  password: string; password_confirm: string;
}

const inputCls = "w-full border-b border-gray-200 bg-transparent py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-gray-500 transition-colors duration-200";
const labelCls = "block text-xs text-gray-400 mb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [mode, setMode]         = useState<"login" | "register">("login");
  const [step, setStep]         = useState<number>(1);
  const [showPwd, setShowPwd]   = useState<boolean>(false);
  const [showConf, setShowConf] = useState<boolean>(false);
  const [loading, setLoading]   = useState<boolean>(false);
  const [error, setError]       = useState<string>("");

  const [loginData, setLoginData] = useState<LoginData>({ email: "", password: "" });
  const [step1, setStep1] = useState<Step1Data>({
    company_name: "", siret: "", contact_email: "", phone: "",
    sector: "", address: "", city: "", postal_code: "",
  });
  const [step2, setStep2] = useState<Step2Data>({
    owner_first_name: "", owner_last_name: "", owner_email: "",
    owner_tel: "", password: "", password_confirm: "",
  });

  const switchMode = (m: "login" | "register") => { setMode(m); setStep(1); setError(""); };

  const btnPrimary = "px-6 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";

  // ── Login ──────────────────────────────────────────────────
  async function handleLogin() {
    if (!loginData.email || !loginData.password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await login(loginData.email, loginData.password);
      setUser({ ...data.user, company_status: data.company?.status });
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  // ── Register ───────────────────────────────────────────────
  async function handleRegister() {
    if (step2.password !== step2.password_confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register({ ...step1, ...step2 });
      navigate("/verify-email", { state: { email: step2.owner_email } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif", background: "radial-gradient(ellipse at 60% 0%, #ede9f6 0%, #f0f0f3 40%, #e8e8ec 100%)" }}>
      <Header />

      <div className="flex flex-col items-center justify-center px-4 py-16">

        {/* Toggle */}
        <div className="flex bg-white rounded-xl p-1 mb-8 w-full max-w-xs" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={mode === m ? { background: "#7e3285", color: "white" } : { color: "#9ca3af" }}
            >
              {m === "login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        {/* ── LOGIN ── */}
        {mode === "login" && (
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-10" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Connexion</h1>
            <p className="text-sm text-gray-400 mb-8">Accédez à votre espace entreprise</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Field label="Email">
                <input
                  type="email"
                  placeholder="contact@entreprise.fr"
                  value={loginData.email}
                  onChange={e => { setLoginData({ ...loginData, email: e.target.value }); setError(""); }}
                  className={inputCls}
                />
              </Field>

              <Field label="Mot de passe">
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={e => { setLoginData({ ...loginData, password: e.target.value }); setError(""); }}
                    className={inputCls + " pr-8"}
                  />
                  <button onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button className="text-xs mt-1.5 float-right" style={{ color: "#7e3285" }}>
                  Mot de passe oublié ?
                </button>
              </Field>
            </div>

            {error && <p className="text-xs text-red-500 mt-4 text-center">{error}</p>}

            <div className="flex justify-center mt-8">
              <button onClick={handleLogin} disabled={loading} className={btnPrimary} style={{ background: "#7e3285" }}>
                {loading ? "Connexion..." : <>Se connecter <ArrowRight size={14} className="inline ml-1" /></>}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              Pas encore de compte ?{" "}
              <button onClick={() => switchMode("register")} className="font-semibold" style={{ color: "#7e3285" }}>
                Créer un compte
              </button>
            </p>
          </div>
        )}

        {/* ── REGISTER ── */}
        {mode === "register" && (
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-10" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>

            {/* Stepper */}
            <div className="flex items-center gap-3 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={step >= s
                      ? { background: "#7e3285", color: "white" }
                      : { background: "#f3f4f6", color: "#d1d5db", border: "1px solid #e5e7eb" }
                    }
                  >
                    {step > s ? <CheckCircle size={12} /> : s}
                  </div>
                  <span className="text-xs font-medium" style={{ color: step >= s ? "#7e3285" : "#d1d5db" }}>
                    {s === 1 ? "Entreprise" : "Propriétaire"}
                  </span>
                  {s < 2 && <div className="w-10 h-px" style={{ background: step > 1 ? "#7e3285" : "#e5e7eb" }} />}
                </div>
              ))}
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Votre entreprise</h1>
                <p className="text-sm text-gray-400 mb-8">Étape 1 sur 2</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Field label="Nom de l'entreprise">
                    <input placeholder="EcoTech SAS" value={step1.company_name}
                      onChange={e => setStep1({ ...step1, company_name: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="SIRET">
                    <input placeholder="12345678901234" value={step1.siret}
                      onChange={e => setStep1({ ...step1, siret: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Téléphone">
                    <input placeholder="+33 6 00 00 00 00" value={step1.phone}
                      onChange={e => setStep1({ ...step1, phone: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Email entreprise">
                    <input type="email" placeholder="contact@ecotech.fr" value={step1.contact_email}
                      onChange={e => setStep1({ ...step1, contact_email: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Secteur d'activité">
                    <select value={step1.sector} onChange={e => setStep1({ ...step1, sector: e.target.value })}
                      className={inputCls + " cursor-pointer"}>
                      <option value="">Choisir un secteur</option>
                      {SECTOR_CHOICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Adresse">
                    <input placeholder="12 rue de la Paix" value={step1.address}
                      onChange={e => setStep1({ ...step1, address: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Ville">
                    <input placeholder="Paris" value={step1.city}
                      onChange={e => setStep1({ ...step1, city: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Code postal">
                    <input placeholder="75001" value={step1.postal_code}
                      onChange={e => setStep1({ ...step1, postal_code: e.target.value })} className={inputCls} />
                  </Field>
                </div>

                <div className="flex justify-center mt-10">
                  <button onClick={() => { setError(""); setStep(2); }} className={btnPrimary} style={{ background: "#7e3285" }}>
                    Continuer <ArrowRight size={14} className="inline ml-1" />
                  </button>
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Propriétaire du compte</h1>
                <p className="text-sm text-gray-400 mb-8">Étape 2 sur 2</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Field label="Prénom">
                    <input placeholder="Marie" value={step2.owner_first_name}
                      onChange={e => setStep2({ ...step2, owner_first_name: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Nom">
                    <input placeholder="Dupont" value={step2.owner_last_name}
                      onChange={e => setStep2({ ...step2, owner_last_name: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Email personnel">
                    <input type="email" placeholder="marie@exemple.fr" value={step2.owner_email}
                      onChange={e => setStep2({ ...step2, owner_email: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Téléphone">
                    <input placeholder="+33 6 00 00 00 00" value={step2.owner_tel}
                      onChange={e => setStep2({ ...step2, owner_tel: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Mot de passe">
                    <div className="relative">
                      <input type={showPwd ? "text" : "password"} placeholder="••••••••"
                        value={step2.password} onChange={e => setStep2({ ...step2, password: e.target.value })}
                        className={inputCls + " pr-8"} />
                      <button onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirmer le mot de passe">
                    <div className="relative">
                      <input type={showConf ? "text" : "password"} placeholder="••••••••"
                        value={step2.password_confirm} onChange={e => setStep2({ ...step2, password_confirm: e.target.value })}
                        className={inputCls + " pr-8"} />
                      <button onClick={() => setShowConf(!showConf)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                        {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </Field>
                </div>

                <p className="text-xs text-gray-300 mt-4">
                  8 caractères minimum — majuscule, minuscule et chiffre requis.
                </p>

                {error && <p className="text-xs text-red-500 mt-4 text-center">{error}</p>}

                <div className="flex items-center justify-center gap-3 mt-8">
                  <button onClick={() => { setError(""); setStep(1); }}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-600 transition-all bg-white">
                    <ArrowLeft size={14} /> Retour
                  </button>
                  <button onClick={handleRegister} disabled={loading} className={btnPrimary} style={{ background: "#7e3285" }}>
                    {loading ? "Création..." : <>Créer mon compte <ArrowRight size={14} className="inline ml-1" /></>}
                  </button>
                </div>
              </>
            )}

            <p className="text-center text-xs text-gray-400 mt-6">
              Déjà un compte ?{" "}
              <button onClick={() => switchMode("login")} className="font-semibold" style={{ color: "#7e3285" }}>
                Se connecter
              </button>
            </p>
          </div>
        )}

        <p className="text-xs text-gray-300 mt-8">© 2026 Proxyo · Tous droits réservés</p>
      </div>
    </div>
  );
}
// import Header from "../components/header";

// const SECTOR_CHOICES = [
//   { value: "it",           label: "IT / Informatique" },
//   { value: "secretariat",  label: "Secrétariat / Assistanat" },
//   { value: "photographie", label: "Photographie / Vidéo" },
//   { value: "jardinage",    label: "Jardinage" },
//   { value: "manutention",  label: "Manutention / Déménagement" },
//   { value: "securite",     label: "Sécurité / Gardiennage" },
//   { value: "restauration", label: "Restauration" },
//   { value: "nettoyage",    label: "Nettoyage / Ménage" },
//   { value: "autre",        label: "Autre" },
// ];

// interface LoginData { email: string; password: string; }
// interface Step1Data {
//   company_name: string; siret: string; contact_email: string;
//   phone: string; sector: string; address: string; city: string; postal_code: string;
// }
// interface Step2Data {
//   owner_first_name: string; owner_last_name: string;
//   owner_email: string; owner_tel: string;
//   password: string; password_confirm: string;
// }

// // ── Champ générique ────────────────────────────────────────
// const inputCls = "w-full border-b border-gray-200 bg-transparent py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-gray-500 transition-colors duration-200";
// const labelCls = "block text-xs text-gray-400 mb-1";

// function Field({ label, children }: { label: string; children: React.ReactNode }) {
//   return (
//     <div>
//       <label className={labelCls}>{label}</label>
//       {children}
//     </div>
//   );
// }

// // ── Page ───────────────────────────────────────────────────
// export default function AuthPage() {
//   const [mode, setMode]         = useState<"login" | "register">("login");
//   const [step, setStep]         = useState<number>(1);
//   const [showPwd, setShowPwd]   = useState<boolean>(false);
//   const [showConf, setShowConf] = useState<boolean>(false);

//   const [loginData, setLoginData] = useState<LoginData>({ email: "", password: "" });
//   const [step1, setStep1] = useState<Step1Data>({
//     company_name: "", siret: "", contact_email: "", phone: "",
//     sector: "", address: "", city: "", postal_code: "",
//   });
//   const [step2, setStep2] = useState<Step2Data>({
//     owner_first_name: "", owner_last_name: "", owner_email: "",
//     owner_tel: "", password: "", password_confirm: "",
//   });

//   const switchMode = (m: "login" | "register") => { setMode(m); setStep(1); };

//   const btnPrimary = "px-6 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90";

//   return (
//     <div className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif", background: "radial-gradient(ellipse at 60% 0%, #ede9f6 0%, #f0f0f3 40%, #e8e8ec 100%)" }}>
//       <Header />

//       <div className="flex flex-col items-center justify-center px-4 py-16">

//         {/* Toggle */}
//         <div className="flex bg-white rounded-xl p-1 mb-8 w-full max-w-xs" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
//           {(["login", "register"] as const).map((m) => (
//             <button
//               key={m}
//               onClick={() => switchMode(m)}
//               className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
//               style={mode === m
//                 ? { background: "#7e3285", color: "white" }
//                 : { color: "#9ca3af" }
//               }
//             >
//               {m === "login" ? "Connexion" : "Inscription"}
//             </button>
//           ))}
//         </div>

//         {/* ── LOGIN ── */}
//         {mode === "login" && (
//           <div className="w-full max-w-2xl bg-white rounded-2xl p-10" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>
//             <h1 className="text-xl font-bold text-gray-900 mb-1">Connexion</h1>
//             <p className="text-sm text-gray-400 mb-8">Accédez à votre espace entreprise</p>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <Field label="Email">
//                 <input
//                   type="email"
//                   placeholder="contact@entreprise.fr"
//                   value={loginData.email}
//                   onChange={e => setLoginData({ ...loginData, email: e.target.value })}
//                   className={inputCls}
//                 />
//               </Field>

//               <Field label="Mot de passe">
//                 <div className="relative">
//                   <input
//                     type={showPwd ? "text" : "password"}
//                     placeholder="••••••••"
//                     value={loginData.password}
//                     onChange={e => setLoginData({ ...loginData, password: e.target.value })}
//                     className={inputCls + " pr-8"}
//                   />
//                   <button
//                     onClick={() => setShowPwd(!showPwd)}
//                     className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
//                   >
//                     {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
//                   </button>
//                 </div>
//                 <button className="text-xs mt-1.5 float-right" style={{ color: "#7e3285" }}>
//                   Mot de passe oublié ?
//                 </button>
//               </Field>
//             </div>

//             <div className="flex justify-center mt-10">
//               <button className={btnPrimary} style={{ background: "#7e3285" }}>
//                 Se connecter <ArrowRight size={14} className="inline ml-1" />
//               </button>
//             </div>

//             <p className="text-center text-xs text-gray-400 mt-6">
//               Pas encore de compte ?{" "}
//               <button
//                 onClick={() => switchMode("register")}
//                 className="font-semibold"
//                 style={{ color: "#7e3285" }}
//               >
//                 Créer un compte
//               </button>
//             </p>
//           </div>
//         )}

//         {/* ── REGISTER ── */}
//         {mode === "register" && (
//           <div className="w-full max-w-2xl bg-white rounded-2xl p-10" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>

//             {/* Stepper */}
//             <div className="flex items-center gap-3 mb-8">
//               {[1, 2].map((s) => (
//                 <div key={s} className="flex items-center gap-2">
//                   <div
//                     className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
//                     style={step >= s
//                       ? { background: "#7e3285", color: "white" }
//                       : { background: "#f3f4f6", color: "#d1d5db", border: "1px solid #e5e7eb" }
//                     }
//                   >
//                     {step > s ? <CheckCircle size={12} /> : s}
//                   </div>
//                   <span className="text-xs font-medium" style={{ color: step >= s ? "#7e3285" : "#d1d5db" }}>
//                     {s === 1 ? "Entreprise" : "Propriétaire"}
//                   </span>
//                   {s < 2 && (
//                     <div className="w-10 h-px" style={{ background: step > 1 ? "#7e3285" : "#e5e7eb" }} />
//                   )}
//                 </div>
//               ))}
//             </div>

//             {/* STEP 1 */}
//             {step === 1 && (
//               <>
//                 <h1 className="text-xl font-bold text-gray-900 mb-1">Votre entreprise</h1>
//                 <p className="text-sm text-gray-400 mb-8">Étape 1 sur 2</p>

//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                   <Field label="Nom de l'entreprise">
//                     <input placeholder="EcoTech SAS" value={step1.company_name}
//                       onChange={e => setStep1({ ...step1, company_name: e.target.value })} className={inputCls} />
//                   </Field>

//                   <Field label="SIRET">
//                     <input placeholder="12345678901234" value={step1.siret}
//                       onChange={e => setStep1({ ...step1, siret: e.target.value })} className={inputCls} />
//                   </Field>

//                   <Field label="Téléphone">
//                     <input placeholder="+33 6 00 00 00 00" value={step1.phone}
//                       onChange={e => setStep1({ ...step1, phone: e.target.value })} className={inputCls} />
//                   </Field>

//                   <Field label="Email entreprise">
//                     <input type="email" placeholder="contact@ecotech.fr" value={step1.contact_email}
//                       onChange={e => setStep1({ ...step1, contact_email: e.target.value })} className={inputCls} />
//                   </Field>

//                   <Field label="Secteur d'activité">
//                     <select value={step1.sector} onChange={e => setStep1({ ...step1, sector: e.target.value })}
//                       className={inputCls + " cursor-pointer"}>
//                       <option value="">Choisir un secteur</option>
//                       {SECTOR_CHOICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
//                     </select>
//                   </Field>

//                   <Field label="Adresse">
//                     <input placeholder="12 rue de la Paix" value={step1.address}
//                       onChange={e => setStep1({ ...step1, address: e.target.value })} className={inputCls} />
//                   </Field>

//                   <Field label="Ville">
//                     <input placeholder="Paris" value={step1.city}
//                       onChange={e => setStep1({ ...step1, city: e.target.value })} className={inputCls} />
//                   </Field>

//                   <Field label="Code postal">
//                     <input placeholder="75001" value={step1.postal_code}
//                       onChange={e => setStep1({ ...step1, postal_code: e.target.value })} className={inputCls} />
//                   </Field>
//                 </div>

//                 <div className="flex justify-center mt-10">
//                   <button onClick={() => setStep(2)} className={btnPrimary} style={{ background: "#7e3285" }}>
//                     Continuer <ArrowRight size={14} className="inline ml-1" />
//                   </button>
//                 </div>
//               </>
//             )}

//             {/* STEP 2 */}
//             {step === 2 && (
//               <>
//                 <h1 className="text-xl font-bold text-gray-900 mb-1">Propriétaire du compte</h1>
//                 <p className="text-sm text-gray-400 mb-8">Étape 2 sur 2</p>

//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                   <Field label="Prénom">
//                     <input placeholder="Marie" value={step2.owner_first_name}
//                       onChange={e => setStep2({ ...step2, owner_first_name: e.target.value })} className={inputCls} />
//                   </Field>

//                   <Field label="Nom">
//                     <input placeholder="Dupont" value={step2.owner_last_name}
//                       onChange={e => setStep2({ ...step2, owner_last_name: e.target.value })} className={inputCls} />
//                   </Field>

//                   <Field label="Email personnel">
//                     <input type="email" placeholder="marie@exemple.fr" value={step2.owner_email}
//                       onChange={e => setStep2({ ...step2, owner_email: e.target.value })} className={inputCls} />
//                   </Field>

//                   <Field label="Téléphone">
//                     <input placeholder="+33 6 00 00 00 00" value={step2.owner_tel}
//                       onChange={e => setStep2({ ...step2, owner_tel: e.target.value })} className={inputCls} />
//                   </Field>

//                   <Field label="Mot de passe">
//                     <div className="relative">
//                       <input type={showPwd ? "text" : "password"} placeholder="••••••••"
//                         value={step2.password} onChange={e => setStep2({ ...step2, password: e.target.value })}
//                         className={inputCls + " pr-8"} />
//                       <button onClick={() => setShowPwd(!showPwd)}
//                         className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
//                         {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
//                       </button>
//                     </div>
//                   </Field>

//                   <Field label="Confirmer le mot de passe">
//                     <div className="relative">
//                       <input type={showConf ? "text" : "password"} placeholder="••••••••"
//                         value={step2.password_confirm} onChange={e => setStep2({ ...step2, password_confirm: e.target.value })}
//                         className={inputCls + " pr-8"} />
//                       <button onClick={() => setShowConf(!showConf)}
//                         className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
//                         {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
//                       </button>
//                     </div>
//                   </Field>
//                 </div>

//                 <p className="text-xs text-gray-300 mt-4">
//                   8 caractères minimum — majuscule, minuscule et chiffre requis.
//                 </p>

//                 <div className="flex items-center justify-center gap-3 mt-10">
//                   <button onClick={() => setStep(1)}
//                     className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-600 transition-all bg-white">
//                     <ArrowLeft size={14} /> Retour
//                   </button>
//                   <button className={btnPrimary} style={{ background: "#7e3285" }}>
//                     Créer mon compte <ArrowRight size={14} className="inline ml-1" />
//                   </button>
//                 </div>
//               </>
//             )}

//             <p className="text-center text-xs text-gray-400 mt-6">
//               Déjà un compte ?{" "}
//               <button onClick={() => switchMode("login")} className="font-semibold" style={{ color: "#7e3285" }}>
//                 Se connecter
//               </button>
//             </p>
//           </div>
//         )}

//         <p className="text-xs text-gray-300 mt-8">© 2026 Proxyo · Tous droits réservés</p>
//       </div>
//     </div>
//   );
// }