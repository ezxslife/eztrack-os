"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
  AlertTriangle,
  Radio,
  Briefcase,
  Link as LinkIcon,
  Users,
  GraduationCap,
  DollarSign,
  UserCheck,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { DataGrid } from "@/components/ui/DataGrid";
import { useToast } from "@/components/ui/Toast";

/* ── Report Metadata ── */
interface ReportMeta {
  name: string;
  description: string;
  icon: LucideIcon;
}

const REPORT_META: Record<string, ReportMeta> = {
  "daily-activity": { name: "Daily Activity Summary", description: "All daily log entries for a selected date range", icon: FileText },
  "incident-summary": { name: "Incident Summary Report", description: "All incidents with classification, status, and response times", icon: AlertTriangle },
  "dispatch-performance": { name: "Dispatch Performance", description: "Response times, resolution rates, officer workload", icon: Radio },
  "case-status": { name: "Case Status Report", description: "Active investigations, stage breakdown, aging", icon: Briefcase },
  "evidence-custody": { name: "Evidence Chain of Custody", description: "Full chain of custody audit trail", icon: LinkIcon },
  "shift-coverage": { name: "Shift Coverage Report", description: "Staff coverage by zone, shift gaps", icon: Users },
  "training-compliance": { name: "Training Compliance", description: "Certification status, expiring qualifications", icon: GraduationCap },
  "savings-losses": { name: "Savings & Losses Summary", description: "Financial impact across all incidents", icon: DollarSign },
  "visitor-log": { name: "Visitor Log", description: "All visits with sign-in/out times", icon: UserCheck },
  "patron-flags": { name: "Patron Flags & Bans", description: "Active flags, ban history, watch list", icon: Shield },
};

/* ── Property Options ── */
const PROPERTY_OPTIONS = [
  { value: "", label: "All Properties" },
  { value: "main-venue", label: "Main Venue" },
  { value: "north-campus", label: "North Campus" },
  { value: "south-campus", label: "South Campus" },
  { value: "parking-complex", label: "Parking Complex" },
];

/* ── Stat Card ── */
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="py-3">
        <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{label}</p>
        <p className="text-lg font-semibold text-[var(--text-primary)] mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/* ── Mock Data Generators ── */
function getDailyActivityData() {
  return {
    stats: [
      { label: "Total Entries", value: "147", sub: "Last 7 days" },
      { label: "High Priority", value: "23", sub: "15.6% of total" },
      { label: "Locations Covered", value: "12", sub: "All zones active" },
      { label: "Avg Per Day", value: "21", sub: "+3 vs prior week" },
    ],
    columns: [
      { key: "date", label: "Date", sortable: true },
      { key: "time", label: "Time" },
      { key: "topic", label: "Topic", sortable: true },
      { key: "priority", label: "Priority", sortable: true, render: (row: Record<string, unknown>) => <Badge tone={row.priority === "High" ? "critical" : row.priority === "Medium" ? "warning" : "default"}>{row.priority as string}</Badge> },
      { key: "location", label: "Location" },
      { key: "officer", label: "Officer" },
      { key: "status", label: "Status", render: (row: Record<string, unknown>) => <Badge tone={row.status === "Complete" ? "success" : "info"} dot>{row.status as string}</Badge> },
    ],
    rows: [
      { id: "1", date: "Apr 5, 2026", time: "06:00", topic: "Shift Handover", priority: "Low", location: "Control Room", officer: "Sgt. Patel", status: "Complete" },
      { id: "2", date: "Apr 5, 2026", time: "07:15", topic: "Perimeter Check", priority: "Medium", location: "North Fence", officer: "Officer Chen", status: "Complete" },
      { id: "3", date: "Apr 5, 2026", time: "08:30", topic: "Visitor Surge", priority: "High", location: "Main Gate", officer: "Officer Rivera", status: "In Progress" },
      { id: "4", date: "Apr 5, 2026", time: "09:00", topic: "Equipment Check", priority: "Low", location: "Storage B", officer: "Officer Davis", status: "Complete" },
      { id: "5", date: "Apr 5, 2026", time: "10:20", topic: "Suspicious Activity", priority: "High", location: "Parking Lot C", officer: "Sgt. Patel", status: "In Progress" },
      { id: "6", date: "Apr 4, 2026", time: "14:00", topic: "Fire Drill", priority: "Medium", location: "Building A", officer: "Lt. Nguyen", status: "Complete" },
      { id: "7", date: "Apr 4, 2026", time: "16:30", topic: "Access Badge Issue", priority: "Low", location: "HR Office", officer: "Officer Martinez", status: "Complete" },
      { id: "8", date: "Apr 4, 2026", time: "18:00", topic: "Alarm Trigger", priority: "High", location: "Server Room", officer: "Officer Chen", status: "Complete" },
      { id: "9", date: "Apr 3, 2026", time: "08:00", topic: "Morning Briefing", priority: "Low", location: "Control Room", officer: "Sgt. Patel", status: "Complete" },
      { id: "10", date: "Apr 3, 2026", time: "11:45", topic: "Medical Call", priority: "High", location: "South Lawn", officer: "Officer Rivera", status: "Complete" },
      { id: "11", date: "Apr 3, 2026", time: "13:00", topic: "Vendor Escort", priority: "Low", location: "Loading Dock", officer: "Officer Davis", status: "Complete" },
      { id: "12", date: "Apr 3, 2026", time: "20:00", topic: "Night Patrol Start", priority: "Medium", location: "All Zones", officer: "Officer Martinez", status: "Complete" },
    ],
  };
}

