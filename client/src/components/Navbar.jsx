import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  User,
  Calendar,
  Award,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import {
  isOrganizer,
  isVolunteer,
  getNavigationItems,
  getProfilePath,
  getUserRoleDisplayName,
} from "../utils/roleUtils";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [orgName, setOrgName] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { currentUser, logout } = useAuth();
  const isAuthenticated = !!currentUser;
  const userIsOrganizer = isOrganizer(currentUser);
  const userIsVolunteer = isVolunteer(currentUser);
  const navigationItems = getNavigationItems(currentUser);
  const profilePath = getProfilePath(currentUser);

  // If any nav item with query params fully matches the current URL, it takes priority.
  // Plain-path items that share the same base path will defer to it.
  const specificActiveItem = navigationItems.find((item) => {
    if (!item.path) return false;
    const [p, q] = item.path.split("?");
    if (!q) return false;
    const pathMatch = p === "/" ? location.pathname === "/" : location.pathname.startsWith(p);
    if (!pathMatch) return false;
    const itemParams = new URLSearchParams(q);
    const currentParams = new URLSearchParams(location.search);
    return [...itemParams.entries()].every(([k, v]) => currentParams.get(k) === v);
  });

  const scrollToTestimonials = () => {
    if (location.pathname === "/") {
      document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/", { state: { scrollToTestimonials: true } });
    }
  };

  // Fetch organization name for org users
  useEffect(() => {
    if (!userIsOrganizer || !currentUser) {
      setOrgName(null);
      return;
    }
    api
      .get("/organizations/my-profile")
      .then((res) => setOrgName(res.data?.organizationName || null))
      .catch(() => setOrgName(null));
  }, [currentUser?._id, userIsOrganizer]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showUserMenu && !e.target.closest("#user-menu-container")) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const displayName = userIsOrganizer
    ? (orgName || currentUser?.name || "Organization")
    : (currentUser?.name || "User");

  const avatarInitial = displayName[0]?.toUpperCase() ?? "U";

  return (
    <nav
      className={`fixed top-0 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 w-full ${
        scrolled ? "mt-2 px-4" : "mt-5 px-6"
      }`}
    >
      <div
        className={`w-full max-w-5xl mx-auto px-8 py-3 rounded-2xl backdrop-blur-lg transition-all duration-300 ${
          scrolled
            ? "bg-white/95 shadow-lg border border-cyan-100"
            : "bg-white/85 shadow-md border border-white/60"
        }`}
      >
        <div className="flex items-center justify-between gap-4 min-w-0">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group cursor-pointer flex-shrink-0"
          >
            <img
              src="/shore-clean-logo.png"
              alt="ShoreClean"
              className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent whitespace-nowrap">
              ShoreClean
            </span>
          </Link>

          {/* Desktop Nav Items — centred */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            {isAuthenticated
              ? navigationItems.map((item) => {
                  const [itemPathname, itemQuery] = (item.path || "").split("?");
                  const isActive = (() => {
                    if (!item.path) return false;
                    const pathMatch =
                      itemPathname === "/"
                        ? location.pathname === "/"
                        : location.pathname.startsWith(itemPathname);
                    if (!pathMatch) return false;
                    // If the nav item carries query params, those must also match
                    // (prevents "/events" and "/events?organizer=x" both being active)
                    if (itemQuery) {
                      const itemParams = new URLSearchParams(itemQuery);
                      const currentParams = new URLSearchParams(location.search);
                      return [...itemParams.entries()].every(
                        ([k, v]) => currentParams.get(k) === v
                      );
                    }
                    // Plain path item — defer if a query-specific sibling already matched
                    if (specificActiveItem) {
                      const [specificBase] = specificActiveItem.path.split("?");
                      if (itemPathname === specificBase) return false;
                    }
                    return true;
                  })();
                  return item.onClick ? (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (item.onClick === "scrollToTestimonials")
                          scrollToTestimonials();
                      }}
                      className="px-4 py-2 rounded-xl text-[0.9rem] text-gray-700 hover:text-cyan-600 hover:bg-cyan-50 transition-all duration-300 font-medium relative group whitespace-nowrap"
                    >
                      {item.name}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-cyan-500 group-hover:w-3/4 transition-all duration-300" />
                    </button>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`px-4 py-2 rounded-xl text-[0.9rem] font-medium relative group whitespace-nowrap transition-all duration-300 ${
                        isActive
                          ? "text-cyan-600 bg-cyan-50"
                          : "text-gray-700 hover:text-cyan-600 hover:bg-cyan-50"
                      }`}
                    >
                      {item.name}
                      <div
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-cyan-500 transition-all duration-300 ${
                          isActive ? "w-3/4" : "w-0 group-hover:w-3/4"
                        }`}
                      />
                    </Link>
                  );
                })
              : [
                  { name: "About", path: "/about" },
                  { name: "Impact", path: "/impact" },
                ].map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="px-4 py-2 rounded-xl text-[0.9rem] text-gray-700 hover:text-cyan-600 hover:bg-cyan-50 transition-all duration-300 font-medium relative group whitespace-nowrap"
                  >
                    {item.name}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-cyan-500 group-hover:w-3/4 transition-all duration-300" />
                  </Link>
                ))}
          </div>

          {/* Desktop: account menu (single control — avatar + name + role) */}
          <div className="hidden md:flex items-center gap-2 min-w-0 shrink">
            {isAuthenticated ? (
              <div className="relative" id="user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-cyan-50 transition-all duration-300"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {avatarInitial}
                  </div>

                  {/* Name block */}
                  <div className="flex flex-col items-start leading-tight max-w-[120px]">
                    <span className="text-gray-800 font-semibold text-sm truncate w-full">
                      {displayName}
                    </span>
                    <span className="text-xs text-cyan-600 font-medium">
                      {getUserRoleDisplayName(currentUser)}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                    </div>
                    <Link
                      to={profilePath}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4 shrink-0" />
                      Profile
                    </Link>

                    {userIsVolunteer && (
                      <>
                        <Link
                          to="/volunteer/my-events"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Calendar className="h-4 w-4 shrink-0" />
                          My Events
                        </Link>
                        <Link
                          to="/volunteer/certificates"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Award className="h-4 w-4 shrink-0" />
                          Certificates
                        </Link>
                      </>
                    )}

                    {userIsOrganizer && (
                      <Link
                        to="/admin/create-event"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Calendar className="h-4 w-4 shrink-0" />
                        Create Event
                      </Link>
                    )}

                    <div className="border-t border-gray-100 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        navigate("/login", { replace: true });
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-gray-600 hover:text-cyan-600 font-medium transition-colors duration-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm rounded-xl hover:from-cyan-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                >
                  Join Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-cyan-50 transition-colors duration-300 ml-auto"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 text-gray-700" />
            ) : (
              <Menu className="h-5 w-5 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-cyan-100">
            <div className="flex flex-col gap-1">
              {isAuthenticated ? (
                <>
                  {navigationItems.map((item) => {
                    const [itemPathname, itemQuery] = (item.path || "").split("?");
                    const active = (() => {
                      if (!item.path) return false;
                      const pathMatch =
                        itemPathname === "/"
                          ? location.pathname === "/"
                          : location.pathname.startsWith(itemPathname);
                      if (!pathMatch) return false;
                      if (itemQuery) {
                        const itemParams = new URLSearchParams(itemQuery);
                        const currentParams = new URLSearchParams(location.search);
                        return [...itemParams.entries()].every(
                          ([k, v]) => currentParams.get(k) === v
                        );
                      }
                      // Plain path item — defer if a query-specific sibling already matched
                      if (specificActiveItem) {
                        const [specificBase] = specificActiveItem.path.split("?");
                        if (itemPathname === specificBase) return false;
                      }
                      return true;
                    })();
                    return item.onClick ? (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (item.onClick === "scrollToTestimonials") {
                            scrollToTestimonials();
                          }
                        }}
                        className="px-4 py-2 rounded-lg text-gray-700 hover:text-cyan-600 hover:bg-cyan-50 transition-all duration-300 text-left w-full font-medium"
                      >
                        {item.name}
                      </button>
                    ) : (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                          active
                            ? "text-cyan-600 bg-cyan-50"
                            : "text-gray-700 hover:text-cyan-600 hover:bg-cyan-50"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    );
                  })}

                  {userIsVolunteer && (
                    <Link
                      to="/volunteer/certificates"
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-cyan-50 hover:text-cyan-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Certificates
                    </Link>
                  )}

                  {userIsOrganizer && (
                    <Link
                      to="/admin/create-event"
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-cyan-50 hover:text-cyan-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Create Event
                    </Link>
                  )}

                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link
                      to={profilePath}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                        navigate("/login", { replace: true });
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {[
                    { name: "Home", path: "/" },
                    { name: "Events", path: "/events" },
                    { name: "Map", path: "/map" },
                    { name: "About", path: "/about" },
                  ].map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1 flex flex-col gap-1">
                    <Link
                      to="/login"
                      className="px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm rounded-lg text-center font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Join Now
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
