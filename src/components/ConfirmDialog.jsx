import { forwardRef, useImperativeHandle, useRef, useState } from "react";

const ConfirmDialog = forwardRef(function ConfirmDialog(
  { title = "Confirm Action", message = "Are you sure?", confirmLabel = "Yes", cancelLabel = "Cancel" },
  ref
) {
  const dialogRef = useRef(null);
  const [config, setConfig] = useState({});

  useImperativeHandle(ref, () => ({
    open(options = {}) {
      setConfig(options);
      dialogRef.current.showModal();
    },
    close() {
      dialogRef.current.close();
    }
  }));

  const handleConfirm = () => {
    if (config.onConfirm) config.onConfirm();
    dialogRef.current.close();
  };

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg p-6 shadow-xl backdrop:bg-black/40 m-auto w-[90%] max-w-md"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === dialogRef.current) dialogRef.current.close();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target.tagName !== "BUTTON") {
          e.preventDefault();
          handleConfirm();
        }
      }}
    >
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">{config.title || title}</h3>
        <p className="text-slate-600">{config.message || message}</p>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => dialogRef.current.close()}
            className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-colors"
          >
            {cancelLabel}
          </button>

          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
});

export default ConfirmDialog;