function getIncidentSummaryData() {
  return {
    stats: [
      { label: "Total Incidents", value: "68", sub: "Last 30 days" },
      { label: "Avg Response Time", value: "4.2 min", sub: "-0.8 vs prior month" },
      { label: "Resolution Rate", value: "91%", sub: "62 of 68 resolved" },
      { label: "Critical", value: "8", sub: "11.8% of total" },
    ],
    columns: [
      { key: "number", label: "Incident #", sortable: true },
      { key: "type", label: "Type", sortable: true },
      { key: "severity", label: "Severity", sortable: true, render: (row: Record<string, unknown>) => <Badge tone={row.severity === "Critical" ? "critical" : row.severity === "High" ? "warning" : "default"}>{row.severity as string}</Badge> },
      { key: "location", label: "Location" },
      { key: "status", label: "Status", render: (row: Record<string, unknown>) => <Badge tone={row.status === "Closed" ? "success" : row.status === "Open" ? "critical" : "info"} dot>{row.status as string}</Badge> },
      { key: "responseTime", label: "Response Time", sortable: true },
      { key: "date", label: "Date", sortable: true },
    ],
    rows: [
      { id: "1", number: "INC-2026-0068", type: "Medical", severity: "Critical", location: "Main Stage", status: "Closed", responseTime: "2.1 min", date: "Apr 5, 2026" },
      { id: "2", number: "INC-2026-0067", type: "Theft", severity: "High", location: "VIP Tent A", status: "In Progress", responseTime: "3.4 min", date: "Apr 5, 2026" },
      { id: "3", number: "INC-2026-0066", type: "Assault", severity: "Critical", location: "Gate B", status: "In Progress", responseTime: "1.8 min", date: "Apr 4, 2026" },
      { id: "4", number: "INC-2026-0065", type: "Disturbance", severity: "Medium", location: "Food Court", status: "Closed", responseTime: "5.2 min", date: "Apr 4, 2026" },
      { id: "5", number: "INC-2026-0064", type: "Vandalism", severity: "Low", location: "Restroom Block 4", status: "Closed", responseTime: "8.1 min", date: "Apr 4, 2026" },
      { id: "6", number: "INC-2026-0063", type: "Drug/Alcohol", severity: "Medium", location: "Campground C", status: "Closed", responseTime: "4.5 min", date: "Apr 3, 2026" },
      { id: "7", number: "INC-2026-0062", type: "Security Breach", severity: "High", location: "Backstage", status: "Closed", responseTime: "2.3 min", date: "Apr 3, 2026" },
      { id: "8", number: "INC-2026-0061", type: "Trespassing", severity: "Low", location: "Perimeter N", status: "Closed", responseTime: "6.7 min", date: "Apr 3, 2026" },
      { id: "9", number: "INC-2026-0060", type: "Medical", severity: "High", location: "South Lawn", status: "Closed", responseTime: "2.9 min", date: "Apr 2, 2026" },
      { id: "10", number: "INC-2026-0059", type: "Fire/Hazard", severity: "Critical", location: "Vendor Row E", status: "Closed", responseTime: "1.5 min", date: "Apr 2, 2026" },
      { id: "11", number: "INC-2026-0058", type: "Missing Person", severity: "High", location: "Family Zone", status: "Closed", responseTime: "3.0 min", date: "Apr 1, 2026" },
      { id: "12", number: "INC-2026-0057", type: "Disturbance", severity: "Low", location: "Parking Lot D", status: "Open", responseTime: "7.3 min", date: "Apr 1, 2026" },
    ],
  };
}

