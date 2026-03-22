import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, CheckCircle, XCircle, Loader } from "lucide-react";
import Navbar from "../components/Navbar";

const CleanupAnalyze = () => {
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [location, setLocation] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const AI_URL = import.meta.env.VITE_AI_API_URL || "http://localhost:8001";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!beforeFile || !afterFile) {
      setError("Please upload both before and after images.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("before", beforeFile);
      formData.append("after", afterFile);
      formData.append("location", location);

      const res = await fetch(`${AI_URL}/cleanup/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed");
      }

      const data = await res.json();
      setResult(data.analysis);
    } catch (err) {
      setError(err.message || "Failed to analyze cleanup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const FileUpload = ({ label, file, onChange, id }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <label
        htmlFor={id}
        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          file ? "border-cyan-400 bg-cyan-50" : "border-gray-300 hover:border-cyan-400 hover:bg-cyan-50"
        }`}
      >
        {file ? (
          <div className="text-center">
            <CheckCircle className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
            <p className="text-sm text-gray-700 font-medium">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Click to upload image</p>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB</p>
          </div>
        )}
        <input id={id} type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files[0])} />
      </label>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cleanup Analysis</h1>
          <p className="text-gray-600 mb-8">
            Upload before and after photos of a cleanup site. Our AI will analyze the impact and calculate a cleanliness score.
          </p>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FileUpload label="Before Cleanup" file={beforeFile} onChange={setBeforeFile} id="before-upload" />
              <FileUpload label="After Cleanup" file={afterFile} onChange={setAfterFile} id="after-upload" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location (optional)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Juhu Beach, Mumbai"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Cleanup"
              )}
            </button>
          </form>

          {result && (
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Results</h2>

              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${result.cleaned ? "bg-green-500" : "bg-red-400"}`}>
                  {result.cleanliness_score ?? "?"}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cleanliness Score</p>
                  <div className="flex items-center gap-2">
                    {result.cleaned ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`font-semibold ${result.cleaned ? "text-green-600" : "text-red-500"}`}>
                      {result.cleaned ? "Cleanup Successful" : "More Cleanup Needed"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${result.cleanliness_score >= 70 ? "bg-green-500" : result.cleanliness_score >= 40 ? "bg-yellow-400" : "bg-red-400"}`}
                  style={{ width: `${result.cleanliness_score ?? 0}%` }}
                />
              </div>

              {result.explanation && (
                <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-lg">{result.explanation}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CleanupAnalyze;
