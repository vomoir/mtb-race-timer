import { forwardRef, useImperativeHandle, useRef } from "react";

const TrackDialog = forwardRef(function TrackDialog(
  { title = "Enter value", placeholder = "", onSubmit },
  ref
) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open(initialValue = "") {
      if (inputRef.current) inputRef.current.value = initialValue;
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

        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={() => dialogRef.current.close()}
            className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-8 py-2 rounded bg-blue-600 text-white font-bold"
          >
            OK
          </button>
        </div>
      </form>
    </dialog>
  );
});

export default TrackDialog;