function getDispatchPerformanceData() {
  return {
    stats: [
      { label: "Avg Response Time", value: "3.8 min", sub: "Target: < 5 min" },
      { label: "Resolution Rate", value: "94%", sub: "189 of 201 resolved" },
      { label: "Total Dispatches", value: "201", sub: "Last 30 days" },
      { label: "Active Officers", value: "18", sub: "Across 3 shifts" },
    ],
    columns: [
      { key: "officer", label: "Officer", sortable: true },
      { key: "dispatches", label: "Dispatches", sortable: true },
      { key: "avgResponse", label: "Avg Response", sortable: true },
      { key: "resolved", label: "Resolved", sortable: true },
      { key: "rate", label: "Resolution Rate", sortable: true },
      { key: "shift", label: "Shift" },
      { key: "zone", label: "Zone" },
    ],
    rows: [
      { id: "1", officer: "Sgt. Patel", dispatches: "28", avgResponse: "2.4 min", resolved: "27", rate: "96%", shift: "Day", zone: "North" },
      { id: "2", officer: "Officer Rivera", dispatches: "24", avgResponse: "3.1 min", resolved: "23", rate: "96%", shift: "Day", zone: "South" },
      { id: "3", officer: "Officer Chen", dispatches: "22", avgResponse: "3.5 min", resolved: "21", rate: "95%", shift: "Day", zone: "East" },
      { id: "4", officer: "Lt. Nguyen", dispatches: "18", avgResponse: "2.8 min", resolved: "17", rate: "94%", shift: "Day", zone: "Command" },
      { id: "5", officer: "Officer Davis", dispatches: "20", avgResponse: "4.2 min", resolved: "18", rate: "90%", shift: "Swing", zone: "North" },
      { id: "6", officer: "Officer Martinez", dispatches: "19", avgResponse: "3.9 min", resolved: "18", rate: "95%", shift: "Swing", zone: "South" },
      { id: "7", officer: "Sgt. Wilson", dispatches: "16", avgResponse: "3.0 min", resolved: "15", rate: "94%", shift: "Swing", zone: "West" },
      { id: "8", officer: "Officer Taylor", dispatches: "15", avgResponse: "4.8 min", resolved: "14", rate: "93%", shift: "Night", zone: "North" },
      { id: "9", officer: "Officer Brown", dispatches: "14", avgResponse: "5.1 min", resolved: "13", rate: "93%", shift: "Night", zone: "South" },
      { id: "10", officer: "Officer Lee", dispatches: "12", avgResponse: "4.0 min", resolved: "11", rate: "92%", shift: "Night", zone: "Perimeter" },
      { id: "11", officer: "Officer Kim", dispatches: "8", avgResponse: "3.6 min", resolved: "8", rate: "100%", shift: "Day", zone: "West" },
      { id: "12", officer: "Officer Garcia", dispatches: "5", avgResponse: "4.4 min", resolved: "4", rate: "80%", shift: "Swing", zone: "East" },
    ],
  };
}

function getCaseStatusData() {
  return {
    stats: [
      { label: "Active Cases", value: "24", sub: "Across all stages" },
      { label: "Intake", value: "6", sub: "Awaiting assignment" },
      { label: "Under Investigation", value: "12", sub: "50% of active" },
      { label: "Avg Case Age", value: "8.3 days", sub: "-1.2 vs last month" },
    ],
    columns: [
      { key: "caseNumber", label: "Case #", sortable: true },
      { key: "title", label: "Title" },
      { key: "stage", label: "Stage", render: (row: Record<string, unknown>) => <Badge tone={row.stage === "Closed" ? "success" : row.stage === "Intake" ? "attention" : "info"} dot>{row.stage as string}</Badge> },
      { key: "assignee", label: "Investigator" },
      { key: "priority", label: "Priority", render: (row: Record<string, unknown>) => <Badge tone={row.priority === "High" ? "critical" : row.priority === "Medium" ? "warning" : "default"}>{row.priority as string}</Badge> },
      { key: "age", label: "Age", sortable: true },
      { key: "updated", label: "Last Updated", sortable: true },
    ],
    rows: [
      { id: "1", caseNumber: "CSE-2026-0024", title: "VIP Tent Theft Ring", stage: "Investigation", assignee: "Det. Brooks", priority: "High", age: "3 days", updated: "Apr 5, 2026" },
      { id: "2", caseNumber: "CSE-2026-0023", title: "Counterfeit Tickets", stage: "Investigation", assignee: "Det. Collins", priority: "High", age: "5 days", updated: "Apr 4, 2026" },
      { id: "3", caseNumber: "CSE-2026-0022", title: "Staff Misconduct", stage: "Review", assignee: "Sgt. Patel", priority: "Medium", age: "7 days", updated: "Apr 4, 2026" },
      { id: "4", caseNumber: "CSE-2026-0021", title: "Vendor Fraud Allegation", stage: "Intake", assignee: "Unassigned", priority: "Medium", age: "2 days", updated: "Apr 5, 2026" },
      { id: "5", caseNumber: "CSE-2026-0020", title: "Assault - Gate B", stage: "Investigation", assignee: "Det. Brooks", priority: "High", age: "4 days", updated: "Apr 4, 2026" },
      { id: "6", caseNumber: "CSE-2026-0019", title: "Equipment Theft", stage: "Investigation", assignee: "Det. Collins", priority: "Medium", age: "9 days", updated: "Apr 3, 2026" },
      { id: "7", caseNumber: "CSE-2026-0018", title: "Trespassing Repeat Offender", stage: "Closed", assignee: "Det. Brooks", priority: "Low", age: "12 days", updated: "Apr 2, 2026" },
      { id: "8", caseNumber: "CSE-2026-0017", title: "Arson Attempt - Vendor Row", stage: "Investigation", assignee: "Det. Collins", priority: "High", age: "10 days", updated: "Apr 1, 2026" },
      { id: "9", caseNumber: "CSE-2026-0016", title: "Missing Property Claim", stage: "Intake", assignee: "Unassigned", priority: "Low", age: "1 day", updated: "Apr 5, 2026" },
      { id: "10", caseNumber: "CSE-2026-0015", title: "Harassment Report", stage: "Review", assignee: "Sgt. Patel", priority: "Medium", age: "14 days", updated: "Mar 31, 2026" },
    ],
  };
}

