import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, getSessionToken } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatCurrency, formatDate, formatDateTime, toDatetimeLocalValue, toDateInputValue, DELIVERABLE_STATUSES, DELIVERABLE_TYPES, DEAL_STATUSES, PAYMENT_STATUSES, OUTPUT_TYPES, OUTPUT_STATUSES } from "../lib/constants";
import { StatusBadge } from "../components/StatusBadge";
import { ArrowLeft, ExternalLink, Paperclip, Link2, Plus, AlertTriangle, MessageSquare, Pencil, Check, X, Trash2, Send } from "lucide-react";

const Section = ({ title, children, action }) => (
  <section className="py-6 border-b border-zinc-800/80 last:border-0">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const fileUrl = (fileId) => fileId ? `${process.env.REACT_APP_BACKEND_URL}/api/files/${fileId}?auth=${getSessionToken() || ""}` : "";

const inputCls = "w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none";

const FileUploadButton = ({ onUploaded, label = "Attach file", accept = "*/*", testId }) => {
  const [busy, setBusy] = useState(false);
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer">
      <Paperclip size={12} strokeWidth={1.5} />
      {busy ? "Uploading…" : label}
      <input
        data-testid={testId}
        type="file"
        accept={accept}
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          const fd = new FormData();
          fd.append("file", f);
          try {
            const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
            onUploaded?.(data);
          } catch (err) {
            alert(err?.response?.data?.detail || "Upload failed");
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
    </label>
  );
};

const CommentComposer = ({ dealId, outputId, onPosted, placeholder = "Add a comment / change request…", testIdPrefix = "comment" }) => {
  const [text, setText] = useState("");
  const [imageId, setImageId] = useState("");
  const [imageName, setImageName] = useState("");
  const [fileId, setFileId] = useState("");
  const [fileName, setFileName] = useState("");
  const [refLink, setRefLink] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.post("/feedback", {
        deal_id: dealId,
        output_id: outputId || null,
        feedback_text: text.trim(),
        image_attachment: imageId,
        file_attachment: fileId,
        reference_link: refLink,
      });
      setText(""); setImageId(""); setImageName(""); setFileId(""); setFileName(""); setRefLink("");
      onPosted?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 bg-zinc-950/60 border border-zinc-800/60 rounded-lg p-3">
      <textarea
        data-testid={`${testIdPrefix}-input`}
        rows={2}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={inputCls + " resize-none text-xs"}
      />
      {refLink !== "" && (
        <input
          placeholder="Reference link"
          value={refLink}
          onChange={(e) => setRefLink(e.target.value)}
          className={inputCls + " text-xs"}
        />
      )}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <FileUploadButton
          testId={`${testIdPrefix}-image-upload`}
          label={imageName ? `📷 ${imageName.slice(0, 14)}${imageName.length > 14 ? "…" : ""}` : "Image"}
          accept="image/*"
          onUploaded={(d) => { setImageId(d.file_id); setImageName(d.original_filename); }}
        />
        <FileUploadButton
          testId={`${testIdPrefix}-file-upload`}
          label={fileName ? `📎 ${fileName.slice(0, 14)}${fileName.length > 14 ? "…" : ""}` : "File"}
          onUploaded={(d) => { setFileId(d.file_id); setFileName(d.original_filename); }}
        />
        <button
          onClick={() => setRefLink(refLink === "" ? " " : "")}
          className="inline-flex items-center gap-1 text-zinc-400 hover:text-white"
          type="button"
        >
          <Link2 size={11} strokeWidth={1.5}/> Link
        </button>
        <button
          data-testid={`${testIdPrefix}-submit`}
          onClick={submit}
          disabled={busy || !text.trim()}
          className="ml-auto inline-flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
        >
          <Send size={11} strokeWidth={2}/> {busy ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
};

const Comment = ({ comment, currentUser, onUpdated, onDeleted }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.feedback_text);
  const isAuthor = comment.added_by_user_id === currentUser?.user_id;
  const isAdmin = currentUser?.role === "admin";
  const canEdit = isAuthor || isAdmin;
  const canDelete = isAuthor || isAdmin;

  const save = async () => {
    await api.put(`/feedback/${comment.feedback_id}`, { feedback_text: text });
    setEditing(false);
    onUpdated?.();
  };
  const toggleResolved = async () => {
    const newStatus = comment.status === "Resolved" ? "Open" : "Resolved";
    await api.put(`/feedback/${comment.feedback_id}`, { status: newStatus });
    onUpdated?.();
  };
  const remove = async () => {
    if (!window.confirm("Delete this comment?")) return;
    await api.delete(`/feedback/${comment.feedback_id}`);
    onDeleted?.();
  };

  const initials = (comment.added_by_name || "?").split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase();
  const resolved = comment.status === "Resolved";

  return (
    <div data-testid={`comment-${comment.feedback_id}`} className={`flex gap-3 ${resolved ? "opacity-60" : ""}`}>
      <div className="w-7 h-7 shrink-0 rounded-full bg-zinc-800 grid place-items-center text-[10px] text-white font-medium">{initials}</div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-2 mb-1">
          <span className="text-xs font-medium text-white">{comment.added_by_name}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            {comment.added_by_role}{comment.added_by_team ? ` · ${comment.added_by_team}` : ""}
          </span>
          <span className="text-[10px] text-zinc-600">· {formatDateTime(comment.created_at)}</span>
          {resolved && <StatusBadge status="Resolved" />}
        </div>
        {editing ? (
          <div className="space-y-2">
            <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} className={inputCls + " text-xs resize-none"} />
            <div className="flex gap-2">
              <button onClick={save} className="bg-white text-black hover:bg-zinc-200 rounded-md px-2 py-1 text-[11px] font-medium">Save</button>
              <button onClick={() => { setEditing(false); setText(comment.feedback_text); }} className="text-[11px] text-zinc-400 hover:text-white">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">{comment.feedback_text}</div>
        )}
        {(comment.image_attachment || comment.file_attachment || comment.reference_link) && (
          <div className="mt-2 space-y-1">
            {comment.image_attachment && (
              <img src={fileUrl(comment.image_attachment)} alt="attachment" className="max-h-48 rounded-md border border-zinc-800/60" />
            )}
            {comment.file_attachment && (
              <a href={fileUrl(comment.file_attachment)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white">
                <Paperclip size={10}/> Download attachment
              </a>
            )}
            {comment.reference_link && (
              <a href={comment.reference_link} target="_blank" rel="noreferrer" className="block text-[11px] text-zinc-400 hover:text-white truncate">
                <Link2 size={10} className="inline mr-1"/>{comment.reference_link}
              </a>
            )}
          </div>
        )}
        {!editing && (
          <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
            <button
              data-testid={`comment-toggle-resolve-${comment.feedback_id}`}
              onClick={toggleResolved}
              className="inline-flex items-center gap-1 hover:text-white transition-colors"
            >
              <Check size={10}/> {resolved ? "Reopen" : "Mark resolved"}
            </button>
            {canEdit && (
              <button data-testid={`comment-edit-${comment.feedback_id}`} onClick={() => setEditing(true)} className="inline-flex items-center gap-1 hover:text-white">
                <Pencil size={10}/> Edit
              </button>
            )}
            {canDelete && (
              <button data-testid={`comment-delete-${comment.feedback_id}`} onClick={remove} className="inline-flex items-center gap-1 hover:text-rose-400">
                <Trash2 size={10}/> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const BriefEditPanel = ({ deal, role, onSaved, busy, setBusy }) => {
  const [form, setForm] = useState({
    brand_name: deal.brand_name || "",
    agency_or_client_name: deal.agency_or_client_name || "",
    brief_text: deal.brief_text || "",
    brief_link: deal.brief_link || "",
    assets: (deal.assets_or_reference_links || []).join("\n"),
    notes: deal.notes || "",
  });

  useEffect(() => {
    setForm({
      brand_name: deal.brand_name || "",
      agency_or_client_name: deal.agency_or_client_name || "",
      brief_text: deal.brief_text || "",
      brief_link: deal.brief_link || "",
      assets: (deal.assets_or_reference_links || []).join("\n"),
      notes: deal.notes || "",
    });
  }, [deal]);

  const isResubmit = role === "bd" && deal.admin_review_status === "Needs More Info";

  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/deals/${deal.deal_id}`, {
        brand_name: form.brand_name.trim(),
        agency_or_client_name: form.agency_or_client_name.trim(),
        brief_text: form.brief_text.trim(),
        brief_link: form.brief_link.trim(),
        assets_or_reference_links: form.assets ? form.assets.split(/\n|,/).map((s) => s.trim()).filter(Boolean) : [],
        notes: form.notes.trim(),
      });
      onSaved?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3" data-testid="brief-edit-panel">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] text-zinc-500 mb-1">Brand name</div>
          <input data-testid="brief-edit-brand" value={form.brand_name} onChange={(e) => setForm((f) => ({ ...f, brand_name: e.target.value }))} className={inputCls + " text-xs"} />
        </div>
        <div>
          <div className="text-[11px] text-zinc-500 mb-1">Agency / client</div>
          <input data-testid="brief-edit-agency" value={form.agency_or_client_name} onChange={(e) => setForm((f) => ({ ...f, agency_or_client_name: e.target.value }))} className={inputCls + " text-xs"} />
        </div>
      </div>
      <div>
        <div className="text-[11px] text-zinc-500 mb-1">Brief link</div>
        <input data-testid="brief-edit-link" value={form.brief_link} onChange={(e) => setForm((f) => ({ ...f, brief_link: e.target.value }))} className={inputCls + " text-xs"} placeholder="https://…" />
      </div>
      <div>
        <div className="text-[11px] text-zinc-500 mb-1">Brief text</div>
        <textarea data-testid="brief-edit-text" rows={4} value={form.brief_text} onChange={(e) => setForm((f) => ({ ...f, brief_text: e.target.value }))} className={inputCls + " text-xs resize-none"} />
      </div>
      <div>
        <div className="text-[11px] text-zinc-500 mb-1">Assets / reference links (one per line)</div>
        <textarea data-testid="brief-edit-assets" rows={2} value={form.assets} onChange={(e) => setForm((f) => ({ ...f, assets: e.target.value }))} className={inputCls + " text-xs resize-none"} />
      </div>
      <div>
        <div className="text-[11px] text-zinc-500 mb-1">Notes</div>
        <textarea data-testid="brief-edit-notes" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls + " text-xs resize-none"} />
      </div>
      <button
        data-testid={isResubmit ? "brief-resubmit-button" : "brief-save-button"}
        onClick={save}
        disabled={busy || !form.brand_name.trim() || !form.agency_or_client_name.trim()}
        className="inline-flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 rounded-lg px-4 py-2 text-xs font-medium"
      >
        {busy ? "Saving…" : isResubmit ? "Save & resubmit to admin" : "Save brief"}
      </button>
    </div>
  );
};

const OutputCard = ({ output, comments, currentUser, dealId, onUpdated }) => {
  const isAuthor = output.created_by === currentUser?.user_id;
  const isAdmin = currentUser?.role === "admin";
  const isFulfillment = currentUser?.role === "fulfillment";
  const canEditOutput = isAdmin || (isFulfillment && isAuthor);
  const canDeleteOutput = isAdmin || (isFulfillment && isAuthor);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...output });
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => { setForm({ ...output }); }, [output]);

  const saveOutput = async () => {
    const upd = {};
    ["title", "writeup_text", "link", "output_type", "status", "visible_to_bd"].forEach((k) => {
      if (form[k] !== output[k]) upd[k] = form[k];
    });
    if (Object.keys(upd).length === 0) { setEditing(false); return; }
    await api.put(`/outputs/${output.output_id}`, upd);
    setEditing(false);
    onUpdated?.();
  };

  const updateStatus = async (status) => {
    await api.put(`/outputs/${output.output_id}`, { status });
    onUpdated?.();
  };

  const remove = async () => {
    if (!window.confirm("Delete this output and all its comments?")) return;
    await api.delete(`/outputs/${output.output_id}`);
    onUpdated?.();
  };

  const myComments = comments.filter((c) => c.output_id === output.output_id);
  const openCount = myComments.filter((c) => c.status !== "Resolved").length;

  return (
    <div data-testid={`output-card-${output.output_id}`} className="bg-[#121212] border border-zinc-800/80 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-zinc-800/60">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            {editing ? (
              <input data-testid={`output-edit-title-${output.output_id}`} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputCls + " mb-2"} />
            ) : (
              <h3 className="text-base font-semibold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>{output.title}</h3>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {editing ? (
                <select value={form.output_type} onChange={(e) => setForm((f) => ({ ...f, output_type: e.target.value }))} className={inputCls + " text-xs py-1 w-auto"}>
                  {OUTPUT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              ) : (
                <StatusBadge status={output.output_type} />
              )}
              {canEditOutput ? (
                <select
                  data-testid={`output-status-${output.output_id}`}
                  value={output.status || "Draft"}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-[11px] text-zinc-200"
                >
                  {OUTPUT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              ) : (
                <StatusBadge status={output.status || "Draft"} />
              )}
              <span className="text-[10px] text-zinc-600">· by {output.created_by_name || "—"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canEditOutput && !editing && (
              <button
                data-testid={`output-edit-${output.output_id}`}
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
              >
                <Pencil size={12} strokeWidth={1.5}/> Edit
              </button>
            )}
            {canDeleteOutput && !editing && (
              <button onClick={remove} className="text-xs text-zinc-500 hover:text-rose-400">
                <Trash2 size={12} strokeWidth={1.5}/>
              </button>
            )}
            {editing && (
              <>
                <button data-testid={`output-save-${output.output_id}`} onClick={saveOutput} className="bg-white text-black hover:bg-zinc-200 rounded-md px-3 py-1 text-xs font-medium">Save</button>
                <button onClick={() => { setEditing(false); setForm({ ...output }); }} className="text-xs text-zinc-400 hover:text-white">Cancel</button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div className="space-y-2 mt-3">
            <input value={form.link || ""} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="Link" className={inputCls + " text-xs"} />
            <textarea rows={3} value={form.writeup_text || ""} onChange={(e) => setForm((f) => ({ ...f, writeup_text: e.target.value }))} placeholder="Writeup text" className={inputCls + " text-xs resize-none"} />
            <label className="inline-flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
              <input
                data-testid={`output-visible-bd-${output.output_id}`}
                type="checkbox"
                checked={!!form.visible_to_bd}
                onChange={(e) => setForm((f) => ({ ...f, visible_to_bd: e.target.checked }))}
                className="rounded border-zinc-700"
              />
              Visible to BD (uncheck to keep draft hidden)
            </label>
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {output.writeup_text && <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{output.writeup_text}</div>}
            {output.link && (
              <a href={output.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white">
                <ExternalLink size={11}/> {output.link}
              </a>
            )}
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-950/40">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-zinc-400 inline-flex items-center gap-1.5">
            <MessageSquare size={12} strokeWidth={1.5}/>
            {myComments.length} {myComments.length === 1 ? "comment" : "comments"}
            {openCount > 0 && <span className="text-amber-400">· {openCount} open</span>}
          </div>
          <button
            data-testid={`output-reply-toggle-${output.output_id}`}
            onClick={() => setShowComposer((s) => !s)}
            className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1"
          >
            <Plus size={11} strokeWidth={1.5}/> Comment
          </button>
        </div>
        <div className="space-y-3">
          {myComments.map((c) => (
            <Comment key={c.feedback_id} comment={c} currentUser={currentUser} onUpdated={onUpdated} onDeleted={onUpdated} />
          ))}
          {!myComments.length && !showComposer && (
            <div className="text-[11px] text-zinc-600">No comments yet.</div>
          )}
        </div>
        {showComposer && (
          <div className="mt-3">
            <CommentComposer
              dealId={dealId}
              outputId={output.output_id}
              testIdPrefix={`output-${output.output_id}-comment`}
              placeholder="Add a comment or change request on this output…"
              onPosted={() => { setShowComposer(false); onUpdated?.(); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export const DealDetail = () => {
  const { dealId } = useParams();
  const { user } = useAuth();
  const role = user?.role;
  const [data, setData] = useState(null);
  const [newOutput, setNewOutput] = useState({ type: "Writeup", title: "", writeup_text: "", link: "", status: "Draft", visible_to_bd: false });
  const [showOutputForm, setShowOutputForm] = useState(false);
  const [note, setNote] = useState("");
  const [briefEditBusy, setBriefEditBusy] = useState(false);
  const [fulfillmentUsers, setFulfillmentUsers] = useState([]);
  const [pages, setPages] = useState([]);
  const [showAddDeliv, setShowAddDeliv] = useState(false);
  const [newDeliv, setNewDeliv] = useState({ page_id: "", deliverable_type: "Reel", quantity: 1 });

  const load = async () => {
    const { data } = await api.get(`/deals/${dealId}`);
    setData(data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [dealId]);
  useEffect(() => {
    if (role === "admin" || role === "fulfillment") {
      api.get("/users/fulfillment").then(({ data }) => setFulfillmentUsers(data)).catch(() => {});
    }
    if (role === "admin" || role === "bd") {
      api.get("/pages", { params: { only_active: true } }).then(({ data }) => {
        setPages(data);
        setNewDeliv((d) => ({ ...d, page_id: data[0]?.page_id || "" }));
      }).catch(() => {});
    }
  }, [role]);

  if (!data) return <div className="text-zinc-500 text-sm">Loading…</div>;

  const d = data.deal;

  const updateDeliverable = async (id, payload) => {
    await api.put(`/deliverables/${id}`, payload);
    load();
  };
  const addDeliverables = async () => {
    if (!newDeliv.page_id) return;
    await api.post(`/deals/${dealId}/deliverables`, {
      page_id: newDeliv.page_id,
      deliverable_type: newDeliv.deliverable_type,
      quantity: Number(newDeliv.quantity) || 1,
    });
    setShowAddDeliv(false);
    setNewDeliv({ page_id: pages[0]?.page_id || "", deliverable_type: "Reel", quantity: 1 });
    load();
  };
  const removeDeliverable = async (id) => {
    if (!window.confirm("Remove this deliverable?")) return;
    await api.delete(`/deliverables/${id}`);
    load();
  };
  const updateDealStatus = async (status) => {
    await api.put(`/deals/${dealId}/status`, { deal_status: status });
    load();
  };
  const addOutput = async () => {
    if (!newOutput.title.trim()) return;
    await api.post("/outputs", {
      deal_id: dealId,
      output_type: newOutput.type,
      title: newOutput.title,
      writeup_text: newOutput.writeup_text,
      link: newOutput.link,
      status: newOutput.status,
      visible_to_bd: newOutput.visible_to_bd,
    });
    setNewOutput({ type: "Writeup", title: "", writeup_text: "", link: "", status: "Draft", visible_to_bd: false });
    setShowOutputForm(false);
    load();
  };
  const addNote = async () => {
    if (!note.trim()) return;
    await api.post("/notes", { deal_id: dealId, note_text: note.trim() });
    setNote("");
    load();
  };
  const updatePayment = async (status) => {
    await api.put(`/payments/${dealId}`, { status });
    load();
  };
  const updateDealField = async (payload) => {
    await api.put(`/deals/${dealId}`, payload);
    load();
  };
  const updatePaymentDetails = async (fields) => {
    await api.put(`/payments/${dealId}`, {
      status: data.payment.status,
      amount_received: data.payment.amount_received,
      payment_notes: data.payment.payment_notes || "",
      ...fields,
    });
    load();
  };

  const isAdmin = role === "admin";
  const canEditBrief = isAdmin || (role === "bd" && ["Submitted", "Needs More Info"].includes(d.admin_review_status));
  const canEditDeliverableSpec = isAdmin || (role === "bd" && ["Submitted", "Needs More Info"].includes(d.admin_review_status));
  const canManageDeliverables = role === "fulfillment" || role === "admin";

  const paymentOverdue = data.payment && data.payment.status !== "Paid" && d.payment_due_date && new Date(d.payment_due_date) < new Date();
  const generalComments = (data.client_feedback || []).filter((c) => !c.output_id);
  const canCreateOutput = role === "fulfillment" || role === "admin";

  return (
    <div data-testid="deal-detail" className="max-w-4xl mx-auto">
      <Link to="/deals" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white mb-4">
        <ArrowLeft size={12} strokeWidth={1.5}/> Back to deals
      </Link>

      <header className="mb-2">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{d.agency_or_client_name}</div>
        <h1 className="text-4xl font-semibold tracking-tight text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>{d.brand_name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <StatusBadge status={d.admin_review_status} />
          {d.deal_status && <StatusBadge status={d.deal_status} />}
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-400">Submitted by {d.submitted_by_user?.name} ({d.submitted_by_team?.team_name})</span>
          <span className="text-zinc-500">·</span>
          {isAdmin ? (
            <input
              data-testid="deal-go-live-edit"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(d.go_live_date_time)}
              onBlur={(e) => {
                if (!e.target.value) return;
                const iso = new Date(e.target.value).toISOString();
                if (iso !== d.go_live_date_time) updateDealField({ go_live_date_time: iso });
              }}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200"
            />
          ) : (
            <span className="text-zinc-400">Go live {formatDateTime(d.go_live_date_time)}</span>
          )}
        </div>
      </header>

      <div className="notion-content">
        {d.needs_more_info_comment && (
          <div className="mt-4 status-warning border rounded-lg px-3 py-2 text-xs">
            <span className="font-medium">Admin asked:</span> {d.needs_more_info_comment}
          </div>
        )}

        <Section title="Original brief">
          {canEditBrief ? (
            <BriefEditPanel deal={d} role={role} onSaved={load} busy={briefEditBusy} setBusy={setBriefEditBusy} />
          ) : (
            <>
              {d.brief_text && (
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-lg p-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap mb-3" data-testid="brief-text-display">
                  {d.brief_text}
                </div>
              )}
              {d.brief_link && (
                <a href={d.brief_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white">
                  <ExternalLink size={12} strokeWidth={1.5}/> Brief link
                </a>
              )}
              {!!(d.assets_or_reference_links?.length) && (
                <div className="mt-3 space-y-1">
                  {d.assets_or_reference_links.map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noreferrer" className="block text-xs text-zinc-400 hover:text-white truncate">
                      <Link2 size={11} strokeWidth={1.5} className="inline mr-1"/>{u}
                    </a>
                  ))}
                </div>
              )}
              {d.notes && (
                <div className="mt-3 text-xs text-zinc-500">
                  <span className="text-zinc-400 font-medium">Notes:</span> {d.notes}
                </div>
              )}
            </>
          )}
        </Section>

        <Section title={`Deliverables (${data.deliverables.length})`} action={
          <div className="flex items-center gap-2">
            {canEditDeliverableSpec && (
              <button
                data-testid="add-deliverable-button"
                onClick={() => setShowAddDeliv((s) => !s)}
                className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1"
              >
                <Plus size={12} strokeWidth={1.5}/> Add
              </button>
            )}
            {(role === "admin" || role === "fulfillment") && d.admin_review_status === "Approved" ? (
              <select
                data-testid="deal-status-select"
                value={d.deal_status || "Accepted"}
                onChange={(e) => updateDealStatus(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200"
              >
                {DEAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            ) : null}
          </div>
        }>
          {showAddDeliv && canEditDeliverableSpec && (
            <div className="mb-4 p-4 border border-zinc-800/60 rounded-lg space-y-2" data-testid="add-deliverable-form">
              <div className="grid grid-cols-12 gap-2 items-center">
                <select
                  data-testid="new-deliv-page"
                  value={newDeliv.page_id}
                  onChange={(e) => setNewDeliv((d) => ({ ...d, page_id: e.target.value }))}
                  className={inputCls + " col-span-5 text-xs"}
                >
                  {pages.map((p) => <option key={p.page_id} value={p.page_id}>{p.page_name}</option>)}
                </select>
                <select
                  data-testid="new-deliv-type"
                  value={newDeliv.deliverable_type}
                  onChange={(e) => setNewDeliv((d) => ({ ...d, deliverable_type: e.target.value }))}
                  className={inputCls + " col-span-3 text-xs"}
                >
                  {DELIVERABLE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <input
                  data-testid="new-deliv-qty"
                  type="number"
                  min={1}
                  value={newDeliv.quantity}
                  onChange={(e) => setNewDeliv((d) => ({ ...d, quantity: e.target.value }))}
                  className={inputCls + " col-span-2 text-xs"}
                />
                <button
                  data-testid="save-deliverable-button"
                  onClick={addDeliverables}
                  className="col-span-2 bg-white text-black hover:bg-zinc-200 rounded-lg px-2 py-2 text-xs font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {data.deliverables.map((dv) => (
              <div key={dv.deliverable_id} data-testid={`deliverable-${dv.deliverable_id}`} className="border border-zinc-800/60 rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{dv.page_name} <span className="text-zinc-500 text-xs">· {dv.deliverable_type}</span></div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Go live {formatDateTime(dv.go_live_date_time)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEditDeliverableSpec && data.deliverables.length > 1 && (
                      <button
                        data-testid={`deliv-remove-${dv.deliverable_id}`}
                        onClick={() => removeDeliverable(dv.deliverable_id)}
                        className="text-zinc-500 hover:text-rose-400"
                        title="Remove deliverable"
                      >
                        <Trash2 size={14} strokeWidth={1.5}/>
                      </button>
                    )}
                    {role === "fulfillment" || role === "admin" ? (
                      <select
                        data-testid={`deliv-status-${dv.deliverable_id}`}
                        value={dv.status}
                        onChange={(e) => updateDeliverable(dv.deliverable_id, { status: e.target.value })}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200"
                      >
                        {DELIVERABLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    ) : <StatusBadge status={dv.status} />}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {canManageDeliverables ? (
                    <>
                      <input
                        data-testid={`deliv-link-${dv.deliverable_id}`}
                        defaultValue={dv.live_link}
                        placeholder="Live link"
                        onBlur={(e) => e.target.value !== dv.live_link && updateDeliverable(dv.deliverable_id, { live_link: e.target.value })}
                        className={inputCls}
                      />
                      <input
                        data-testid={`deliv-views-${dv.deliverable_id}`}
                        type="number"
                        min={0}
                        defaultValue={dv.views}
                        placeholder="Views"
                        onBlur={(e) => Number(e.target.value) !== dv.views && updateDeliverable(dv.deliverable_id, { views: Number(e.target.value) })}
                        className={inputCls}
                      />
                      <input
                        data-testid={`deliv-notes-${dv.deliverable_id}`}
                        defaultValue={dv.notes || ""}
                        placeholder="Deliverable notes"
                        onBlur={(e) => e.target.value !== (dv.notes || "") && updateDeliverable(dv.deliverable_id, { notes: e.target.value })}
                        className={inputCls + " md:col-span-2"}
                      />
                      <select
                        data-testid={`deliv-assignee-${dv.deliverable_id}`}
                        value={dv.assigned_fulfillment_user_id || ""}
                        onChange={(e) => updateDeliverable(dv.deliverable_id, { assigned_fulfillment_user_id: e.target.value || null })}
                        className={inputCls + " md:col-span-2 text-xs"}
                      >
                        <option value="">Unassigned</option>
                        {fulfillmentUsers.map((u) => (
                          <option key={u.user_id} value={u.user_id}>{u.name}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      {dv.live_link ? <a href={dv.live_link} target="_blank" rel="noreferrer" className="text-xs text-zinc-300 hover:text-white inline-flex items-center gap-1"><ExternalLink size={11}/>{dv.live_link}</a> : <span className="text-xs text-zinc-600">No live link yet</span>}
                      <span className="text-xs text-zinc-300 tabular-nums">{Number(dv.views || 0).toLocaleString("en-IN")} views</span>
                    </>
                  )}
                </div>
              </div>
            ))}
            {!data.deliverables.length && <div className="text-xs text-zinc-500">No deliverables.</div>}
          </div>
        </Section>

        <Section
          title={`Outputs & changes (${data.fulfillment_outputs.length})`}
          action={canCreateOutput && (
            <button
              data-testid="add-output-button"
              onClick={() => setShowOutputForm((s) => !s)}
              className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1"
            >
              <Plus size={12} strokeWidth={1.5}/> Add output
            </button>
          )}
        >
          {showOutputForm && (
            <div className="mb-4 p-4 border border-zinc-800/60 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select value={newOutput.type} onChange={(e) => setNewOutput((o) => ({ ...o, type: e.target.value }))} className={inputCls}>
                  {OUTPUT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <input data-testid="output-title" placeholder="Title (e.g. Carousel — design v1)" value={newOutput.title} onChange={(e) => setNewOutput((o) => ({ ...o, title: e.target.value }))} className={inputCls} />
              </div>
              <input data-testid="output-link" placeholder="Link (Canva / Drive / GDoc / content URL)" value={newOutput.link} onChange={(e) => setNewOutput((o) => ({ ...o, link: e.target.value }))} className={inputCls} />
              <textarea data-testid="output-writeup" placeholder="Writeup text…" rows={3} value={newOutput.writeup_text} onChange={(e) => setNewOutput((o) => ({ ...o, writeup_text: e.target.value }))} className={inputCls + " resize-none"} />
              <div className="flex items-center gap-3 flex-wrap">
                <select data-testid="output-initial-status" value={newOutput.status} onChange={(e) => setNewOutput((o) => ({ ...o, status: e.target.value }))} className={inputCls + " w-auto"}>
                  {OUTPUT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <label className="inline-flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input
                    data-testid="output-visible-bd-new"
                    type="checkbox"
                    checked={newOutput.visible_to_bd}
                    onChange={(e) => setNewOutput((o) => ({ ...o, visible_to_bd: e.target.checked }))}
                    className="rounded border-zinc-700"
                  />
                  Visible to BD
                </label>
                <button data-testid="save-output" onClick={addOutput} className="bg-white text-black hover:bg-zinc-200 rounded-lg px-3 py-1.5 text-xs font-medium">Save output</button>
                <button onClick={() => setShowOutputForm(false)} className="text-xs text-zinc-400 hover:text-white">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {data.fulfillment_outputs.map((o) => (
              <OutputCard
                key={o.output_id}
                output={o}
                comments={data.client_feedback}
                currentUser={user}
                dealId={dealId}
                onUpdated={load}
              />
            ))}
            {!data.fulfillment_outputs.length && (
              <div className="text-xs text-zinc-500">
                {role === "bd" ? "Fulfillment hasn't shared anything yet." : "No outputs yet — add the first one above."}
              </div>
            )}
          </div>
        </Section>

        <Section title={`General deal comments${generalComments.length ? ` (${generalComments.length})` : ""}`}>
          <div className="text-[11px] text-zinc-600 mb-3">For comments that aren&apos;t about a specific output. Most client feedback should live on the output card above.</div>
          <div className="space-y-3 mb-3">
            {generalComments.map((c) => (
              <Comment key={c.feedback_id} comment={c} currentUser={user} onUpdated={load} onDeleted={load} />
            ))}
            {!generalComments.length && <div className="text-xs text-zinc-600">No general comments.</div>}
          </div>
          <CommentComposer
            dealId={dealId}
            outputId={null}
            testIdPrefix="general-comment"
            placeholder="Add a general comment about this deal…"
            onPosted={load}
          />
        </Section>

        {data.payment && (
          <Section title="Payment">
            {paymentOverdue && (
              <div className="status-error border rounded-lg px-3 py-2 text-xs mb-3 inline-flex items-center gap-2">
                <AlertTriangle size={13} strokeWidth={1.5}/> Payment overdue — was due {formatDate(d.payment_due_date)}.
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-zinc-500">Status</div>
                <div className="mt-1">
                  {(role === "admin" || role === "bd") ? (
                    <select data-testid="payment-status-select" value={data.payment.status} onChange={(e) => updatePayment(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200">
                      {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  ) : <StatusBadge status={data.payment.status} />}
                </div>
              </div>
              <div>
                <div className="text-zinc-500">Due date</div>
                <div className="mt-1">
                  {isAdmin ? (
                    <input
                      data-testid="payment-due-date-edit"
                      type="date"
                      defaultValue={toDateInputValue(d.payment_due_date)}
                      onBlur={(e) => {
                        if (!e.target.value) return;
                        const iso = new Date(e.target.value).toISOString();
                        if (iso !== d.payment_due_date) updateDealField({ payment_due_date: iso });
                      }}
                      className={inputCls + " text-xs py-1"}
                    />
                  ) : (
                    <div className="text-zinc-200">{formatDate(d.payment_due_date)}</div>
                  )}
                </div>
              </div>
              <div>
                <div className="text-zinc-500">Amount received</div>
                <div className="mt-1">
                  {isAdmin ? (
                    <input
                      data-testid="payment-amount-edit"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={data.payment.amount_received ?? ""}
                      placeholder="0"
                      onBlur={(e) => {
                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                        if (val !== (data.payment.amount_received ?? 0)) {
                          updatePaymentDetails({ amount_received: val });
                        }
                      }}
                      className={inputCls + " text-xs py-1 tabular-nums"}
                    />
                  ) : (
                    <div className="text-zinc-200 tabular-nums">{formatCurrency(data.payment.amount_received)}</div>
                  )}
                </div>
              </div>
              <div>
                <div className="text-zinc-500">Last updated by</div>
                <div className="text-zinc-200 mt-1">{data.payment.last_updated_by_name || "—"}</div>
                <div className="text-[10px] text-zinc-500">{formatDateTime(data.payment.last_updated_at)}</div>
              </div>
            </div>
            {isAdmin && (
              <div className="mt-4">
                <div className="text-zinc-500 text-xs mb-1">Payment notes</div>
                <textarea
                  data-testid="payment-notes-edit"
                  rows={2}
                  defaultValue={data.payment.payment_notes || ""}
                  placeholder="Add payment notes…"
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val !== (data.payment.payment_notes || "")) {
                      updatePaymentDetails({ payment_notes: val });
                    }
                  }}
                  className={inputCls + " text-xs resize-none"}
                />
              </div>
            )}
          </Section>
        )}

        {isAdmin && d.admin_review_status !== "Approved" && (
          <Section title="Commercial">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-zinc-500 mb-1">Price closed at</div>
                <input
                  data-testid="commercial-price-edit"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={d.price_closed_at ?? ""}
                  placeholder="0"
                  onBlur={(e) => {
                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                    if (val !== (d.price_closed_at ?? 0)) updateDealField({ price_closed_at: val });
                  }}
                  className={inputCls + " tabular-nums"}
                />
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Payment due</div>
                <input
                  data-testid="commercial-due-edit"
                  type="date"
                  defaultValue={toDateInputValue(d.payment_due_date)}
                  onBlur={(e) => {
                    if (!e.target.value) return;
                    const iso = new Date(e.target.value).toISOString();
                    if (iso !== d.payment_due_date) updateDealField({ payment_due_date: iso });
                  }}
                  className={inputCls}
                />
              </div>
            </div>
          </Section>
        )}

        {(role === "admin" || role === "bd") && d.admin_review_status === "Approved" && (
          <Section title="Revenue">
            <div className="text-xs text-zinc-500 mb-1">Closed at</div>
            {isAdmin ? (
              <input
                data-testid="revenue-edit"
                type="number"
                min={0}
                step={1}
                defaultValue={d.price_closed_at ?? ""}
                placeholder="0"
                onBlur={(e) => {
                  const val = e.target.value === "" ? 0 : Number(e.target.value);
                  if (val !== (d.price_closed_at ?? 0)) updateDealField({ price_closed_at: val });
                }}
                className={inputCls + " text-2xl font-semibold tabular-nums max-w-xs"}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              />
            ) : (
              <div className="text-2xl font-semibold text-white tabular-nums" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="revenue-display">
                {formatCurrency(d.price_closed_at)}
              </div>
            )}
          </Section>
        )}

        {(role === "admin" || role === "fulfillment") && (
          <Section title="Internal notes (fulfillment + admin only)">
            <div className="space-y-2 mb-3">
              {data.internal_notes.map((n) => (
                <div key={n.note_id} data-testid={`note-${n.note_id}`} className="border border-zinc-800/60 rounded-lg p-3">
                  <div className="text-[11px] text-zinc-500 mb-0.5">{n.created_by_name} · {formatDateTime(n.created_at)}</div>
                  <div className="text-sm text-zinc-200 whitespace-pre-wrap">{n.note_text}</div>
                </div>
              ))}
              {!data.internal_notes.length && <div className="text-xs text-zinc-500">No notes.</div>}
            </div>
            <div className="flex gap-2">
              <input data-testid="note-input" placeholder="Add an internal note…" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
              <button data-testid="add-note-button" onClick={addNote} className="bg-white text-black hover:bg-zinc-200 rounded-lg px-3 py-1.5 text-xs font-medium">Add</button>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default DealDetail;
