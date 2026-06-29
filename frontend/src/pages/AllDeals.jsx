import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatCurrency, formatDate, PAYMENT_STATUSES } from "../lib/constants";
import { StatusBadge } from "../components/StatusBadge";

export const AllDeals = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState([]);
  const [filter, setFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const load = async () => {
    const params = {};
    if (paymentFilter !== "all") params.payment_status = paymentFilter;
    const { data } = await api.get("/deals", { params });
    setDeals(data);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.role, paymentFilter]);

  const filtered = deals.filter((d) => {
    if (filter === "all") return true;
    if (filter === "approved") return d.admin_review_status === "Approved";
    if (filter === "submitted") return d.admin_review_status === "Submitted";
    if (filter === "completed") return d.deal_status === "Completed";
    if (filter === "rejected") return d.admin_review_status === "Rejected";
    return true;
  });

  const showPayment = user?.role === "admin" || user?.role === "bd";
  const colSpan = showPayment ? 6 : 5;

  return (
    <div data-testid="all-deals" className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Deals</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {user?.role === "fulfillment" ? "All admin-approved deals." : user?.role === "bd" ? "Your team's briefs and deals." : "All briefs and deals across teams."}
        </p>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          ["all", "All"],
          ...(user?.role !== "fulfillment" ? [["submitted", "Submitted"]] : []),
          ["approved", "Approved"], ["completed", "Completed"],
          ...(user?.role === "admin" ? [["rejected", "Rejected"]] : []),
        ].map(([key, label]) => (
          <button
            key={key}
            data-testid={`deals-filter-${key}`}
            onClick={() => setFilter(key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors duration-200 ${
              filter === key ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >{label}</button>
        ))}
      </div>

      {showPayment && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500">Payment status</span>
          {[["all", "All"], ...PAYMENT_STATUSES.map((s) => [s, s])].map(([key, label]) => (
            <button
              key={key}
              data-testid={`deals-payment-filter-${key.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => setPaymentFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                paymentFilter === key ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >{label}</button>
          ))}
        </div>
      )}

      <div className="bg-[#121212] border border-zinc-800/80 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60">
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-5 py-3">Brand</th>
              <th className="px-5 py-3">Team</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Go-live</th>
              {showPayment && <th className="px-5 py-3">Payment</th>}
              {user?.role !== "fulfillment" && <th className="px-5 py-3 text-right">Price</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.deal_id} data-testid={`deals-row-${d.deal_id}`} className="border-t border-zinc-800/60 hover:bg-zinc-900/30 transition-colors">
                <td className="px-5 py-3">
                  <Link to={`/deals/${d.deal_id}`} className="text-white hover:underline font-medium">{d.brand_name}</Link>
                  <div className="text-[11px] text-zinc-500">{d.agency_or_client_name}</div>
                </td>
                <td className="px-5 py-3 text-zinc-400">{d.submitted_by_team?.team_name || "—"}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge status={d.admin_review_status} />
                    {d.deal_status && <StatusBadge status={d.deal_status} />}
                  </div>
                </td>
                <td className="px-5 py-3 text-zinc-300">{formatDate(d.go_live_date_time)}</td>
                {showPayment && (
                  <td className="px-5 py-3">
                    {d.payment ? <StatusBadge status={d.payment.status} /> : <span className="text-zinc-600 text-xs">—</span>}
                  </td>
                )}
                {user?.role !== "fulfillment" && (
                  <td className="px-5 py-3 text-right text-zinc-200 tabular-nums">{formatCurrency(d.price_closed_at)}</td>
                )}
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={colSpan} className="px-5 py-12 text-center text-xs text-zinc-500">No deals.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllDeals;