function getEvidenceCustodyData() {
  return {
    stats: [
      { label: "Total Items", value: "43", sub: "In evidence storage" },
      { label: "Transfers Today", value: "5", sub: "All documented" },
      { label: "Pending Checkout", value: "3", sub: "Awaiting approval" },
      { label: "Chain Intact", value: "100%", sub: "No breaks detected" },
    ],
    columns: [
      { key: "evidenceId", label: "Evidence ID", sortable: true },
      { key: "description", label: "Description" },
      { key: "caseNumber", label: "Case #" },
      { key: "custodian", label: "Current Custodian" },
      { key: "action", label: "Last Action" },
      { key: "timestamp", label: "Timestamp", sortable: true },
      { key: "location", label: "Storage Location" },
    ],
    rows: [
      { id: "1", evidenceId: "EV-2026-0089", description: "Knife (sealed bag)", caseNumber: "CSE-2026-0020", custodian: "Det. Brooks", action: "Checked Out", timestamp: "Apr 5, 10:30", location: "Locker B-12" },
      { id: "2", evidenceId: "EV-2026-0088", description: "CCTV Footage USB", caseNumber: "CSE-2026-0024", custodian: "Evidence Room", action: "Returned", timestamp: "Apr 5, 09:15", location: "Digital Vault" },
      { id: "3", evidenceId: "EV-2026-0087", description: "Counterfeit tickets (5x)", caseNumber: "CSE-2026-0023", custodian: "Det. Collins", action: "Checked Out", timestamp: "Apr 4, 16:00", location: "Locker A-04" },
      { id: "4", evidenceId: "EV-2026-0086", description: "Wallet (recovered)", caseNumber: "CSE-2026-0019", custodian: "Evidence Room", action: "Logged In", timestamp: "Apr 4, 14:20", location: "Shelf C-08" },
      { id: "5", evidenceId: "EV-2026-0085", description: "Accelerant sample", caseNumber: "CSE-2026-0017", custodian: "Lab", action: "Transferred", timestamp: "Apr 4, 11:00", location: "External Lab" },
      { id: "6", evidenceId: "EV-2026-0084", description: "Clothing item", caseNumber: "CSE-2026-0020", custodian: "Evidence Room", action: "Returned", timestamp: "Apr 3, 17:45", location: "Locker B-13" },
      { id: "7", evidenceId: "EV-2026-0083", description: "Photo printouts (8x)", caseNumber: "CSE-2026-0022", custodian: "Sgt. Patel", action: "Checked Out", timestamp: "Apr 3, 10:30", location: "Desk File" },
      { id: "8", evidenceId: "EV-2026-0082", description: "Access badge (cloned)", caseNumber: "CSE-2026-0024", custodian: "Evidence Room", action: "Logged In", timestamp: "Apr 2, 15:00", location: "Locker A-02" },
    ],
  };
}

