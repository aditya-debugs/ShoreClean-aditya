import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Users } from "lucide-react";
import Navbar from "../../components/Navbar";
import api from "../../utils/api";

const AdminVolunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const res = await api.get("/auth/profile");
        // Fetch all users — using organizations endpoint as proxy for now
        const orgsRes = await api.get("/organizations");
        const orgs = orgsRes.data?.organizations || orgsRes.data || [];
        setVolunteers(orgs);
      } catch (err) {
        console.error("Error fetching volunteers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVolunteers();
  }, []);

  const filtered = volunteers.filter((v) =>
    (v.orgName || v.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to="/admin/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Volunteer Management</h1>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No organizations found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Organization</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Location</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((org) => (
                    <tr key={org._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{org.orgName || org.name}</td>
                      <td className="px-6 py-4 text-gray-500">{org.city || org.location?.city || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${org.isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {org.isVerified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/organization/${org._id}`} className="text-blue-600 hover:underline text-xs">
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminVolunteers;
