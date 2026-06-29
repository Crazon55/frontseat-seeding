import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Plus, Pencil, Check, X } from "lucide-react";

const inputCls = "w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none";

const PageCard = ({ page, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(page.page_name);
  const [notes, setNotes] = useState(page.notes || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(page.page_name);
    setNotes(page.notes || "");
  }, [page.page_name, page.notes]);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.put(`/pages/${page.page_id}`, { page_name: name.trim(), notes: notes.trim() });
      setEditing(false);
      onUpdated?.();
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    await api.put(`/pages/${page.page_id}`, { active: !page.active });
    onUpdated?.();
  };

  return (
    <div data-testid={`page-${page.page_id}`} className="bg-[#121212] border border-zinc-800/80 rounded-xl p-4 card-hover">
      {editing ? (
        <div className="space-y-2">
          <input
            data-testid={`edit-page-name-${page.page_id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
          <input
            data-testid={`edit-page-notes-${page.page_id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className={inputCls}
          />
          <div className="flex items-center gap-2">
            <button
              data-testid={`save-page-edit-${page.page_id}`}
              onClick={save}
              disabled={busy || !name.trim()}
              className="inline-flex items-center gap-1 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 rounded-lg px-3 py-1 text-xs font-medium"
            >
              <Check size={12} /> Save
            </button>
            <button
              onClick={() => { setEditing(false); setName(page.page_name); setNotes(page.notes || ""); }}
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-white font-medium truncate">{page.page_name}</div>
            <div className="text-[11px] text-zinc-500 truncate mt-1">{page.notes || "No notes"}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              data-testid={`edit-page-${page.page_id}`}
              onClick={() => setEditing(true)}
              className="text-zinc-500 hover:text-white"
              title="Edit page"
            >
              <Pencil size={13} strokeWidth={1.5} />
            </button>
            <button
              data-testid={`toggle-page-${page.page_id}`}
              onClick={toggle}
              className={`text-[11px] px-2 py-1 rounded-full border ${page.active ? "status-success" : "status-neutral"}`}
            >
              {page.active ? "active" : "inactive"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminPages = () => {
  const [pages, setPages] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    const { data } = await api.get("/pages");
    setPages(data);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    await api.post("/pages", { page_name: name.trim(), notes, active: true });
    setName(""); setNotes(""); setShowAdd(false);
    load();
  };

  return (
    <div data-testid="admin-pages" className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Monetisable Pages</h1>
          <p className="text-sm text-zinc-500 mt-1">Only active pages show up in the brief submission form.</p>
        </div>
        <button
          data-testid="add-page-button"
          onClick={() => setShowAdd((s) => !s)}
          className="inline-flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          <Plus size={14} strokeWidth={2} /> Add page
        </button>
      </header>

      {showAdd && (
        <div className="bg-[#121212] border border-zinc-800/80 rounded-xl p-4 flex gap-2">
          <input
            data-testid="new-page-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Page name"
            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none"
          />
          <button data-testid="save-page-button" onClick={create} className="bg-white text-black hover:bg-zinc-200 rounded-lg px-4 py-2 text-sm font-medium">Save</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((p) => (
          <PageCard key={p.page_id} page={p} onUpdated={load} />
        ))}
      </div>
    </div>
  );
};

export default AdminPages;