function getShiftCoverageData() {
  return {
    stats: [
      { label: "Total Staff", value: "42", sub: "Active personnel" },
      { label: "Coverage Rate", value: "96%", sub: "All shifts combined" },
      { label: "Open Gaps", value: "2", sub: "Night shift, Zone W" },
      { label: "Overtime Hours", value: "38h", sub: "This week" },
    ],
    columns: [
      { key: "zone", label: "Zone", sortable: true },
      { key: "shift", label: "Shift", sortable: true },
      { key: "required", label: "Required" },
      { key: "assigned", label: "Assigned" },
      { key: "coverage", label: "Coverage", render: (row: Record<string, unknown>) => <Badge tone={(row.coverage as string) === "100%" ? "success" : "warning"}>{row.coverage as string}</Badge> },
      { key: "lead", label: "Shift Lead" },
      { key: "notes", label: "Notes" },
    ],
    rows: [
      { id: "1", zone: "North", shift: "Day (06-14)", required: "4", assigned: "4", coverage: "100%", lead: "Sgt. Patel", notes: "-" },
      { id: "2", zone: "South", shift: "Day (06-14)", required: "3", assigned: "3", coverage: "100%", lead: "Officer Rivera", notes: "-" },
      { id: "3", zone: "East", shift: "Day (06-14)", required: "3", assigned: "3", coverage: "100%", lead: "Officer Chen", notes: "-" },
      { id: "4", zone: "West", shift: "Day (06-14)", required: "2", assigned: "2", coverage: "100%", lead: "Officer Kim", notes: "-" },
      { id: "5", zone: "North", shift: "Swing (14-22)", required: "4", assigned: "4", coverage: "100%", lead: "Officer Davis", notes: "-" },
      { id: "6", zone: "South", shift: "Swing (14-22)", required: "3", assigned: "3", coverage: "100%", lead: "Officer Martinez", notes: "-" },
      { id: "7", zone: "West", shift: "Swing (14-22)", required: "2", assigned: "2", coverage: "100%", lead: "Sgt. Wilson", notes: "-" },
      { id: "8", zone: "North", shift: "Night (22-06)", required: "3", assigned: "3", coverage: "100%", lead: "Officer Taylor", notes: "-" },
      { id: "9", zone: "South", shift: "Night (22-06)", required: "3", assigned: "3", coverage: "100%", lead: "Officer Brown", notes: "-" },
      { id: "10", zone: "West", shift: "Night (22-06)", required: "2", assigned: "1", coverage: "50%", lead: "Officer Lee", notes: "1 gap - pending fill" },
      { id: "11", zone: "Perimeter", shift: "Night (22-06)", required: "2", assigned: "2", coverage: "100%", lead: "Officer Lee", notes: "-" },
      { id: "12", zone: "Command", shift: "All", required: "2", assigned: "2", coverage: "100%", lead: "Lt. Nguyen", notes: "24h coverage" },
    ],
  };
}

function getTrainingComplianceData() {
  return {
    stats: [
      { label: "Total Personnel", value: "42", sub: "Active staff" },
      { label: "Fully Compliant", value: "36", sub: "85.7% of staff" },
      { label: "Expiring Soon", value: "4", sub: "Within 30 days" },
      { label: "Overdue", value: "2", sub: "Requires immediate action" },
    ],
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "role", label: "Role" },
      { key: "certification", label: "Certification" },
      { key: "status", label: "Status", render: (row: Record<string, unknown>) => <Badge tone={row.status === "Current" ? "success" : row.status === "Expiring" ? "warning" : "critical"} dot>{row.status as string}</Badge> },
      { key: "expiryDate", label: "Expiry Date", sortable: true },
      { key: "daysLeft", label: "Days Left", sortable: true },
    ],
    rows: [
      { id: "1", name: "Sgt. Patel", role: "Shift Lead", certification: "CPR/First Aid", status: "Current", expiryDate: "Nov 15, 2026", daysLeft: "224" },
      { id: "2", name: "Officer Rivera", role: "Patrol", certification: "Use of Force", status: "Expiring", expiryDate: "May 1, 2026", daysLeft: "26" },
      { id: "3", name: "Officer Chen", role: "Patrol", certification: "CPR/First Aid", status: "Overdue", expiryDate: "Mar 20, 2026", daysLeft: "-16" },
      { id: "4", name: "Lt. Nguyen", role: "Commander", certification: "Incident Command", status: "Current", expiryDate: "Dec 1, 2026", daysLeft: "240" },
      { id: "5", name: "Officer Davis", role: "Patrol", certification: "Radio Operations", status: "Current", expiryDate: "Aug 15, 2026", daysLeft: "132" },
      { id: "6", name: "Officer Martinez", role: "Patrol", certification: "CPR/First Aid", status: "Expiring", expiryDate: "Apr 28, 2026", daysLeft: "23" },
      { id: "7", name: "Sgt. Wilson", role: "Shift Lead", certification: "Crowd Management", status: "Current", expiryDate: "Sep 10, 2026", daysLeft: "158" },
      { id: "8", name: "Officer Taylor", role: "Patrol", certification: "Use of Force", status: "Expiring", expiryDate: "May 5, 2026", daysLeft: "30" },
      { id: "9", name: "Officer Brown", role: "Patrol", certification: "CPR/First Aid", status: "Current", expiryDate: "Jul 20, 2026", daysLeft: "106" },
      { id: "10", name: "Officer Lee", role: "Patrol", certification: "Radio Operations", status: "Overdue", expiryDate: "Mar 15, 2026", daysLeft: "-21" },
      { id: "11", name: "Det. Brooks", role: "Investigator", certification: "Evidence Handling", status: "Current", expiryDate: "Oct 1, 2026", daysLeft: "179" },
      { id: "12", name: "Det. Collins", role: "Investigator", certification: "Interview Techniques", status: "Expiring", expiryDate: "May 10, 2026", daysLeft: "35" },
    ],
  };
}

