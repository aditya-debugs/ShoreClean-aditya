// MapWithList.jsx
import React, { useEffect, useState } from "react";
import TrashMarkerMap from "./TrashMarkerMap";
import TrashMarkerList from "./TrashMarkerList";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_ROOT } from "../utils/api";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function MapWithList() {
  const { currentUser } = useAuth();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_ROOT}/markers`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMarkers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching markers:", error);
        setMarkers([]);
        setLoading(false);
      });
  }, []);

  // Fetch a single marker with full image data (lazy-loaded on demand)
  const fetchMarkerById = async (id) => {
    const res = await fetch(`${API_ROOT}/markers/${id}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  };

  // Add marker with full details (name, description, before_img as File)
  const addMarker = async (lat, lng, { name, description, beforeFile, creatorName }) => {
    try {
      const before_img = await fileToBase64(beforeFile);
      const res = await fetch(`${API_ROOT}/markers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          name,
          description,
          before_img,
          creator_id: currentUser?._id || "anonymous",
          creator_name: creatorName || currentUser?.name || "Anonymous",
        }),
      });
      if (res.ok) {
        const newMarker = await res.json();
        setMarkers((prev) => [newMarker, ...prev]);
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, error: err.error };
      }
    } catch (error) {
      console.error("Error adding marker:", error);
      return { success: false, error: error.message };
    }
  };

  // Edit marker (name, description, optional new before image)
  const editMarker = async (id, { name, description, beforeFile }) => {
    try {
      const body = { name, description };
      if (beforeFile) {
        body.before_img = await fileToBase64(beforeFile);
      }
      const res = await fetch(`${API_ROOT}/markers/${id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setMarkers((prev) => prev.map((m) => (m._id === id ? updated : m)));
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, error: err.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Update marker status
  const updateStatus = async (id, status) => {
    const res = await fetch(`${API_ROOT}/markers/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMarkers((prev) => prev.map((m) => (m._id === id ? updated : m)));
    }
  };

  // Complete task - accepts a File object, converts to base64
  const completeTask = async (id, imageFile) => {
    try {
      const after_img = await fileToBase64(imageFile);
      const res = await fetch(`${API_ROOT}/markers/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ after_img }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMarkers((prev) => prev.map((m) => (m._id === id ? updated : m)));
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Delete marker (actual DB delete, only pending allowed by server)
  const deleteMarker = async (id) => {
    try {
      const res = await fetch(`${API_ROOT}/markers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMarkers((prev) => prev.filter((m) => m._id !== id));
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, error: err.error };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Update marker remark
  const updateRemark = async (id, remark) => {
    const res = await fetch(`${API_ROOT}/markers/${id}/remark`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remark }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMarkers((prev) => prev.map((m) => (m._id === id ? updated : m)));
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0f7ff 0%, #b8ebff 50%, #87ceeb 100%)",
        padding: "0",
        fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <Navbar />
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "9rem 2rem 2rem 2rem",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        {/* Map Section */}
        <section
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "2rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "2rem",
                fontWeight: "600",
                color: "#333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              🗺️ Interactive Cleanup Map
            </h2>
            <p style={{ margin: "0", color: "#666", fontSize: "1rem", fontStyle: "italic" }}>
              Double-click anywhere on the map to report a new cleanup spot
            </p>
          </div>
          <div style={{ borderRadius: "15px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)" }}>
            <TrashMarkerMap
              markers={markers}
              loading={loading}
              addMarker={addMarker}
              updateStatus={updateStatus}
              deleteMarker={deleteMarker}
              editMarker={editMarker}
              completeTask={completeTask}
              currentUser={currentUser}
              fetchMarkerById={fetchMarkerById}
            />
          </div>
        </section>

        {/* Table Section */}
        <section
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "2rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "2rem",
                fontWeight: "600",
                color: "#333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              📋 Cleanup Mission Control
            </h2>
            <p style={{ margin: "0", color: "#666", fontSize: "1rem", fontStyle: "italic" }}>
              Track progress, accept missions, and celebrate completed cleanups
            </p>
          </div>
          <TrashMarkerList
            markers={markers}
            loading={loading}
            updateStatus={updateStatus}
            completeTask={completeTask}
            updateRemark={updateRemark}
            fetchMarkerById={fetchMarkerById}
          />
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default MapWithList;
