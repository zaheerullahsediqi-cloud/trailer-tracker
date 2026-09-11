import Link from "next/link";
import { Truck, ArrowRight } from "lucide-react";

const statusBadge: Record<string, string> = {
  available: "badge-accent",
  maintenance: "badge-warning",
  out_of_service: "badge-danger",
  sold: "badge-neutral",
};
const statusLabel: Record<string, string> = {
  available: "Available",
  maintenance: "In Maintenance",
  out_of_service: "Out of Service",
  sold: "Sold",
};

export default function TrailerRow({ trailer }: { trailer: any }) {
  const rental = trailer.rental;
  const isRented = !!rental;
  const displayStatusBadge = isRented ? "badge-success" : statusBadge[trailer.status] || "badge-neutral";
  const displayStatusLabel = isRented ? "In Rental" : statusLabel[trailer.status] || trailer.status;

  return (
    <div className="card card-hover overflow-hidden">
      <div className="relative">
        {trailer.photoUrl ? (
          <img src={trailer.photoUrl} alt={trailer.vin} className="w-full aspect-[4/3] object-cover" />
        ) : (
          <div className="aspect-[4/3] bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Truck size={32} className="text-white/30" strokeWidth={1.5} />
          </div>
        )}
        <span className={`absolute top-3 right-3 ${displayStatusBadge}`}>{displayStatusLabel}</span>
      </div>
      <div className="p-4 space-y-2.5">
        <p className="text-lg font-bold text-primary dark:text-white">{trailer.unit_number || "Unassigned #"}</p>
        <div className="text-sm space-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-muted">VIN</span>
            <span className="plate text-xs">{trailer.vin}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">Current Renter</span>
            <span className="text-primary dark:text-slate-200 truncate">{rental?.renters?.name || "—"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">Trailer Type</span>
            <span className="text-primary dark:text-slate-200">{trailer.trailer_type || "—"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">Last Service</span>
            <span className="text-primary dark:text-slate-200">{trailer.last_service_date || "—"}</span>
          </div>
        </div>
        <Link
          href={`/trailers/${trailer.id}`}
          className="btn-secondary w-full text-sm mt-1 flex items-center justify-center gap-1.5"
        >
          View Trailer <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