function getSavingsLossesData() {
  return {
    stats: [
      { label: "Total Losses", value: "$48,250", sub: "Last 30 days" },
      { label: "Recovered", value: "$31,800", sub: "65.9% recovery rate" },
      { label: "Net Loss", value: "$16,450", sub: "-$4,200 vs prior month" },
      { label: "Savings from Prevention", value: "$72,000", sub: "Estimated" },
    ],
    columns: [
      { key: "incidentRef", label: "Incident Ref", sortable: true },
      { key: "type", label: "Type" },
      { key: "lossAmount", label: "Loss Amount", sortable: true },
      { key: "recovered", label: "Recovered", sortable: true },
      { key: "netLoss", label: "Net Loss" },
      { key: "category", label: "Category" },
      { key: "date", label: "Date", sortable: true },
    ],
    rows: [
      { id: "1", incidentRef: "INC-2026-0068", type: "Medical", lossAmount: "$0", recovered: "$0", netLoss: "$0", category: "Personnel", date: "Apr 5, 2026" },
      { id: "2", incidentRef: "INC-2026-0067", type: "Theft", lossAmount: "$12,500", recovered: "$8,200", netLoss: "$4,300", category: "Property", date: "Apr 5, 2026" },
      { id: "3", incidentRef: "INC-2026-0064", type: "Vandalism", lossAmount: "$3,200", recovered: "$0", netLoss: "$3,200", category: "Property", date: "Apr 4, 2026" },
      { id: "4", incidentRef: "INC-2026-0062", type: "Security Breach", lossAmount: "$8,000", recovered: "$8,000", netLoss: "$0", category: "Operations", date: "Apr 3, 2026" },
      { id: "5", incidentRef: "INC-2026-0059", type: "Fire/Hazard", lossAmount: "$15,000", recovered: "$10,000", netLoss: "$5,000", category: "Property", date: "Apr 2, 2026" },
      { id: "6", incidentRef: "INC-2026-0058", type: "Missing Person", lossAmount: "$0", recovered: "$0", netLoss: "$0", category: "Personnel", date: "Apr 1, 2026" },
      { id: "7", incidentRef: "INC-2026-0055", type: "Theft", lossAmount: "$4,800", recovered: "$3,200", netLoss: "$1,600", category: "Property", date: "Mar 30, 2026" },
      { id: "8", incidentRef: "INC-2026-0052", type: "Vandalism", lossAmount: "$2,750", recovered: "$400", netLoss: "$2,350", category: "Property", date: "Mar 28, 2026" },
      { id: "9", incidentRef: "INC-2026-0049", type: "Theft", lossAmount: "$2,000", recovered: "$2,000", netLoss: "$0", category: "Property", date: "Mar 26, 2026" },
    ],
  };
}

function getVisitorLogData() {
  return {
    stats: [
      { label: "Total Visits", value: "312", sub: "Last 7 days" },
      { label: "Currently On-site", value: "18", sub: "Not yet signed out" },
      { label: "Avg Duration", value: "2.4 hrs", sub: "Per visit" },
      { label: "Peak Day", value: "Apr 3", sub: "67 visitors" },
    ],
    columns: [
      { key: "visitorName", label: "Visitor", sortable: true },
      { key: "company", label: "Company" },
      { key: "host", label: "Host" },
      { key: "signIn", label: "Sign In", sortable: true },
      { key: "signOut", label: "Sign Out" },
      { key: "duration", label: "Duration" },
      { key: "badge", label: "Badge #" },
    ],
    rows: [
      { id: "1", visitorName: "James Morton", company: "AV Solutions", host: "Lt. Nguyen", signIn: "Apr 5, 08:00", signOut: "Apr 5, 11:30", duration: "3h 30m", badge: "V-201" },
      { id: "2", visitorName: "Sarah Chen", company: "Fire Marshal", host: "Sgt. Patel", signIn: "Apr 5, 09:15", signOut: "-", duration: "On-site", badge: "V-202" },
      { id: "3", visitorName: "Michael Torres", company: "Catering Co.", host: "Officer Davis", signIn: "Apr 5, 07:00", signOut: "Apr 5, 15:00", duration: "8h 0m", badge: "V-203" },
      { id: "4", visitorName: "Emily Lawson", company: "Insurance Adj.", host: "Det. Brooks", signIn: "Apr 4, 10:00", signOut: "Apr 4, 12:30", duration: "2h 30m", badge: "V-198" },
      { id: "5", visitorName: "David Park", company: "IT Contractor", host: "Officer Chen", signIn: "Apr 4, 08:30", signOut: "Apr 4, 17:00", duration: "8h 30m", badge: "V-199" },
      { id: "6", visitorName: "Lisa Rodriguez", company: "Legal Counsel", host: "Lt. Nguyen", signIn: "Apr 4, 14:00", signOut: "Apr 4, 16:00", duration: "2h 0m", badge: "V-200" },
      { id: "7", visitorName: "Robert Kim", company: "Electrician", host: "Officer Martinez", signIn: "Apr 3, 07:30", signOut: "Apr 3, 12:00", duration: "4h 30m", badge: "V-195" },
      { id: "8", visitorName: "Angela White", company: "Media/Press", host: "Sgt. Patel", signIn: "Apr 3, 11:00", signOut: "Apr 3, 13:00", duration: "2h 0m", badge: "V-196" },
      { id: "9", visitorName: "Thomas Grant", company: "Vendor Rep", host: "Officer Rivera", signIn: "Apr 3, 09:00", signOut: "Apr 3, 16:30", duration: "7h 30m", badge: "V-197" },
      { id: "10", visitorName: "Nancy Bell", company: "Auditor", host: "Lt. Nguyen", signIn: "Apr 2, 08:00", signOut: "Apr 2, 17:00", duration: "9h 0m", badge: "V-192" },
    ],
  };
}

