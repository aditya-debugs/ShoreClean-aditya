// TrashMarkerList.jsx
import React, { useState } from "react";
import { aiApiUrl } from "../utils/api";

const statusColor = {
  pending: "#e3f2fd",
  ongoing: "#fffde7",
  completed: "#e8f5e9",
};

// Convert base64 data URL → Blob (for sending to AI server as a file)
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
}

function TrashMarkerList({
  markers,
  loading,
  updateStatus,
  completeTask,
  updateRemark,
  fetchMarkerById,
}) {
  const [focusedDescriptionId, setFocusedDescriptionId] = useState(null);

  // After image: File object + local preview URL, keyed by marker._id
  const [afterFiles, setAfterFiles] = useState({});
  const [afterPreviews, setAfterPreviews] = useState({});

  // Analysis state keyed by marker._id
  const [analysisResults, setAnalysisResults] = useState({});
  const [analysing, setAnalysing] = useState({});

  // Submitting (completing) state keyed by marker._id
  const [submitting, setSubmitting] = useState({});

  function handleDescriptionKeyPress(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      setFocusedDescriptionId(null);
      e.target.blur();
    }
  }

  // Accept with confirmation dialog
  async function handleAccept(id) {
    const confirmed = window.confirm(
      "Accept this cleanup task? You will be responsible for cleaning this area."
    );
    if (!confirmed) return;
    await updateStatus(id, "ongoing");
  }

  // Store selected after image in state + show local preview
  function handleAfterImageUpload(e, id) {
    const file = e.target.files[0];
    if (!file) return;
    setAfterFiles((prev) => ({ ...prev, [id]: file }));
    setAfterPreviews((prev) => ({ ...prev, [id]: URL.createObjectURL(file) }));
    // Reset previous analysis when a new after image is selected
    setAnalysisResults((prev) => ({ ...prev, [id]: null }));
  }

  // Analyse: uses marker.before_img (from DB) + locally selected after image
  async function handleAnalyse(marker) {
    const id = marker._id;
    const afterFile = afterFiles[id];

    if (!afterFile) {
      alert("Please upload the After image first.");
      return;
    }

    setAnalysing((prev) => ({ ...prev, [id]: true }));
    setAnalysisResults((prev) => ({ ...prev, [id]: null }));

    try {
      // Fetch full marker to get before_img (not included in list response)
      const fullMarker = await fetchMarkerById(id);

      if (!fullMarker.before_img) {
        alert("Before image not found for this spot.");
        return;
      }

      const beforeBlob = dataURLtoBlob(fullMarker.before_img);

      const formData = new FormData();
      formData.append("before", beforeBlob, "before.jpg");
      formData.append("after", afterFile);
      formData.append("location", marker.address || "unknown");
      formData.append("user", "anonymous");

      const res = await fetch(aiApiUrl("/cleanup/analyze"), {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setAnalysisResults((prev) => ({ ...prev, [id]: data.analysis }));
      } else {
        alert("Analysis failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error connecting to AI server: " + err.message);
    } finally {
      setAnalysing((prev) => ({ ...prev, [id]: false }));
    }
  }

  // Submit (complete): only callable when score >= 50%
  async function handleSubmit(marker) {
    const id = marker._id;
    const afterFile = afterFiles[id];
    if (!afterFile) return;

    const confirmed = window.confirm(
      `Submit this cleanup as completed? Score: ${analysisResults[id]?.cleanliness_score}%`
    );
    if (!confirmed) return;

    setSubmitting((prev) => ({ ...prev, [id]: true }));
    await completeTask(id, afterFile);
    setSubmitting((prev) => ({ ...prev, [id]: false }));

    // Clear local state for this marker
    setAfterFiles((prev) => { const p = { ...prev }; delete p[id]; return p; });
    setAfterPreviews((prev) => { const p = { ...prev }; delete p[id]; return p; });
    setAnalysisResults((prev) => { const p = { ...prev }; delete p[id]; return p; });
  }

  return (
    <div style={{ marginTop: 20, overflowX: "auto" }}>
      {loading ? (
        <div style={{ padding: "20px", textAlign: "center", color: "#718096" }}>Loading markers...</div>
      ) : markers.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#a0aec0", fontSize: "15px" }}>
          No cleanup spots reported yet. Double-click on the map to report one!
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
          }}
        >
          <thead style={{ background: "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)" }}>
            <tr>
              <th style={thStyle}>Spot / Address</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Reporter</th>
              <th style={thStyle}>Before Image</th>
              <th style={thStyle}>After Image</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Analysis</th>
            </tr>
          </thead>
          <tbody>
            {markers.map((marker, index) => {
              const result = analysisResults[marker._id];
              const isAnalysing = analysing[marker._id];
              const isSubmitting = submitting[marker._id];
              const afterFile = afterFiles[marker._id];
              const canSubmit = result?.cleanliness_score >= 50 && afterFile;

              return (
                <tr
                  key={marker._id}
                  style={{
                    background:
                      marker.status === "completed"
                        ? statusColor["completed"]
                        : marker.status === "ongoing"
                        ? statusColor["ongoing"]
                        : statusColor["pending"],
                    transition: "background 0.3s",
                    borderBottom: index === markers.length - 1 ? "none" : "1px solid #e2e8f0",
                  }}
                >
                  {/* Spot name + address */}
                  <td style={tdStyle}>
                    {marker.name && (
                      <div style={{ fontWeight: "600", color: "#2d3748", marginBottom: "3px" }}>
                        {marker.name}
                      </div>
                    )}
                    <div style={{ fontSize: "12px", color: "#718096" }}>
                      {marker.address || `${marker.latitude?.toFixed(4)}, ${marker.longitude?.toFixed(4)}`}
                    </div>
                  </td>

                  {/* Description */}
                  <td style={{ ...tdStyle, maxWidth: "200px" }}>
                    <div style={{
                      fontSize: "13px", color: "#4a5568", lineHeight: "1.5",
                      maxHeight: "80px", overflowY: "auto",
                    }}>
                      {marker.description || <span style={{ color: "#a0aec0", fontStyle: "italic" }}>No description</span>}
                    </div>
                  </td>

                  {/* Reporter name */}
                  <td style={tdStyle}>
                    <div style={{ fontSize: "13px", color: "#4a5568" }}>
                      {marker.creator_name || "-"}
                    </div>
                  </td>

                  {/* Before Image — icon only, full image loads in map detail */}
                  <td style={tdStyle}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <span style={{ fontSize: "20px", title: "View in map" }}>📷</span>
                    </div>
                  </td>

                  {/* After Image — local preview when selected; completed badge otherwise */}
                  <td style={tdStyle}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      {afterPreviews[marker._id] ? (
                        <img
                          src={afterPreviews[marker._id]}
                          alt="After preview"
                          style={{ width: 64, height: 52, objectFit: "cover", borderRadius: "6px", border: "2px solid #48bb78" }}
                        />
                      ) : marker.status === "completed" ? (
                        <span style={{ fontSize: "18px" }}>✅</span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#a0aec0" }}>—</span>
                      )}

                      {/* File upload only for ongoing markers */}
                      {marker.status === "ongoing" && (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAfterImageUpload(e, marker._id)}
                          style={imageUploadStyle}
                        />
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{
                    ...tdStyle,
                    fontWeight: "bold",
                    color:
                      marker.status === "completed" ? "#276749"
                      : marker.status === "pending" ? "#1976d2"
                      : "#b7791f",
                  }}>
                    {marker.status.charAt(0).toUpperCase() + marker.status.slice(1)}
                  </td>

                  {/* Action */}
                  <td style={tdStyle}>
                    {/* Pending: Accept with confirm */}
                    {marker.status === "pending" && (
                      <button
                        style={buttonStyleBlue}
                        onClick={() => handleAccept(marker._id)}
                      >
                        Accept
                      </button>
                    )}

                    {/* Ongoing: Submit button — enabled only when score ≥ 50% */}
                    {marker.status === "ongoing" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <button
                          style={{
                            ...buttonStyleGreen,
                            opacity: canSubmit && !isSubmitting ? 1 : 0.4,
                            cursor: canSubmit && !isSubmitting ? "pointer" : "not-allowed",
                          }}
                          onClick={() => canSubmit && handleSubmit(marker)}
                          disabled={!canSubmit || isSubmitting}
                          title={
                            !afterFile
                              ? "Upload an after image first"
                              : !result
                              ? "Run analysis first"
                              : result.cleanliness_score < 50
                              ? `Score ${result.cleanliness_score}% — needs 50%+ to submit`
                              : "Submit as completed"
                          }
                        >
                          {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                        {result && result.cleanliness_score < 50 && (
                          <div style={{ fontSize: "10px", color: "#c53030", textAlign: "center" }}>
                            {result.cleanliness_score}% — needs 50%+
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completed: show badge */}
                    {marker.status === "completed" && (
                      <span style={{ fontSize: "12px", color: "#276749", fontWeight: "600" }}>
                        Completed
                      </span>
                    )}
                  </td>

                  {/* Analysis */}
                  <td style={tdStyle}>
                    {marker.status === "completed" ? (
                      <span style={{ fontSize: "12px", color: "#a0aec0", fontStyle: "italic" }}>Done</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <button
                          style={{
                            ...buttonStyleAnalyse,
                            opacity: isAnalysing ? 0.7 : 1,
                            cursor: isAnalysing ? "not-allowed" : "pointer",
                          }}
                          onClick={() => !isAnalysing && handleAnalyse(marker)}
                          disabled={isAnalysing}
                        >
                          {isAnalysing ? "Analysing..." : "Analyse"}
                        </button>

                        {/* Result card */}
                        {result && (
                          <div style={{
                            ...analysisBoxStyle,
                            borderColor: result.cleanliness_score >= 50 ? "#48bb78" : "#fc8181",
                          }}>
                            <div style={{
                              fontWeight: "bold", marginBottom: "3px",
                              color: result.cleanliness_score >= 50 ? "#276749" : "#c53030",
                            }}>
                              {result.cleaned ? "Cleaned" : "Not cleaned"}
                            </div>
                            <div style={{ marginBottom: "3px" }}>
                              Score:{" "}
                              <strong style={{ color: "#2b6cb0" }}>
                                {result.cleanliness_score}%
                              </strong>
                              {result.cleanliness_score >= 50 && (
                                <span style={{ color: "#276749", marginLeft: "4px" }}>Submit ready</span>
                              )}
                            </div>
                            <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.4" }}>
                              {result.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const thStyle = {
  padding: "14px 12px",
  color: "#ffffff",
  fontWeight: "600",
  fontSize: "13px",
  textAlign: "left",
  borderBottom: "2px solid #2b77cb",
};

const tdStyle = {
  padding: "12px",
  borderRight: "1px solid #e2e8f0",
  fontSize: "13px",
  color: "#2d3748",
  verticalAlign: "top",
};

const buttonStyleBlue = {
  padding: "6px 12px",
  borderRadius: "6px",
  background: "#2196f3",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

const buttonStyleGreen = {
  padding: "6px 12px",
  borderRadius: "6px",
  background: "#38a169",
  color: "#fff",
  border: "none",
  fontWeight: "600",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

const buttonStyleAnalyse = {
  padding: "6px 10px",
  borderRadius: "6px",
  background: "#667eea",
  color: "#fff",
  border: "none",
  fontWeight: "600",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

const imageUploadStyle = {
  padding: "3px 6px",
  border: "1px dashed #cbd5e0",
  borderRadius: "4px",
  fontSize: "10px",
  backgroundColor: "#f7fafc",
  cursor: "pointer",
  width: "72px",
};

const analysisBoxStyle = {
  padding: "8px",
  borderRadius: "6px",
  backgroundColor: "#f7fafc",
  border: "2px solid",
  fontSize: "12px",
  maxWidth: "180px",
};

export default TrashMarkerList;
