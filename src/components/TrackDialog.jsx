import { forwardRef, useImperativeHandle, useRef } from "react";

const TrackDialog = forwardRef(function TrackDialog(
  { title = "Enter value", placeholder = "", onSubmit },
  ref
) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open() {
      if (inputRef.current) inputRef.current.value = "";
      dialogRef.current.showModal();
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    close() {
      dialogRef.current.close();
    }
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = inputRef.current.value.trim().toUpperCase();
    try {
      if (value) onSubmit(value);
    } finally {
      dialogRef.current.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg p-6 shadow-xl backdrop:bg-black/40 m-auto w-[90%] max-w-md"      
    >
      <form method="dialog" onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-bold">{title}</h3>

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="border p-2 w-full rounded"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current.close()}
            className="px-3 py-1 rounded bg-gray-300"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-3 py-1 rounded bg-blue-600 text-white"
          >
            OK
          </button>
        </div>
      </form>
    </dialog>
  );
});

export default TrackDialog;