function getPatronFlagsData() {
  return {
    stats: [
      { label: "Active Flags", value: "31", sub: "Current watch list" },
      { label: "Active Bans", value: "12", sub: "Venue-wide" },
      { label: "New This Week", value: "4", sub: "Flags added" },
      { label: "Expired Bans", value: "8", sub: "Last 90 days" },
    ],
    columns: [
      { key: "patronName", label: "Patron", sortable: true },
      { key: "flagType", label: "Flag Type", render: (row: Record<string, unknown>) => <Badge tone={row.flagType === "Ban" ? "critical" : row.flagType === "Watch" ? "warning" : "info"} dot>{row.flagType as string}</Badge> },
      { key: "reason", label: "Reason" },
      { key: "issuedDate", label: "Issued", sortable: true },
      { key: "expiryDate", label: "Expiry", sortable: true },
      { key: "issuedBy", label: "Issued By" },
      { key: "status", label: "Status", render: (row: Record<string, unknown>) => <Badge tone={row.status === "Active" ? "critical" : "default"}>{row.status as string}</Badge> },
    ],
    rows: [
      { id: "1", patronName: "John Doe", flagType: "Ban", reason: "Assault on staff", issuedDate: "Mar 15, 2026", expiryDate: "Mar 15, 2027", issuedBy: "Lt. Nguyen", status: "Active" },
      { id: "2", patronName: "Jane Smith", flagType: "Watch", reason: "Repeated disturbances", issuedDate: "Apr 1, 2026", expiryDate: "Jul 1, 2026", issuedBy: "Sgt. Patel", status: "Active" },
      { id: "3", patronName: "Mike Johnson", flagType: "Ban", reason: "Drug possession", issuedDate: "Feb 20, 2026", expiryDate: "Feb 20, 2027", issuedBy: "Lt. Nguyen", status: "Active" },
      { id: "4", patronName: "Karen Williams", flagType: "Watch", reason: "Verbal threats", issuedDate: "Apr 3, 2026", expiryDate: "Jul 3, 2026", issuedBy: "Officer Rivera", status: "Active" },
      { id: "5", patronName: "Chris Brown", flagType: "Alert", reason: "Known associate of banned patron", issuedDate: "Mar 25, 2026", expiryDate: "Jun 25, 2026", issuedBy: "Det. Brooks", status: "Active" },
      { id: "6", patronName: "Patricia Davis", flagType: "Ban", reason: "Theft (repeat offender)", issuedDate: "Jan 10, 2026", expiryDate: "Jan 10, 2028", issuedBy: "Lt. Nguyen", status: "Active" },
      { id: "7", patronName: "Robert Wilson", flagType: "Watch", reason: "Trespassing history", issuedDate: "Mar 5, 2026", expiryDate: "Jun 5, 2026", issuedBy: "Sgt. Patel", status: "Active" },
      { id: "8", patronName: "Linda Martinez", flagType: "Alert", reason: "Outstanding warrant", issuedDate: "Apr 4, 2026", expiryDate: "Jul 4, 2026", issuedBy: "Det. Collins", status: "Active" },
      { id: "9", patronName: "Steven Garcia", flagType: "Ban", reason: "Vandalism ($5k+ damage)", issuedDate: "Dec 1, 2025", expiryDate: "Dec 1, 2026", issuedBy: "Lt. Nguyen", status: "Active" },
      { id: "10", patronName: "Amy Thompson", flagType: "Watch", reason: "Counterfeit tickets", issuedDate: "Apr 2, 2026", expiryDate: "Jul 2, 2026", issuedBy: "Officer Chen", status: "Active" },
    ],
  };
}

