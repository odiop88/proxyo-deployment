import { useState, useRef, useEffect } from 'react';
import { Menu, X, ChevronDown, Bell, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth_context';

// ── Avatar initiales ───────────────────────────────────────
function Avatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials  = `${firstName?.[0] ?? "?"}${lastName?.[0] ?? ""}`.toUpperCase();
  const avatarUrl = localStorage.getItem("avatar_url");

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initials}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
      />
    );
  }

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: "#7e3285" }}
    >
      {initials}
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────
export default function Header({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen]         = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer dropdown si clic en dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    navigate("/");
  }

  const fullName  = user ? `${user.first_name} ${user.last_name}` : "";
  const isPending = user?.company_status === "pending";

  const dropdownLinks = [
    { label: "Mon profil",       to: "/dashboard/profil" },
    { label: "Mes publications",      to: "/dashboard" },
    { label: "Mes candidatures",  to: "/dashboard/candidatures" },
    { label: "Mes paiements",     to: "/dashboard/paiements" },
    { label: "Centre d'aide",     to: "/aide" },
  ];

  return (
    <header className="bg-white shadow-sm relative z-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {isPending && (
        <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
          Votre compte est en attente d'activation par notre équipe. Vous serez notifié par email.
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/">
            <span className="text-2xl font-bold" style={{ color: "#7e3285" }}>Proxyo</span>
          </Link>

          {/* ── Desktop nav ── */}
          <div className="hidden md:flex items-center gap-5">
            {isPending ? (
              <span
                className="text-white px-5 py-2 rounded-lg text-sm font-semibold opacity-40 cursor-not-allowed"
                title="Votre compte doit être activé pour effectuer cette action"
                style={{ background: "#7e3285" }}
              >
                Demander un service
              </span>
            ) : (
              <Link
                to={isAuthenticated ? "/missions/new" : "/auth"}
                className="text-white px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: "#7e3285" }}
              >
                Demander un service
              </Link>
            )}

            <Link to="/auth" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Devenir prestataire
            </Link>

            {/* NON CONNECTÉ */}
            {!isAuthenticated && (
              <Link
                to="/auth"
                className="text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 px-4 py-1.5 rounded-lg transition-colors"
              >
                Connexion
              </Link>
            )}

            {/* CONNECTÉ */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-4">
                {/* Cloche */}
                <button onClick={() => navigate("/notifications")} className="relative text-gray-400 hover:text-gray-600 transition-colors">
                  <Bell size={18} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: "#7e3285" }} />
                </button>

                {/* Messages */}
                <button onClick={() => navigate("/messages")} className="relative text-gray-400 hover:text-gray-600 transition-colors">
                  <MessageCircle size={18} />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center text-[10px] font-bold" style={{ background: "#7e3285" }}>
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </button>

                {/* Avatar + Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <Avatar firstName={user.first_name} lastName={user.last_name} />
                    <span className="text-sm font-medium text-gray-700">{user.first_name}</span>
                    <ChevronDown
                      size={14}
                      className="text-gray-400 transition-transform duration-200"
                      style={{ transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Mon espace entreprise</p>
                      </div>

                      {dropdownLinks.map((item) => (
                        isPending ? (
                          <span
                            key={item.to}
                            title="Compte en attente d'activation"
                            className="block px-4 py-2.5 text-sm text-gray-300 cursor-not-allowed"
                          >
                            {item.label}
                          </span>
                        ) : (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsDropdownOpen(false)}
                            className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            {item.label}
                          </Link>
                        )
                      ))}

                      <div className="border-t border-gray-100 mt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
                          style={{ color: "#e53e3e" }}
                        >
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Burger mobile */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Menu Mobile ── */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-3 space-y-1">
            {isPending ? (
              <span className="block px-3 py-2.5 text-sm font-semibold text-white rounded-lg text-center opacity-40 cursor-not-allowed"
                style={{ background: "#7e3285" }}>
                Demander un service
              </span>
            ) : (
              <Link to={isAuthenticated ? "/missions/new" : "/auth"} onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-semibold text-white rounded-lg text-center hover:opacity-90"
                style={{ background: "#7e3285" }}>
                Demander un service
              </Link>
            )}

            <Link to="/auth" onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
              Devenir prestataire
            </Link>

            {!isAuthenticated && (
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                Connexion
              </Link>
            )}

            {isAuthenticated && user && (
              <>
                <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 mt-2 pt-3">
                  <Avatar firstName={user.first_name} lastName={user.last_name} />
                  <span className="text-sm font-semibold text-gray-800">{fullName}</span>
                </div>

                {dropdownLinks.map((item) => (
                  isPending ? (
                    <span key={item.to}
                      className="block px-3 py-2.5 text-sm text-gray-300 rounded-lg cursor-not-allowed">
                      {item.label}
                    </span>
                  ) : (
                    <Link key={item.to} to={item.to} onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      {item.label}
                    </Link>
                  )
                ))}

                <button onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                  style={{ color: "#e53e3e" }}>
                  Déconnexion
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}