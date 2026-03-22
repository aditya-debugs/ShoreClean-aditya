// MapWithList.jsx

import React, { useEffect, useState } from "react";
import TrashMarkerMap from "./TrashMarkerMap";
import TrashMarkerList from "./TrashMarkerList";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";

function MapWithList() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all markers on mount
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/markers`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Ensure data is an array
        setMarkers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching markers:", error);
        setMarkers([]); // Set empty array on error
        setLoading(false);
      });
  }, []);

  // Add marker
  const addMarker = async (lat, lng) => {
    try {
      const res = await fetch("http://localhost:8000/api/markers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      if (res.ok) {
        const newMarker = await res.json();
        setMarkers((prev) => [...prev, newMarker]);
      } else {
        console.error("Failed to add marker:", res.status);
      }
    } catch (error) {
      console.error("Error adding marker:", error);
    }
  };

  // Update marker status
  const updateStatus = async (id, status) => {
    const res = await fetch(`http://localhost:8000/api/markers/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMarkers((prev) => prev.map((m) => (m._id === id ? updated : m)));
    }
  };

  // Complete task (with image upload)
  const completeTask = async (id, imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("status", "completed");
    const res = await fetch(
      `http://localhost:8000/api/markers/${id}/complete`,
      {
        method: "POST",
        body: formData,
      }
    );
    if (res.ok) {
      const updated = await res.json();
      setMarkers((prev) => prev.map((m) => (m._id === id ? updated : m)));
    }
  };

  // Delete marker from frontend only
  const deleteMarkerFrontend = (id) => {
    setMarkers((prev) => prev.filter((m) => m._id !== id));
  };

  // Update marker remark
  const updateRemark = async (id, remark) => {
    const res = await fetch(`http://localhost:8000/api/markers/${id}/remark`, {
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
        background:
          "linear-gradient(135deg, #e0f7ff 0%, #b8ebff 50%, #87ceeb 100%)",
        padding: "0",
        fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <Navbar />
      <div style={{ paddingTop: "80px" }}>
        <div style={{ padding: "16px 24px 0" }}>
          <BackButton />
        </div>
      {/* Header Section
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          padding: "2rem 0",
          textAlign: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1
          style={{
            margin: "0",
            fontSize: "3rem",
            fontWeight: "700",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.5rem",
          }}
        >
          🌊 Shore Clean Initiative
        </h1>
        <p
          style={{
            margin: "0",
            fontSize: "1.2rem",
            color: "#666",
            fontWeight: "400",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          "Every beach cleaned, every shore restored - together we protect our
          ocean's beauty"
        </p>
      </div> */}

      {/* Main Content Container */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        {/* Interactive Map Section */}
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
          <div
            style={{
              textAlign: "center",
              marginBottom: "1.5rem",
            }}
          >
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
            <p
              style={{
                margin: "0",
                color: "#666",
                fontSize: "1rem",
                fontStyle: "italic",
              }}
            >
              Double-click anywhere on the map to mark a new cleanup spot
            </p>
          </div>
          <div
            style={{
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            <TrashMarkerMap
              markers={markers}
              loading={loading}
              addMarker={addMarker}
              updateStatus={updateStatus}
              deleteMarkerFrontend={deleteMarkerFrontend}
              completeTask={completeTask}
            />
          </div>
        </section>

        {/* Task Management Section */}
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
          <div
            style={{
              textAlign: "center",
              marginBottom: "1.5rem",
            }}
          >
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
            <p
              style={{
                margin: "0",
                color: "#666",
                fontSize: "1rem",
                fontStyle: "italic",
              }}
            >
              Track progress, accept missions, and celebrate completed cleanups
            </p>
          </div>
          <TrashMarkerList
            markers={markers}
            loading={loading}
            updateStatus={updateStatus}
            completeTask={completeTask}
            updateRemark={updateRemark}
          />
        </section>
      </div>

      {/* Footer Section */}
      <div
        style={{
          background: "rgba(135, 206, 235, 0.3)",
          padding: "2rem",
          textAlign: "center",
          marginTop: "2rem",
        }}
      >
        <p
          style={{
            margin: "0",
            color: "#2c5282",
            fontSize: "0.9rem",
            fontStyle: "italic",
          }}
        >
          💙 Making waves of change, one cleanup at a time 💙
        </p>
      </div>
      </div>
    </div>
  );
}

export default MapWithList;
