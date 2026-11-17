
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from 'react-router-dom'

import { Toaster } from 'sonner'

// Authentication
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Public pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import DoctorRegisterPage from './pages/auth/DoctorRegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ResendVerificationPage from './pages/auth/ResendVerificationPage'
import ActivatePatientPage from './pages/auth/ActivatePatientPage'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminDevicesPage from './pages/admin/AdminDevicesPage'

// Doctor pages
import DoctorLayout from './layouts/DoctorLayout'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import PatientsPage from './pages/doctor/PatientsPage'
import AddPatientPage from './pages/doctor/AddPatientPage'
import PatientDetailsPage from './pages/doctor/PatientDetailsPage'
import DoctorMonitoringPage from './pages/doctor/DoctorMonitoringPage'
import DoctorRecoveryPage from './pages/doctor/DoctorRecoveryPage'
import DoctorMedicationPage from './pages/doctor/DoctorMedicationPage'
import DoctorAlertsPage from './pages/doctor/DoctorAlertsPage'
import DoctorDevicesPage from './pages/doctor/DoctorDevicesPage'

// Patient pages
import PatientLayout from './layouts/PatientLayout'
import PatientDashboard from './pages/patient/PatientDashboard'
import PatientMonitoringPage from './pages/patient/PatientMonitoringPage'
import PatientRecoveryPage from './pages/patient/PatientRecoveryPage'
import PatientMedicationPage from './pages/patient/PatientMedicationPage'
import PatientNotificationsPage from './pages/patient/PatientNotificationsPage'
import PatientAssistantPage from './pages/patient/PatientAssistantPage'

// Shared pages
import HealthReportsPage from './pages/shared/HealthReportsPage'
import HealthSummariesPage from './pages/shared/HealthSummariesPage'
import AccountProfilePage from './pages/AccountProfilePage'

// =====================================
// NOT FOUND PAGE
// =====================================

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#080F26] px-6 text-center text-white">

      <h1 className="text-7xl font-extrabold text-indigo-300">
        404
      </h1>

      <h2 className="mt-5 text-2xl font-bold">
        Page not found
      </h2>

      <Link
        to="/"
        className="mt-7 rounded-xl bg-indigo-600 px-6 py-3"
      >
        Back to home
      </Link>

    </main>
  )
}

// =====================================
// APPLICATION ROUTES
// =====================================

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* PUBLIC ROUTES */}

          <Route
            path="/"
            element={<LandingPage />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register/doctor"
            element={<DoctorRegisterPage />}
          />

          <Route
            path="/verify-email"
            element={<VerifyEmailPage />}
          />

          <Route
            path="/resend-verification"
            element={<ResendVerificationPage />}
          />

          <Route
            path="/activate-patient"
            element={<ActivatePatientPage />}
          />

          {/* ADMIN PORTAL */}

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/devices"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDevicesPage />
              </ProtectedRoute>
            }
          />

          {/* DOCTOR PORTAL */}

          <Route
            path="/doctor"
            element={
              <ProtectedRoute role="DOCTOR">
                <DoctorLayout />
              </ProtectedRoute>
            }
          >

            <Route
              index
              element={<DoctorDashboard />}
            />

            <Route
              path="dashboard"
              element={<DoctorDashboard />}
            />

            <Route
              path="patients"
              element={<PatientsPage />}
            />

            <Route
              path="patients/new"
              element={<AddPatientPage />}
            />

            <Route
              path="patients/:id"
              element={<PatientDetailsPage />}
            />

            <Route
              path="monitoring"
              element={<DoctorMonitoringPage />}
            />

            <Route
              path="recovery"
              element={<DoctorRecoveryPage />}
            />

            <Route
              path="medication"
              element={<DoctorMedicationPage />}
            />

            <Route
              path="alerts"
              element={<DoctorAlertsPage />}
            />

            <Route
              path="reports"
              element={<HealthReportsPage role="DOCTOR" />}
            />

            <Route
              path="devices"
              element={<DoctorDevicesPage />}
            />

            <Route
              path="summaries"
              element={<HealthSummariesPage role="DOCTOR" />}
            />

            <Route
              path="settings"
              element={<AccountProfilePage />}
            />

          </Route>

          {/* PATIENT PORTAL */}

          <Route
            path="/patient"
            element={
              <ProtectedRoute role="PATIENT">
                <PatientLayout />
              </ProtectedRoute>
            }
          >

            <Route
              index
              element={<PatientDashboard />}
            />

            <Route
              path="dashboard"
              element={<PatientDashboard />}
            />

            <Route
              path="monitoring"
              element={<PatientMonitoringPage />}
            />

            <Route
              path="recovery"
              element={<PatientRecoveryPage />}
            />

            <Route
              path="medication"
              element={<PatientMedicationPage />}
            />

            <Route
              path="notifications"
              element={<PatientNotificationsPage />}
            />

            <Route
              path="reports"
              element={<HealthReportsPage role="PATIENT" />}
            />

            <Route
              path="summaries"
              element={<HealthSummariesPage role="PATIENT" />}
            />

            <Route
              path="assistant"
              element={<PatientAssistantPage />}
            />

            <Route
              path="profile"
              element={<AccountProfilePage />}
            />

          </Route>

          {/* FALLBACK */}

          <Route
            path="*"
            element={<NotFoundPage />}
          />

        </Routes>

        <Toaster
          position="top-right"
          theme="dark"
          richColors
        />

      </AuthProvider>
    </BrowserRouter>
  )
}
