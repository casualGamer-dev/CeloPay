"use client";
import { Chip } from "@mui/material";

const map: Record<string, { label: string; color: "default" | "primary" | "secondary" | "success" | "warning" | "error" | undefined; }> = {
  pending:  { label: "Pending",  color: "warning" },
  approved: { label: "Approved", color: "success" },
  rejected: { label: "Rejected", color: "error" },
  active:   { label: "Active",   color: "primary" },
  closed:   { label: "Closed",   color: "default" },
};

export default function StatusChip({ status }: { status?: string }) {
  const key = (status || "pending").toLowerCase();
  const cfg = map[key] || { label: status || "Unknown", color: "default" as const };
  return <Chip size="small" label={cfg.label} color={cfg.color} />;
}
