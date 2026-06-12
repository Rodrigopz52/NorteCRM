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
    success: "bg-white/95 border-green-500/30 text-gray-800 shadow-green-500/10",
    error: "bg-white/95 border-red-500/30 text-gray-800 shadow-red-500/10",
    warning: "bg-white/95 border-yellow-500/30 text-gray-800 shadow-yellow-500/10",
    info: "bg-white/95 border-blue-500/30 text-gray-800 shadow-blue-500/10"
  };

  const icons = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-500 drop-shadow-sm" />,
    error: <XCircleIcon className="w-6 h-6 text-red-500 drop-shadow-sm" />,
    warning: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 drop-shadow-sm" />,
    info: <InformationCircleIcon className="w-6 h-6 text-blue-500 drop-shadow-sm" />
  };

  return (
    <div className={`fixed bottom-6 right-6 sm:top-6 sm:bottom-auto sm:right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${styles[type]} animate-slide-in-right max-w-sm w-full sm:w-auto`}>
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug text-gray-900">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors focus:outline-none"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}
