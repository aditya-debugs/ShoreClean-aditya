import React from "react";
import DonationSuccess from "./pages/DonationSuccess";
import {
  Route,
  Routes,
  BrowserRouter,
  useLocation,
  Link,
} from "react-router-dom";
import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import EventManagement from "./pages/EventManagement";
import CreateEvent from "./pages/admin/CreateEvent";
import AdminDashboard from "./pages/admin/Dashboard";
import VolunteerDashboard from "./pages/volunteer/Dashboard";
import Certificates from "./pages/Certificates";
import VolunteerCertificates from "./pages/volunteer/Certificates";
import MyEvents from "./pages/volunteer/MyEvents";
import AdminVolunteers from "./pages/admin/Volunteers";
import AdminOrgProfile from "./pages/admin/OrgProfile";
import OrganizationProfile from "./pages/OrganizationProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatCommunity from "./pages/ChatCommunity";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import OrganizationRoute from "./components/OrganizationRoute";
import OrgRoute from "./components/OrgRoute";
import AdminRoute from "./components/AdminRoute";
import Profile from "./pages/Profile";
import Organization from "./pages/Organization";
import Organizations from "./pages/Organizations";
import OrganizationDetailsForm from "./pages/OrganizationDetailsForm";
import Donations from "./pages/Donations";
import MapWithList from "./pages/MapWithList";
import CleanupAnalyze from "./pages/CleanupAnalyze";
import TrashMarkerMap from "./pages/TrashMarkerMap";
import TrashMarkerList from "./pages/TrashMarkerList";
import NotifyEvent from "./pages/NotifyEvent";
import ErrorBoundary from "./components/ErrorBoundary";

const ComingSoon = ({ pageName }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">{pageName}</h1>
      <p className="text-gray-600 mb-8">This page is coming soon!</p>
      <Link
        to="/"
        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 inline-block"
      >
        Back to Home
      </Link>
    </div>
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <OrganizationRoute>
                  <Home />
                </OrganizationRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/donation-success" element={<DonationSuccess />} />
            <Route path="/success" element={<DonationSuccess />} />
            <Route path="/map" element={<MapWithList />} />
            <Route path="/map/markers" element={<TrashMarkerMap />} />
            <Route path="/map/markers/list" element={<TrashMarkerList />} />
            <Route
              path="/notify-event"
              element={
                <PrivateRoute>
                  <NotifyEvent />
                </PrivateRoute>
              }
            />
            <Route path="/impact" element={<ComingSoon pageName="Impact" />} />
            <Route path="/about" element={<ComingSoon pageName="About" />} />
            <Route
              path="/cleanup/analyze"
              element={
                <PrivateRoute>
                  <CleanupAnalyze />
                </PrivateRoute>
              }
            />

            {/* Organization Profile Setup — must complete before accessing org routes */}
            <Route
              path="/organization-details"
              element={
                <PrivateRoute>
                  <OrganizationDetailsForm />
                </PrivateRoute>
              }
            />

            {/* Volunteer & All-user Protected Routes */}
            <Route
              path="/events"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <Events />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/events/:id"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <EventDetails />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <AdminDashboard />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <AdminDashboard />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/volunteer/dashboard"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <VolunteerDashboard />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />


          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route path="/impact" element={<ComingSoon pageName="Impact" />} />
          <Route path="/about" element={<ComingSoon pageName="About" />} />
          <Route path="/map" element={<MapWithList />} />

            {/* ✅ Replace ComingSoon with Donations page */}
            <Route
              path="/donations"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <Donations />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <ChatCommunity />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/certificates"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <Certificates />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/organization/:id"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <Organization />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/organizations"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <Organizations />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />

            {/* Volunteer-specific routes */}
            <Route
              path="/volunteer/dashboard"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <VolunteerDashboard />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/volunteer/certificates"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <VolunteerCertificates />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/volunteer/my-events"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <MyEvents />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />

            {/* Organizer-only routes */}
            <Route
              path="/admin/create-event"
              element={
                <OrgRoute>
                  <OrganizationRoute>
                    <CreateEvent />
                  </OrganizationRoute>
                </OrgRoute>
              }
            />
            <Route
              path="/events/:id/manage"
              element={
                <OrgRoute>
                  <OrganizationRoute>
                    <EventManagement />
                  </OrganizationRoute>
                </OrgRoute>
              }
            />
            <Route
              path="/organization-profile"
              element={
                <PrivateRoute>
                  <OrganizationRoute>
                    <OrganizationProfile />
                  </OrganizationRoute>
                </PrivateRoute>
              }
            />

            {/* Admin-only routes */}
            <Route
              path="/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/volunteers"
              element={
                <AdminRoute>
                  <AdminVolunteers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <AdminRoute>
                  <AdminOrgProfile />
                </AdminRoute>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                    <p className="text-gray-600 mb-8">Page not found</p>
                    <Link
                      to="/"
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 inline-block"
                    >
                      Go Home
                    </Link>
                  </div>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
