// TrashMarkerMap.jsx
import React, { useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { aiApiUrl } from "../utils/api";

// ─── Icons ────────────────────────────────────────────────────────────────────
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const yellowIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const statusIcon = { pending: blueIcon, ongoing: yellowIcon, completed: greenIcon };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
}

// ─── Marker Form Modal (Create / Edit) ────────────────────────────────────────
function MarkerFormModal({ mode, initialData, onSubmit, onClose, currentUser }) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [creatorName, setCreatorName] = useState(
    initialData?.creator_name || currentUser?.name || ""
  );
  const [beforeFile, setBeforeFile] = useState(null);
  const [beforePreview, setBeforePreview] = useState(initialData?.before_img || null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function handleBeforeFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBeforeFile(file);
    setBeforePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, beforeFile: null }));
  }

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = "Title is required";
    if (!description.trim()) errs.description = "Description is required";
    if (!creatorName.trim()) errs.creatorName = "Your name is required";
    if (mode === "create" && !beforeFile) errs.beforeFile = "Before image is required";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    const result = await onSubmit({ name, description, beforeFile, creatorName });
    setSubmitting(false);
    if (result?.success === false) {
      setErrors({ general: result.error || "Something went wrong" });
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1a202c" }}>
              {mode === "create" ? "Report Cleanup Spot" : "Edit Cleanup Spot"}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#718096" }}>
              {mode === "create"
                ? "Fill in the details so volunteers know what to expect"
                : "Update the details for this cleanup spot"}
            </p>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {errors.general && (
          <div style={errorBannerStyle}>{errors.general}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={fieldGroup}>
            <label style={labelStyle}>Spot Title <span style={{ color: "#e53e3e" }}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: null })); }}
              placeholder="e.g. Versova Beach North End"
              style={{ ...inputStyle, borderColor: errors.name ? "#e53e3e" : "#e2e8f0" }}
            />
            {errors.name && <span style={errorText}>{errors.name}</span>}
          </div>

          {/* Description */}
          <div style={fieldGroup}>
            <label style={labelStyle}>Description <span style={{ color: "#e53e3e" }}>*</span></label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: null })); }}
              placeholder="Describe the type and amount of trash, accessibility, urgency, etc."
              rows={3}
              style={{ ...inputStyle, resize: "vertical", borderColor: errors.description ? "#e53e3e" : "#e2e8f0" }}
            />
            {errors.description && <span style={errorText}>{errors.description}</span>}
          </div>

          {/* Before Image */}
          <div style={fieldGroup}>
            <label style={labelStyle}>
              Before Image <span style={{ color: "#e53e3e" }}>*</span>
              {mode === "edit" && <span style={{ color: "#718096", fontWeight: "400" }}> (leave empty to keep current)</span>}
            </label>
            {beforePreview && (
              <img
                src={beforePreview}
                alt="Before preview"
                style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px", marginBottom: "8px", border: "2px solid #4299e1" }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleBeforeFile}
              style={{ ...inputStyle, padding: "6px", borderColor: errors.beforeFile ? "#e53e3e" : "#e2e8f0" }}
            />
            {errors.beforeFile && <span style={errorText}>{errors.beforeFile}</span>}
          </div>

          {/* Reporter Name */}
          <div style={fieldGroup}>
            <label style={labelStyle}>Your Name <span style={{ color: "#e53e3e" }}>*</span></label>
            <input
              type="text"
              value={creatorName}
              onChange={(e) => { setCreatorName(e.target.value); setErrors((p) => ({ ...p, creatorName: null })); }}
              placeholder="Your name or username"
              disabled={!!currentUser?.name}
              style={{
                ...inputStyle,
                borderColor: errors.creatorName ? "#e53e3e" : "#e2e8f0",
                backgroundColor: currentUser?.name ? "#f7fafc" : "#fff",
              }}
            />
            {errors.creatorName && <span style={errorText}>{errors.creatorName}</span>}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={submitBtnStyle}>
              {submitting
                ? "Saving..."
                : mode === "create"
                ? "Report Cleanup Spot"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Marker Detail Modal ──────────────────────────────────────────────────────
function MarkerDetailModal({
  marker,
  isCreator,
  loadingImages,
  proofFile,
  proofPreview,
  isAnalysing,
  analysisResult,
  onClose,
  onAccept,
  onEdit,
  onDelete,
  onProofSelect,
  onAnalyseAndComplete,
  onForceComplete,
  onResetAnalysis,
}) {
  const imgPlaceholder = (
    <div style={{ width: "100%", height: "180px", background: "#f0f4f8", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#a0aec0" }}>
        <div style={{ width: "20px", height: "20px", border: "2px solid #bee3f8", borderTopColor: "#3182ce", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "12px" }}>Loading image…</span>
      </div>
    </div>
  );
  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: "520px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ flex: 1, paddingRight: "12px" }}>
            <span style={statusBadge[marker.status]}>{statusLabel[marker.status]}</span>
            <h2 style={{ margin: "8px 0 2px", fontSize: "18px", fontWeight: "700", color: "#1a202c", lineHeight: "1.3" }}>
              {marker.name || "Unnamed Spot"}
            </h2>
            <div style={{ fontSize: "12px", color: "#718096" }}>Reported by {marker.creator_name}</div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* Description */}
        {marker.description && (
          <div style={{ background: "#f7fafc", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px", fontSize: "13px", color: "#4a5568", lineHeight: "1.6" }}>
            {marker.description}
          </div>
        )}

        {/* ── PENDING ── */}
        {marker.status === "pending" && (
          <>
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: "#718096", fontWeight: "700", marginBottom: "6px", letterSpacing: "0.05em" }}>BEFORE</div>
              {loadingImages ? imgPlaceholder : marker.before_img ? (
                <img src={marker.before_img} alt="Before" style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "10px", border: "1px solid #e2e8f0" }} />
              ) : null}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button style={{ ...btnAccept, padding: "10px" }} onClick={onAccept}>Accept This Task</button>
              {isCreator && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={{ ...btnEdit, flex: 1, padding: "9px" }} onClick={onEdit}>Edit</button>
                  <button style={{ ...btnDelete, flex: 1, padding: "9px" }} onClick={onDelete}>Delete</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── ONGOING ── */}
        {marker.status === "ongoing" && (
          <>
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: "#718096", fontWeight: "700", marginBottom: "6px", letterSpacing: "0.05em" }}>BEFORE</div>
              {loadingImages ? imgPlaceholder : marker.before_img ? (
                <img src={marker.before_img} alt="Before" style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "10px", border: "1px solid #e2e8f0" }} />
              ) : null}
            </div>

            <div style={{ fontSize: "11px", color: "#718096", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.05em" }}>
              UPLOAD AFTER IMAGE TO COMPLETE
            </div>

            {proofPreview && (
              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "11px", color: "#718096", fontWeight: "700", marginBottom: "6px", letterSpacing: "0.05em" }}>AFTER (preview)</div>
                <img src={proofPreview} alt="After preview" style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "10px", border: "2px solid #48bb78" }} />
              </div>
            )}

            <input type="file" accept="image/*" onChange={onProofSelect} style={{ ...fileInputStyle, marginBottom: "10px" }} />

            {proofFile && !isAnalysing && !analysisResult && (
              <button style={{ ...btnComplete, padding: "10px" }} onClick={onAnalyseAndComplete}>
                Submit & Analyse
              </button>
            )}

            {isAnalysing && (
              <div style={analysingBox}>
                <div style={spinner} />
                <span style={{ fontSize: "13px", color: "#4a5568" }}>Analysing your work...</span>
              </div>
            )}

            {analysisResult && !analysisResult.autoComplete && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ ...resultBox, borderColor: analysisResult.cleanliness_score >= 50 ? "#48bb78" : "#fc8181" }}>
                  <div style={{ fontWeight: "700", fontSize: "14px", color: analysisResult.cleanliness_score >= 50 ? "#276749" : "#c53030", marginBottom: "6px" }}>
                    {analysisResult.cleanliness_score >= 50 ? "Good progress!" : "Needs more work"}
                  </div>
                  <div style={{ fontSize: "14px", marginBottom: "6px" }}>
                    Score: <strong style={{ color: "#2b6cb0" }}>{analysisResult.cleanliness_score}%</strong>
                  </div>
                  <div style={{ fontSize: "13px", color: "#4a5568", lineHeight: "1.5" }}>{analysisResult.explanation}</div>
                </div>
                {analysisResult.cleanliness_score < 50 && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button style={{ ...btnDelete, flex: 1, padding: "9px" }} onClick={onResetAnalysis}>Try Again</button>
                    <button style={{ ...btnComplete, flex: 1, padding: "9px", background: "#a0aec0", marginTop: 0 }} onClick={onForceComplete}>Submit Anyway</button>
                  </div>
                )}
              </div>
            )}

            {analysisResult?.autoComplete && (
              <div style={{ ...resultBox, borderColor: "#48bb78", marginTop: "10px" }}>
                <div style={{ fontWeight: "700", color: "#276749", fontSize: "14px" }}>
                  Auto-completed! {analysisResult.cleanliness_score}% clean
                </div>
              </div>
            )}
          </>
        )}

        {/* ── COMPLETED ── */}
        {marker.status === "completed" && (
          <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              {(loadingImages || marker.before_img) && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "#718096", fontWeight: "700", marginBottom: "6px", letterSpacing: "0.05em" }}>BEFORE</div>
                  {loadingImages ? imgPlaceholder : (
                    <img src={marker.before_img} alt="Before" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "10px" }} />
                  )}
                </div>
              )}
              {(loadingImages || marker.after_img) && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "#718096", fontWeight: "700", marginBottom: "6px", letterSpacing: "0.05em" }}>AFTER</div>
                  {loadingImages ? imgPlaceholder : (
                    <img src={marker.after_img} alt="After" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "10px", border: "2px solid #48bb78" }} />
                  )}
                </div>
              )}
            </div>
            <div style={{ textAlign: "center", color: "#276749", fontWeight: "700", fontSize: "14px", padding: "10px", background: "#f0fff4", borderRadius: "8px" }}>
              This area has been cleaned!
            </div>
          </>
        )}

        {/* Coordinates */}
        <div style={{ marginTop: "14px", fontSize: "11px", color: "#a0aec0", borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
          {marker.address || `${marker.latitude.toFixed(4)}, ${marker.longitude.toFixed(4)}`}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function TrashMarkerMap({
  markers,
  loading,
  addMarker,
  updateStatus,
  deleteMarker,
  editMarker,
  completeTask,
  currentUser,
  fetchMarkerById,
}) {
  const initialPosition = [19.076, 72.8777];

  const [creationModal, setCreationModal] = useState({ open: false, lat: null, lng: null });
  const [editModal, setEditModal] = useState({ open: false, marker: null });
  const [detailModal, setDetailModal] = useState({ open: false, marker: null });
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Cache for full marker data (with images), keyed by _id
  const [fullMarkerCache, setFullMarkerCache] = useState({});

  // Per-marker: proof file and preview for ongoing → complete flow
  const [proofFiles, setProofFiles] = useState({});
  const [proofPreviews, setProofPreviews] = useState({});

  // Per-marker: analysis state
  const [analysing, setAnalysing] = useState({});
  const [analysisResults, setAnalysisResults] = useState({});

  function MapClickHandler() {
    useMapEvents({
      dblclick(e) {
        setCreationModal({ open: true, lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  }

  // Open detail modal: fetch full marker data (with images) lazily
  async function handleMarkerClick(marker) {
    const cached = fullMarkerCache[marker._id];
    if (cached) {
      setDetailModal({ open: true, marker: cached });
      return;
    }
    // Show modal immediately with partial data while full data loads
    setDetailModal({ open: true, marker });
    setLoadingDetail(true);
    try {
      const full = await fetchMarkerById(marker._id);
      setFullMarkerCache((prev) => ({ ...prev, [full._id]: full }));
      setDetailModal({ open: true, marker: full });
    } catch {
      // fallback to partial data already shown
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleCreate(formData) {
    const result = await addMarker(creationModal.lat, creationModal.lng, formData);
    if (result?.success !== false) {
      setCreationModal({ open: false, lat: null, lng: null });
    }
    return result;
  }

  async function handleEdit(formData) {
    const result = await editMarker(editModal.marker._id, formData);
    if (result?.success !== false) {
      // Bust the cache for this marker so it re-fetches fresh data next click
      setFullMarkerCache((prev) => {
        const next = { ...prev };
        delete next[editModal.marker._id];
        return next;
      });
      setEditModal({ open: false, marker: null });
    }
    return result;
  }

  async function handleAccept(markerId) {
    const confirmed = window.confirm(
      "Accept this cleanup task? You will be responsible for cleaning this area."
    );
    if (!confirmed) return;
    await updateStatus(markerId, "ongoing");
    setDetailModal({ open: false, marker: null });
  }

  async function handleDelete(marker) {
    const confirmed = window.confirm(
      `Delete "${marker.name || "this marker"}"? This cannot be undone.`
    );
    if (!confirmed) return;
    const result = await deleteMarker(marker._id);
    if (result?.success === false) {
      alert("Could not delete: " + result.error);
    } else {
      setFullMarkerCache((prev) => {
        const next = { ...prev };
        delete next[marker._id];
        return next;
      });
      setDetailModal({ open: false, marker: null });
    }
  }

  function handleProofSelect(e, markerId) {
    const file = e.target.files[0];
    if (!file) return;
    setProofFiles((prev) => ({ ...prev, [markerId]: file }));
    setProofPreviews((prev) => ({ ...prev, [markerId]: URL.createObjectURL(file) }));
    setAnalysisResults((prev) => ({ ...prev, [markerId]: null }));
  }

  async function handleAnalyseAndComplete(marker) {
    const afterFile = proofFiles[marker._id];
    if (!afterFile) return;

    setAnalysing((prev) => ({ ...prev, [marker._id]: true }));
    setAnalysisResults((prev) => ({ ...prev, [marker._id]: null }));

    try {
      // Ensure we have the full marker with before_img
      let fullMarker = fullMarkerCache[marker._id];
      if (!fullMarker?.before_img) {
        fullMarker = await fetchMarkerById(marker._id);
        setFullMarkerCache((prev) => ({ ...prev, [fullMarker._id]: fullMarker }));
      }

      const beforeBlob = dataURLtoBlob(fullMarker.before_img);

      const formData = new FormData();
      formData.append("before", beforeBlob, "before.jpg");
      formData.append("after", afterFile);
      formData.append("location", fullMarker.address || "unknown");
      formData.append("user", currentUser?.name || "anonymous");

      const res = await fetch(aiApiUrl("/cleanup/analyze"), {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        const result = data.analysis;
        const autoComplete = result.cleanliness_score >= 50;

        setAnalysisResults((prev) => ({
          ...prev,
          [marker._id]: { ...result, autoComplete },
        }));

        if (autoComplete) {
          await completeTask(marker._id, afterFile);
        }
      } else {
        alert("Analysis failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Could not reach AI server: " + err.message);
    } finally {
      setAnalysing((prev) => ({ ...prev, [marker._id]: false }));
    }
  }

  async function handleForceComplete(marker) {
    const afterFile = proofFiles[marker._id];
    if (!afterFile) return;
    await completeTask(marker._id, afterFile);
    setAnalysisResults((prev) => ({ ...prev, [marker._id]: null }));
    setProofFiles((prev) => { const p = { ...prev }; delete p[marker._id]; return p; });
    setProofPreviews((prev) => { const p = { ...prev }; delete p[marker._id]; return p; });
  }

  function isCreator(marker) {
    if (!currentUser) return marker.creator_id === "anonymous";
    return marker.creator_id === currentUser._id;
  }

  // Resolve detail modal marker — prefer full cached version
  const detailMarker = detailModal.marker
    ? (fullMarkerCache[detailModal.marker._id] || detailModal.marker)
    : null;

  return (
    <div style={{ position: "relative" }}>
      {loading ? (
        <div style={{ padding: 20 }}>Loading markers...</div>
      ) : (
        <MapContainer center={initialPosition} zoom={12} style={{ height: "500px", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler />

          {markers.map((marker) => (
            <Marker
              key={marker._id}
              position={[marker.latitude, marker.longitude]}
              icon={statusIcon[marker.status]}
              eventHandlers={{
                click: () => handleMarkerClick(marker),
              }}
            />
          ))}
        </MapContainer>
      )}

      {/* Creation Modal */}
      {creationModal.open && (
        <MarkerFormModal
          mode="create"
          initialData={null}
          onSubmit={handleCreate}
          onClose={() => setCreationModal({ open: false, lat: null, lng: null })}
          currentUser={currentUser}
        />
      )}

      {/* Edit Modal */}
      {editModal.open && (
        <MarkerFormModal
          mode="edit"
          initialData={editModal.marker}
          onSubmit={handleEdit}
          onClose={() => setEditModal({ open: false, marker: null })}
          currentUser={currentUser}
        />
      )}

      {/* Marker Detail Modal */}
      {detailModal.open && detailMarker && (
        <MarkerDetailModal
          marker={detailMarker}
          isCreator={isCreator(detailMarker)}
          loadingImages={loadingDetail}
          proofFile={proofFiles[detailMarker._id]}
          proofPreview={proofPreviews[detailMarker._id]}
          isAnalysing={analysing[detailMarker._id]}
          analysisResult={analysisResults[detailMarker._id]}
          onClose={() => setDetailModal({ open: false, marker: null })}
          onAccept={() => handleAccept(detailMarker._id)}
          onEdit={() => {
            setDetailModal({ open: false, marker: null });
            setEditModal({ open: true, marker: detailMarker });
          }}
          onDelete={() => handleDelete(detailMarker)}
          onProofSelect={(e) => handleProofSelect(e, detailMarker._id)}
          onAnalyseAndComplete={() => handleAnalyseAndComplete(detailMarker)}
          onForceComplete={() => handleForceComplete(detailMarker)}
          onResetAnalysis={() => setAnalysisResults((p) => ({ ...p, [detailMarker._id]: null }))}
        />
      )}
    </div>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────
const statusLabel = { pending: "Pending", ongoing: "In Progress", completed: "Completed" };

const statusBadge = {
  pending:   { display: "inline-block", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: "#ebf8ff", color: "#2b6cb0" },
  ongoing:   { display: "inline-block", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: "#fffff0", color: "#b7791f" },
  completed: { display: "inline-block", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: "#f0fff4", color: "#276749" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 10000, padding: "16px",
};

const modalStyle = {
  background: "#fff", borderRadius: "16px", padding: "28px",
  width: "100%", maxWidth: "480px", maxHeight: "90vh",
  overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
};

const closeBtnStyle = {
  background: "#f7fafc", border: "none", borderRadius: "50%",
  width: "32px", height: "32px", cursor: "pointer",
  fontSize: "14px", color: "#718096", display: "flex",
  alignItems: "center", justifyContent: "center",
};

const fieldGroup = { marginBottom: "16px" };

const labelStyle = {
  display: "block", fontSize: "13px", fontWeight: "600",
  color: "#4a5568", marginBottom: "6px",
};

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: "8px",
  border: "2px solid #e2e8f0", fontSize: "14px", color: "#2d3748",
  boxSizing: "border-box", outline: "none", fontFamily: "inherit",
  transition: "border-color 0.2s",
};

const errorText = { fontSize: "12px", color: "#e53e3e", marginTop: "4px", display: "block" };

const errorBannerStyle = {
  background: "#fff5f5", border: "1px solid #fed7d7", color: "#c53030",
  borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px",
};

const submitBtnStyle = {
  flex: 1, padding: "10px 16px", borderRadius: "8px",
  background: "linear-gradient(135deg, #4299e1, #3182ce)",
  color: "#fff", border: "none", cursor: "pointer",
  fontWeight: "700", fontSize: "14px",
};

const cancelBtnStyle = {
  padding: "10px 16px", borderRadius: "8px",
  background: "#edf2f7", color: "#4a5568",
  border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px",
};

const btnAccept = {
  width: "100%", padding: "8px", borderRadius: "6px",
  background: "linear-gradient(135deg, #4299e1, #3182ce)",
  color: "#fff", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px",
};

const btnEdit = {
  flex: 1, padding: "7px", borderRadius: "6px",
  background: "#edf2f7", color: "#4a5568",
  border: "none", cursor: "pointer", fontWeight: "600", fontSize: "12px",
};

const btnDelete = {
  flex: 1, padding: "7px", borderRadius: "6px",
  background: "#fff5f5", color: "#c53030",
  border: "1px solid #fed7d7", cursor: "pointer", fontWeight: "600", fontSize: "12px",
};

const btnComplete = {
  width: "100%", marginTop: "8px", padding: "8px",
  borderRadius: "6px", background: "linear-gradient(135deg, #48bb78, #38a169)",
  color: "#fff", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px",
};

const fileInputStyle = {
  width: "100%", padding: "5px", border: "1px dashed #cbd5e0",
  borderRadius: "6px", fontSize: "11px", backgroundColor: "#f7fafc",
  cursor: "pointer", boxSizing: "border-box", marginBottom: "6px",
};

const analysingBox = {
  display: "flex", alignItems: "center", gap: "10px",
  padding: "10px", background: "#ebf8ff", borderRadius: "8px",
  marginTop: "8px",
};

const spinner = {
  width: "16px", height: "16px", borderRadius: "50%",
  border: "2px solid #bee3f8", borderTopColor: "#3182ce",
  animation: "spin 0.8s linear infinite", flexShrink: 0,
};

const resultBox = {
  background: "#f7fafc", borderRadius: "8px",
  padding: "10px", border: "2px solid",
};

// Inject spinner keyframe
const style = document.createElement("style");
style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
document.head.appendChild(style);

export default TrashMarkerMap;
