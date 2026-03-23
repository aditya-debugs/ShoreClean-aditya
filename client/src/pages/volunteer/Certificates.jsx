import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Download,
  Calendar,
  MapPin,
  ArrowLeft,
  Loader2,
  Star,
  Trophy,
  X,
  CheckCircle,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { isVolunteer } from "../../utils/roleUtils";
import { getCertificates, downloadCertificate } from "../../utils/api";

/* ─── Helper ─────────────────────────────────────────────────────────────── */
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

/* ─── Canvas Certificate Preview / Download ──────────────────────────────── */
const drawCertificate = (canvas, cert, userName) => {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#023E8A");
  bg.addColorStop(0.5, "#0077B6");
  bg.addColorStop(1, "#023E8A");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // White panel
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 30, 30, W - 60, H - 60, 16);
  ctx.fill();

  // Cyan top stripe
  const stripe = ctx.createLinearGradient(30, 30, W - 30, 30);
  stripe.addColorStop(0, "#00B4D8");
  stripe.addColorStop(1, "#0096C7");
  ctx.fillStyle = stripe;
  roundRect(ctx, 30, 30, W - 60, 18, 16, true, false);
  ctx.fill();

  // Bottom stripe
  ctx.fillStyle = "#00B4D8";
  roundRect(ctx, 30, H - 48, W - 60, 18, 0, false, true);
  ctx.fill();

  // SHORECLEAN heading
  ctx.font = "bold 20px Arial";
  ctx.fillStyle = "#0077B6";
  ctx.textAlign = "center";
  ctx.fillText("SHORECLEAN", W / 2, 80);

  // Decorative line
  ctx.strokeStyle = "#00B4D8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(100, 92);
  ctx.lineTo(W - 100, 92);
  ctx.stroke();

  // Main title
  ctx.font = "bold 44px Georgia";
  ctx.fillStyle = "#023E8A";
  ctx.fillText("Certificate of Participation", W / 2, 148);

  // Sub text
  ctx.font = "18px Arial";
  ctx.fillStyle = "#555";
  ctx.fillText("This is to proudly certify that", W / 2, 188);

  // Volunteer name
  ctx.font = "bold italic 52px Georgia";
  const nameGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  nameGrad.addColorStop(0, "#0096C7");
  nameGrad.addColorStop(1, "#0077B6");
  ctx.fillStyle = nameGrad;
  ctx.fillText(userName || cert.user?.name || "Volunteer", W / 2, 252);

  // Name underline
  const nameW = ctx.measureText(userName || cert.user?.name || "Volunteer").width;
  ctx.strokeStyle = "#00B4D8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nameW / 2, 262);
  ctx.lineTo(W / 2 + nameW / 2, 262);
  ctx.stroke();

  // Participation text
  ctx.font = "16px Arial";
  ctx.fillStyle = "#444";
  ctx.fillText(
    "has successfully participated as a volunteer in the coastal cleanup event",
    W / 2,
    295
  );

  // Event name
  ctx.font = "bold 28px Georgia";
  ctx.fillStyle = "#023E8A";
  const evTitle = `"${cert.event?.title || "Coastal Cleanup Event"}"`;
  ctx.fillText(evTitle, W / 2, 340);

  // Event details
  const evDate = cert.event?.startDate ? fmt(cert.event.startDate) : "";
  const evLoc = cert.event?.location || "";
  ctx.font = "15px Arial";
  ctx.fillStyle = "#888";
  if (evDate && evLoc)
    ctx.fillText(`📅  ${evDate}     📍  ${evLoc}`, W / 2, 372);
  else if (evDate) ctx.fillText(`📅  ${evDate}`, W / 2, 372);

  // Appreciation
  ctx.font = "italic 15px Arial";
  ctx.fillStyle = "#666";
  ctx.fillText(
    "In recognition of your dedication to protecting our coastlines and oceans.",
    W / 2,
    408
  );

  // Divider
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(80, 425);
  ctx.lineTo(W - 80, 425);
  ctx.stroke();

  // Footer left: issue date + ID
  const issueDate = cert.issuedAt ? fmt(cert.issuedAt) : fmt(new Date());
  ctx.font = "12px Arial";
  ctx.fillStyle = "#aaa";
  ctx.textAlign = "left";
  ctx.fillText(`Issued on: ${issueDate}`, 80, 450);
  ctx.fillText(`Certificate ID: ${cert._id || "N/A"}`, 80, 468);

  // Signature line (right)
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W - 260, 460);
  ctx.lineTo(W - 80, 460);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "bold 13px Arial";
  ctx.fillStyle = "#023E8A";
  ctx.fillText("ShoreClean Organization", W - 170, 475);
  ctx.font = "11px Arial";
  ctx.fillStyle = "#aaa";
  ctx.fillText("Authorized Signature", W - 170, 490);

  // Wave decoration bottom
  ctx.strokeStyle = "#00B4D8";
  ctx.lineWidth = 1.2;
  for (let x = 30; x < W - 30; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, H - 38);
    ctx.quadraticCurveTo(x + 5, H - 42, x + 10, H - 38);
    ctx.quadraticCurveTo(x + 15, H - 34, x + 20, H - 38);
    ctx.stroke();
  }
};

