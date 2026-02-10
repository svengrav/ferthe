import { useState } from "react";

interface FeedbackFormProps {
  onClose: () => void;
}

type FeedbackType = "bug" | "feature" | "other";

const INPUT_STYLE =
  "w-full p-3 rounded-md border border-surface-divider text-white text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-primary/10";

export function FeedbackForm({ onClose }: FeedbackFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<FeedbackType>("other");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!message.trim()) {
      setErrorMessage("Message is required");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          type,
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setStatus("success");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit feedback",
      );
    }
  };

  return (
    <div className="bg-surface rounded-xl p-6 max-w-125 w-[90vw] mx-auto shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Feedback
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="bg-transparent border-none text-2xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {status === "success"
        ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✓</div>
            <p className="text-lg">Danke für dein Feedback!</p>
          </div>
        )
        : (
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="mb-1 flex gap-2">
                Name
                <span className="text-gray-600 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT_STYLE}
                placeholder="Dein Name"
                disabled={status === "submitting"}
              />
            </div>

            <div className="mb-5">
              <label className="mb-1 flex gap-2">
                Email
                <span className="text-gray-600 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_STYLE}
                placeholder="deine@email.com"
                disabled={status === "submitting"}
              />
            </div>

            <div className="mb-5">
              <label className="block mb-1">
                Typ
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FeedbackType)}
                className={`${INPUT_STYLE} cursor-pointer`}
                disabled={status === "submitting"}
              >
                <option value="other">Allgemeines Feedback</option>
                <option value="bug">Fehlerbericht</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block mb-1">
                Deine Nachricht <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${INPUT_STYLE} min-h-30 resize-y`}
                placeholder="Erzähle uns, was du denkst..."
                disabled={status === "submitting"}
                required
              />
            </div>

            {errorMessage && (
              <div className="text-red-400 mb-4 text-sm">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className={`w-full p-3 rounded-md border-none text-onprimary text-base font-bold transition-colors ${
                status === "submitting"
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-primary"
              }`}
            >
              {status === "submitting" ? "Senden..." : "Feedback senden"}
            </button>
          </form>
        )}
    </div>
  );
}
