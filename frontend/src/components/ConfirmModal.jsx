import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = "Aceptar", 
  cancelText = "Cancelar",
  onConfirm, 
  onCancel,
  type = "danger" // "danger" o "warning"
}) {
  if (!isOpen) return null;

  const confirmStyles = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700"
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center backdrop-blur-sm z-[9998] p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 animate-scale-in">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            type === "danger" ? "bg-red-100" : "bg-yellow-100"
          }`}>
            <ExclamationTriangleIcon className={`w-6 h-6 ${
              type === "danger" ? "text-red-600" : "text-yellow-600"
            }`} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 text-sm whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 ${confirmStyles[type]} text-white px-4 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
