import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Calendar, Award, TrendingUp, ArrowLeft } from "lucide-react";
import Navbar from "../../components/Navbar";
import api from "../../utils/api";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 border border-gray-100">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ events: 0, organizations: 0, donations: 0 });
  const [events, setEvents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, orgsRes] = await Promise.all([
          api.get("/events", { params: { limit: 5 } }),
          api.get("/organizations", { params: { limit: 5 } }),
        ]);
        const evtList = eventsRes.data?.events || [];
        const orgList = orgsRes.data?.organizations || orgsRes.data || [];
        setEvents(evtList);
        setOrganizations(orgList);
        setStats({
          events: eventsRes.data?.total || evtList.length,
          organizations: orgList.length,
          donations: 0,
        });
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <StatCard icon={Calendar} label="Total Events" value={stats.events} color="bg-blue-500" />
                <StatCard icon={Users} label="Organizations" value={stats.organizations} color="bg-green-500" />
                <StatCard icon={TrendingUp} label="Platform Status" value="Active" color="bg-cyan-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Recent Events */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Events</h2>
                    <Link to="/events" className="text-sm text-blue-600 hover:underline">View all</Link>
                  </div>
                  {events.length === 0 ? (
                    <p className="text-gray-500 text-sm">No events found.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {events.map((evt) => (
                        <li key={evt._id} className="py-3">
                          <p className="font-medium text-gray-800 text-sm">{evt.title}</p>
                          <p className="text-xs text-gray-500">{evt.location} · {new Date(evt.startDate).toLocaleDateString()}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Organizations */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Organizations</h2>
                    <Link to="/admin/volunteers" className="text-sm text-blue-600 hover:underline">Manage</Link>
                  </div>
                  {organizations.length === 0 ? (
                    <p className="text-gray-500 text-sm">No organizations found.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {organizations.map((org) => (
                        <li key={org._id} className="py-3">
                          <p className="font-medium text-gray-800 text-sm">{org.orgName || org.name}</p>
                          <p className="text-xs text-gray-500">{org.city || org.location?.city || "—"}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
