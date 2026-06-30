import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatCurrency, formatDate, formatDateTime, monthRange, statusColor } from "../lib/constants";
import { StatusBadge } from "../components/StatusBadge";
import { ArrowUpRight, TrendingUp, Clock, CheckCircle2, AlertCircle, Eye, Ban, Wallet, Plus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const formatChartDate = (iso) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const RevenueChart = ({ data }) => {
  if (!data?.length) {
    return <div className="text-xs text-zinc-500 py-12 text-center">No approved revenue in this date range.</div>;
  }
  const hasRevenue = data.some((d) => d.revenue > 0);
  if (!hasRevenue) {
    return <div className="text-xs text-zinc-500 py-12 text-center">No revenue recorded in this period yet.</div>;
  }

  return (
    <div data-testid="revenue-over-time-chart" className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatChartDate}
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(v) => (v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
            labelFormatter={formatChartDate}
            formatter={(value, name) => [
              name === "revenue" ? formatCurrency(value) : value,
              name === "revenue" ? "Revenue" : "Deals",
            ]}
          />
          <Area type="monotone" dataKey="revenue" stroke="#ffffff" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#fff" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, hint, testId, accent }) => (
  <div
    data-testid={testId}
    className="bg-[#121212] border border-zinc-800/80 rounded-xl p-5 card-hover"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 grid place-items-center">
        <Icon size={16} strokeWidth={1.5} className={accent || "text-zinc-400"} />
      </div>
    </div>
    <div className="text-2xl font-semibold tracking-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
    <div className="text-xs text-zinc-500 mt-1">{label}</div>
    {hint && <div className="text-[11px] text-zinc-600 mt-2">{hint}</div>}
  </div>
);

export const AdminOverview = () => {
  const [data, setData] = useState(null);
  const [pendingBriefs, setPendingBriefs] = useState([]);
  const [activeDeals, setActiveDeals] = useState([]);
  const [range, setRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0,10);
    return { from: start, to: end };
  });

  const load = async () => {
    const params = { from_date: range.from, to_date: range.to + "T23:59:59" };
    const [{ data: rep }, { data: pend }, { data: active }] = await Promise.all([
      api.get("/reports/overview", { params }),
      api.get("/deals", { params: { admin_review_status: "Submitted" } }),
      api.get("/deals", { params: { admin_review_status: "Approved" } }),
    ]);
    setData(rep);
    setPendingBriefs(pend.slice(0, 5));
    setActiveDeals(active.filter(d => d.deal_status !== "Completed").slice(0, 6));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [range.from, range.to]);

  // Re-fetch when the user returns to this tab/window so edits made on the
  // Deals page show up without a manual reload.
  useEffect(() => {
    const refresh = () => { if (!document.hidden) load(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
    /* eslint-disable-next-line */
  }, [range.from, range.to]);

  if (!data) return <div className="text-zinc-500 text-sm">Loading…</div>;

  return (
    <div data-testid="admin-overview" className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">Revenue, approvals, fulfillment and payments — at a glance.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={range.from}
            data-testid="date-from"
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
          />
          <span className="text-zinc-600">→</span>
          <input
            type="date"
            value={range.to}
            data-testid="date-to"
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
          />
          <Link
            to="/submit"
            data-testid="admin-create-brief"
            className="ml-2 inline-flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
          >
            <Plus size={13} strokeWidth={2.25} /> Create Brief
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard testId="stat-revenue" icon={TrendingUp} label="Revenue closed" value={formatCurrency(data.revenue_closed)} accent="text-emerald-400" />
        <StatCard testId="stat-deals-approved" icon={CheckCircle2} label="Deals approved" value={data.deals_approved} />
        <StatCard testId="stat-pending" icon={Clock} label="Briefs pending approval" value={data.deals_submitted_pending} accent="text-amber-400" />
        <StatCard testId="stat-payment-pending" icon={Wallet} label="Payments pending" value={data.payment_pending_count} accent="text-amber-400" />
        <StatCard testId="stat-completed" icon={CheckCircle2} label="Deals completed" value={data.deals_completed} />
        <StatCard testId="stat-views" icon={Eye} label="Total views" value={Number(data.total_views).toLocaleString("en-IN")} />
        <StatCard testId="stat-blocked" icon={Ban} label="Blocked deliverables" value={data.blocked_deliverables} accent="text-rose-400" />
        <StatCard testId="stat-needs-info" icon={AlertCircle} label="Needs more info" value={data.deals_needs_info} accent="text-amber-400" />
      </section>

      <section className="bg-[#121212] border border-zinc-800/80 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Revenue over time</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Approved deal revenue by approval date</p>
          </div>
          <span className="text-[11px] text-zinc-500 tabular-nums">
            {formatCurrency((data.revenue_over_time || []).reduce((s, d) => s + (d.revenue || 0), 0))} in range
          </span>
        </div>
        <RevenueChart data={data.revenue_over_time || []} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#121212] border border-zinc-800/80 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Revenue by team</h2>
            <span className="text-[11px] text-zinc-500">{data.team_revenue.length} teams</span>
          </div>
          <div className="space-y-3">
            {data.team_revenue.map((t) => {
              const max = Math.max(...data.team_revenue.map(x => x.revenue), 1);
              const pct = (t.revenue / max) * 100;
              return (
                <div key={t.team_id} data-testid={`team-rev-${t.team_name}`}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-300">{t.team_name}</span>
                    <span className="text-zinc-400 tabular-nums">{formatCurrency(t.revenue)} · {t.deals} deals</span>
                  </div>
                  <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-white/80 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {!data.team_revenue.length && <div className="text-xs text-zinc-500">No approved deals yet.</div>}
          </div>
        </div>

        <div className="bg-[#121212] border border-zinc-800/80 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Views by team</h2>
          <div className="space-y-3">
            {data.team_views.map((t) => (
              <div key={t.team_name} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{t.team_name}</span>
                <span className="text-zinc-400 tabular-nums">{Number(t.views).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(data.team_payments?.length > 0) && (
        <section className="bg-[#121212] border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Payments by team</h2>
            <Link to="/admin/teams" className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1">
              Teamwise deals <ArrowUpRight size={12} strokeWidth={1.5}/>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800/60">
                  <th className="pb-2 pr-4">Team</th>
                  <th className="pb-2 pr-4 text-right">Revenue</th>
                  <th className="pb-2 pr-4 text-right">Pending</th>
                  <th className="pb-2 pr-4 text-right">Outstanding</th>
                  <th className="pb-2 text-right">Paid</th>
                </tr>
              </thead>
              <tbody>
                {data.team_payments.map((t) => (
                  <tr key={t.team_id} data-testid={`team-payment-${t.team_id}`} className="border-t border-zinc-800/40">
                    <td className="py-2.5 pr-4 text-zinc-200">{t.team_name}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-300">{formatCurrency(t.revenue)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-amber-400">{t.payment_pending_count}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-400">{formatCurrency(t.payment_pending_amount)}</td>
                    <td className="py-2.5 text-right tabular-nums text-emerald-400">{t.payment_paid_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#121212] border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Briefs waiting for approval</h2>
            <Link to="/approvals" className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1">
              Approval queue <ArrowUpRight size={12} strokeWidth={1.5}/>
            </Link>
          </div>
          <div className="space-y-2">
            {pendingBriefs.map((d) => (
              <Link to={`/deals/${d.deal_id}`} key={d.deal_id} className="block border border-zinc-800/60 rounded-lg p-3 hover:bg-zinc-900/40 transition-colors" data-testid={`pending-brief-${d.deal_id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{d.brand_name}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{d.submitted_by_team?.team_name} · {d.submitted_by_user?.name}</div>
                  </div>
                  <div className="text-xs text-zinc-300 tabular-nums">{formatCurrency(d.price_closed_at)}</div>
                </div>
              </Link>
            ))}
            {!pendingBriefs.length && <div className="text-xs text-zinc-500">Nothing pending.</div>}
          </div>
        </div>

        <div className="bg-[#121212] border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Active deals</h2>
            <Link to="/deals" className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1">
              All deals <ArrowUpRight size={12} strokeWidth={1.5}/>
            </Link>
          </div>
          <div className="space-y-2">
            {activeDeals.map((d) => (
              <Link to={`/deals/${d.deal_id}`} key={d.deal_id} className="block border border-zinc-800/60 rounded-lg p-3 hover:bg-zinc-900/40 transition-colors" data-testid={`active-deal-${d.deal_id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{d.brand_name}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{d.submitted_by_team?.team_name} · live {formatDate(d.go_live_date_time)}</div>
                  </div>
                  <StatusBadge status={d.deal_status || "Accepted"} />
                </div>
              </Link>
            ))}
            {!activeDeals.length && <div className="text-xs text-zinc-500">No active deals.</div>}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminOverview;
