"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  Radio,
  Briefcase,
  Link as LinkIcon,
  Users,
  GraduationCap,
  DollarSign,
  UserCheck,
  Shield,
  Download,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

/* ── Report Definition ── */
interface ReportDef {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  formats: string[];
  lastGenerated: string | null;
}

interface ReportCategory {
  title: string;
  reports: ReportDef[];
}

/* ── Report Categories ── */
const REPORT_CATEGORIES: ReportCategory[] = [
  {
    title: "Operations Reports",
    reports: [
      {
        slug: "daily-activity",
        name: "Daily Activity Summary",
        description: "All daily log entries for a selected date range",
        icon: FileText,
        formats: ["PDF", "CSV", "Excel"],
        lastGenerated: "Apr 3, 2026",
      },
      {
        slug: "incident-summary",
        name: "Incident Summary Report",
        description: "All incidents with classification, status, and response times",
        icon: AlertTriangle,
        formats: ["PDF", "CSV", "Excel"],
        lastGenerated: "Apr 1, 2026",
      },
      {
        slug: "dispatch-performance",
        name: "Dispatch Performance",
        description: "Response times, resolution rates, officer workload",
        icon: Radio,
        formats: ["PDF", "CSV", "Excel"],
        lastGenerated: null,
      },
    ],
  },
  {
    title: "Investigation Reports",
    reports: [
      {
        slug: "case-status",
        name: "Case Status Report",
        description: "Active investigations, stage breakdown, aging",
        icon: Briefcase,
        formats: ["PDF", "CSV", "Excel"],
        lastGenerated: "Mar 28, 2026",
      },
      {
        slug: "evidence-custody",
        name: "Evidence Chain of Custody",
        description: "Full chain of custody audit trail",
        icon: LinkIcon,
        formats: ["PDF", "CSV"],
        lastGenerated: null,
      },
    ],
  },
  {
    title: "Personnel Reports",
    reports: [
      {
        slug: "shift-coverage",
        name: "Shift Coverage Report",
        description: "Staff coverage by zone, shift gaps",
        icon: Users,
        formats: ["PDF", "CSV", "Excel"],
        lastGenerated: "Apr 2, 2026",
      },
      {
        slug: "training-compliance",
        name: "Training Compliance",
        description: "Certification status, expiring qualifications",
        icon: GraduationCap,
        formats: ["PDF", "Excel"],
        lastGenerated: null,
      },
    ],
  },
  {
    title: "Financial Reports",
    reports: [
      {
        slug: "savings-losses",
        name: "Savings & Losses Summary",
        description: "Financial impact across all incidents",
        icon: DollarSign,
        formats: ["PDF", "CSV", "Excel"],
        lastGenerated: "Mar 30, 2026",
      },
    ],
  },
  {
    title: "Visitor & Patron Reports",
    reports: [
      {
        slug: "visitor-log",
        name: "Visitor Log",
        description: "All visits with sign-in/out times",
        icon: UserCheck,
        formats: ["PDF", "CSV", "Excel"],
        lastGenerated: "Apr 4, 2026",
      },
      {
        slug: "patron-flags",
        name: "Patron Flags & Bans",
        description: "Active flags, ban history, watch list",
        icon: Shield,
        formats: ["PDF", "CSV"],
        lastGenerated: null,
      },
    ],
  },
];

/* ── Quick Generate Reports ── */
const QUICK_REPORTS = [
  { slug: "daily-activity", name: "Daily Activity Summary", icon: FileText },
  { slug: "incident-summary", name: "Incident Summary", icon: AlertTriangle },
  { slug: "shift-coverage", name: "Shift Coverage", icon: Users },
  { slug: "visitor-log", name: "Visitor Log", icon: UserCheck },
];

export default function ReportsPage() {
  const { toast } = useToast();
  const [quickLoading, setQuickLoading] = useState<string | null>(null);

  const handleQuickGenerate = (slug: string, name: string) => {
    setQuickLoading(slug);
    setTimeout(() => {
      setQuickLoading(null);
      toast(`${name} generated successfully`, { variant: "success" });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Reports</h1>
        <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
          Generate and export operational reports
        </p>
      </div>

      {/* ── Quick Generate ── */}
      <Card>
        <CardContent className="py-3.5">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">
              Quick Generate
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_REPORTS.map((r) => (
              <Button
                key={r.slug}
                variant="secondary"
                size="sm"
                isLoading={quickLoading === r.slug}
                onClick={() => handleQuickGenerate(r.slug, r.name)}
              >
                <r.icon className="h-3 w-3" />
                {r.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Report Categories ── */}
      {REPORT_CATEGORIES.map((category) => (
        <div key={category.title} className="space-y-3">
          <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            {category.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {category.reports.map((report) => (
              <Card key={report.slug} hover>
                <CardContent className="py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[var(--surface-secondary)] text-[var(--text-tertiary)] shrink-0">
                      <report.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
                        {report.name}
                      </h3>
                      <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5 leading-snug">
                        {report.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {report.formats.map((fmt) => (
                          <Badge key={fmt} tone="default">
                            {fmt}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-2">
                        {report.lastGenerated
                          ? `Last generated: ${report.lastGenerated}`
                          : "Never generated"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Link href={`/reports/${report.slug}`}>
                      <Button variant="secondary" size="sm">
                        <Download className="h-3 w-3" />
                        Generate
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