function getReportData(type: string) {
  switch (type) {
    case "daily-activity": return getDailyActivityData();
    case "incident-summary": return getIncidentSummaryData();
    case "dispatch-performance": return getDispatchPerformanceData();
    case "case-status": return getCaseStatusData();
    case "evidence-custody": return getEvidenceCustodyData();
    case "shift-coverage": return getShiftCoverageData();
    case "training-compliance": return getTrainingComplianceData();
    case "savings-losses": return getSavingsLossesData();
    case "visitor-log": return getVisitorLogData();
    case "patron-flags": return getPatronFlagsData();
    default: return getDailyActivityData();
  }
}

/* ── Extra Filters by Type ── */
const PRIORITY_OPTIONS = [
  { value: "", label: "All Priorities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const ZONE_OPTIONS = [
  { value: "", label: "All Zones" },
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "perimeter", label: "Perimeter" },
];

const SHIFT_OPTIONS = [
  { value: "", label: "All Shifts" },
  { value: "day", label: "Day" },
  { value: "swing", label: "Swing" },
  { value: "night", label: "Night" },
];

const FLAG_TYPE_OPTIONS = [
  { value: "", label: "All Flag Types" },
  { value: "ban", label: "Ban" },
  { value: "watch", label: "Watch" },
  { value: "alert", label: "Alert" },
];

/* ── Main Component ── */
export default function ReportViewerPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const meta = REPORT_META[type] || { name: type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), description: "Report details", icon: FileText };
  const IconComponent = meta.icon;

  const { toast } = useToast();

  const [dateFrom, setDateFrom] = useState("2026-03-29");
  const [dateTo, setDateTo] = useState("2026-04-05");
  const [property, setProperty] = useState("");
  const [extraFilter, setExtraFilter] = useState("");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const reportData = useMemo(() => getReportData(type), [type]);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
      toast("Report generated successfully", { variant: "success" });
    }, 800);
  };

  const handleExport = (format: string) => {
    toast(`Report exported as ${format}`, { variant: "success" });
  };

  const handlePrint = () => {
    toast("Preparing print view...", { variant: "info" });
  };

  /* ── Extra filter selector based on report type ── */
  const extraFilterConfig = useMemo(() => {
    switch (type) {
      case "incident-summary":
        return { options: PRIORITY_OPTIONS, label: "Priority" };
      case "dispatch-performance":
      case "shift-coverage":
        return { options: ZONE_OPTIONS, label: "Zone" };
      case "training-compliance":
        return { options: SHIFT_OPTIONS, label: "Shift" };
      case "patron-flags":
        return { options: FLAG_TYPE_OPTIONS, label: "Flag Type" };
      default:
        return null;
    }
  }, [type]);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-[var(--text-tertiary)]" />
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">{meta.name}</h1>
            </div>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">{meta.description}</p>
          </div>
        </div>
        {generated && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport("PDF")}>
              <Download className="h-3 w-3" />
              PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport("CSV")}>
              <Download className="h-3 w-3" />
              CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport("Excel")}>
              <Download className="h-3 w-3" />
              Excel
            </Button>
          </div>
        )}
      </div>

      {/* ── Configuration Panel ── */}
      <Card>
        <CardContent className="py-3.5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-[13px] text-[var(--text-primary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-[13px] text-[var(--text-primary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
              />
            </div>
            <div className="w-full sm:w-[180px]">
              <Select
                label="Property"
                options={PROPERTY_OPTIONS}
                value={property}
                onChange={(e) => setProperty(e.target.value)}
              />
            </div>
            {extraFilterConfig && (
              <div className="w-full sm:w-[160px]">
                <Select
                  label={extraFilterConfig.label}
                  options={extraFilterConfig.options}
                  value={extraFilter}
                  onChange={(e) => setExtraFilter(e.target.value)}
                />
              </div>
            )}
            <Button variant="default" size="md" onClick={handleGenerate} isLoading={loading}>
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Report Content (shown after generate) ── */}
      {generated && (
        <>
          {/* ── Summary Stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {reportData.stats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} sub={stat.sub} />
            ))}
          </div>

          {/* ── Data Table ── */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
            <DataGrid
              columns={reportData.columns}
              data={reportData.rows}
              sortKey={sortKey}
              sortDirection={sortDir}
              onSort={(key, dir) => {
                setSortKey(key);
                setSortDir(dir);
              }}
              emptyMessage="No data available for the selected filters"
              totalCount={reportData.rows.length}
              pageSize={20}
            />
          </div>
        </>
      )}

      {/* ── Empty state before generation ── */}
      {!generated && !loading && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] py-16 text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center">
              <IconComponent className="h-5 w-5 text-[var(--text-tertiary)]" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Configure and generate
          </h3>
          <p className="text-[13px] text-[var(--text-tertiary)] max-w-sm mx-auto">
            Set your date range and filters above, then click &ldquo;Generate Report&rdquo; to view the data.
          </p>
        </div>
      )}
    </div>
  );
}