const roundRect = (ctx, x, y, w, h, r, topOnly = false, botOnly = false) => {
  ctx.beginPath();
  if (topOnly) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  } else if (botOnly) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y);
    ctx.closePath();
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
};

/* ─── Certificate Preview Modal ─────────────────────────────────────────── */
const CertificateModal = ({ cert, userName, onClose, onDownload, downloading }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && cert) {
      drawCertificate(canvasRef.current, cert, userName);
    }
  }, [cert, userName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-cyan-500" />
            Certificate Preview
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Canvas preview */}
        <div className="p-4 bg-gray-50 overflow-auto">
          <canvas
            ref={canvasRef}
            width={900}
            height={540}
            className="w-full rounded-xl shadow-md"
            style={{ maxHeight: "60vh", objectFit: "contain" }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onDownload(cert)}
            disabled={downloading === cert._id}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {downloading === cert._id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────────────── */
const VolunteerCertificates = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [previewCert, setPreviewCert] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    if (canNavigate()) return;
  });

  const canNavigate = () => {
    if (currentUser && !isVolunteer(currentUser)) {
      navigate("/certificates");
      return true;
    }
    return false;
  };

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const data = await getCertificates();
        setCertificates(data);
      } catch (err) {
        console.error("Error fetching certificates:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && isVolunteer(currentUser)) {
      fetchCerts();
    } else if (currentUser) {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleDownload = async (cert) => {
    setDownloading(cert._id);
    try {
      const blob = await downloadCertificate(cert._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ShoreClean-Certificate-${cert.event?.title?.replace(/\s+/g, "-") || cert._id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Certificate downloaded successfully!", "success");
    } catch (err) {
      showToast("Download failed. Please try again.", "error");
    } finally {
      setDownloading(null);
    }
  };

  if (!currentUser || !isVolunteer(currentUser)) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Navbar />



      {previewCert && (
        <CertificateModal
          cert={previewCert}
          userName={currentUser.name}
          onClose={() => setPreviewCert(null)}
          onDownload={handleDownload}
          downloading={downloading}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl text-white shadow-2xl animate-slide-in ${
            toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      <section className="pt-32 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back */}
          <button
            id="back-to-vol-dashboard"
            onClick={() => navigate("/volunteer/dashboard")}
            className="flex items-center gap-2 mb-8 px-4 py-2 border border-gray-200 text-gray-600 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>

          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold uppercase tracking-widest mb-3">
              <Award className="h-3.5 w-3.5" /> My Achievements
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Certificates
            </h1>
            <p className="text-gray-500 mt-2 text-base">
              Recognition for your volunteer contributions to coastal conservation.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              {
                label: "Total Earned",
                value: certificates.length,
                icon: <Award className="h-7 w-7 text-cyan-500" />,
                bg: "from-cyan-50 to-blue-50 border-cyan-200",
              },
              {
                label: "Events Completed",
                value: [...new Set(certificates.map((c) => c.event?._id))].length,
                icon: <Trophy className="h-7 w-7 text-amber-500" />,
                bg: "from-amber-50 to-orange-50 border-amber-200",
              },
              {
                label: "Latest Award",
                value:
                  certificates.length > 0
                    ? new Date(certificates[0].issuedAt).toLocaleDateString(
                        "en-US",
                        { month: "short", year: "numeric" }
                      )
                    : "—",
                icon: <Star className="h-7 w-7 text-purple-500" />,
                bg: "from-purple-50 to-pink-50 border-purple-200",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between shadow-sm"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {s.value}
                  </p>
                </div>
                {s.icon}
              </div>
            ))}
          </div>

          {/* Certificates */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
              <p className="text-gray-500 font-medium">Loading your certificates…</p>
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
              <Award className="h-20 w-20 text-gray-200 mx-auto mb-5" />
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                No Certificates Yet
              </h3>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                Participate in cleanup events and get checked in to earn your first certificate!
              </p>
              <button
                onClick={() => navigate("/events")}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Browse Events
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors overflow-hidden"
                >
                  <div className="p-5">
                    {/* Icon + title */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Award className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight">
                          Certificate of Participation
                        </h3>
                        <p className="text-xs text-gray-400">
                          Issued {fmt(cert.issuedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Event info */}
                    <div className="space-y-1.5 mb-5">
                      <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="truncate">{cert.event?.title || "Event"}</span>
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

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        id={`preview-cert-${cert._id}`}
                        onClick={() => setPreviewCert(cert)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Award className="h-4 w-4" />
                        Preview
                      </button>
                      <button
                        id={`download-cert-${cert._id}`}
                        onClick={() => handleDownload(cert)}
                        disabled={downloading === cert._id}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {downloading === cert._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info section */}
          <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-cyan-500" /> About Your Certificates
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-3">
                <div className="w-9 h-9 border border-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <Award className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                    Participation Certificates
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Earned by attending and completing volunteer events. These
                    recognize your personal contribution to coastal conservation.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-9 h-9 border border-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                    Shareable & Downloadable
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Download your certificates as official PDF documents. Share
                    them with your network to showcase your volunteer impact.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VolunteerCertificates;
