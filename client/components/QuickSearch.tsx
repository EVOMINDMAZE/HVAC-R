import React, { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog"; // if dialog exists; otherwise simple modal
import { useNavigate } from "react-router-dom";

export function QuickSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    // simple heuristics: map keywords to routes
    const q = query.toLowerCase();
    if (q.includes("dash")) navigate('/dashboard');
    else if (q.includes('history')) navigate('/history');
    else if (q.includes('trouble')) navigate('/troubleshooting');
    else if (q.includes('standard')) navigate('/standard-cycle');
    else if (q.includes('compare') || q.includes('refrigerant')) navigate('/refrigerant-comparison');
    else navigate('/dashboard');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div className="w-full max-w-xl mx-4">
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-4">
          <div className="flex items-center gap-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search (try: dashboard, history, troubleshooting)"
              className="w-full border border-input rounded-md px-4 py-3"
            />
            <button type="button" onClick={onClose} className="text-sm text-gray-500">Close</button>
          </div>
        </form>
      </div>
    </div>
  );
}
