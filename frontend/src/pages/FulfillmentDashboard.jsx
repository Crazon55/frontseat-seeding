import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate, formatDateTime, DELIVERABLE_STATUSES } from "../lib/constants";
import { StatusBadge } from "../components/StatusBadge";
import { KanbanSquare, LayoutGrid, Calendar } from "lucide-react";

const VIEW_TABS = [
  { key: "gallery", label: "Gallery", icon: LayoutGrid },
  { key: "kanban", label: "Kanban", icon: KanbanSquare },
  { key: "timeline", label: "Timeline", icon: Calendar },
];

const KANBAN_COLS = ["Not Started", "Writing", "Designing", "Client Review", "Scheduled", "Posted", "Completed", "Blocked"];

export const FulfillmentDashboard = () => {
  const { user } = useAuth();
  const [view, setView] = useState("gallery");
  const [deals, setDeals] = useState([]);
  const [deliverables, setDeliverables] = useState([]);

  const load = async () => {
    const [{ data: ds }, { data: dvs }] = await Promise.all([
      api.get("/deals", { params: { admin_review_status: "Approved" } }),
      api.get("/deliverables"),
    ]);
    setDeals(ds.filter((d) => d.deal_status !== "Completed"));
    setDeliverables(dvs);
  };
  useEffect(() => { load(); }, []);

  const dealMap = useMemo(() => Object.fromEntries(deals.map((d) => [d.deal_id, d])), [deals]);
  const dealVisibleDeliverables = useMemo(
    () => deliverables.filter((dv) => dealMap[dv.deal_id]),
    [deliverables, dealMap]
  );

  return (
    <div data-testid="fulfillment-dashboard" className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Fulfillment Board</h1>
          <p className="text-sm text-zinc-500 mt-1">All approved deals, ready to execute.</p>
        </div>
        <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-1">
          {VIEW_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              data-testid={`view-${key}`}
              onClick={() => setView(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                view === key ? "bg-white text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon size={12} strokeWidth={1.5}/> {label}
            </button>
          ))}
        </div>
      </header>

      {view === "gallery" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((d) => {
            const myDelivs = deliverables.filter((dv) => dv.deal_id === d.deal_id);
            return (
              <Link
                to={`/deals/${d.deal_id}`}
                key={d.deal_id}
                data-testid={`ff-card-${d.deal_id}`}
                className="bg-[#121212] border border-zinc-800/80 rounded-xl p-5 card-hover block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">{d.agency_or_client_name}</div>
                    <div className="text-lg font-semibold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>{d.brand_name}</div>
                  </div>
                  <StatusBadge status={d.deal_status || "Accepted"} />
                </div>
                <div className="text-xs text-zinc-400 mb-2">{myDelivs.length} deliverables · live {formatDate(d.go_live_date_time)}</div>
                <div className="flex flex-wrap gap-1.5">
                  {myDelivs.slice(0, 6).map((dv) => (
                    <span key={dv.deliverable_id} className="inline-flex text-[10px] px-1.5 py-0.5 rounded border border-zinc-800/60 text-zinc-400">{dv.page_name.split(" ")[0]} · {dv.deliverable_type}</span>
                  ))}
                </div>
              </Link>
            );
          })}
          {!deals.length && (
            <div className="col-span-full text-center py-16 border border-dashed border-zinc-800 rounded-xl">
              <div className="text-sm text-zinc-400">No approved deals in queue.</div>
            </div>
          )}
        </div>
      )}

      {view === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {KANBAN_COLS.map((col) => {
              const items = dealVisibleDeliverables.filter((dv) => dv.status === col);
              return (
                <div key={col} data-testid={`kanban-col-${col}`} className="w-80 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-zinc-300">{col}</div>
                    <span className="text-[11px] text-zinc-500">{items.length}</span>
                  </div>
                  <div className="bg-[#0c0c0d] border border-zinc-800/60 rounded-lg p-2 min-h-[120px] space-y-2">
                    {items.map((dv) => {
                      const d = dealMap[dv.deal_id];
                      return (
                        <Link to={`/deals/${dv.deal_id}`} key={dv.deliverable_id} data-testid={`kanban-card-${dv.deliverable_id}`} className="block bg-[#121212] border border-zinc-800/80 rounded-lg p-3 hover:-translate-y-0.5 transition-transform duration-200">
                          <div className="text-xs font-medium text-white mb-1">{d?.brand_name}</div>
                          <div className="text-[11px] text-zinc-400">{dv.page_name} · {dv.deliverable_type}</div>
                          <div className="text-[10px] text-zinc-500 mt-2">live {formatDate(dv.go_live_date_time)}</div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "timeline" && (
        <div className="bg-[#121212] border border-zinc-800/80 rounded-xl divide-y divide-zinc-800/60">
          {[...dealVisibleDeliverables]
            .sort((a, b) => new Date(a.go_live_date_time) - new Date(b.go_live_date_time))
            .map((dv) => {
              const d = dealMap[dv.deal_id];
              return (
                <Link to={`/deals/${dv.deal_id}`} key={dv.deliverable_id} data-testid={`timeline-row-${dv.deliverable_id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-900/30 transition-colors">
                  <div className="w-28 text-xs text-zinc-400">{formatDate(dv.go_live_date_time)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{d?.brand_name}</div>
                    <div className="text-[11px] text-zinc-500">{dv.page_name} · {dv.deliverable_type}</div>
                  </div>
                  <StatusBadge status={dv.status} />
                </Link>
              );
            })}
          {!dealVisibleDeliverables.length && (
            <div className="px-5 py-10 text-center text-xs text-zinc-500">No upcoming deliverables.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default FulfillmentDashboard;
