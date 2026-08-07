# Financially Up — Client Risk Assessment & Compliance Rating Specification

This document provides a detailed explanation of how the **Overall Risk Level** (`Low`, `Medium`, `High`, `Unacceptable`) is calculated, evaluated, and assigned during the **Individual Client Engagement** process under Australian **Tax Agent Services Act 2009 (TASA 2009)**, **Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (AML/CTF Act)**, and **Tax Practitioners Board (TPB)** guidelines.

---

## 1. Overview & Purpose

Every submitted **Individual Client Engagement Application** undergoes a two-phase risk evaluation:

1. **Phase 1: Automated Rule Engine (Submission Time)**
   When the client completes the 10-step online engagement form, the system automatically evaluates key data points (ATO history, ID verification, business complexity, foreign income, representative authority) to assign an initial risk rating (`Low`, `Medium`, or `High`).

2. **Phase 2: Tax Agent Compliance Review (Admin Portal)**
   During Tax Agent review on `/admin/individual-engagement-new`, the registered Tax Agent reviews the auto-calculated rating, TPB 100-point identity proof, and AML checks, and can manually update the final Risk Rating (`Low`, `Medium`, `High`, `Unacceptable`) along with mandatory reviewer notes.

---

## 2. Automated Risk Calculation Matrix (Phase 1)

The system calculates a cumulative **Compliance Risk Score (0 to 10+)** based on the following weighted indicators:

### 📊 Risk Triggers & Weightings

| Category | Field / Indicator | Condition | Points Added | Risk Impact |
| :--- | :--- | :--- | :---: | :--- |
| **ATO History** | `atoIssues` | Client reports ATO debt, audit, penalty, or dispute | **+3** | ⚠️ High Compliance Concern |
| **ATO History** | `overdueBas` | Sole trader has overdue Business Activity Statements | **+2** | ⚠️ Statutory Default |
| **Identity Check** | `identityMethod` | Client selected "No Photo ID Available" | **+2** | ⚠️ Secondary ID Verification Needed |
| **Representative** | `isSelf` | Form completed by Representative / POA (not self) | **+2** | ⚠️ Third-Party Authority Check |
| **Business Turnover** | `expectedTurnover` | Sole trader expected turnover > $500,000 AUD | **+2** | 📈 High Turnover Business |
| **Complex Income** | `incomeActivities` | Includes Cryptocurrency Trading / Staking / Mining | **+1** | 🪙 Specialized Tax Deductions |
| **Foreign Income** | `foreignCountry` / `foreignInfo` | Foreign employment, overseas pensions, or offshore assets | **+1** | 🌐 Foreign Tax Residency / FATCA |
| **Accounting History** | `hadPreviousAccountant` | Changed previous accountant due to fee/service dispute | **+1** | ℹ️ Transitional Record Review |

---

## 3. Risk Level Classifications

Based on the total cumulative Risk Score, the system assigns one of four standardized compliance levels:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  [Score 0 - 1]  ──► LOW RISK          (Green Badge - Automated Pass)     │
│                                                                         │
│  [Score 2 - 3]  ──► MEDIUM RISK       (Amber Badge - Agent Review)       │
│                                                                         │
│  [Score 4 - 5]  ──► HIGH RISK         (Red Badge - Senior Approval)      │
│                                                                         │
│  [Score 6+]     ──► UNACCEPTABLE RISK (Critical Red - Partner Escalation)│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 🟢 Low Risk (Score: 0 – 1)
- **Profile:** Standard salary/wage earners (PAYG), Australian residents with valid primary photo ID (Driver's License/Passport), clean ATO lodgement history, and no active disputes.
- **Workflow Action:** Direct Tax Agent fast-track approval.
- **PDF Badge:** `Low` (Green badge in Admin Review & Audit PDFs).

### 🟡 Medium Risk (Score: 2 – 3)
- **Profile:** Clients with Sole Trader ABN/GST registrations, representative filings, overseas income, or minor past ATO payment arrangements.
- **Workflow Action:** Tax Agent verifies uploaded supporting documents (utility bill, Medicare card, authority letter) before countersigning.
- **PDF Badge:** `Medium` (Amber badge).

### 🔴 High Risk (Score: 4 – 5)
- **Profile:** Ongoing ATO audits, undisclosed debts, missing primary photo ID, high business turnover (> $500k), or complex multi-jurisdictional tax affairs.
- **Workflow Action:** Requires Senior Tax Agent sign-off and secondary identity confirmation before engagement acceptance.
- **PDF Badge:** `High` (Red badge).

### ⛔ Unacceptable Risk (Score: 6+)
- **Profile:** Severe identity mismatch, failed DVS database verification, active ATO prosecution, or potential money laundering / sanctions flags.
- **Workflow Action:** Engagement placed on hold. Tax Agent must contact client for formal interview or decline engagement.

---

## 4. Phase 2 Tax Agent Manual Override

On the **Admin Portal (`/admin/individual-engagement-new/[id]`)**, the Tax Agent has full statutory authority to adjust the final Risk Level:

1. Navigates to **Application Detail & Compliance Review**.
2. Reviews client responses, uploaded ID files, and DVS check status.
3. Selects the updated **Risk Level** (`Low`, `Medium`, `High`, `Unacceptable`).
4. Enters compulsory **Tax Agent Reviewer Notes** explaining the rationale.
5. Clicks **Submit Decision & Countersign**.

When saved, the system automatically regenerates the **Admin Review PDF** and **Engagement Acceptance PDF** with the updated Risk Level and Tax Agent notes.

---

## 5. Summary Table for Client Presentations

When explaining the Risk Rating System to your client or stakeholders, use this executive summary:

> *"Financially Up uses an automated, TPB-compliant Risk Assessment engine. Standard individual tax return submissions with valid photo ID default to **Low Risk**. Submissions involving ATO debt queries, complex Sole Trader structures, or third-party representatives are categorized as **Medium** or **High Risk** to ensure our registered Tax Agents perform appropriate due diligence before lodging documents with the ATO."*

---

*Document Version:* `v1.0.0`  
*Applicable System:* Financially Up ERP — Individual Client Engagement Engine  
*Compliance Standards:* TASA 2009 | TPB Identity Guidelines 2024 | Privacy Act 1988 | AML/CTF 2006
