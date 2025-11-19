import { useState } from "react";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const ToastContainer = () => (
    toast && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
      />
    )
  );

  return {
    showToast,
    ToastContainer,
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error"),
    warning: (msg) => showToast(msg, "warning"),
    info: (msg) => showToast(msg, "info")
  };
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    resolve: null
  });

  const showConfirm = ({ title, message, type = "danger" }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        type,
        resolve
      });
    });
  };

  const handleConfirm = () => {
    confirmState.resolve(true);
    setConfirmState({ ...confirmState, isOpen: false });
  };

  const handleCancel = () => {
    confirmState.resolve(false);
    setConfirmState({ ...confirmState, isOpen: false });
  };

  const ConfirmContainer = () => (
    <ConfirmModal
      isOpen={confirmState.isOpen}
      title={confirmState.title}
      message={confirmState.message}
      type={confirmState.type}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { showConfirm, ConfirmContainer };
}
