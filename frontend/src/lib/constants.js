export const ROLES = ["pending", "admin", "bd", "fulfillment"];

export const ADMIN_REVIEW_STATUSES = ["Submitted", "Needs More Info", "Rejected", "Approved", "Cancelled"];
export const DEAL_STATUSES = ["Accepted", "In Progress", "Client Review", "Approved", "Scheduled", "Posted", "Completed", "Cancelled"];
export const DELIVERABLE_STATUSES = ["Not Started", "Writing", "Designing", "Client Review", "Approved", "Scheduled", "Posted", "Completed", "Blocked"];
export const PAYMENT_STATUSES = ["Not Raised", "Raised", "Payment Pending", "Partially Paid", "Paid"];
export const DELIVERABLE_TYPES = ["Reel", "Static", "Carousel"];
export const OUTPUT_TYPES = ["Writeup", "Canva Link", "Drive Link", "Google Doc Link", "Content Link", "Other"];
export const OUTPUT_STATUSES = ["Draft", "Shared with BD", "Changes Requested", "Updated", "Approved", "Final"];

export const formatCurrency = (n) => {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));
};

export const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const pad2 = (n) => String(n).padStart(2, "0");

/** ISO string → value for `<input type="datetime-local">` */
export const toDatetimeLocalValue = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

/** ISO string → value for `<input type="date">` */
export const toDateInputValue = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const monthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { from_date: start, to_date: end };
};

export const statusColor = (status) => {
  const s = (status || "").toLowerCase();
  if (["approved", "paid", "completed", "posted", "final", "resolved"].includes(s)) return "status-success";
  if (["submitted", "needs more info", "raised", "scheduled", "writing", "designing", "client review", "in progress", "partially paid", "payment pending", "accepted", "shared with bd", "changes requested", "updated"].includes(s)) return "status-warning";
  if (["rejected", "cancelled", "blocked"].includes(s)) return "status-error";
  if (["not raised", "not started", "draft", "open"].includes(s)) return "status-neutral";
  return "status-info";
};
