import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Users,
  MessageCircle,
  Search,
  Loader,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { isVolunteer } from "../utils/roleUtils";
import api from "../utils/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Organizations = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [joiningId, setJoiningId] = useState(null);
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    api
      .get("/organizations")
      .then((res) => {
        const data = res.data;
        setOrgs(Array.isArray(data) ? data : data.organizations ?? []);
      })
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orgs.filter((o) => {
    const name = (o.organizationName || o.name || "").toLowerCase();
    const city = (o.city || o.address || "").toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || city.includes(q);
  });

  const handleJoin = async (org) => {
    const orgId = org.userId?._id || org._id;
    setJoiningId(orgId);
    try {
      const res = await api.get(`/groups/${orgId}`);
      const groups = res.data?.data ?? [];
      const communityGroups = groups.filter((g) => g.type !== "event");

      if (communityGroups.length === 0) {
        setFeedback((f) => ({ ...f, [orgId]: "No community groups yet." }));
        return;
      }

      for (const group of communityGroups) {
        try { await api.post(`/groups/${group._id}/join`); } catch (_) {}
      }

      setJoinedIds((prev) => new Set([...prev, orgId]));
      setFeedback((f) => ({ ...f, [orgId]: "Joined! Go to Community Chat to chat." }));
    } catch {
      setFeedback((f) => ({ ...f, [orgId]: "Failed — please try again." }));
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      <Navbar />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Page heading */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              Find Organizers
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              Browse organizations running beach cleanup events. Join their
              community to access group chats and stay updated.
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
            />
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No organizations found.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((org) => {
                const orgId = org.userId?._id || org._id;
                const hasJoined = joinedIds.has(orgId);
                const fb = feedback[orgId];

                return (
                  <div
                    key={org._id}
                    className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
                  >
                    {/* Cover */}
                    <div className="h-24 bg-gradient-to-r from-cyan-500 to-blue-500 relative">
                      {org.logo && (
                        <img
                          src={org.logo}
                          alt={org.organizationName || org.name}
                          className="absolute -bottom-6 left-5 w-12 h-12 rounded-xl border-2 border-white shadow object-cover bg-white"
                        />
                      )}
                      {!org.logo && (
                        <div className="absolute -bottom-6 left-5 w-12 h-12 rounded-xl border-2 border-white shadow bg-white flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-cyan-500" />
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="pt-9 px-5 pb-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-gray-800 text-base leading-tight">
                          {org.organizationName || org.name}
                        </h3>
                        {org.verified && (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        )}
                      </div>

                      {(org.city || org.address) && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                          <MapPin className="h-3 w-3" />
                          <span>{org.city || org.address}</span>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">
                        {org.description || "Environmental conservation organization."}
                      </p>

                      {/* Feedback */}
                      {fb && (
                        <p className={`text-xs mb-2 font-medium ${hasJoined ? "text-green-600" : "text-red-500"}`}>
                          {fb}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-auto">
                        <Link
                          to={`/organization/${orgId}`}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          View Profile
                          <ChevronRight className="h-3 w-3" />
                        </Link>

                        {isVolunteer(currentUser) && (
                          <button
                            onClick={() => handleJoin(org)}
                            disabled={joiningId === orgId || hasJoined}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <MessageCircle className="h-3 w-3" />
                            {joiningId === orgId
                              ? "Joining…"
                              : hasJoined
                              ? "Joined ✓"
                              : "Join Community"}
                          </button>
                        )}
                      </div>

                      {hasJoined && (
                        <Link
                          to="/chat"
                          className="mt-2 text-center text-xs text-cyan-600 font-semibold hover:text-cyan-800 transition-colors"
                        >
                          → Open Community Chat
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Organizations;
