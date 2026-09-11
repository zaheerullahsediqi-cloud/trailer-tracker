import Link from "next/link";
import { Truck, ArrowRight } from "lucide-react";

const statusBadge: Record<string, string> = {
  available: "badge-success",
  maintenance: "badge-warning",
  out_of_service: "badge-danger",
  sold: "badge-neutral",
};
const statusLabel: Record<string, string> = {
  available: "Available",
  maintenance: "Maintenance",
  out_of_service: "Out of Service",
  sold: "Sold",
};

export default function TrailerRow({ trailer }: { trailer: any }) {
  const rental = trailer.rental;
  const isRented = !!rental;
  const displayStatusBadge = isRented ? "badge-accent" : statusBadge[trailer.status] || "badge-neutral";
  const displayStatusLabel = isRented ? "Rented" : statusLabel[trailer.status] || trailer.status;

  return (
    <Link href={`/trailers/${trailer.id}`} className="card card-hover overflow-hidden block">
      {trailer.photoUrl ? (
        <img src={trailer.photoUrl} alt={trailer.vin} className="w-full aspect-[4/3] object-cover" />
      ) : (
        <div className="aspect-[4/3] bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Truck size={32} className="text-white/30" strokeWidth={1.5} />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary dark:text-white truncate">
              {trailer.unit_number || "Unassigned #"}
            </p>
            <p className="plate">{trailer.vin}</p>
          </div>
          <span className={displayStatusBadge}>{displayStatusLabel}</span>
        </div>
        <p className="text-xs text-secondary dark:text-slate-400">
          {trailer.year} {trailer.make} {trailer.model}
        </p>
        {isRented ? (
          <div className="text-xs text-muted space-y-0.5 pt-1">
            <p>Renter: {rental.renters?.name}</p>
            <p>Rental since: {rental.start_date}</p>
          </div>
        ) : (
          <p className="text-xs text-muted pt-1">No active rental</p>
        )}
        <p className="text-xs text-accent font-medium flex items-center gap-1 pt-1">
          View trailer <ArrowRight size={12} />
        </p>
      </div>
    </Link>
  );
}
