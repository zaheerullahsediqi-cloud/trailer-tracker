"use client";
import { useState } from "react";
import { FileDown } from "lucide-react";

export default function InventoryPdfButton() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function download() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/inventory/pdf", { cache: "no-store" });
      if (!response.ok) {
        let message = "Could not generate the inventory PDF. Please try again.";
        try {
          const body = await response.json();
          if (body.error) message = body.error;
        } catch {
          /* Non-JSON authentication/error response. */
        }
        throw new Error(message);
      }
      if (!response.headers.get("content-type")?.includes("application/pdf"))
        throw new Error("Please sign in again before downloading inventory.");
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download =
        response.headers
          .get("content-disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ||
        "Star_Link_Trailer_Inventory.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not generate the inventory PDF.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        className="btn-secondary"
        disabled={busy}
        onClick={download}
        title="Download all inventory categories, regardless of the current filters"
      >
        <FileDown size={16} />
        {busy ? "Generating PDF…" : "Download inventory PDF"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-danger mt-1 max-w-xs">
          {error}
        </p>
      )}
    </div>
  );
}
