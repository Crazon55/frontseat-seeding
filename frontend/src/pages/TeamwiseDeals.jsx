import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatCurrency, formatDate, PAYMENT_STATUSES } from "../lib/constants";
import { StatusBadge } from "../components/StatusBadge";

export const TeamwiseDeals = () => {
  const [teams, setTeams] = useState([]);
  const [teamPayments, setTeamPayments] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activeTeam, setActiveTeam] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const now = new Date();
    const from_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const to_date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const [{ data: teamList }, { data: rep }, { data: dealList }] = await Promise.all([
      api.get("/teams"),
      api.get("/reports/overview", { params: { from_date, to_date } }),
      api.get("/deals"),
    ]);
    setTeams(teamList);
    setTeamPayments(rep.team_payments || []);
    setDeals(dealList);
    if (!activeTeam && teamList.length) setActiveTeam(teamList[0].team_id);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const teamDeals = deals.filter((d) => d.submitted_by_team_id === activeTeam);
  const filtered = teamDeals.filter((d) => {
    if (paymentFilter === "all") return true;
    return (d.payment?.status || "Not Raised") === paymentFilter;
  });

  const activePayment = teamPayments.find((t) => t.team_id === activeTeam);
  const activeTeamName = teams.find((t) => t.team_id === activeTeam)?.team_name;

  if (loading) return <div className="text-zinc-500 text-sm">Loading…</div>;

  return (
    <div data-testid="teamwise-deals" className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Teamwise Deals</h1>
        <p className="text-sm text-zinc-500 mt-1">Revenue, payment status, and deals grouped by BD team — this month.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {teams.map((t) => {
          const tp = teamPayments.find((x) => x.team_id === t.team_id);
          return (
            <button
              key={t.team_id}
              data-testid={`team-tab-${t.team_id}`}
              onClick={() => setActiveTeam(t.team_id)}
              className={`text-xs px-4 py-2 rounded-full border transition-colors ${
                activeTeam === t.team_id ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              {t.team_name}
              {tp?.payment_pending_count > 0 && (
                <span className="ml-1.5 text-amber-400">· {tp.payment_pending_count} due</span>
              )}
            </button>
          );
        })}
      </div>

      {activePayment && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#121212] border border-zinc-800/80 rounded-xl p-4">
            <div className="text-xs text-zinc-500">Revenue closed</div>
            <div className="text-xl font-semibold text-white tabular-nums mt-1">{formatCurrency(activePayment.revenue)}</div>
          </div>
          <div className="bg-[#121212] border border-zinc-800/80 rounded-xl p-4">
            <div className="text-xs text-zinc-500">Approved deals</div>
            <div className="text-xl font-semibold text-white mt-1">{activePayment.deals_approved}</div>
          </div>
          <div className="bg-[#121212] border border-zinc-800/80 rounded-xl p-4">
            <div className="text-xs text-zinc-500">Payments pending</div>
            <div className="text-xl font-semibold text-amber-400 mt-1">{activePayment.payment_pending_count}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5 tabular-nums">{formatCurrency(activePayment.payment_pending_amount)} outstanding</div>
          </div>
          <div className="bg-[#121212] border border-zinc-800/80 rounded-xl p-4">
            <div className="text-xs text-zinc-500">Paid</div>
            <div className="text-xl font-semibold text-emerald-400 mt-1">{activePayment.payment_paid_count}</div>
          </div>
        </section>
      )}

      {activePayment?.by_status && (
        <div className="flex flex-wrap gap-2">
          {PAYMENT_STATUSES.map((s) => (
            <span key={s} className="text-[11px] px-2 py-1 rounded-full border border-zinc-800 text-zinc-400">
              {s}: {activePayment.by_status[s] || 0}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-500">{activeTeamName} deals</span>
        <span className="text-zinc-700">·</span>
        {[["all", "All payments"], ...PAYMENT_STATUSES.map((s) => [s, s])].map(([key, label]) => (
          <button
            key={key}
            data-testid={`team-payment-filter-${key.replace(/\s+/g, "-").toLowerCase()}`}
            onClick={() => setPaymentFilter(key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              paymentFilter === key ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >{label}</button>
        ))}
      </div>

      <div className="bg-[#121212] border border-zinc-800/80 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60">
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-5 py-3">Brand</th>
              <th className="px-5 py-3">Review</th>
              <th className="px-5 py-3">Deal status</th>
              <th className="px-5 py-3">Go-live</th>
              <th className="px-5 py-3 text-right">Price</th>
              <th className="px-5 py-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.deal_id} data-testid={`team-deal-row-${d.deal_id}`} className="border-t border-zinc-800/60 hover:bg-zinc-900/30 transition-colors">
                <td className="px-5 py-3">
                  <Link to={`/deals/${d.deal_id}`} className="text-white hover:underline font-medium">{d.brand_name}</Link>
                  <div className="text-[11px] text-zinc-500">{d.agency_or_client_name}</div>
                </td>
                <td className="px-5 py-3"><StatusBadge status={d.admin_review_status} /></td>
                <td className="px-5 py-3">{d.deal_status ? <StatusBadge status={d.deal_status} /> : <span className="text-zinc-600 text-xs">—</span>}</td>
                <td className="px-5 py-3 text-zinc-300">{formatDate(d.go_live_date_time)}</td>
                <td className="px-5 py-3 text-right text-zinc-200 tabular-nums">{formatCurrency(d.price_closed_at)}</td>
                <td className="px-5 py-3">
                  {d.payment ? <StatusBadge status={d.payment.status} /> : <span className="text-zinc-600 text-xs">—</span>}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-xs text-zinc-500">No deals for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamwiseDeals;
