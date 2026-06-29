import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { DELIVERABLE_TYPES } from "../lib/constants";
import { Plus, Trash2, Check, User } from "lucide-react";

const Input = ({ label, children, required }) => (
  <label className="block">
    <div className="text-xs text-zinc-400 mb-1.5">{label} {required && <span className="text-rose-400">*</span>}</div>
    {children}
  </label>
);

export const SubmitBrief = () => {
  const navigate = useNavigate();
  const { user, team } = useAuth();
  const isAdmin = user?.role === "admin";
  const [pages, setPages] = useState([]);
  const [teams, setTeams] = useState([]);
  const [submitTeamId, setSubmitTeamId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    brand_name: "",
    agency_or_client_name: "",
    brief_text: "",
    brief_link: "",
    assets: "",
    go_live_date_time: "",
    price_closed_at: "",
    payment_due_date: "",
    notes: "",
  });
  const [specs, setSpecs] = useState([{ page_id: "", deliverable_type: "Reel", quantity: 1 }]);

  useEffect(() => {
    api.get("/pages", { params: { only_active: true } }).then(({ data }) => {
      setPages(data);
      setSpecs([{ page_id: data[0]?.page_id || "", deliverable_type: "Reel", quantity: 1 }]);
    });
    if (isAdmin) {
      api.get("/teams").then(({ data }) => {
        setTeams(data);
        if (data.length) setSubmitTeamId(data[0].team_id);
      });
    }
  }, [isAdmin]);

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addSpec = () => setSpecs((s) => [...s, { page_id: pages[0]?.page_id || "", deliverable_type: "Reel", quantity: 1 }]);
  const removeSpec = (i) => setSpecs((s) => s.filter((_, idx) => idx !== i));
  const updateSpec = (i, k, v) => setSpecs((s) => s.map((x, idx) => idx === i ? { ...x, [k]: v } : x));

  const submit = async () => {
    setErr("");
    if (!form.brand_name || !form.agency_or_client_name) { setErr("Brand and agency/client are required."); return; }
    if (!form.brief_text && !form.brief_link) { setErr("Add brief text or brief link."); return; }
    if (!form.go_live_date_time) { setErr("Go-live date is required."); return; }
    if (!form.price_closed_at) { setErr("Price is required."); return; }
    if (!form.payment_due_date) { setErr("Payment due date is required."); return; }
    if (!specs.length || !specs[0].page_id) { setErr("Add at least one page deliverable."); return; }
    if (isAdmin && !submitTeamId) { setErr("Select which BD team this brief is for."); return; }

    setBusy(true);
    try {
      const payload = {
        brand_name: form.brand_name.trim(),
        agency_or_client_name: form.agency_or_client_name.trim(),
        brief_text: form.brief_text.trim(),
        brief_link: form.brief_link.trim(),
        assets_or_reference_links: form.assets ? form.assets.split(/\n|,/).map(s => s.trim()).filter(Boolean) : [],
        deliverables_spec: specs.map(s => ({ ...s, quantity: Number(s.quantity) || 1 })),
        go_live_date_time: new Date(form.go_live_date_time).toISOString(),
        price_closed_at: Number(form.price_closed_at),
        payment_due_date: new Date(form.payment_due_date).toISOString(),
        notes: form.notes,
        ...(isAdmin ? { submitted_by_team_id: submitTeamId } : {}),
      };
      const { data } = await api.post("/briefs", payload);
      navigate(`/deals/${data.deal_id}`);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to submit brief");
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none transition-colors";

  return (
    <div data-testid="submit-brief-page" className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Submit Brief</h1>
        <p className="text-sm text-zinc-500 mt-1">Fast. If your brief link is ready, this should take under 60 seconds.</p>
        <div className="mt-3 inline-flex items-center gap-2 text-xs bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5" data-testid="submit-as-chip">
          <User size={11} strokeWidth={1.5} className="text-zinc-400" />
          <span className="text-zinc-400">Submitting as</span>
          <span className="text-zinc-100 font-medium">{user?.name}</span>
          {team?.team_name && (
            <>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-300">{team.team_name}</span>
            </>
          )}
          {!team?.team_name && isAdmin && submitTeamId && (
            <>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-300">{teams.find((t) => t.team_id === submitTeamId)?.team_name || "—"}</span>
            </>
          )}
        </div>
        <p className="text-[11px] text-zinc-600 mt-2">This goes to Admin for approval — it does not count as revenue until approved.</p>
      </header>

      <div className="bg-[#121212] border border-zinc-800/80 rounded-xl p-6 space-y-5">
        {isAdmin && (
          <Input label="Submit for team" required>
            <select
              data-testid="brief-submit-team"
              value={submitTeamId}
              onChange={(e) => setSubmitTeamId(e.target.value)}
              className={inputCls}
            >
              {teams.map((t) => (
                <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-600 mt-1.5">Revenue and deal visibility will count under this BD team.</p>
          </Input>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Brand name" required>
            <input data-testid="brief-brand" className={inputCls} value={form.brand_name} onChange={(e) => setF("brand_name", e.target.value)} placeholder="e.g. Razorpay" />
          </Input>
          <Input label="Agency / Client name" required>
            <input data-testid="brief-agency" className={inputCls} value={form.agency_or_client_name} onChange={(e) => setF("agency_or_client_name", e.target.value)} placeholder="e.g. Wavemaker or Direct" />
          </Input>
        </div>

        <Input label="Brief link (one of brief link / text required)">
          <input data-testid="brief-link" className={inputCls} value={form.brief_link} onChange={(e) => setF("brief_link", e.target.value)} placeholder="https://…" />
        </Input>
        <Input label="Brief text">
          <textarea data-testid="brief-text" rows={3} className={inputCls + " resize-none"} value={form.brief_text} onChange={(e) => setF("brief_text", e.target.value)} placeholder="Paste the brief or notes…" />
        </Input>
        <Input label="Assets / reference links (one per line)">
          <textarea rows={2} className={inputCls + " resize-none"} value={form.assets} onChange={(e) => setF("assets", e.target.value)} placeholder="https://drive.google.com/…" />
        </Input>

        <div>
          <div className="text-xs text-zinc-400 mb-2">Pages & deliverables <span className="text-rose-400">*</span></div>
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <select
                  data-testid={`spec-page-${i}`}
                  value={s.page_id}
                  onChange={(e) => updateSpec(i, "page_id", e.target.value)}
                  className={inputCls + " col-span-6"}
                >
                  {pages.map((p) => <option key={p.page_id} value={p.page_id}>{p.page_name}</option>)}
                </select>
                <select
                  data-testid={`spec-type-${i}`}
                  value={s.deliverable_type}
                  onChange={(e) => updateSpec(i, "deliverable_type", e.target.value)}
                  className={inputCls + " col-span-3"}
                >
                  {DELIVERABLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  data-testid={`spec-qty-${i}`}
                  type="number" min={1}
                  value={s.quantity}
                  onChange={(e) => updateSpec(i, "quantity", e.target.value)}
                  className={inputCls + " col-span-2"}
                />
                <button
                  data-testid={`spec-remove-${i}`}
                  onClick={() => removeSpec(i)}
                  disabled={specs.length === 1}
                  className="col-span-1 grid place-items-center text-zinc-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-zinc-500"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            ))}
            <button
              data-testid="add-spec"
              onClick={addSpec}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2 py-1.5"
            >
              <Plus size={13} strokeWidth={1.5} /> Add another page/deliverable
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Go-live date / time" required>
            <input data-testid="brief-go-live" type="datetime-local" className={inputCls} value={form.go_live_date_time} onChange={(e) => setF("go_live_date_time", e.target.value)} />
          </Input>
          <Input label="Price closed at (INR)" required>
            <input data-testid="brief-price" type="number" min={0} className={inputCls} value={form.price_closed_at} onChange={(e) => setF("price_closed_at", e.target.value)} placeholder="e.g. 250000" />
          </Input>
          <Input label="Payment due date" required>
            <input data-testid="brief-pay-due" type="date" className={inputCls} value={form.payment_due_date} onChange={(e) => setF("payment_due_date", e.target.value)} />
          </Input>
        </div>

        <Input label="Notes (optional)">
          <textarea rows={2} className={inputCls + " resize-none"} value={form.notes} onChange={(e) => setF("notes", e.target.value)} />
        </Input>

        {err && <div className="status-error border rounded-lg px-3 py-2 text-xs" data-testid="brief-error">{err}</div>}

        <div className="pt-2 flex items-center gap-3">
          <button
            data-testid="submit-brief-button"
            disabled={busy}
            onClick={submit}
            className="inline-flex items-center gap-2 bg-white text-black hover:bg-zinc-200 rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Check size={14} strokeWidth={2} /> Submit brief
          </button>
          <button onClick={() => navigate(-1)} className="text-sm text-zinc-400 hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default SubmitBrief;
