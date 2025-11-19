import { useEffect } from "react";
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };

  const icons = {
    success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
    error: <XCircleIcon className="w-5 h-5 text-red-500" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />,
    info: <InformationCircleIcon className="w-5 h-5 text-blue-500" />
  };

  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-2 ${styles[type]} animate-slide-in-right`}>
      {icons[type]}
      <p className="font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
