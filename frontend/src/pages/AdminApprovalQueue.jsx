import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDateTime, toDatetimeLocalValue, toDateInputValue } from "../lib/constants";
import { StatusBadge } from "../components/StatusBadge";
import { Check, X, MessageCircleWarning, Ban, ExternalLink } from "lucide-react";

const inputCls = "w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-lg px-2 py-1 text-xs text-zinc-100 focus:outline-none tabular-nums";

const saveDealField = async (dealId, field, value, current) => {
  if (value === current) return;
  await api.put(`/deals/${dealId}`, { [field]: value });
};

const ActionBar = ({ deal, onAction }) => {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const fire = async (action) => {
    if (action === "Needs More Info" && !comment.trim()) {
      setShowComment(true);
      return;
    }
    setBusy(true);
    try {
      await api.post(`/deals/${deal.deal_id}/review`, { action, comment: comment.trim() });
      setComment("");
      setShowComment(false);
      onAction?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          data-testid={`approve-${deal.deal_id}`}
          disabled={busy}
          onClick={() => fire("Approve")}
          className="inline-flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200"
        >
          <Check size={13} strokeWidth={2} /> Approve
        </button>
        <button
          data-testid={`needs-info-${deal.deal_id}`}
          disabled={busy}
          onClick={() => setShowComment(true)}
          className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200"
        >
          <MessageCircleWarning size={13} strokeWidth={1.5} /> Needs Info
        </button>
        <button
          data-testid={`reject-${deal.deal_id}`}
          disabled={busy}
          onClick={() => fire("Reject")}
          className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200"
        >
          <X size={13} strokeWidth={1.5} /> Reject
        </button>
        <button
          data-testid={`cancel-${deal.deal_id}`}
          disabled={busy}
          onClick={() => fire("Cancel")}
          className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200"
        >
          <Ban size={13} strokeWidth={1.5} /> Cancel
        </button>
      </div>
      {showComment && (
        <div className="space-y-2">
          <textarea
            data-testid={`comment-${deal.deal_id}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What information is missing?"
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-zinc-200 resize-none"
          />
          <div className="flex gap-2">
            <button
              data-testid={`submit-needs-info-${deal.deal_id}`}
              onClick={() => fire("Needs More Info")}
              disabled={busy || !comment.trim()}
              className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50 rounded-lg px-3 py-1.5 text-xs font-medium"
            >Send</button>
            <button onClick={() => { setShowComment(false); setComment(""); }} className="text-xs text-zinc-400 hover:text-white px-2">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminApprovalQueue = () => {
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/deals", { params: { admin_review_status: "Submitted" } });
    setBriefs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div data-testid="admin-approval-queue" className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Approval Queue</h1>
        <p className="text-sm text-zinc-500 mt-1">All briefs submitted by BD teams, awaiting your review.</p>
      </header>

      {loading && <div className="text-xs text-zinc-500">Loading…</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {briefs.map((d) => (
          <div key={d.deal_id} data-testid={`brief-card-${d.deal_id}`} className="bg-[#121212] border border-zinc-800/80 rounded-xl p-5 card-hover">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{d.submitted_by_team?.team_name || "Team"}</div>
                <h3 className="text-lg font-semibold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>{d.brand_name}</h3>
                <div className="text-xs text-zinc-500 mt-0.5">via {d.agency_or_client_name} · {d.submitted_by_user?.name}</div>
              </div>
              <StatusBadge status={d.admin_review_status} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div>
                <div className="text-zinc-500">Price</div>
                <input
                  data-testid={`price-${d.deal_id}`}
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={d.price_closed_at ?? ""}
                  onBlur={async (e) => {
                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                    await saveDealField(d.deal_id, "price_closed_at", val, d.price_closed_at);
                    load();
                  }}
                  className={inputCls + " mt-1 font-medium"}
                />
              </div>
              <div>
                <div className="text-zinc-500">Go-live</div>
                <input
                  data-testid={`go-live-${d.deal_id}`}
                  type="datetime-local"
                  defaultValue={toDatetimeLocalValue(d.go_live_date_time)}
                  onBlur={async (e) => {
                    if (!e.target.value) return;
                    const iso = new Date(e.target.value).toISOString();
                    await saveDealField(d.deal_id, "go_live_date_time", iso, d.go_live_date_time);
                    load();
                  }}
                  className={inputCls + " mt-1"}
                />
              </div>
              <div>
                <div className="text-zinc-500">Payment due</div>
                <input
                  data-testid={`payment-due-${d.deal_id}`}
                  type="date"
                  defaultValue={toDateInputValue(d.payment_due_date)}
                  onBlur={async (e) => {
                    if (!e.target.value) return;
                    const iso = new Date(e.target.value).toISOString();
                    await saveDealField(d.deal_id, "payment_due_date", iso, d.payment_due_date);
                    load();
                  }}
                  className={inputCls + " mt-1"}
                />
              </div>
              <div>
                <div className="text-zinc-500">Submitted</div>
                <div className="text-zinc-200 mt-1">{formatDateTime(d.created_at)}</div>
              </div>
            </div>

            {d.brief_text && (
              <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-lg p-3 text-xs text-zinc-300 mb-3 leading-relaxed">
                {d.brief_text}
              </div>
            )}
            {d.brief_link && (
              <a href={d.brief_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-3">
                <ExternalLink size={12} strokeWidth={1.5}/> Brief link
              </a>
            )}

            <ActionBar deal={d} onAction={load} />
          </div>
        ))}
        {!loading && !briefs.length && (
          <div className="col-span-full text-center py-16 border border-dashed border-zinc-800 rounded-xl">
            <div className="text-sm text-zinc-400">No briefs waiting.</div>
            <div className="text-xs text-zinc-600 mt-1">All caught up.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovalQueue;
