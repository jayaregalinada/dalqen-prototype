import type { Role, User } from "../shared/types";
export const roleDefs: Array<{ key: Role; label: string; stages: string[] }> = [
  { key: "owner", label: "Workspace Owner", stages: [] },
  { key: "artist", label: "Artist", stages: ["Layout", "Sizing"] },
  { key: "printer", label: "Printer", stages: ["Printing", "Heatpress"] },
  { key: "sewer", label: "Sewer", stages: ["Sewing"] },
  { key: "heatpress", label: "Heatpress", stages: ["Heatpress"] },
  { key: "qc", label: "Quality Control", stages: ["QC"] },
  { key: "release", label: "Release", stages: ["Release", "Completed"] },
];
export const users: User[] = [
  { id: "owner", name: "Workspace Owner", role: "owner", initials: "WO", dept: null },
  { id: "jamie", name: "Jamie Reyes", role: "artist", initials: "JR", dept: "Layout & Sizing" },
  { id: "maya", name: "Maya Santos", role: "artist", initials: "MS", dept: "Layout & Sizing" },
  { id: "rafael", name: "Rafael Torres", role: "printer", initials: "RT", dept: "Printing & Heatpress" },
  { id: "liza", name: "Liza Ramos", role: "printer", initials: "LR", dept: "Printing & Heatpress" },
  { id: "elena", name: "Elena Cruz", role: "sewer", initials: "EC", dept: "Sewing" },
  { id: "marco", name: "Marco Diaz", role: "sewer", initials: "MD", dept: "Sewing" },
  { id: "rosa", name: "Rosa Lim", role: "heatpress", initials: "RL", dept: "Heatpress" },
  { id: "tomas", name: "Tomas Aquino", role: "heatpress", initials: "TA", dept: "Heatpress" },
  { id: "nina", name: "Nina Bautista", role: "qc", initials: "NB", dept: "QC" },
  { id: "carlos", name: "Carlos Vega", role: "qc", initials: "CV", dept: "QC" },
  { id: "dan", name: "Dan Rivera", role: "release", initials: "DR", dept: "Release" },
  { id: "sofia", name: "Sofia Mendoza", role: "release", initials: "SM", dept: "Release" },
];
export const stages = ["Layout", "Approval", "Document", "Sizing", "Printing", "Heatpress", "Sewing", "QC", "Release", "Completed"];
