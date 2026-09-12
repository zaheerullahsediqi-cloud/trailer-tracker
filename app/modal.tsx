"use client";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 animate-in" onClick={onClose} />
      <div
        className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-elevated w-full ${
          wide ? "max-w-3xl" : "max-w-lg"
        } max-h-[90vh] flex flex-col animate-in`}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-2 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-primary dark:text-white">{title}</h2>
            {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-muted hover:text-primary dark:hover:text-white shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border dark:border-slate-800 shrink-0">
          {footer}
        </div>
      </div>
    </div>
  );
}
