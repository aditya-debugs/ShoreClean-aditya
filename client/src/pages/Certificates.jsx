import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Download,
  Calendar,
  MapPin,
  ArrowLeft,
  Loader2,
  Trophy,
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Zap,
  FileText,
  Eye,
  Trash2,
  AlertCircle,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { isOrganizer, isAdmin } from "../utils/roleUtils";
import {
  getCertificates,
  issueCertificatesForEvent,
  issueCertificate,
  downloadCertificate,
  revokeCertificate,
} from "../utils/api";
import api from "../utils/api";

/* ─── Tiny helper: format date ──────────────────────────────────────────── */
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

/* ─── Status badge ───────────────────────────────────────────────────────── */
const StatusBadge = ({ count }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700">
    <Award className="h-3 w-3" />
    {count}
  </span>
);

/* ─── Toast ──────────────────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors =
    type === "success"
      ? "bg-emerald-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg text-white shadow-lg ${colors} animate-slide-in`}
    >
      {type === "success" ? (
        <CheckCircle className="h-5 w-5 shrink-0" />
      ) : type === "error" ? (
        <XCircle className="h-5 w-5 shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 shrink-0" />
      )}
      <span className="text-sm font-medium">{msg}</span>
    </div>
  );
};

/* ─── Certificate Card ───────────────────────────────────────────────────── */
const CertificateCard = ({ cert, onDownload, onRevoke, downloading }) => {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 transition-colors overflow-hidden">

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
            <Award className="h-5 w-5 text-gray-500" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-gray-900 truncate text-base"
              title={cert.user?.name}
            >
              {cert.user?.name || "Unknown Volunteer"}
            </h3>
            <p
              className="text-sm text-gray-500 truncate"
              title={cert.user?.email}
            >
              {cert.user?.email}
            </p>
          </div>
        </div>

        {/* Event info */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="truncate font-medium">
              {cert.event?.title || "Event"}
            </span>
          </div>
          {cert.event?.startDate && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4 shrink-0" />
              {fmt(cert.event.startDate)}
            </div>
          )}
          {cert.event?.location && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{cert.event.location}</span>
            </div>
          )}
        </div>

        {/* Issued at */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Issued {fmt(cert.issuedAt)}
          </span>
          <span className="text-xs font-mono text-gray-300">
            #{cert._id?.slice(-6)}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            id={`download-cert-${cert._id}`}
            onClick={() => onDownload(cert)}
            disabled={downloading === cert._id}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {downloading === cert._id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </button>

          {!confirming ? (
            <button
              id={`revoke-cert-${cert._id}`}
              onClick={() => setConfirming(true)}
              className="flex items-center justify-center px-3 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-md hover:bg-red-50 transition-colors"
              title="Revoke certificate"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setConfirming(false);
                  onRevoke(cert._id);
                }}
                className="px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────────────── */
const Certificates = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [certs, setCerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState("");
  const [filterEvent, setFilterEvent] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(""); // for bulk-issue

  /* Redirect non-organizers / non-admins */
  useEffect(() => {
    if (currentUser && !isOrganizer(currentUser) && !isAdmin(currentUser)) {
      navigate("/volunteer/certificates");
    }
  }, [currentUser, navigate]);

  const showToast = (msg, type = "info") => setToast({ msg, type });

  /* Fetch certificates */
  const fetchCerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterEvent) params.event = filterEvent;
      const data = await getCertificates(params);
      setCerts(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load certificates.", "error");
    } finally {
      setLoading(false);
    }
  }, [filterEvent]);

  /* Fetch events (org's events) */
  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get("/events");
      // filter events by organizer if not admin
      const all = Array.isArray(res.data) ? res.data : res.data.events || [];
      if (isAdmin(currentUser)) {
        setEvents(all);
      } else {
        setEvents(
          all.filter(
            (e) =>
              e.organizer === currentUser._id ||
              e.organizer?._id === currentUser._id
          )
        );
      }
    } catch (err) {
      console.error("fetchEvents error:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchCerts();
      fetchEvents();
    }
  }, [currentUser, fetchCerts, fetchEvents]);

  /* Bulk issue for an event */
  const handleBulkIssue = async () => {
    if (!selectedEvent) {
      showToast("Please select an event first.", "error");
      return;
    }
    setIssuing(true);
    try {
      const result = await issueCertificatesForEvent(selectedEvent);
      showToast(result.message, "success");
      fetchCerts();
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to issue certificates.";
      showToast(msg, "error");
    } finally {
      setIssuing(false);
    }
  };

  /* Download PDF */
  const handleDownload = async (cert) => {
    setDownloading(cert._id);
    try {
      const blob = await downloadCertificate(cert._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ShoreClean-Certificate-${cert.user?.name?.replace(/\s+/g, "-") || cert._id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Certificate downloaded!", "success");
    } catch (err) {
      showToast("Failed to download certificate.", "error");
    } finally {
      setDownloading(null);
    }
  };

  /* Revoke */
  const handleRevoke = async (certId) => {
    try {
      await revokeCertificate(certId);
      showToast("Certificate revoked.", "success");
      setCerts((prev) => prev.filter((c) => c._id !== certId));
    } catch (err) {
      showToast("Failed to revoke certificate.", "error");
    }
  };

  /* Filtered list */
  const filteredCerts = certs.filter((c) => {
    const q = search.toLowerCase();
    const nameMatch = c.user?.name?.toLowerCase().includes(q);
    const emailMatch = c.user?.email?.toLowerCase().includes(q);
    const eventMatch = c.event?.title?.toLowerCase().includes(q);
    return !q || nameMatch || emailMatch || eventMatch;
  });

  /* Stats */
  const uniqueEvents = [...new Set(certs.map((c) => c.event?._id))].length;
  const uniqueVolunteers = [...new Set(certs.map((c) => c.user?._id))].length;

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Navbar />

      <style>{`
        @keyframes slide-in {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease; }
      `}</style>

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <section className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <button
            id="back-to-dashboard"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 mb-8 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>

          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-3">
                <Award className="h-3.5 w-3.5" /> Administration
              </div>
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                Certificate Manager
              </h1>
              <p className="text-gray-500 mt-2 text-base">
                Issue, manage, and download certificates for your cleanup events.
              </p>
            </div>

            <button
              id="refresh-certs"
              onClick={fetchCerts}
              className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {/* ── Stats Row ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Certificates",
                value: certs.length,
                icon: <Award className="h-6 w-6 text-cyan-500" />,
                color: "from-cyan-50 to-cyan-100 border-cyan-200",
              },
              {
                label: "Unique Volunteers",
                value: uniqueVolunteers,
                icon: <Users className="h-6 w-6 text-blue-500" />,
                color: "from-blue-50 to-blue-100 border-blue-200",
              },
              {
                label: "Events Covered",
                value: uniqueEvents,
                icon: <Trophy className="h-6 w-6 text-amber-500" />,
                color: "from-amber-50 to-amber-100 border-amber-200",
              },
              {
                label: "This Month",
                value: certs.filter((c) => {
                  const d = new Date(c.issuedAt);
                  const now = new Date();
                  return (
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear()
                  );
                }).length,
                icon: <Calendar className="h-6 w-6 text-purple-500" />,
                color: "from-purple-50 to-purple-100 border-purple-200",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between shadow-sm"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className="text-gray-400">
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>

          {/* ── Bulk Issue Panel ─────────────────────────────────────────── */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 border border-gray-200 rounded flex items-center justify-center">
                <Zap className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Bulk Issue Certificates
                </h2>
                <p className="text-sm text-gray-500">
                  Issue certificates to all checked-in / checked-out volunteers for an event.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <select
                  id="bulk-issue-event-select"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 text-gray-800 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
                >
                  <option value="">Select an event…</option>
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.title} — {fmt(ev.startDate)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <button
                id="bulk-issue-btn"
                onClick={handleBulkIssue}
                disabled={issuing || !selectedEvent}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {issuing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Issuing…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" /> Issue Certificates
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Search & Filter ──────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="cert-search"
                type="text"
                placeholder="Search by name, email, or event…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="cert-filter-event"
                value={filterEvent}
                onChange={(e) => {
                  setFilterEvent(e.target.value);
                }}
                className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors appearance-none min-w-[180px]"
              >
                <option value="">All Events</option>
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* ── Certificate Grid ─────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
              <p className="text-gray-500 font-medium">Loading certificates…</p>
            </div>
          ) : filteredCerts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                No Certificates Found
              </h3>
              <p className="text-gray-400 mb-6 text-sm">
                {search || filterEvent
                  ? "Try adjusting your search or filter."
                  : "Issue certificates to volunteers by selecting an event above."}
              </p>
              {(search || filterEvent) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterEvent("");
                  }}
                  className="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {filteredCerts.length}
                </span>{" "}
                certificate{filteredCerts.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredCerts.map((cert) => (
                  <CertificateCard
                    key={cert._id}
                    cert={cert}
                    onDownload={handleDownload}
                    onRevoke={handleRevoke}
                    downloading={downloading}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Certificates;