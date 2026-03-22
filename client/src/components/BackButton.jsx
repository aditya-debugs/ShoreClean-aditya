import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Consistent "Go Home" button used across all pages.
 * Always navigates to the home screen ("/").
 */
const BackButton = ({ className = "" }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/")}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition-all duration-200 font-medium text-sm shadow-sm ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Go Home
    </button>
  );
};

export default BackButton;
