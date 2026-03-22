import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Waves, LogOut, User, Settings, Calendar, Award } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  isOrganizer,
  isVolunteer,
  getNavigationItems,
  getProfilePath,
} from "../utils/roleUtils";

/**
 * Main navigation component for ShoreClean
 * Provides responsive navigation with role-based menu items
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { currentUser, logout } = useAuth();
  const isAuthenticated = !!currentUser;
  const userIsOrganizer = isOrganizer(currentUser);
  const userIsVolunteer = isVolunteer(currentUser);
  const navigationItems = getNavigationItems(currentUser);
  const profilePath = getProfilePath(currentUser);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTestimonials = () => {
    // If we're not on the home page, navigate to home first
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollToTestimonials: true } });
      return;
    }

    // If we're on home page, scroll to testimonials
    const testimonialsSection = document.getElementById("testimonials");
    if (testimonialsSection) {
      testimonialsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        scrolled ? "mt-2" : "mt-6"
      }`}
    >
      <div
        className={`w-screen max-w-5xl mx-auto px-8 py-3 rounded-2xl backdrop-blur-lg transition-all duration-300 ${
          scrolled
            ? "bg-white/90 shadow-lg border border-cyan-100"
            : "bg-white/80 shadow-md border border-cyan-50"
        }`}
      >
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group cursor-pointer flex-shrink-0"
          >
            <div className="relative">
              <Waves className="h-7 w-7 text-cyan-600 group-hover:text-cyan-700 transition-colors duration-300" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent whitespace-nowrap">
              ShoreClean
            </span>
          </Link>

          {/* Desktop Nav Items — centred */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            {isAuthenticated
              ? navigationItems.map((item) => {
                  const itemPathname = item.path?.split("?")[0];
                  const isActive =
                    item.path &&
                    (itemPathname === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(itemPathname));
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

          {/* Desktop right — user menu OR sign-in buttons */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-cyan-50 transition-all duration-300"
                >
                  <User className="w-7 h-7 text-cyan-600" />
                  <span className="text-gray-700 text-[0.9rem] font-medium whitespace-nowrap">
                    {currentUser?.name || "User"}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      to={profilePath}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-cyan-50 transition-colors text-sm"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </Link>

                    {userIsVolunteer && (
                      <>
                        <Link
                          to="/volunteer/my-events"
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-cyan-50 transition-colors text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Calendar className="h-4 w-4 mr-3" />
                          My Events
                        </Link>
                        <Link
                          to="/volunteer/certificates"
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-cyan-50 transition-colors text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Award className="h-4 w-4 mr-3" />
                          Certificates
                        </Link>
                      </>
                    )}

                    {userIsOrganizer && (
                      <Link
                        to="/admin/create-event"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-cyan-50 transition-colors text-sm"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Calendar className="h-4 w-4 mr-3" />
                        Create Event
                      </Link>
                    )}

                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        navigate("/login", { replace: true });
                      }}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-gray-700 hover:text-cyan-600 transition-colors font-medium whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm rounded-xl hover:from-cyan-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md font-medium whitespace-nowrap"
                >
                  Join Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-cyan-50 transition-colors duration-300"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-cyan-100">
            <div className="flex flex-col space-y-2">
              {isAuthenticated ? (
                <>
                  {[
                    ...navigationItems,
                    { name: "Profile", path: profilePath },
                  ].map((item) => {
                    const itemPathname = item.path?.split("?")[0];
                    const isActive = item.path && (
                      itemPathname === "/"
                        ? location.pathname === "/"
                        : location.pathname.startsWith(itemPathname)
                    );
                    return item.onClick === "scrollToTestimonials" ? (
                      <button
                        key={item.name}
                        onClick={() => {
                          setIsMenuOpen(false);
                          scrollToTestimonials();
                        }}
                        className="px-4 py-2 rounded-lg text-gray-700 hover:text-cyan-600 hover:bg-cyan-50 transition-all duration-300 text-left w-full"
                      >
                        {item.name}
                      </button>
                    ) : (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                          isActive
                            ? "text-cyan-600 bg-cyan-50"
                            : "text-gray-700 hover:text-cyan-600 hover:bg-cyan-50"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    );
                  })}

                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                      navigate("/login", { replace: true });
                    }}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 mx-4 text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  {[
                    { name: "About", path: "/about" },
                    { name: "Impact", path: "/impact" },
                  ].map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="px-4 py-2 rounded-lg text-gray-700 hover:text-cyan-600 hover:bg-cyan-50 transition-all duration-300"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-gray-700 hover:text-cyan-600 hover:bg-cyan-50 transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="mt-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 mx-4 text-center block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Join Now
                  </Link>
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
