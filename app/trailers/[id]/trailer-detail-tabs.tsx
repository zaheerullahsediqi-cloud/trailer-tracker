"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateTrailer, deleteTrailer } from "../actions";
import TrailerPhotoUpload from "../trailer-photo-upload";
import TrailerDocuments from "../trailer-documents";
import {
  Truck,
  FileText,
  CreditCard,
  FolderOpen,
  Image as ImageIcon,
  ArrowRight,
  Flag,
  AlertCircle,
} from "lucide-react";

const statusLabel: Record<string, string> = {
  available: "Available",
  maintenance: "Maintenance",
  out_of_service: "Out of Service",
  sold: "Sold",
};
const statusBadge: Record<string, string> = {
  available: "badge-success",
  maintenance: "badge-warning",
  out_of_service: "badge-danger",
  sold: "badge-neutral",
};

const tabs = [
  { key: "overview", label: "Overview", icon: Truck },
  { key: "rentals", label: "Rentals", icon: FileText },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "documents", label: "Documents", icon: FolderOpen },
  { key: "photos", label: "Photos", icon: ImageIcon },
];

export default function TrailerDetailTabs({
  trailer,
  photoUrl,
  registrationUrl,
  insuranceUrl,
  rentals,
  payments,
  photos,
}: {
  trailer: any;
  photoUrl: string | null;
  registrationUrl: string | null;
  insuranceUrl: string | null;
  rentals: any[];
  payments: any[];
  photos: any[];
}) {
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const activeRental = rentals.find((r) => r.status === "active");
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className={activeRental ? "badge-accent" : statusBadge[trailer.status] || "badge-neutral"}>
            {activeRental ? "Rented" : statusLabel[trailer.status] || trailer.status}
          </span>
          <h1 className="page-title mt-2">{trailer.unit_number || trailer.vin}</h1>
          <p className="plate mt-0.5">{trailer.vin}</p>
        </div>
        <Link href="/trailers" className="btn-secondary text-sm">
          ← All trailers
        </Link>
      </div>

      <div className="card overflow-hidden">
        <TrailerPhotoUpload trailerId={trailer.id} photoUrl={photoUrl} photoPath={trailer.photo_url} />
      </div>

      <div className="flex gap-1 border-b border-border dark:border-slate-800 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-primary dark:hover:text-white"
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" &&
        (editing ? (
          <form
            action={async (formData) => {
              setSaving(true);
              await updateTrailer(trailer.id, formData);
              setSaving(false);
              setEditing(false);
              router.refresh();
            }}
            className="card p-5 grid sm:grid-cols-2 gap-3"
          >
            <div>
              <label className="label">Trailer #</label>
              <input name="unit_number" defaultValue={trailer.unit_number ?? ""} className="input" />
            </div>
            <div>
              <label className="label">VIN</label>
              <input name="vin" defaultValue={trailer.vin} required className="input plate" />
            </div>
            <div>
              <label className="label">Plate</label>
              <input name="plate" defaultValue={trailer.plate ?? ""} className="input" />
            </div>
            <div>
              <label className="label">Title #</label>
              <input name="title_number" defaultValue={trailer.title_number ?? ""} className="input" />
            </div>
            <div>
              <label className="label">Plate type</label>
              <input name="plate_type" defaultValue={trailer.plate_type ?? ""} className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" defaultValue={trailer.status ?? "available"} className="input">
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of service</option>
                <option value="sold">Sold (retain records)</option>
              </select>
            </div>
            <div>
              <label className="label">Make</label>
              <input name="make" defaultValue={trailer.make} required className="input" />
            </div>
            <div>
              <label className="label">Model</label>
              <input name="model" defaultValue={trailer.model} required className="input" />
            </div>
            <div>
              <label className="label">Year</label>
              <input name="year" type="number" defaultValue={trailer.year ?? ""} className="input" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="eyebrow">Specifications</p>
                <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>
                  Edit
                </button>
              </div>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-muted">Make/Model:</span> {trailer.year} {trailer.make} {trailer.model}</p>
                <p><span className="text-muted">Plate:</span> {trailer.plate || "—"}</p>
                <p><span className="text-muted">Title #:</span> {trailer.title_number || "—"}</p>
                <p><span className="text-muted">Plate type:</span> {trailer.plate_type || "—"}</p>
              </div>
            </div>
            <div className="card p-5">
              <p className="eyebrow mb-3">Current status</p>
              {activeRental ? (
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-muted">Renter:</span> {activeRental.renters?.name}</p>
                  <p><span className="text-muted">Since:</span> {activeRental.start_date}</p>
                  <p><span className="text-muted">Rate:</span> ${Number(activeRental.rate).toFixed(2)}</p>
                  <Link href={`/rentals/${activeRental.id}`} className="text-accent text-xs font-medium flex items-center gap-1 pt-1">
                    View rental <ArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted">No active rental.</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <button
                className="btn-danger text-xs"
                onClick={async () => {
                  if (confirm("Delete this trailer? This cannot be undone.")) {
                    try {
                      await deleteTrailer(trailer.id);
                      router.push("/trailers");
                    } catch (e: any) {
                      alert(e.message);
                    }
                  }
                }}
              >
                Delete trailer
              </button>
            </div>
          </div>
        ))}

      {tab === "rentals" && (
        <div className="card divide-y divide-border dark:divide-slate-800 overflow-hidden">
          {rentals.map((r: any) => (
            <Link
              key={r.id}
              href={`/rentals/${r.id}`}
              className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  r.status === "active" ? "bg-success/10 text-success" : "bg-slate-200 dark:bg-slate-700 text-muted"
                }`}
              >
                {r.status === "active" ? <Flag size={14} /> : <AlertCircle size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-primary dark:text-white">{r.renters?.name}</p>
                  <span className={r.status === "active" ? "badge-success" : "badge-neutral"}>{r.status}</span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {r.start_date} → {r.end_date || (r.status === "active" ? "ongoing" : "not recorded")}
                </p>
                {r.completion_note && <p className="text-xs text-muted mt-1 italic">{r.completion_note}</p>}
              </div>
              <p className="text-sm font-medium text-primary dark:text-white shrink-0">${Number(r.rate).toFixed(2)}</p>
            </Link>
          ))}
          {rentals.length === 0 && <p className="text-sm text-muted px-5 py-6">No rental history yet.</p>}
        </div>
      )}

      {tab === "payments" && (
        <div className="card p-5">
          <p className="text-2xl font-bold text-primary dark:text-white mb-4">${totalCollected.toFixed(2)} collected all-time</p>
          <div className="space-y-1.5">
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm border-b border-border dark:border-slate-800 last:border-0 py-2">
                <span>{p.rentals?.renters?.name ?? "—"}</span>
                <span className="text-muted">{p.method} — {p.payment_date}</span>
                <span className="font-medium text-success">${Number(p.amount).toFixed(2)}</span>
              </div>
            ))}
            {payments.length === 0 && <p className="text-sm text-muted">No payments recorded yet.</p>}
          </div>
        </div>
      )}

      {tab === "documents" && (
        <div className="space-y-4">
          <div className="card p-5">
            <p className="eyebrow mb-3">Trailer documents</p>
            <TrailerDocuments
              trailerId={trailer.id}
              registration={{ url: registrationUrl, filename: trailer.registration_filename, path: trailer.registration_url }}
              insurance={{ url: insuranceUrl, filename: trailer.insurance_filename, path: trailer.insurance_url }}
            />
          </div>
          <div className="card p-5">
            <p className="eyebrow mb-3">Signed contracts by rental</p>
            <div className="space-y-1.5">
              {rentals.filter((r) => r.contractUrl).map((r: any) => (
                <a key={r.id} href={r.contractUrl} target="_blank" className="flex items-center justify-between text-sm hover:text-accent py-1">
                  <span>{r.renters?.name} — {r.start_date}</span>
                  <span className="text-accent">{r.contract_filename || "View"}</span>
                </a>
              ))}
              {rentals.filter((r) => r.contractUrl).length === 0 && (
                <p className="text-sm text-muted">No contracts uploaded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "photos" && (
        <div className="card p-5">
          {photos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map((p: any) =>
                p.url ? (
                  <a key={p.id} href={p.url} target="_blank" className="relative">
                    <img
                      src={p.url}
                      alt={p.stage}
                      className="w-full aspect-square object-cover rounded-lg border border-border dark:border-slate-700"
                    />
                    <span className="absolute bottom-1 left-1 badge-neutral text-[10px]">{p.stage}</span>
                  </a>
                ) : null
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">
              No condition photos yet — these are uploaded from each rental's page during pickup and return.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
