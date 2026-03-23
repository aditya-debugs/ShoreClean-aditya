import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Calendar,
  Users,
  MapPin,
  Loader,
  Trash2,
  Edit,
  Plus,
  ChevronDown,
} from "lucide-react";
import BackButton from "../components/BackButton";
import {
  getEvents,
  rsvpForEvent,
  cancelRsvpForEvent,
  deleteEvent,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { canCreateEvents, isOrganizer, isVolunteer } from "../utils/roleUtils";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../index.css";

const EVENTS_PER_PAGE = 6;

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get organizer ID from URL search params
  const searchParams = new URLSearchParams(location.search);
  const organizerIdFromUrl = searchParams.get("organizer");

  const buildParams = useCallback(
    (pageNum) => {
      const params = { page: pageNum, limit: EVENTS_PER_PAGE };
      if (organizerIdFromUrl) {
        params.organizer = organizerIdFromUrl;
      } else if (isOrganizer(currentUser)) {
        params.organizer = currentUser._id;
      }
      return params;
    },
    [organizerIdFromUrl, currentUser]
  );

  // Initial load — reset list when filters change
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError("");
      setPage(1);
      try {
        const data = await getEvents(buildParams(1));
        const fetched = data.events || [];
        setEvents(fetched);
        const pages = data.totalPages ?? (fetched.length === EVENTS_PER_PAGE ? 2 : 1);
        setHasMore(pages > 1);
        setLoading(false);
      } catch (err) {
        setError("Could not load events. Please try again later.");
        setLoading(false);
      }
    };
    fetchEvents();
  }, [currentUser, organizerIdFromUrl, buildParams]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getEvents(buildParams(nextPage));
      const fetched = data.events || [];
      setEvents((prev) => [...prev, ...fetched]);
      setPage(nextPage);
      setHasMore(nextPage < (data.totalPages ?? (fetched.length === EVENTS_PER_PAGE ? nextPage + 1 : nextPage)));
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRSVP = async (eventId, alreadyRSVPed) => {
    if (!currentUser) {
      alert("Please log in to RSVP for events.");
      return;
    }

    try {
      const result = alreadyRSVPed
        ? await cancelRsvpForEvent(eventId)
        : await rsvpForEvent(eventId);

      // Update the local state with the new attendees list
      setEvents((evts) =>
        evts.map((ev) =>
          ev._id === eventId ? { ...ev, attendees: result.event.attendees } : ev
        )
      );
    } catch (error) {
      console.error("RSVP error:", error);
      alert("Could not update RSVP. Please try again.");
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteEvent(eventId);
      // Remove the event from local state
      setEvents((evts) => evts.filter((ev) => ev._id !== eventId));
      alert("Event deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Could not delete event. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      <Navbar />
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <BackButton className="mb-8" />

          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex-1 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                {organizerIdFromUrl
                  ? "Organization"
                  : isOrganizer(currentUser)
                  ? "My"
                  : "Upcoming"}{" "}
                <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                  Events
                </span>
              </h1>
              <p className="text-lg text-gray-600 mt-3 max-w-2xl mx-auto">
                {organizerIdFromUrl
                  ? "Explore all events organized by this organization and join their coastal clean-up initiatives."
                  : isOrganizer(currentUser)
                  ? "Manage your organization's coastal clean-up events and track their impact."
                  : "Discover and join coastal clean-up events near you. RSVP to secure your spot and make an impact!"}
              </p>
            </div>

            {/* Create Event button — always visible for organizers */}
            {canCreateEvents(currentUser) && !organizerIdFromUrl && (
              <Link
                to="/admin/create-event"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-xl font-bold shadow-lg hover:bg-cyan-700 hover:scale-105 hover:shadow-xl transition-all duration-300 flex-shrink-0"
              >
                <Plus className="h-5 w-5" />
                Create Event
              </Link>
            )}
          </div>

          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader className="h-10 w-10 animate-spin text-cyan-500" />
            </div>
          )}

          {!loading && error && (
            <div className="text-center text-red-500 py-12">
              {error}
              <div className="mt-4 text-sm text-gray-500">
                Please check your backend server and API route.
                <br />
                <span className="font-mono">GET /api/events</span> should return
                a list of events.
                <br />
                If you are running locally, make sure the server is started and
                CORS is configured if needed.
              </div>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="text-center py-12 bg-white/80 rounded-xl border border-gray-200/50 mb-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                No upcoming events
              </h3>
              <p className="text-gray-500 mb-6">
                Check back later for new coastal cleanup events.
              </p>
              {canCreateEvents(currentUser) && (
                <Link to="/admin/create-event">
                  <button className="inline-flex items-center px-8 py-3 bg-cyan-600 text-white rounded-xl font-bold shadow-lg hover:bg-cyan-700 hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                    Create Event
                  </button>
                </Link>
              )}
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {events.map((event, idx) => (
                <div key={event._id} className="relative">
                  <Link
                    to={`/events/${event._id}`}
                    className="bg-white rounded-2xl shadow-lg transition-all duration-500 overflow-hidden border border-gray-100 group transform hover:scale-105 hover:shadow-2xl hover:border-cyan-400 animate-fade-in block"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div
                      className="h-48 bg-cover bg-center relative"
                      style={{
                        backgroundImage: `url(${
                          event.bannerUrl ||
                          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                        })`,
                      }}
                    >
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
                      <div className="absolute top-2 right-2 bg-white/80 rounded-full px-3 py-1 text-xs font-semibold text-cyan-600 shadow-md backdrop-blur">
                        {new Date(event.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col justify-between min-h-[260px]">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2 min-h-[2.5em]">
                          {event.description}
                        </p>
                        <div className="flex items-center text-gray-600 mb-3">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-cyan-500">
                            <Users className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">
                              {event.attendees?.length || 0} joined
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            by {event.organizer?.name || "Organizer"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  {/* Edit and Delete buttons for organizers viewing their own events */}
                  {isOrganizer(currentUser) &&
                    ((!organizerIdFromUrl &&
                      currentUser._id === event.organizer?._id) ||
                      (!organizerIdFromUrl &&
                        currentUser._id === event.organizer)) && (
                      <div className="absolute top-4 left-4 z-10 flex gap-2">
                        <Link
                          to={`/admin/create-event?edit=${event._id}`}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 hover:scale-105 hover:shadow-xl transition-all duration-300 text-xs cursor-pointer flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteEvent(event._id, event.title);
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 hover:scale-105 hover:shadow-xl transition-all duration-300 text-xs cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}

          {/* Load More button */}
          {!loading && !error && hasMore && (
            <div className="flex justify-center mb-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-8 py-3 bg-white border-2 border-cyan-300 text-cyan-700 rounded-2xl font-bold hover:bg-cyan-50 hover:border-cyan-400 hover:scale-105 transition-all duration-300 shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loadingMore ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
                {loadingMore ? "Loading…" : "Load More Events"}
              </button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Events;
