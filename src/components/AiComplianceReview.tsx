"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, 
  Calendar, 
  Plus, 
  Save, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  X,
  History,
  RotateCcw,
  Upload,
  Download,
  Check,
  Loader2,
  Table2,
  FileText,
  AlertCircle,
  ShieldCheck,
  FileBarChart,
  Search,
  ArrowLeft
} from "lucide-react";
import { 
  getCompaniesAction, 
  createCompanyAction, 
  getTaxPeriodsAction, 
  saveTaxPeriodAction, 
  runComplianceReviewAction, 
  updateFindingStatusAction,
  getComplianceHistoryAction,
  ComplianceHistoryRecord
} from "../app/actions/complianceActions";
import { C } from "../lib/constants";
import { parseTaxReturnFile } from "../lib/fileParser";

// ─── Statutory Checklist Guidance ──────────────────────────────────────────
const STATUTORY_CHECKLIST_GUIDANCE: Record<string, {
  legislation: string;
  description: string;
  actions: string[];
}> = {
  VAT: {
    legislation: "VAT Act Cap 349, ss. 16, 28, 30",
    description: "Monthly VAT return filed under the VAT Act Cap 349. Output VAT must reconcile directly with EFRIS-recorded sales. Input VAT claims require valid tax invoices with supplier TINs.",
    actions: [
      "Reconcile EFRIS sales export against VAT working schedule line by line.",
      "Ensure all input VAT claims are supported by valid tax invoices.",
      "Verify supplier TINs are recorded for all input VAT claimants.",
      "File VAT return by the 15th of the following month.",
    ],
  },
  PAYE: {
    legislation: "Income Tax Act Cap 340, ss. 114–120",
    description: "Monthly Pay As You Earn deductions and remittance. All employees above the threshold must appear in the PAYE computation schedule.",
    actions: [
      "Verify all employees in payroll register appear in the PAYE schedule.",
      "Confirm tax computed uses current URA tax band thresholds.",
      "File monthly PAYE return with URA by the 15th of the following month.",
      "Remit PAYE to avoid 2% monthly statutory interest.",
    ],
  },
  "Income Tax": {
    legislation: "Income Tax Act Cap 340, ss. 15, 89–104",
    description: "Annual income tax return and quarterly instalment payments. Gross profit margins and cost movements should be consistent with prior periods.",
    actions: [
      "Prepare a note to financial statements explaining material cost movements.",
      "Reconcile gross margin to prior periods and document variances.",
      "Ensure provisional tax instalments have been paid.",
      "File annual income tax return within 6 months of year-end.",
    ],
  },
  EFRIS: {
    legislation: "VAT Act Cap 349, s. 73A; EFRIS Regulations 2020",
    description: "Electronic Fiscal Receipting and Invoicing System compliance. All sales must be recorded via an approved EFRIS device.",
    actions: [
      "Ensure your fiscal device (ERD/VSDC) is active and transmitting to URA servers.",
      "Issue QR-coded fiscal receipts for every sale.",
      "Perform monthly reconciliation of EFRIS receipts vs sales records.",
    ],
  },
  "Financial Statements": {
    legislation: "Income Tax Act Cap 340, s. 27; Companies Act 2012, s. 168",
    description: "Annual financial statements must be prepared in accordance with IFRS or IFRS for SMEs.",
    actions: [
      "Prepare financial statements within 6 months of accounting year-end.",
      "Include notes explaining material variances from prior periods.",
      "Reconcile balance sheet figures to trial balances.",
    ],
  },
  "Supporting Documents": {
    legislation: "Tax Procedures Code Act 2014, s. 30",
    description: "URA requires tax returns to be supported by source documents retained for a minimum of 5 years.",
    actions: [
      "Assemble sales invoices, purchase invoices, and receipts for the period.",
      "Organise EFRIS fiscal receipt records and match them to sales ledger.",
      "Retain bank statements, payroll schedules, and NSSF schedules.",
    ],
  },
  "NSSF Cross-Check": {
    legislation: "NSSF Act Cap 222, ss. 9–13",
    description: "National Social Security Fund contributions must match payroll figures. 10% employee and 10% employer contributions.",
    actions: [
      "Confirm NSSF contribution amount matches 20% of gross pay for qualifying staff.",
      "Verify remittance receipts from NSSF for the period.",
      "Cross-reference NSSF member list against PAYE employee list.",
    ],
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmtUGX = (n: number) => "UGX " + Math.round(n).toLocaleString("en-UG");

const fmtDate = (s: string) => {
  try {
    return new Date(s).toLocaleDateString("en-UG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
};

interface AiComplianceReviewProps {
  user: {
    id: string;
    full_name?: string;
  };
  onReviewComplete?: (findings: any[]) => void;
  initialData?: Record<string, any>;
  standalone?: boolean;
  onBackToOverview?: () => void;
  initialCompanyName?: string;
}

export const AiComplianceReview: React.FC<AiComplianceReviewProps> = ({ 
  user, 
  onReviewComplete, 
  initialData,
  onBackToOverview,
  initialCompanyName,
}) => {
  // Navigation / Scope
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-06");

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState<
    "reconciliation" | "findings" | "memorandum" | "checklist" | "history" | "reports"
  >("reconciliation");

  // Company creation
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  // Period creation
  const [showCreatePeriod, setShowCreatePeriod] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState("2026-07");

  // Raw Tax Figures State
  const [vatOutput, setVatOutput] = useState(15450000);
  const [vatInput, setVatInput] = useState(4200000);
  const [efrisSales, setEfrisSales] = useState(98500000);
  const [vatInvalidTin, setVatInvalidTin] = useState(1200000);

  const [payrollCount, setPayrollCount] = useState(12);
  const [payrollGross, setPayrollGross] = useState(24000000);
  const [payeCount, setPayeCount] = useState(10);
  const [payeTax, setPayeTax] = useState(3600000);

  const [grossMargin, setGrossMargin] = useState(18); // %
  const [financialSales, setFinancialSales] = useState(115000000);
  const [supplierTinsTotal, setSupplierTinsTotal] = useState(12);
  const [supplierTinsInvalid, setSupplierTinsInvalid] = useState(3);

  const [nssfContribution, setNssfContribution] = useState(3600000);
  const [isNilReturn, setIsNilReturn] = useState(false);
  const [docsPresent, setDocsPresent] = useState(false);
  const [duplicateInvoices, setDuplicateInvoices] = useState(3);
  const [negativeBalances, setNegativeBalances] = useState(true);

  // States
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<ComplianceHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Search & Filter for Findings
  const [findingFilterSeverity, setFindingFilterSeverity] = useState<string>("all");
  const [findingFilterArea, setFindingFilterArea] = useState<string>("all");
  const [findingSearchQuery, setFindingSearchQuery] = useState("");

  // Statutory Checklist State
  const [checklist, setChecklist] = useState<Array<{ area: string; status: "pass" | "review" | "missing" }>>([
    { area: "VAT", status: "review" },
    { area: "PAYE", status: "review" },
    { area: "Income Tax", status: "review" },
    { area: "EFRIS", status: "review" },
    { area: "Financial Statements", status: "pass" },
    { area: "Supporting Documents", status: "missing" },
    { area: "NSSF Cross-Check", status: "pass" },
  ]);

  // Audit Trails / Resolution Modal
  const [resolutionTarget, setResolutionTarget] = useState<any>(null);
  const [resolutionAction, setResolutionAction] = useState<"resolve" | "ignore">("resolve");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProcessing, setUploadProcessing] = useState(false);

  // Report Generation State
  const [reportGenerating, setReportGenerating] = useState<string | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  };

  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // ── Reference Client Scenarios ───────────────────────────────────────────
  const applyCompanyScenario = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("kato")) {
      // Kato Hardware Ltd: High EFRIS sales variance + PAYE casual staff gap
      setVatOutput(25650000);
      setVatInput(8400000);
      setEfrisSales(124260000);
      setVatInvalidTin(1800000);
      setPayrollCount(26);
      setPayeCount(12);
      setPayrollGross(32000000);
      setPayeTax(4800000);
      setGrossMargin(22);
      setFinancialSales(142500000);
      setSupplierTinsTotal(18);
      setSupplierTinsInvalid(5);
      setNssfContribution(4800000);
      setDocsPresent(false);
      setDuplicateInvoices(4);
      setNegativeBalances(true);
      setSelectedPeriod("2026-06");
      setChecklist([
        { area: "VAT", status: "review" },
        { area: "PAYE", status: "missing" },
        { area: "Income Tax", status: "review" },
        { area: "EFRIS", status: "review" },
        { area: "Financial Statements", status: "pass" },
        { area: "Supporting Documents", status: "missing" },
        { area: "NSSF Cross-Check", status: "review" },
      ]);
    } else if (n.includes("lira")) {
      // Lira Pharmacy Ltd: WHT exposure + critical attention
      setVatOutput(18900000);
      setVatInput(14200000);
      setEfrisSales(95000000);
      setVatInvalidTin(3200000);
      setPayrollCount(18);
      setPayeCount(14);
      setPayrollGross(26000000);
      setPayeTax(3800000);
      setGrossMargin(14);
      setFinancialSales(105000000);
      setSupplierTinsTotal(28);
      setSupplierTinsInvalid(9);
      setNssfContribution(3900000);
      setDocsPresent(false);
      setDuplicateInvoices(2);
      setNegativeBalances(true);
      setSelectedPeriod("2026-05");
      setChecklist([
        { area: "VAT", status: "review" },
        { area: "PAYE", status: "review" },
        { area: "Income Tax", status: "missing" },
        { area: "EFRIS", status: "review" },
        { area: "Financial Statements", status: "review" },
        { area: "Supporting Documents", status: "missing" },
        { area: "NSSF Cross-Check", status: "review" },
      ]);
    } else if (n.includes("mbarara")) {
      // Mbarara Agro Processors Ltd: Clean, fully compliant
      setVatOutput(36000000);
      setVatInput(12500000);
      setEfrisSales(200000000);
      setVatInvalidTin(0);
      setPayrollCount(40);
      setPayeCount(40);
      setPayrollGross(68000000);
      setPayeTax(14200000);
      setGrossMargin(32);
      setFinancialSales(200000000);
      setSupplierTinsTotal(35);
      setSupplierTinsInvalid(0);
      setNssfContribution(10200000);
      setDocsPresent(true);
      setDuplicateInvoices(0);
      setNegativeBalances(false);
      setSelectedPeriod("2026-06");
      setChecklist([
        { area: "VAT", status: "pass" },
        { area: "PAYE", status: "pass" },
        { area: "Income Tax", status: "pass" },
        { area: "EFRIS", status: "pass" },
        { area: "Financial Statements", status: "pass" },
        { area: "Supporting Documents", status: "pass" },
        { area: "NSSF Cross-Check", status: "pass" },
      ]);
    }
  };

  // ── Load Companies ────────────────────────────────────────────────────────
  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      let data: any[] = await getCompaniesAction();

      if (initialCompanyName) {
        const found = data.find((c: any) => c.name.toLowerCase() === initialCompanyName.toLowerCase());
        if (found) {
          setSelectedCompany(found);
        } else {
          const synthesized = {
            id: `client-${initialCompanyName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
            name: initialCompanyName,
            created_at: new Date().toISOString(),
            role: "Tax Client",
          };
          data = [synthesized, ...data];
          setSelectedCompany(synthesized);
        }
        applyCompanyScenario(initialCompanyName);
      } else if (data.length > 0) {
        setSelectedCompany(data[0]);
      }
      setCompanies(data);
    } catch (err: any) {
      console.error("Error loading companies:", err);
      if (initialCompanyName) {
        const synthesized = {
          id: `client-${initialCompanyName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          name: initialCompanyName,
          created_at: new Date().toISOString(),
          role: "Tax Client",
        };
        setCompanies([synthesized]);
        setSelectedCompany(synthesized);
        applyCompanyScenario(initialCompanyName);
      } else {
        showToast("Using default entity context.", "info");
      }
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [initialCompanyName]);

  // ── Load Periods for Selected Company ─────────────────────────────────────
  const loadPeriods = async (companyId: string) => {
    try {
      const data = await getTaxPeriodsAction(companyId);
      setPeriods(data);
      if (data.length > 0) {
        setFormFromRecord(data[0]);
      }
    } catch (err) {
      console.error("Error loading periods:", err);
    }
  };

  // ── Load Compliance History for Selected Company ──────────────────────────
  const loadHistory = async (companyId: string) => {
    try {
      setLoadingHistory(true);
      const hist = await getComplianceHistoryAction(companyId);
      setHistoryList(hist);
    } catch (err) {
      console.error("Error loading compliance history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      loadPeriods(selectedCompany.id);
      loadHistory(selectedCompany.id);
    }
  }, [selectedCompany]);

  // Apply initialData (from uploaded file) once it arrives
  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;
    if (initialData.vat_declared_output !== undefined) setVatOutput(Number(initialData.vat_declared_output));
    if (initialData.vat_declared_input !== undefined) setVatInput(Number(initialData.vat_declared_input));
    if (initialData.efris_sales_total !== undefined) setEfrisSales(Number(initialData.efris_sales_total));
    if (initialData.vat_input_invalid_tin !== undefined) setVatInvalidTin(Number(initialData.vat_input_invalid_tin));
    if (initialData.payroll_register_count !== undefined) setPayrollCount(Number(initialData.payroll_register_count));
    if (initialData.payroll_register_gross !== undefined) setPayrollGross(Number(initialData.payroll_register_gross));
    if (initialData.paye_schedule_count !== undefined) setPayeCount(Number(initialData.paye_schedule_count));
    if (initialData.paye_schedule_tax !== undefined) setPayeTax(Number(initialData.paye_schedule_tax));
    if (initialData.financial_gross_margin !== undefined) {
      const raw = Number(initialData.financial_gross_margin);
      setGrossMargin(raw > 1 ? raw : raw * 100);
    }
    if (initialData.financial_sales !== undefined) setFinancialSales(Number(initialData.financial_sales));
    if (initialData.supplier_tins_total_count !== undefined) setSupplierTinsTotal(Number(initialData.supplier_tins_total_count));
    if (initialData.supplier_tins_invalid_count !== undefined) setSupplierTinsInvalid(Number(initialData.supplier_tins_invalid_count));
    if (initialData.nssf_contribution_total !== undefined) setNssfContribution(Number(initialData.nssf_contribution_total));
    if (initialData.is_nil_return !== undefined) setIsNilReturn(Boolean(initialData.is_nil_return));
    if (initialData.supporting_documents_present !== undefined) setDocsPresent(Boolean(initialData.supporting_documents_present));
    if (initialData.duplicate_invoices_count !== undefined) setDuplicateInvoices(Number(initialData.duplicate_invoices_count));
    if (initialData.negative_balances_present !== undefined) setNegativeBalances(Boolean(initialData.negative_balances_present));
    showToast("Return figures auto-populated from file.", "success");
  }, [initialData]);

  // Map database record figures back to UI inputs
  const setFormFromRecord = (rec: any) => {
    setSelectedPeriod(rec.period_name || rec.period);
    if (rec.vat_declared_output !== undefined) setVatOutput(Number(rec.vat_declared_output));
    if (rec.vat_declared_input !== undefined) setVatInput(Number(rec.vat_declared_input));
    if (rec.efris_sales_total !== undefined) setEfrisSales(Number(rec.efris_sales_total));
    if (rec.vat_input_invalid_tin !== undefined) setVatInvalidTin(Number(rec.vat_input_invalid_tin));
    if (rec.payroll_register_count !== undefined) setPayrollCount(Number(rec.payroll_register_count));
    if (rec.payroll_register_gross !== undefined) setPayrollGross(Number(rec.payroll_register_gross));
    if (rec.paye_schedule_count !== undefined) setPayeCount(Number(rec.paye_schedule_count));
    if (rec.paye_schedule_tax !== undefined) setPayeTax(Number(rec.paye_schedule_tax));
    if (rec.financial_gross_margin !== undefined) {
      const val = Number(rec.financial_gross_margin);
      setGrossMargin(val <= 1 ? val * 100 : val);
    }
    if (rec.financial_sales !== undefined) setFinancialSales(Number(rec.financial_sales));
    if (rec.supplier_tins_total_count !== undefined) setSupplierTinsTotal(Number(rec.supplier_tins_total_count));
    if (rec.supplier_tins_invalid_count !== undefined) setSupplierTinsInvalid(Number(rec.supplier_tins_invalid_count));
    if (rec.nssf_contribution_total !== undefined) setNssfContribution(Number(rec.nssf_contribution_total));
    if (rec.is_nil_return !== undefined) setIsNilReturn(Boolean(rec.is_nil_return));
    if (rec.supporting_documents_present !== undefined) setDocsPresent(Boolean(rec.supporting_documents_present));
    if (rec.duplicate_invoices_count !== undefined) setDuplicateInvoices(Number(rec.duplicate_invoices_count));
    if (rec.negative_balances_present !== undefined) setNegativeBalances(Boolean(rec.negative_balances_present));
  };

  // ── Create Company ────────────────────────────────────────────────────────
  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    try {
      setSaving(true);
      const created = await createCompanyAction(newCompanyName.trim());
      setCompanies(prev => [...prev, created]);
      setSelectedCompany(created);
      setNewCompanyName("");
      setShowCreateCompany(false);
      showToast(`Company "${created.name}" created successfully.`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to create company", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Create Period ─────────────────────────────────────────────────────────
  const handleCreatePeriod = () => {
    if (!newPeriodName.trim()) return;
    setSelectedPeriod(newPeriodName);
    setReviewResult(null);
    setFindings([]);
    setShowCreatePeriod(false);
    showToast(`Tax period set to ${newPeriodName}. Enter figures and click Save.`, "info");
  };

  // ── Save Return Figures to Supabase ───────────────────────────────────────
  const handleSavePeriod = async () => {
    if (!selectedCompany) {
      showToast("Please select a company first.", "error");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        vat_declared_output: vatOutput,
        vat_declared_input: vatInput,
        efris_sales_total: efrisSales,
        vat_input_invalid_tin: vatInvalidTin,
        payroll_register_count: payrollCount,
        payroll_register_gross: payrollGross,
        paye_schedule_count: payeCount,
        paye_schedule_tax: payeTax,
        financial_gross_margin: grossMargin / 100,
        financial_sales: financialSales,
        supplier_tins_total_count: supplierTinsTotal,
        supplier_tins_invalid_count: supplierTinsInvalid,
        nssf_contribution_total: nssfContribution,
        is_nil_return: isNilReturn,
        supporting_documents_present: docsPresent,
        duplicate_invoices_count: duplicateInvoices,
        negative_balances_present: negativeBalances
      };
      await saveTaxPeriodAction(selectedCompany.id, selectedPeriod, payload);
      showToast(`Return figures for ${selectedPeriod} saved to database.`, "success");
      loadPeriods(selectedCompany.id);
    } catch (err: any) {
      showToast(err.message || "Error saving tax period figures", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Run AI Compliance Review ──────────────────────────────────────────────
  const handleRunReview = async () => {
    if (!selectedCompany) {
      showToast("Please select a company first.", "error");
      return;
    }
    try {
      setReviewing(true);
      // Auto-save the latest figures before running audit
      await handleSavePeriod();
      
      const res = await runComplianceReviewAction(selectedCompany.id, selectedPeriod, true);
      setReviewResult(res.review);
      setFindings(res.findings);
      onReviewComplete?.(res.findings);
      
      // Update checklist status based on findings
      const hasVatCritical = res.findings.some(f => f.area === "VAT" && f.severity === "critical" && f.status === "open");
      const hasPayeCritical = res.findings.some(f => f.area === "PAYE" && f.severity === "critical" && f.status === "open");
      setChecklist(prev => prev.map(c => {
        if (c.area === "VAT") return { ...c, status: hasVatCritical ? "review" : "pass" };
        if (c.area === "PAYE") return { ...c, status: hasPayeCritical ? "review" : "pass" };
        if (c.area === "Supporting Documents") return { ...c, status: docsPresent ? "pass" : "missing" };
        return c;
      }));

      // Switch to findings tab so user immediately sees results
      setActiveTab("findings");
      showToast("AI Compliance Review completed! Inspect flagged discrepancies below.", "success");
      loadHistory(selectedCompany.id);
    } catch (err: any) {
      showToast(`Review failed: ${err.message}`, "error");
    } finally {
      setReviewing(false);
    }
  };

  // ── Resolve or Ignore Finding ─────────────────────────────────────────────
  const handleUpdateFindingStatus = async () => {
    if (!reviewResult || !resolutionTarget) return;
    try {
      setActionLoading(true);
      const res = await updateFindingStatusAction(
        reviewResult.id,
        resolutionTarget.id,
        resolutionAction,
        resolutionNotes
      );
      if (res.success) {
        setReviewResult(res.review || null);
        setFindings(res.findings || []);
        showToast(
          `Finding ${resolutionTarget.code} marked as ${resolutionAction === "resolve" ? "Resolved" : "Risk Accepted"}.`,
          "success"
        );
        setResolutionTarget(null);
        setResolutionNotes("");
      }
    } catch (err: any) {
      showToast(`Failed to update finding status: ${err.message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reopen Finding ────────────────────────────────────────────────────────
  const handleReopenFinding = async (finding: any) => {
    if (!reviewResult) return;
    try {
      const res = await updateFindingStatusAction(
        reviewResult.id,
        finding.id,
        "reopen",
        "Reopened for investigation"
      );
      if (res.success) {
        setReviewResult(res.review || null);
        setFindings(res.findings || []);
        showToast(`Finding ${finding.code} reopened.`, "info");
      }
    } catch (err: any) {
      showToast(`Failed to reopen finding: ${err.message}`, "error");
    }
  };

  // ── Load Sample Scenario Preset ───────────────────────────────────────────
  const handleLoadScenario = (type: "high-risk" | "clean") => {
    if (type === "high-risk") {
      setVatOutput(14800000);
      setVatInput(5200000);
      setEfrisSales(120000000);
      setVatInvalidTin(1800000);
      setPayrollCount(18);
      setPayrollGross(36000000);
      setPayeCount(14);
      setPayeTax(4200000);
      setGrossMargin(15);
      setFinancialSales(135000000);
      setSupplierTinsTotal(15);
      setSupplierTinsInvalid(4);
      setNssfContribution(4200000);
      setIsNilReturn(false);
      setDocsPresent(false);
      setDuplicateInvoices(4);
      setNegativeBalances(true);
      showToast("High-Risk Audit Scenario figures loaded.", "info");
    } else {
      setVatOutput(18000000);
      setVatInput(7200000);
      setEfrisSales(100000000);
      setVatInvalidTin(0);
      setPayrollCount(15);
      setPayrollGross(30000000);
      setPayeCount(15);
      setPayeTax(4500000);
      setGrossMargin(32);
      setFinancialSales(100000000);
      setSupplierTinsTotal(12);
      setSupplierTinsInvalid(0);
      setNssfContribution(6000000);
      setIsNilReturn(false);
      setDocsPresent(true);
      setDuplicateInvoices(0);
      setNegativeBalances(false);
      showToast("Compliant Filing Scenario figures loaded.", "info");
    }
  };

  // ── Handle File Upload & Parsing ──────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      setUploadProcessing(true);
      const res = await parseTaxReturnFile(file);
      if (res.ok && res.data) {
        setFormFromRecord(res.data);
        showToast(`Successfully extracted return figures from "${file.name}".`, "success");
      } else {
        showToast(res.error || "Failed to parse return file.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "File upload failed.", "error");
    } finally {
      setUploadProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Download Report ───────────────────────────────────────────────────────
  const handleDownloadReport = async (format: "pdf" | "xlsx" | "docx") => {
    setReportGenerating(format);
    try {
      const payload = {
        format,
        companyName: selectedCompany?.name || "Company",
        tin: "1004829201",
        period: selectedPeriod,
        reviewedAt: new Date().toISOString(),
        overallStatus: reviewResult?.status || "under_review",
        critical: findings.filter(f => f.severity === "critical" && f.status === "open").length,
        warning: findings.filter(f => f.severity === "warning" && f.status === "open").length,
        passed: checklist.filter(c => c.status === "pass").length,
        exposure: reviewResult?.estimated_exposure || 0,
        confidence: reviewResult?.confidence || 90,
        findings: findings.map(f => ({
          code: f.code,
          severity: f.severity,
          area: f.area,
          title: f.title,
          description: f.description,
          reason: f.reason,
          impact: f.impact,
          recommendation: f.recommendation,
          legislation_ref: f.legislation_ref,
          exposure: f.exposure,
          confidence: f.confidence,
          status: f.status,
        })),
        checklist,
        aiSummary: reviewResult?.ai_summary || "Statutory compliance audit executed.",
      };

      const res = await fetch("/api/compliance/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Report generation failed.");
      }

      if (format === "pdf") {
        const html = await res.text();
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `taxwise-compliance-${selectedPeriod}.html`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
        showToast("Report generated as printable HTML format.", "success");
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `taxwise-compliance-${selectedPeriod}.${format === "docx" ? "doc" : format}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
        showToast(`${format.toUpperCase()} report downloaded successfully.`, "success");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to generate report.", "error");
    } finally {
      setReportGenerating(null);
    }
  };

  // ── Calculated Live Variance Signals ──────────────────────────────────────
  const impliedVatFromEfris = efrisSales * 0.18;
  const vatDiscrepancy = Math.abs(vatOutput - impliedVatFromEfris);
  const vatDiscrepancyPct = impliedVatFromEfris > 0 ? (vatDiscrepancy / impliedVatFromEfris) * 100 : 0;
  const hasVatEfrisGap = vatDiscrepancyPct > 5;

  const employeeCountGap = payrollCount - payeCount;
  const hasPayeEmployeeGap = employeeCountGap !== 0;

  // Findings Breakdown
  const openFindings = findings.filter(f => f.status === "open");
  const criticalCount = openFindings.filter(f => f.severity === "critical").length;
  const warningCount = openFindings.filter(f => f.severity === "warning").length;
  const resolvedCount = findings.filter(f => f.status === "resolved").length;
  const totalExposure = reviewResult?.estimated_exposure ?? openFindings.reduce((sum, f) => sum + (Number(f.exposure) || 0), 0);

  // Filtered Findings
  const filteredFindings = findings.filter(f => {
    if (findingFilterSeverity !== "all" && f.severity !== findingFilterSeverity) return false;
    if (findingFilterArea !== "all" && f.area !== findingFilterArea) return false;
    if (findingSearchQuery.trim()) {
      const q = findingSearchQuery.toLowerCase();
      const matchTitle = f.title?.toLowerCase().includes(q);
      const matchCode = f.code?.toLowerCase().includes(q);
      const matchDesc = f.description?.toLowerCase().includes(q);
      const matchLeg = f.legislation_ref?.toLowerCase().includes(q);
      return matchTitle || matchCode || matchDesc || matchLeg;
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv,.xlsx,.xls,.pdf,.docx,.doc"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* Back to Overview Banner (when navigated from Overview) */}
      {onBackToOverview && (
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            flexWrap: "wrap", 
            gap: 12,
            background: "var(--cx-surface, #FFFFFF)",
            border: "1px solid var(--cx-line, #DADFD6)",
            borderRadius: 10,
            padding: "10px 16px",
          }}
        >
          <button
            type="button"
            onClick={onBackToOverview}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "transparent",
              border: "none",
              color: "var(--cx-emerald, #0E7C5A)",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 6,
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "var(--cx-emerald-soft, #E4F1EA)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Compliance Overview</span>
          </button>

          {initialCompanyName && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--cx-ink-soft, #4C5C68)" }}>
              <span>Target Client:</span>
              <strong style={{ color: "var(--cx-ink, #101E30)" }}>{initialCompanyName}</strong>
            </div>
          )}
        </div>
      )}

      {/* ── TOP EXECUTIVE CONTROL STRIP ───────────────────────────────────── */}
      <div 
        style={{ 
          background: "#FFFFFF", 
          borderRadius: 16, 
          padding: "20px 24px", 
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 12px rgba(15, 32, 68, 0.04)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div 
              style={{ 
                width: 44, 
                height: 44, 
                borderRadius: 12, 
                background: "rgba(26, 123, 107, 0.1)", 
                color: C.teal, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 800, color: C.navy, margin: 0, letterSpacing: "-0.01em" }}>
                  AI Statutory Compliance &amp; Audit Suite
                </h1>
                <span 
                  style={{ 
                    padding: "3px 9px", 
                    borderRadius: 99, 
                    fontSize: "0.68rem", 
                    fontWeight: 700, 
                    background: criticalCount > 0 ? "rgba(220, 38, 38, 0.1)" : "rgba(26, 123, 107, 0.1)", 
                    color: criticalCount > 0 ? "#DC2626" : C.teal,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em"
                  }}
                >
                  {criticalCount > 0 ? "High Exposure Audit" : reviewResult ? "Compliant Filing" : "Pre-Filing Draft"}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: C.muted }}>
                Statutory cross-reconciliation across EFRIS, VAT, PAYE, and NSSF under the Tax Procedures Code Act 2014.
              </p>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadProcessing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "#FFFFFF",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: C.navy,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.offwhite; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
              title="Upload return file (CSV/JSON/PDF)"
            >
              {uploadProcessing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>Upload Return</span>
            </button>

            <button
              onClick={handleSavePeriod}
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "#FFFFFF",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: C.navy,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.offwhite; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Save Figures</span>
            </button>

            <button
              onClick={handleRunReview}
              disabled={reviewing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 18px",
                borderRadius: 8,
                border: "none",
                background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealDark} 100%)`,
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#FFFFFF",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(26,123,107,0.3)",
                transition: "all 0.15s ease",
              }}
            >
              {reviewing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Auditing Figures…</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Run AI Audit Review</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ENTITY & TAX PERIOD SELECTOR ROW */}
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            flexWrap: "wrap", 
            gap: 12,
            paddingTop: 14,
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Entity Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.offwhite, padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.border}` }}>
              <Building2 size={15} style={{ color: C.teal }} />
              <span style={{ fontSize: "0.74rem", fontWeight: 600, color: C.muted, textTransform: "uppercase" }}>Entity:</span>
              <select
                value={selectedCompany?.id || ""}
                onChange={(e) => {
                  const comp = companies.find(c => c.id === e.target.value);
                  if (comp) setSelectedCompany(comp);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: C.navy,
                  cursor: "pointer",
                }}
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowCreateCompany(true)}
                style={{
                  background: "rgba(26,123,107,0.1)",
                  border: "none",
                  color: C.teal,
                  padding: "3px 6px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                }}
                title="Add new entity"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Tax Period Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.offwhite, padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.border}` }}>
              <Calendar size={15} style={{ color: C.teal }} />
              <span style={{ fontSize: "0.74rem", fontWeight: 600, color: C.muted, textTransform: "uppercase" }}>Filing Period:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  const pName = e.target.value;
                  setSelectedPeriod(pName);
                  const found = periods.find(p => p.period_name === pName);
                  if (found) setFormFromRecord(found);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: C.navy,
                  cursor: "pointer",
                }}
              >
                {periods.length > 0 ? (
                  periods.map(p => (
                    <option key={p.id || p.period_name} value={p.period_name}>{p.period_name}</option>
                  ))
                ) : (
                  <>
                    <option value="2026-07">2026-07 (Jul 2026)</option>
                    <option value="2026-06">2026-06 (Jun 2026)</option>
                    <option value="2026-05">2026-05 (May 2026)</option>
                  </>
                )}
              </select>
              <button
                onClick={() => setShowCreatePeriod(true)}
                style={{
                  background: "rgba(26,123,107,0.1)",
                  border: "none",
                  color: C.teal,
                  padding: "3px 6px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                }}
                title="Add new period"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Quick Scenario Fill Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600 }}>Demo Presets:</span>
            <button
              onClick={() => handleLoadScenario("high-risk")}
              style={{
                background: "rgba(220, 38, 38, 0.08)",
                border: "1px solid rgba(220, 38, 38, 0.2)",
                color: "#DC2626",
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "4px 8px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Audit Scenario (High Risk)
            </button>
            <button
              onClick={() => handleLoadScenario("clean")}
              style={{
                background: "rgba(26, 123, 107, 0.08)",
                border: "1px solid rgba(26, 123, 107, 0.2)",
                color: C.teal,
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "4px 8px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Compliant Filing
            </button>
          </div>
        </div>
      </div>

      {/* ── EXECUTIVE RISK & EXPOSURE SCORECARD ────────────────────────────── */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", 
          gap: 14 
        }}
      >
        <div 
          style={{ 
            background: "#FFFFFF", 
            borderRadius: 14, 
            padding: "18px 20px", 
            border: `1px solid ${C.border}`,
            borderLeft: `4px solid ${criticalCount > 0 ? "#DC2626" : warningCount > 0 ? C.gold : C.teal}`,
            boxShadow: "0 2px 8px rgba(15, 32, 68, 0.02)"
          }}
        >
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Overall Audit Risk
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "1.35rem", fontWeight: 800, color: criticalCount > 0 ? "#DC2626" : warningCount > 0 ? C.gold : C.teal }}>
              {criticalCount > 0 ? "High Risk" : warningCount > 0 ? "Review Needed" : reviewResult ? "Compliant" : "Pre-Audit"}
            </span>
            {criticalCount > 0 ? <ShieldAlert size={20} color="#DC2626" /> : <ShieldCheck size={20} color={C.teal} />}
          </div>
          <div style={{ fontSize: "0.72rem", color: C.muted, marginTop: 4 }}>
            {criticalCount} critical, {warningCount} warning issues
          </div>
        </div>

        <div 
          style={{ 
            background: "#FFFFFF", 
            borderRadius: 14, 
            padding: "18px 20px", 
            border: `1px solid ${C.border}`,
            boxShadow: "0 2px 8px rgba(15, 32, 68, 0.02)"
          }}
        >
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Estimated Exposure
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: C.navy, fontFamily: "'IBM Plex Mono', monospace" }}>
            {fmtUGX(totalExposure)}
          </div>
          <div style={{ fontSize: "0.72rem", color: totalExposure > 0 ? "#DC2626" : C.teal, marginTop: 4, fontWeight: 600 }}>
            {totalExposure > 0 ? "Penalty & statutory interest risk" : "Zero identified exposure"}
          </div>
        </div>

        <div 
          style={{ 
            background: "#FFFFFF", 
            borderRadius: 14, 
            padding: "18px 20px", 
            border: `1px solid ${C.border}`,
            boxShadow: "0 2px 8px rgba(15, 32, 68, 0.02)"
          }}
        >
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            URA Audit Probability
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: "1.35rem", fontWeight: 800, color: hasVatEfrisGap || hasPayeEmployeeGap ? "#DC2626" : C.teal }}>
              {criticalCount > 0 ? "88%" : warningCount > 0 ? "46%" : "12%"}
            </span>
            <span style={{ fontSize: "0.74rem", color: C.muted }}>automated query risk</span>
          </div>
          <div style={{ width: "100%", height: 5, background: C.offwhite, borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
            <div 
              style={{ 
                width: criticalCount > 0 ? "88%" : warningCount > 0 ? "46%" : "12%", 
                height: "100%", 
                background: criticalCount > 0 ? "#DC2626" : warningCount > 0 ? C.gold : C.teal 
              }} 
            />
          </div>
        </div>

        <div 
          style={{ 
            background: "#FFFFFF", 
            borderRadius: 14, 
            padding: "18px 20px", 
            border: `1px solid ${C.border}`,
            boxShadow: "0 2px 8px rgba(15, 32, 68, 0.02)"
          }}
        >
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Resolution Progress
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: C.navy, fontFamily: "'IBM Plex Mono', monospace" }}>
            {resolvedCount} / {findings.length}
          </div>
          <div style={{ fontSize: "0.72rem", color: C.muted, marginTop: 4 }}>
            {openFindings.length} open discrepancies pending
          </div>
        </div>

        <div 
          style={{ 
            background: "#FFFFFF", 
            borderRadius: 14, 
            padding: "18px 20px", 
            border: `1px solid ${C.border}`,
            boxShadow: "0 2px 8px rgba(15, 32, 68, 0.02)"
          }}
        >
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            AI Confidence
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: C.teal, fontFamily: "'IBM Plex Mono', monospace" }}>
            {reviewResult?.confidence ? `${reviewResult.confidence}%` : "94%"}
          </div>
          <div style={{ fontSize: "0.72rem", color: C.muted, marginTop: 4 }}>
            Statutory rule engine &amp; Gemini analysis
          </div>
        </div>
      </div>

      {/* ── WORKSPACE TAB NAVIGATION ──────────────────────────────────────── */}
      <div 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 6, 
          borderBottom: `1px solid ${C.border}`,
          paddingBottom: 2,
          overflowX: "auto",
        }}
      >
        {[
          { id: "reconciliation" as const, label: "Live Return Reconciliation", icon: <Table2 size={15} /> },
          { id: "findings" as const, label: `Audit Discrepancies (${openFindings.length})`, icon: <AlertTriangle size={15} />, badge: criticalCount > 0 ? criticalCount : undefined },
          { id: "memorandum" as const, label: "Executive AI Memorandum", icon: <FileText size={15} /> },
          { id: "checklist" as const, label: "Statutory Checklist", icon: <ShieldCheck size={15} /> },
          { id: "history" as const, label: `Audit History (${historyList.length})`, icon: <History size={15} /> },
          { id: "reports" as const, label: "Reports & Exports", icon: <FileBarChart size={15} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                border: "none",
                borderBottom: isActive ? `2px solid ${C.teal}` : "2px solid transparent",
                background: "transparent",
                color: isActive ? C.teal : C.muted,
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span 
                  style={{ 
                    background: "#DC2626", 
                    color: "#FFFFFF", 
                    fontSize: "0.65rem", 
                    fontWeight: 700, 
                    borderRadius: 99, 
                    padding: "1px 6px" 
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: LIVE RECONCILIATION & RETURN DATA ENTRY ─────────────────── */}
      {activeTab === "reconciliation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Diagnostic Alert Banners */}
          {hasVatEfrisGap && (
            <div 
              style={{ 
                background: "rgba(220, 38, 38, 0.06)", 
                border: "1px solid rgba(220, 38, 38, 0.25)", 
                borderRadius: 12, 
                padding: "14px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12
              }}
            >
              <AlertCircle size={18} style={{ color: "#DC2626", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#DC2626" }}>
                  EFRIS vs Output VAT Reconciliation Discrepancy Detected
                </div>
                <div style={{ fontSize: "0.78rem", color: C.text, marginTop: 2, lineHeight: 1.5 }}>
                  EFRIS sales of {fmtUGX(efrisSales)} implies standard output VAT of {fmtUGX(impliedVatFromEfris)}, but declared output VAT is {fmtUGX(vatOutput)} (variance of {fmtUGX(vatDiscrepancy)} or {vatDiscrepancyPct.toFixed(1)}%). Under Section 16 &amp; 30 of VAT Act Cap 349, URA automated audit queries flag variances exceeding 2%.
                </div>
              </div>
            </div>
          )}

          {hasPayeEmployeeGap && (
            <div 
              style={{ 
                background: "rgba(200, 146, 42, 0.08)", 
                border: "1px solid rgba(200, 146, 42, 0.25)", 
                borderRadius: 12, 
                padding: "14px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12
              }}
            >
              <AlertTriangle size={18} style={{ color: C.gold, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: C.gold }}>
                  Payroll Headcount vs PAYE Computation Mismatch
                </div>
                <div style={{ fontSize: "0.78rem", color: C.text, marginTop: 2, lineHeight: 1.5 }}>
                  Active payroll lists {payrollCount} staff, but only {payeCount} are accounted for in the monthly PAYE return ({Math.abs(employeeCountGap)} missing). Section 116 of the Income Tax Act requires all staff earning above threshold to be scheduled.
                </div>
              </div>
            </div>
          )}

          {/* Input Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {/* VAT & EFRIS Alignment */}
            <div 
              style={{ 
                background: "#FFFFFF", 
                borderRadius: 16, 
                padding: 22, 
                border: `1px solid ${C.border}`,
                boxShadow: "0 2px 10px rgba(15, 32, 68, 0.02)" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: C.navy }}>
                  1. VAT &amp; EFRIS Alignment
                </div>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: C.teal, background: "rgba(26,123,107,0.1)", padding: "2px 8px", borderRadius: 4 }}>
                  VAT Act Cap 349
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                    Declared Output VAT (UGX)
                  </label>
                  <input
                    type="number"
                    value={vatOutput}
                    onChange={(e) => setVatOutput(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: C.navy,
                      outline: "none",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                    Declared Input VAT (UGX)
                  </label>
                  <input
                    type="number"
                    value={vatInput}
                    onChange={(e) => setVatInput(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: C.navy,
                      outline: "none",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                    EFRIS Fiscal Recorded Sales Total (UGX)
                  </label>
                  <input
                    type="number"
                    value={efrisSales}
                    onChange={(e) => setEfrisSales(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: C.navy,
                      outline: "none",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                    Input VAT Claims with Invalid Supplier TIN (UGX)
                  </label>
                  <input
                    type="number"
                    value={vatInvalidTin}
                    onChange={(e) => setVatInvalidTin(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: vatInvalidTin > 0 ? "1.5px solid rgba(220, 38, 38, 0.4)" : `1.5px solid ${C.border}`,
                      background: vatInvalidTin > 0 ? "rgba(220, 38, 38, 0.02)" : "#FFFFFF",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: C.navy,
                      outline: "none",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* PAYE & Payroll Reconciliation */}
            <div 
              style={{ 
                background: "#FFFFFF", 
                borderRadius: 16, 
                padding: 22, 
                border: `1px solid ${C.border}`,
                boxShadow: "0 2px 10px rgba(15, 32, 68, 0.02)" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: C.navy }}>
                  2. PAYE &amp; NSSF Reconciliation
                </div>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: C.teal, background: "rgba(26,123,107,0.1)", padding: "2px 8px", borderRadius: 4 }}>
                  Income Tax Provision
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                      Payroll Staff Count
                    </label>
                    <input
                      type="number"
                      value={payrollCount}
                      onChange={(e) => setPayrollCount(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: `1.5px solid ${C.border}`,
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: C.navy,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                      PAYE Schedule Count
                    </label>
                    <input
                      type="number"
                      value={payeCount}
                      onChange={(e) => setPayeCount(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: hasPayeEmployeeGap ? "1.5px solid rgba(220, 38, 38, 0.4)" : `1.5px solid ${C.border}`,
                        background: hasPayeEmployeeGap ? "rgba(220, 38, 38, 0.02)" : "#FFFFFF",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: C.navy,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                    Total Gross Payroll (UGX)
                  </label>
                  <input
                    type="number"
                    value={payrollGross}
                    onChange={(e) => setPayrollGross(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: C.navy,
                      outline: "none",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                    PAYE Tax Deducted &amp; Scheduled (UGX)
                  </label>
                  <input
                    type="number"
                    value={payeTax}
                    onChange={(e) => setPayeTax(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: C.navy,
                      outline: "none",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                    Total NSSF Statutory Remittance (UGX)
                  </label>
                  <input
                    type="number"
                    value={nssfContribution}
                    onChange={(e) => setNssfContribution(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: C.navy,
                      outline: "none",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Financial Margins & Documentation Controls */}
            <div 
              style={{ 
                background: "#FFFFFF", 
                borderRadius: 16, 
                padding: 22, 
                border: `1px solid ${C.border}`,
                boxShadow: "0 2px 10px rgba(15, 32, 68, 0.02)" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: C.navy }}>
                  3. Financials &amp; Internal Controls
                </div>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: C.teal, background: "rgba(26,123,107,0.1)", padding: "2px 8px", borderRadius: 4 }}>
                  TPCA 2014
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                      Gross Profit Margin (%)
                    </label>
                    <input
                      type="number"
                      value={grossMargin}
                      onChange={(e) => setGrossMargin(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: `1.5px solid ${C.border}`,
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: C.navy,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                      Duplicate Invoices
                    </label>
                    <input
                      type="number"
                      value={duplicateInvoices}
                      onChange={(e) => setDuplicateInvoices(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: duplicateInvoices > 0 ? "1.5px solid rgba(220, 38, 38, 0.4)" : `1.5px solid ${C.border}`,
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: C.navy,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                    Financial Statements Total Sales (UGX)
                  </label>
                  <input
                    type="number"
                    value={financialSales}
                    onChange={(e) => setFinancialSales(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: C.navy,
                      outline: "none",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}
                  />
                </div>

                <div style={{ paddingTop: 6, display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.82rem", color: C.navy, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={docsPresent}
                      onChange={(e) => setDocsPresent(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: C.teal, cursor: "pointer" }}
                    />
                    <span>Full Supporting Invoices &amp; Source Docs Present (s. 30 TPCA)</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.82rem", color: C.navy, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={negativeBalances}
                      onChange={(e) => setNegativeBalances(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: "#DC2626", cursor: "pointer" }}
                    />
                    <span>Negative Cash or Inventory Balances Flagged</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.82rem", color: C.navy, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={isNilReturn}
                      onChange={(e) => setIsNilReturn(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: C.gold, cursor: "pointer" }}
                    />
                    <span>Nil Return Status (No trading activity during period)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
            <button
              onClick={handleSavePeriod}
              disabled={saving}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "#FFFFFF",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: C.navy,
                cursor: "pointer",
              }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={handleRunReview}
              disabled={reviewing}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealDark} 100%)`,
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#FFFFFF",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(26,123,107,0.3)"
              }}
            >
              {reviewing ? "Executing AI Audit Engine…" : "Execute AI Audit Review"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: FLAGGED DISCREPANCIES & MITIGATION ACTION CENTER ───────── */}
      {activeTab === "findings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Filter & Search Bar */}
          <div 
            style={{ 
              background: "#FFFFFF", 
              borderRadius: 14, 
              padding: "14px 18px", 
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 220 }}>
              <Search size={16} style={{ color: C.muted }} />
              <input
                type="text"
                placeholder="Search discrepancy code, title, or legislation citation…"
                value={findingSearchQuery}
                onChange={(e) => setFindingSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: "0.82rem",
                  color: C.navy,
                  background: "transparent"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "0.75rem", color: C.muted, fontWeight: 600 }}>Severity:</span>
                <select
                  value={findingFilterSeverity}
                  onChange={(e) => setFindingFilterSeverity(e.target.value)}
                  style={{
                    background: C.offwhite,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: C.navy,
                    cursor: "pointer"
                  }}
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "0.75rem", color: C.muted, fontWeight: 600 }}>Area:</span>
                <select
                  value={findingFilterArea}
                  onChange={(e) => setFindingFilterArea(e.target.value)}
                  style={{
                    background: C.offwhite,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: C.navy,
                    cursor: "pointer"
                  }}
                >
                  <option value="all">All Areas</option>
                  <option value="VAT">VAT</option>
                  <option value="PAYE">PAYE</option>
                  <option value="Income Tax">Income Tax</option>
                  <option value="Documentation">Documentation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Findings List */}
          {filteredFindings.length === 0 ? (
            <div 
              style={{ 
                background: "#FFFFFF", 
                borderRadius: 16, 
                padding: "60px 24px", 
                textAlign: "center",
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(26,123,107,0.1)", color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>
                {findings.length === 0 ? "No Audit Review Run Yet" : "No Discrepancies Match Filter"}
              </h3>
              <p style={{ fontSize: "0.82rem", color: C.muted, maxWidth: 440, margin: "0 auto 18px" }}>
                {findings.length === 0 
                  ? "Click 'Run AI Audit Review' above to execute statutory rules and cross-check against URA databases." 
                  : "All findings are either resolved or filtered out by your current search criteria."}
              </p>
              {findings.length === 0 && (
                <button
                  onClick={handleRunReview}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    background: C.teal,
                    color: "#FFFFFF",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  Execute Audit Review Now
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filteredFindings.map((finding) => {
                const isCritical = finding.severity === "critical";
                const isWarning = finding.severity === "warning";
                const isResolved = finding.status === "resolved";
                const isIgnored = finding.status === "ignored";

                return (
                  <div
                    key={finding.id}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 14,
                      padding: "18px 22px",
                      border: `1px solid ${isResolved ? "rgba(26,123,107,0.3)" : isCritical ? "rgba(220, 38, 38, 0.3)" : C.border}`,
                      borderLeft: `4px solid ${isResolved ? C.teal : isCritical ? "#DC2626" : isWarning ? C.gold : C.navy}`,
                      boxShadow: "0 2px 10px rgba(15, 32, 68, 0.02)",
                      opacity: isResolved || isIgnored ? 0.75 : 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span 
                          style={{ 
                            fontFamily: "'IBM Plex Mono', monospace", 
                            fontSize: "0.75rem", 
                            fontWeight: 700, 
                            color: C.navy,
                            background: C.offwhite,
                            padding: "2px 7px",
                            borderRadius: 4,
                            border: `1px solid ${C.border}`
                          }}
                        >
                          {finding.code}
                        </span>

                        <span 
                          style={{ 
                            fontSize: "0.7rem", 
                            fontWeight: 800, 
                            textTransform: "uppercase",
                            padding: "2px 8px", 
                            borderRadius: 4,
                            background: isResolved 
                              ? "rgba(26,123,107,0.12)" 
                              : isCritical 
                              ? "rgba(220, 38, 38, 0.12)" 
                              : isWarning 
                              ? "rgba(200, 146, 42, 0.12)" 
                              : "rgba(15, 32, 68, 0.08)",
                            color: isResolved 
                              ? C.teal 
                              : isCritical 
                              ? "#DC2626" 
                              : isWarning 
                              ? C.gold 
                              : C.navy,
                          }}
                        >
                          {isResolved ? "Resolved" : isIgnored ? "Accepted Risk" : finding.severity}
                        </span>

                        <span 
                          style={{ 
                            fontSize: "0.72rem", 
                            fontWeight: 600, 
                            color: C.muted,
                            background: C.offwhite,
                            padding: "2px 8px",
                            borderRadius: 4
                          }}
                        >
                          {finding.area}
                        </span>

                        {finding.legislation_ref && (
                          <span 
                            style={{ 
                              fontSize: "0.72rem", 
                              fontWeight: 700, 
                              color: C.teal,
                              fontFamily: "'IBM Plex Mono', monospace"
                            }}
                          >
                            § {finding.legislation_ref}
                          </span>
                        )}
                      </div>

                      {/* Exposure Badge */}
                      {finding.exposure > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600 }}>Exposure:</span>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.85rem", fontWeight: 700, color: "#DC2626" }}>
                            {fmtUGX(finding.exposure)}
                          </span>
                        </div>
                      )}
                    </div>

                    <h4 style={{ fontSize: "0.98rem", fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>
                      {finding.title}
                    </h4>

                    <p style={{ fontSize: "0.82rem", color: C.text, lineHeight: 1.55, margin: "0 0 10px" }}>
                      {finding.description}
                    </p>

                    {finding.reason && (
                      <div 
                        style={{ 
                          background: C.offwhite, 
                          borderRadius: 8, 
                          padding: "10px 14px", 
                          fontSize: "0.78rem", 
                          color: C.muted,
                          lineHeight: 1.5,
                          marginBottom: 12
                        }}
                      >
                        <span style={{ fontWeight: 700, color: C.navy }}>Audit Analysis: </span>
                        {finding.reason}
                      </div>
                    )}

                    {finding.recommendation && (
                      <div 
                        style={{ 
                          borderLeft: `2px solid ${C.teal}`, 
                          paddingLeft: 12, 
                          fontSize: "0.78rem", 
                          color: C.tealDark, 
                          lineHeight: 1.5,
                          marginBottom: 14 
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>Recommended Statutory Remedy: </span>
                        {finding.recommendation}
                      </div>
                    )}

                    {/* Action Controls */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                      {isResolved || isIgnored ? (
                        <button
                          onClick={() => handleReopenFinding(finding)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 12px",
                            borderRadius: 6,
                            border: `1px solid ${C.border}`,
                            background: "#FFFFFF",
                            color: C.navy,
                            fontSize: "0.76rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <RotateCcw size={12} />
                          <span>Reopen Discrepancy</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setResolutionTarget(finding);
                              setResolutionAction("ignore");
                              setResolutionNotes("");
                            }}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: `1px solid ${C.border}`,
                              background: "#FFFFFF",
                              color: C.muted,
                              fontSize: "0.76rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Accept Risk
                          </button>

                          <button
                            onClick={() => {
                              setResolutionTarget(finding);
                              setResolutionAction("resolve");
                              setResolutionNotes("");
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 14px",
                              borderRadius: 6,
                              border: "none",
                              background: C.teal,
                              color: "#FFFFFF",
                              fontSize: "0.76rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <Check size={13} />
                            <span>Mark Resolved</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: EXECUTIVE AI TAX MEMORANDUM ─────────────────────────────── */}
      {activeTab === "memorandum" && (
        <div 
          style={{ 
            background: "#FFFFFF", 
            borderRadius: 16, 
            padding: "32px 36px", 
            border: `1px solid ${C.border}`,
            boxShadow: "0 4px 18px rgba(15, 32, 68, 0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Memorandum Header */}
          <div style={{ borderBottom: `2px solid ${C.navy}`, paddingBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.45rem", fontWeight: 800, color: C.navy }}>
                  TaxWise Uganda — Executive Audit Memorandum
                </div>
                <div style={{ fontSize: "0.82rem", color: C.muted, marginTop: 4 }}>
                  Statutory Pre-Filing Review &amp; Discrepancy Assessment
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.navy }}>Date: {fmtDate(new Date().toISOString())}</div>
                <div style={{ fontSize: "0.74rem", color: C.muted }}>Period: {selectedPeriod}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 16, background: C.offwhite, padding: "12px 16px", borderRadius: 8 }}>
              <div>
                <span style={{ fontSize: "0.7rem", color: C.muted, fontWeight: 600, display: "block" }}>ENTITY:</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: C.navy }}>{selectedCompany?.name || "Uganda Premium Trade Ltd"}</span>
              </div>
              <div>
                <span style={{ fontSize: "0.7rem", color: C.muted, fontWeight: 600, display: "block" }}>TAX IDENTIFICATION (TIN):</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: C.navy, fontFamily: "'IBM Plex Mono', monospace" }}>1004829201</span>
              </div>
              <div>
                <span style={{ fontSize: "0.7rem", color: C.muted, fontWeight: 600, display: "block" }}>ENGAGEMENT LEAD:</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: C.navy }}>{user.full_name || "Lead Tax Practitioner"}</span>
              </div>
            </div>
          </div>

          {/* AI Narrative Body */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                1. Executive Summary &amp; Assessment
              </h3>
              <p style={{ fontSize: "0.85rem", color: C.text, lineHeight: 1.65, margin: 0 }}>
                {reviewResult?.ai_summary || (
                  criticalCount > 0 
                    ? `Pre-filing statutory validation for ${selectedCompany?.name || "the entity"} for period ${selectedPeriod} has detected ${criticalCount} critical discrepancy items representing approximately ${fmtUGX(totalExposure)} in potential tax liability and penalty exposure. Primary concerns stem from discrepancies between EFRIS electronic fiscal receipts and declared VAT outputs, alongside payroll schedule headcount discrepancies. Immediate rectification prior to filing is strongly advised to prevent automated assessment under Section 55 of the Tax Procedures Code Act 2014.`
                    : `Pre-filing validation indicates an overall compliant state with no critical statutory deviations detected. Routine reconciliations for input tax invoices and NSSF schedules are aligned with statutory schedules. The return may proceed to final sign-off and filing.`
                )}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                2. Key Statutory Findings &amp; Exposure Analysis
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {findings.map((f, i) => (
                  <div key={f.id || i} style={{ padding: "12px 14px", borderRadius: 8, background: C.offwhite, border: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: C.navy }}>
                        {f.code}: {f.title}
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem", fontWeight: 700, color: f.severity === "critical" ? "#DC2626" : C.gold }}>
                        {f.exposure > 0 ? fmtUGX(f.exposure) : "Governance Risk"}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.5 }}>
                      {f.reason || f.description}
                    </div>
                    {f.legislation_ref && (
                      <div style={{ fontSize: "0.72rem", color: C.teal, fontWeight: 700, marginTop: 4 }}>
                        Statutory Reference: {f.legislation_ref}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                3. Mandatory Statutory Action Plan
              </h3>
              <ul style={{ paddingLeft: 20, fontSize: "0.85rem", color: C.text, lineHeight: 1.65, margin: 0 }}>
                <li>Reconcile the EFRIS sales export line by line against your internal sales ledger before submitting monthly Form 5.</li>
                <li>Obtain valid supplier TIN numbers for all input tax deductions exceeding UGX 100,000 to prevent disallowance under s. 28 of the VAT Act.</li>
                <li>Confirm payroll register entries reconcile with Form 5 PAYE remittance schedule.</li>
                <li>Store all source documents, export stamps, and payment receipts for minimum 5 years in accordance with Section 30 of the Tax Procedures Code Act 2014.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: STATUTORY COMPLIANCE CHECKLIST ─────────────────────────── */}
      {activeTab === "checklist" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "20px 24px", border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.navy, margin: "0 0 4px" }}>
              Uganda Statutory Filing Obligations
            </h3>
            <p style={{ fontSize: "0.8rem", color: C.muted, margin: 0 }}>
              Verify adherence against the 7 mandatory compliance pillars before tax period closure.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
            {checklist.map((item) => {
              const guidance = STATUTORY_CHECKLIST_GUIDANCE[item.area];
              const isPass = item.status === "pass";
              const isReview = item.status === "review";
              const isMissing = item.status === "missing";

              return (
                <div
                  key={item.area}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 14,
                    padding: "18px 20px",
                    border: `1px solid ${C.border}`,
                    borderLeft: `4px solid ${isPass ? C.teal : isReview ? C.gold : "#DC2626"}`,
                    boxShadow: "0 2px 8px rgba(15, 32, 68, 0.02)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: C.navy }}>
                      {item.area}
                    </div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: isPass ? "rgba(26,123,107,0.1)" : isReview ? "rgba(200,146,42,0.1)" : "rgba(220,38,38,0.1)",
                        color: isPass ? C.teal : isReview ? C.gold : "#DC2626",
                      }}
                    >
                      {isPass ? "Passed" : isReview ? "Needs Review" : "Missing / Deficient"}
                    </span>
                  </div>

                  {guidance && (
                    <div style={{ fontSize: "0.72rem", color: C.teal, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>
                      {guidance.legislation}
                    </div>
                  )}

                  <p style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.5, margin: "0 0 12px" }}>
                    {guidance?.description || "Statutory validation requirement under Uganda tax regulations."}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>
                    <span style={{ fontSize: "0.72rem", color: C.muted }}>Update Status:</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["pass", "review", "missing"] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => {
                            setChecklist(prev => prev.map(c => c.area === item.area ? { ...c, status: s } : c));
                            showToast(`${item.area} updated to ${s.toUpperCase()}.`, "info");
                          }}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: `1px solid ${item.status === s ? C.teal : C.border}`,
                            background: item.status === s ? "rgba(26,123,107,0.1)" : "#FFFFFF",
                            color: item.status === s ? C.teal : C.muted,
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            textTransform: "capitalize"
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 5: AUDIT HISTORY & COMPARATIVE ARCHIVE ────────────────────── */}
      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "20px 24px", border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.navy, margin: "0 0 4px" }}>
                Past Compliance Reviews for {selectedCompany?.name || "Entity"}
              </h3>
              <p style={{ fontSize: "0.8rem", color: C.muted, margin: 0 }}>
                Historical audit results stored in Supabase compliance records. Click to load any prior review into the active workspace.
              </p>
            </div>
            <button
              onClick={() => selectedCompany && loadHistory(selectedCompany.id)}
              disabled={loadingHistory}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: "#FFFFFF",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: C.navy,
                cursor: "pointer"
              }}
            >
              <RotateCcw size={13} className={loadingHistory ? "animate-spin" : ""} />
              <span>Refresh History</span>
            </button>
          </div>

          {loadingHistory ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
              <Loader2 size={24} className="animate-spin mx-auto mb-2" />
              <span>Fetching compliance records…</span>
            </div>
          ) : historyList.length === 0 ? (
            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "50px 24px", textAlign: "center", border: `1px solid ${C.border}`, color: C.muted }}>
              No previous audit records found for this entity.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {historyList.map((hist) => (
                <div
                  key={hist.id}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 12,
                    padding: "16px 20px",
                    border: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    boxShadow: "0 2px 6px rgba(15, 32, 68, 0.02)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: "rgba(26,123,107,0.1)", color: C.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: C.navy, fontFamily: "'IBM Plex Mono', monospace" }}>
                          Period: {hist.period}
                        </span>
                        <span 
                          style={{ 
                            fontSize: "0.68rem", 
                            fontWeight: 700, 
                            padding: "2px 7px", 
                            borderRadius: 4, 
                            background: hist.status === "high_risk" ? "rgba(220,38,38,0.1)" : "rgba(26,123,107,0.1)", 
                            color: hist.status === "high_risk" ? "#DC2626" : C.teal 
                          }}
                        >
                          {hist.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: 2 }}>
                        Reviewed {fmtDate(hist.reviewed_at)} • Confidence: {hist.confidence}%
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {hist.estimated_exposure > 0 && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.7rem", color: C.muted, fontWeight: 600 }}>Exposure</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#DC2626", fontFamily: "'IBM Plex Mono', monospace" }}>
                          {fmtUGX(hist.estimated_exposure)}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setSelectedPeriod(hist.period);
                        if (hist.findings) setFindings(hist.findings);
                        setReviewResult(hist);
                        setActiveTab("findings");
                        showToast(`Loaded review archive for ${hist.period}.`, "success");
                      }}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        background: C.offwhite,
                        color: C.navy,
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Load into Workspace
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 6: REPORTS & STATUTORY FILING PACK ─────────────────────────── */}
      {activeTab === "reports" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "24px 28px", border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>
              Export Statutory Audit &amp; Filing Pack
            </h3>
            <p style={{ fontSize: "0.82rem", color: C.muted, margin: 0, lineHeight: 1.5 }}>
              Generate complete executive reporting packs including executive summaries, statutory discrepancy tables, legal citations, and management remediation plans.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {/* PDF Report */}
            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "22px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(220,38,38,0.1)", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <FileText size={20} />
                </div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>
                  Printable Statutory PDF Report
                </h4>
                <p style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.5, margin: 0 }}>
                  Formal board-ready audit report with URA compliance rating, executive memorandum, and legal analysis.
                </p>
              </div>

              <button
                onClick={() => handleDownloadReport("pdf")}
                disabled={reportGenerating === "pdf"}
                style={{
                  width: "100%",
                  padding: "9px",
                  borderRadius: 8,
                  border: "none",
                  background: C.navy,
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                {reportGenerating === "pdf" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>Download PDF Report</span>
              </button>
            </div>

            {/* Excel Workbook */}
            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "22px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(26,123,107,0.1)", color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <FileSpreadsheet size={20} />
                </div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>
                  Detailed Excel Reconciliation Workbook
                </h4>
                <p style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.5, margin: 0 }}>
                  Raw data matrices, EFRIS variance schedules, employee headcount schedules, and calculation formulas.
                </p>
              </div>

              <button
                onClick={() => handleDownloadReport("xlsx")}
                disabled={reportGenerating === "xlsx"}
                style={{
                  width: "100%",
                  padding: "9px",
                  borderRadius: 8,
                  border: "none",
                  background: C.teal,
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                {reportGenerating === "xlsx" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>Download XLSX Workbook</span>
              </button>
            </div>

            {/* Word Document */}
            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "22px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(37,99,235,0.1)", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <FileBarChart size={20} />
                </div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>
                  Tax Opinion Memorandum (Word DOCX)
                </h4>
                <p style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.5, margin: 0 }}>
                  Editable memorandum template for tax consultants to customize for clients, partner review, or court filings.
                </p>
              </div>

              <button
                onClick={() => handleDownloadReport("docx")}
                disabled={reportGenerating === "docx"}
                style={{
                  width: "100%",
                  padding: "9px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: "#FFFFFF",
                  color: C.navy,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                {reportGenerating === "docx" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>Download Word DOCX</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE ENTITY ──────────────────────────────────────────── */}
      {showCreateCompany && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(10,15,30,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, width: "100%", maxWidth: 440, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.navy, margin: 0 }}>Create Taxpayer Entity</h3>
              <button onClick={() => setShowCreateCompany(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                <X size={18} />
              </button>
            </div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.muted, marginBottom: 6 }}>
              Entity Legal Name
            </label>
            <input
              type="text"
              placeholder="e.g. Nile Breweries Ltd / Kase Trading Co."
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                fontSize: "0.85rem",
                color: C.navy,
                outline: "none",
                marginBottom: 18
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowCreateCompany(false)}
                style={{ padding: "8px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#FFFFFF", fontSize: "0.8rem", color: C.muted, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCompany}
                disabled={saving}
                style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: C.teal, color: "#FFFFFF", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
              >
                {saving ? "Creating…" : "Create Entity"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE PERIOD ──────────────────────────────────────────── */}
      {showCreatePeriod && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(10,15,30,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, width: "100%", maxWidth: 440, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.navy, margin: 0 }}>Add Tax Period</h3>
              <button onClick={() => setShowCreatePeriod(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                <X size={18} />
              </button>
            </div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.muted, marginBottom: 6 }}>
              Period Label (YYYY-MM)
            </label>
            <input
              type="text"
              placeholder="e.g. 2026-08"
              value={newPeriodName}
              onChange={(e) => setNewPeriodName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                fontSize: "0.85rem",
                color: C.navy,
                outline: "none",
                marginBottom: 18
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowCreatePeriod(false)}
                style={{ padding: "8px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#FFFFFF", fontSize: "0.8rem", color: C.muted, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePeriod}
                style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: C.teal, color: "#FFFFFF", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
              >
                Set Period
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RESOLVE / ACCEPT FINDING ───────────────────────────────── */}
      {resolutionTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(10,15,30,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, width: "100%", maxWidth: 500, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.navy, margin: 0 }}>
                {resolutionAction === "resolve" ? "Resolve Discrepancy" : "Accept Risk Exposure"}
              </h3>
              <button onClick={() => setResolutionTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "10px 14px", borderRadius: 8, background: C.offwhite, marginBottom: 14 }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: C.navy }}>{resolutionTarget.code}: {resolutionTarget.title}</div>
              <div style={{ fontSize: "0.74rem", color: C.muted, marginTop: 2 }}>{resolutionTarget.recommendation}</div>
            </div>

            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.muted, marginBottom: 6 }}>
              {resolutionAction === "resolve" ? "Resolution Rationale / Supporting Adjustment Note" : "Management Justification for Risk Acceptance"}
            </label>
            <textarea
              rows={4}
              placeholder={resolutionAction === "resolve" 
                ? "e.g. Corrective credit note issued; EFRIS sales export re-aligned; supplier provided verified TIN." 
                : "e.g. Immaterial variance accepted; timing difference will reverse in next tax period."}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                fontSize: "0.82rem",
                color: C.navy,
                outline: "none",
                fontFamily: "inherit",
                resize: "vertical",
                marginBottom: 18
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setResolutionTarget(null)}
                style={{ padding: "8px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#FFFFFF", fontSize: "0.8rem", color: C.muted, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFindingStatus}
                disabled={actionLoading}
                style={{
                  padding: "8px 18px",
                  borderRadius: 6,
                  border: "none",
                  background: resolutionAction === "resolve" ? C.teal : C.gold,
                  color: "#FFFFFF",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {actionLoading && <Loader2 size={13} className="animate-spin" />}
                <span>{resolutionAction === "resolve" ? "Confirm Resolution" : "Confirm Risk Acceptance"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATIONS ───────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 9999,
              background: toast.type === "success" ? "#0E7C5A" : toast.type === "error" ? "#DC2626" : C.navy,
              color: "#FFFFFF",
              borderRadius: 10,
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "inherit",
              fontSize: "0.82rem",
              fontWeight: 600,
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
              maxWidth: 380,
            }}
          >
            {toast.type === "success" && <CheckCircle2 size={16} />}
            {toast.type === "error" && <AlertCircle size={16} />}
            {toast.type === "info" && <Info size={16} />}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#FFFFFF", display: "flex", padding: 2 }}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
