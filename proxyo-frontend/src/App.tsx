import { Routes, Route } from "react-router-dom";
import Home from "./app/pages/home";
import AuthPage from "./app/pages/auth_page";
import PublicationPage from "./app/pages/publication_page";
import VerifyEmailPage from "./app/pages/verify_email_page";
import VerifyEmailSentPage from "./app/pages/verify_email";
import NewMissionPage from "./app/pages/publier_mission_page";
import NotificationsPage from "./app/pages/notifications_page";
import MissionDetailPage from "./app/pages/detail_mission_page";
import ApplyMissionPage from "./app/pages/candidater_page";
import MyApplicationsPage from "./app/pages/candidatures_page";
import MissionApplicationsPage from "./app/pages/mission_applications_page";
import ProfilPage from "./app/pages/profil_page";
import PaymentPage from "./app/pages/payment_page";
import MessagingPage from "./app/pages/messaging_page";
import OnboardingSuccessPage from "./app/pages/onboarding_success_page";
import OnboardingRefreshPage from "./app/pages/onboarding_refresh_page";
import CompaniesPage from "./app/pages/companies_page";
import CompanyDetailPage from "./app/pages/company_detail_page";
import ProtectedRoute from "./app/components/protected_route";
import SectorPage from "./app/pages/sector_page";

export default function App() {
  return(
    <main className="min-h-screen">
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />}/>
          <Route path="/verify-email" element={<VerifyEmailSentPage />} />
          <Route path="/verify-email-confirmation" element={<VerifyEmailPage />} />

          {/* Routes protégees — bloquees si company pending */}
          <Route path="/dashboard" element={<ProtectedRoute><PublicationPage /></ProtectedRoute>} />
          <Route path="/dashboard/profil" element={<ProtectedRoute><ProfilPage /></ProtectedRoute>} />
          <Route path="/missions/new" element={<ProtectedRoute><NewMissionPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/missions/:id" element={<ProtectedRoute><MissionDetailPage /></ProtectedRoute>} />
          <Route path="/missions/:id/apply" element={<ProtectedRoute><ApplyMissionPage /></ProtectedRoute>} />
          <Route path="/dashboard/candidatures" element={<ProtectedRoute><MyApplicationsPage /></ProtectedRoute>} />
          <Route path="/missions/:id/applications" element={<ProtectedRoute><MissionApplicationsPage /></ProtectedRoute>} />
          <Route path="/payment/:paymentId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
          <Route path="/messages/:missionId" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
          <Route path="/onboarding/success" element={<ProtectedRoute><OnboardingSuccessPage /></ProtectedRoute>} />
          <Route path="/onboarding/refresh" element={<ProtectedRoute><OnboardingRefreshPage /></ProtectedRoute>} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
          <Route path="/secteurs/:slug" element={<SectorPage />} />
        </Routes>
      </main>
  )
}