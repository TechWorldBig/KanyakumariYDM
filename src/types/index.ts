export type Page =
  | "Overview"
  | "Live analytics"
  | "Sections"
  | "Churches"
  | "Users"
  | "Reports"
  | "Audit logs"
  | "Access control";
export type UserRole =
  | "district"
  | "head-pastor"
  | "think-tank"
  | "section-pastor"
  | "church-pastor"
  | "district-ydm"
  | "district-women"
  | "section1"
  | "section2"
  | "section3"
  | "section4";
export type AccountType = "section" | "church" | "user";
export interface Section {
  name: string;
  town: string;
  description?: string;
  admin: string;
  churches: number;
  users: number;
  tone: string;
  health: number;
}
