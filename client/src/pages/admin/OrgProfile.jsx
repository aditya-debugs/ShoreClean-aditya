import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";

const AdminOrgProfile = () => {
  const { currentUser } = useAuth();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to="/admin/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-8 flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-cyan-600" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">{currentUser?.name || "Admin"}</h1>
                <p className="text-cyan-100">{currentUser?.email}</p>
                <span className="inline-block mt-1 px-3 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                  Administrator
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{currentUser?.name || "—"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{currentUser?.email || "—"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg capitalize">Administrator</p>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <Link
                to="/admin/dashboard"
                className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/admin/volunteers"
                className="px-5 py-2.5 border border-cyan-300 text-cyan-700 rounded-lg hover:bg-cyan-50 transition-colors text-sm font-medium"
              >
                Manage Organizations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOrgProfile;
