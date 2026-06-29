import React from "react";
import { statusColor } from "../lib/constants";

export const StatusBadge = ({ status, testId }) => {
  if (!status) return null;
  return (
    <span
      data-testid={testId || `status-${status.toLowerCase().replace(/\s+/g, "-")}`}
      className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusColor(status)}`}
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      {status}
    </span>
  );
};
