import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatCurrency, formatDate, formatDateTime } from "../lib/constants";
import { StatusBadge } from "../components/StatusBadge";
import { TrendingUp, FileText, CheckCircle2, AlertCircle, Eye, Wallet, Plus } from "lucide-react";

const Stat = ({ icon: Icon, label, value, accent, testId }) => (
  <div data-testid={testId} className="bg-[#121212] border border-zinc-800/80 rounded-xl p-5">
    <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 grid place-items-center mb-3">
      <Icon size={16} strokeWidth={1.5} className={accent || "text-zinc-400"} />
    </div>
    <div className="text-2xl font-semibold tracking-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
    <div className="text-xs text-zinc-500 mt-1">{label}</div>
  </div>
);

export const BDDashboard = () => {
  const { team } = useAuth();
  const [data, setData] = useState(null);
  const [deals, setDeals] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const now = new Date();
    const from_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const to_date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const [{ data: rep }, { data: dlist }] = await Promise.all([
      api.get("/reports/overview", { params: { from_date, to_date } }),
      api.get("/deals"),
    ]);
    setData(rep);
    setDeals(dlist);
  };

  useEffect(() => { load(); }, []);

  const filtered = deals.filter((d) => {
    if (filter === "all") return true;
    if (filter === "submitted") return d.admin_review_status === "Submitted";
    if (filter === "approved") return d.admin_review_status === "Approved" && d.deal_status !== "Completed";
    if (filter === "completed") return d.deal_status === "Completed";
    if (filter === "needs_info") return d.admin_review_status === "Needs More Info";
    return true;
  });

  if (!data) return <div className="text-zinc-500 text-sm">Loading…</div>;

  return (
    <div data-testid="bd-dashboard" className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>{team?.team_name || "Your team"}</h1>
          <p className="text-sm text-zinc-500 mt-1">Your team&apos;s briefs, deals and revenue — this month.</p>
        </div>
        <Link to="/submit" data-testid="bd-new-brief" className="inline-flex items-center gap-2 bg-white text-black hover:bg-zinc-200 rounded-lg px-5 py-3 text-sm font-semibold transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          <Plus size={16} strokeWidth={2.25} /> Submit New Brief
        </Link>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat testId="bd-stat-revenue" icon={TrendingUp} label="Team revenue closed" value={formatCurrency(data.revenue_closed)} accent="text-emerald-400" />
        <Stat testId="bd-stat-submitted" icon={FileText} label="Briefs submitted" value={(data.deals_approved + data.deals_submitted_pending + data.deals_needs_info)} />
        <Stat testId="bd-stat-approved" icon={CheckCircle2} label="Briefs approved" value={data.deals_approved} accent="text-emerald-400" />
        <Stat testId="bd-stat-completed" icon={CheckCircle2} label="Deals completed" value={data.deals_completed} />
        <Stat testId="bd-stat-needs-info" icon={AlertCircle} label="Needing more info" value={data.deals_needs_info} accent="text-amber-400" />
        <Stat testId="bd-stat-payment" icon={Wallet} label="Payments pending" value={data.payment_pending_count} accent="text-amber-400" />
        <Stat testId="bd-stat-views" icon={Eye} label="Total views" value={Number(data.total_views).toLocaleString("en-IN")} />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {[
            ["all", "All"], ["submitted", "Submitted"], ["needs_info", "Needs Info"],
            ["approved", "Active"], ["completed", "Completed"],
          ].map(([key, label]) => (
            <button
              key={key}
              data-testid={`bd-filter-${key}`}
              onClick={() => setFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                filter === key ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >{label}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <Link
              to={`/deals/${d.deal_id}`}
              key={d.deal_id}
              data-testid={`bd-deal-card-${d.deal_id}`}
              className="bg-[#121212] border border-zinc-800/80 rounded-xl p-5 card-hover block"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">{d.agency_or_client_name}</div>
                  <div className="text-lg font-semibold text-white tracking-tight truncate" style={{ fontFamily: "'Outfit', sans-serif" }}>{d.brand_name}</div>
                </div>
                <StatusBadge status={d.admin_review_status === "Approved" ? (d.deal_status || "Accepted") : d.admin_review_status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-zinc-500">Price</div>
                  <div className="text-white tabular-nums font-medium">{formatCurrency(d.price_closed_at)}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Go-live</div>
                  <div className="text-zinc-200">{formatDate(d.go_live_date_time)}</div>
                </div>
              </div>
              {d.needs_more_info_comment && (
                <div className="mt-3 text-[11px] status-warning border rounded-md px-2 py-1.5">
                  <span className="font-medium">Admin:</span> {d.needs_more_info_comment}
                </div>
              )}
            </Link>
          ))}
          {!filtered.length && (
            <div className="col-span-full text-center py-16 border border-dashed border-zinc-800 rounded-xl">
              <div className="text-sm text-zinc-300 mb-1">No briefs in this view yet.</div>
              <div className="text-xs text-zinc-500 mb-5">Briefs you submit will land here and route to admin for approval.</div>
              <Link to="/submit" data-testid="bd-empty-state-submit" className="inline-flex items-center gap-2 bg-white text-black hover:bg-zinc-200 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors">
                <Plus size={14} strokeWidth={2.25} /> Submit your first brief
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BDDashboard;

