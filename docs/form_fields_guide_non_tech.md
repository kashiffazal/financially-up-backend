# Financially Up — Client Engagement Form & Risk Assessment Guide (Plain English)

This guide explains every field collected in the **10-Step Individual Client Engagement Form** in plain, non-technical language. It outlines **what each field means**, **why Australian tax law requires it**, and **how it affects the automated Risk Level rating**.

---

## 📌 Executive Summary

Financially Up is a registered Australian Tax Agent. Under the **Tax Agent Services Act 2009 (TASA 2009)**, the **Privacy Act 1988**, and **Anti-Money Laundering (AML/CTF) laws**, we are required to:
1. Verify the identity of every taxpayer (TPB 100-Point Check).
2. Obtain written legal authorization before accessing your ATO portal records.
3. Assess engagement risk to ensure accurate tax lodgements.

---

## 🛠️ Step-by-Step Field Guide & Risk Logic

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: SERVICE SELECTION                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Field Name | Plain English Meaning | Why We Collect It (ATO/Tax Law) | Risk Impact |
| :--- | :--- | :--- | :--- |
| **Selected Tax Services** (`services`) | The specific tax returns or lodgements you need help with (e.g. Individual Tax Return, Sole Trader BAS, Crypto Tax, Amendment). | Tells our accountants exactly what forms must be lodged with the Australian Taxation Office (ATO). | Standard selection. Selecting Sole Trader BAS, ABN, or GST unlocks Step 5. |
| **Entity Service Needed?** (`entityService`) | Asks if your request involves a Company, Trust, Partnership, or SMSF. | ATO rules require separate legal engagement agreements for business entities vs individuals. | If "Yes", sets up a linked Entity Engagement. |

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: PERSONAL INFORMATION                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Field Name | Plain English Meaning | Why We Collect It (ATO/Tax Law) | Risk Impact |
| :--- | :--- | :--- | :--- |
| **Full Legal Name** (`fullName`) | Your legal first, middle, and last name matching your ID. | ATO identity matching. Mismatched names delay tax refunds. | Standard |
| **Email & Mobile** (`email`, `mobile`) | Your primary contact details. | For secure two-factor notifications and electronic signature audit trail. | Standard |
| **Date & Place of Birth** (`dateOfBirth`, `birthCountry`, `birthCity`) | When and where you were born. | Required by Tax Practitioners Board (TPB) to verify identity against ATO records. | Standard |
| **Occupation & Employment** (`occupation`, `employmentStatus`) | Your job title and employment type (Full-time, Part-time, Casual, Unemployed). | Determines work-related tax deductions allowed for your specific occupation. | Standard |
| **Tax File Number** (`tfn`) | Your 9-digit ATO taxpayer identifier. | Essential for accessing ATO online portal and lodging your income tax return. | Kept strictly confidential under Privacy Act. |
| **Previous / Maiden Names** (`hasPreviousName`, `previousNames`) | Former legal names or maiden names. | Matches historical ATO records if your name changed upon marriage or deed poll. | Standard |
| **Residential & Postal Address** (`address`, `postalAddress`) | Your home address and mailing address. | ATO statutory requirement. Protects against identity fraud. | Standard |

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: TAX RESIDENCY & FAMILY PROFILE                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Field Name | Plain English Meaning | Why We Collect It (ATO/Tax Law) | Risk Impact |
| :--- | :--- | :--- | :--- |
| **Citizenship & Visa Details** (`isAustralianCitizen`, `visaStatus`, `visaSubclass`, `visaExpiry`, `arrivalDate`) | Your Australian citizenship status or visa subclass (e.g. 482, 500, Working Holiday 417). | Determines tax rates. Temporary visa holders may have different tax rates or Medicare exemptions. | Standard |
| **Tax Residency Status** (`taxResidency`, `residentArrival`, `residentDeparture`) | Whether you are an Australian Resident for Tax Purposes, Foreign Resident, or Working Holiday Maker. | Australian residents get the $18,200 tax-free threshold; foreign residents pay tax from dollar one. | **+1 Risk Point** if Foreign Resident / Foreign Assets. |
| **Foreign Income & Assets** (`foreignCountry`, `foreignInfo`) | Overseas income, pensions, or assets worth over $50,000 AUD. | Australian residents must report worldwide income under ATO tax laws. | **+1 Risk Point** |
| **Spouse Details & Income** (`hasSpouse`, `spouseName`, `spouseDob`, `spouseIncome`, `prepareSpouseReturn`) | Your husband/wife/de-facto partner's details and taxable income. | ATO uses combined family income to calculate Medicare Levy Surcharge and offsets. | Standard |
| **Dependant Children** (`hasDependants`, `dependantCount`) | Number of children dependent on you. | Calculates family tax benefit thresholds and Medicare Surcharge exemptions. | Standard |

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: INCOME PROFILE & ATO MATTERS                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Field Name | Plain English Meaning | Why We Collect It (ATO/Tax Law) | Risk Impact |
| :--- | :--- | :--- | :--- |
| **Income Activities** (`incomeActivities`) | Types of income earned (Salary, Rental Property, Capital Gains, Crypto, Shares, Super). | Ensures all income sources and potential deductions are correctly included. | **+1 Risk Point** if Crypto / Complex Investments. |
| **Previous Tax Accountant** (`hadPreviousAccountant`, `previousFirm`, `authorisePreviousAdvisor`, `reasonForChange`) | Details of your previous accountant. | Professional ethics rules require clearance when transferring client Tax Agent authority. | Standard |
| **ATO Debts, Audits & Disputes** (`atoIssues`, `atoExplanation`, `noticeDate`, `dueDate`) | Tells us if you have overdue ATO debts, active audits, or payment arrangements. | Enables us to request ATO debt pauses or payment plans on your behalf. | ⚠️ **+3 Risk Points** *(Triggers Tax Agent manual review)* |

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: SOLE TRADER BAS, ABN & GST                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```
*(Only active if Sole Trader BAS, ABN, or GST was selected in Step 1)*

| Field Name | Plain English Meaning | Why We Collect It (ATO/Tax Law) | Risk Impact |
| :--- | :--- | :--- | :--- |
| **Existing ABN & Status** (`existingAbn`, `abnStatus`) | Your Australian Business Number. | Required to lodge Sole Trader business returns and BAS statements. | Standard |
| **BAS & GST Lodgement Period** (`basPeriod`, `reportingFrequency`, `gstStatus`, `overdueBas`) | Quarterly or Monthly BAS lodgement schedule. | Mandatory ATO Activity Statement reporting. | ⚠️ **+2 Risk Points** if Overdue BAS statements exist. |
| **Accounting Records & Method** (`recordsComplete`, `recordsMaintainedBy`, `accountingMethod`) | Bookkeeping status (Xero/MYOB/Cash) and Cash vs Accruals accounting. | Determines tax recognition timing and audit defense quality. | Standard |
| **Business Activity & Turnover** (`businessStartDate`, `businessActivity`, `businessLocation`, `expectedTurnover`, `profitExpectation`) | What your business does and expected yearly sales. | Compulsory GST registration is required if turnover exceeds $75,000 AUD. | 📈 **+2 Risk Points** if Expected Turnover > $500,000 AUD. |
| **Employees, PAYG & Fuel Tax** (`hasEmployees`, `registerPAYG`, `registerGST`, `fuelTaxCredits`, `imports`, `exports`) | Payroll, employee withholding, fuel tax, and import/export details. | Employer statutory obligations under ATO Business Portal. | Standard |

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: IDENTITY VERIFICATION & DOCUMENTS                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Field Name | Plain English Meaning | Why We Collect It (ATO/Tax Law) | Risk Impact |
| :--- | :--- | :--- | :--- |
| **ID Verification Method** (`identityMethod`) | How you choose to verify ID (Upload Photo ID, Electronic eID, Video Call, In-Person, No Photo ID). | TPB 100-Point identity verification mandatory under Tax Agent law. | ⚠️ **+2 Risk Points** if "No Photo ID" selected. |
| **Primary & Supporting Photo ID** (`primaryId`, `supportingId`) | Uploaded Driver's License, Passport, Medicare Card, or Utility Bill. | Confirms legal identity and prevents tax refund fraud. | Standard |
| **Selfie Photo & Biometric Consent** (`selfie`, `biometricConsent`) | Live photo holding ID for automated database matching. | Facial verification against Australian Government Document Verification Service (DVS). | Standard |

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 7: REPRESENTATIVE & REFUND BANK ACCOUNT                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Field Name | Plain English Meaning | Why We Collect It (ATO/Tax Law) | Risk Impact |
| :--- | :--- | :--- | :--- |
| **Submitting for Self vs Representative** (`isSelf`, `repName`, `relationship`, `authorityDoc`, `authorityDesc`) | Asks if you are completing this for yourself or as a Legal Guardian / Power of Attorney (POA). | Tax law prohibits third parties from signing tax forms without legal Guardianship or POA. | ⚠️ **+2 Risk Points** if Representative filing. |
| **Refund Bank Account** (`needBank`, `accountName`, `bsb`, `accountNumber`) | Your 6-digit BSB and Account Number for tax refunds. | Directs ATO tax refunds straight into your nominated Australian bank account. | Standard |

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 8: ENGAGEMENT SCHEDULE & SCOPE                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Field Name | Plain English Meaning | Why We Collect It (ATO/Tax Law) | Risk Impact |
| :--- | :--- | :--- | :--- |
| **Engagement Schedule Terms** (`hasViewedSchedule`) | Reviewing scope of work, accountant fees, and statutory responsibilities. | Legally required by Tax Practitioners Board (TPB Code of Professional Conduct). | Standard |

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 9: LEGAL CONSENTS & STATUTORY DECLARATIONS                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Field Name | Plain English Meaning | Why We Collect It (ATO/Tax Law) | Risk Impact |
| :--- | :--- | :--- | :--- |
| **TASA 2009 Authority** | Granting Financially Up authority to act as your registered Tax Agent. | Authorizes us to access ATO portal records, check tax debts, and lodge returns. | Mandatory Legal Consent |
| **Privacy Act 1988 & ATO Portal Consent** | Consent to collect personal tax data and manage ATO records. | Mandated by Australian Privacy Principles (APP). | Mandatory Legal Consent |

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 10: ELECTRONIC SIGNATURE & AUDIT TRAIL                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Field Name | Plain English Meaning | Why We Collect It (ATO/Tax Law) | Risk Impact |
| :--- | :--- | :--- | :--- |
| **Drawn Signature Image** (`signatureDrawnData`) | Your finger/stylus/mouse signature drawn on the digital canvas. | Serves as your legal signature under Electronic Transactions Act 1999 (ETA 1999). | Executed & Stored on PDF |
| **Signer Name, IP & Timestamp** (`signerFullName`, `ipAddress`, `submittedAt`) | Signer full legal name, computer IP address, and submission timestamp. | Fraud prevention and legal audit trail in case of ATO identity disputes. | Standard Audit Stamp |

---

## 📊 Summary Risk Calculation Formula

The system automatically sums the **Risk Points** from your answers:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│   TOTAL RISK SCORE = (ATO Issues: 3) + (Overdue BAS: 2)                   │
│                    + (No Photo ID: 2) + (Representative: 2)               │
│                    + (Turnover >$500k: 2) + (Foreign/Crypto: 1)           │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

- **`0 to 1 Point` = LOW RISK (Green):** Standard taxpayer. Fast-track Tax Agent approval.
- **`2 to 3 Points` = MEDIUM RISK (Amber):** Sole trader / foreign income. Standard Tax Agent document check.
- **`4+ Points` = HIGH RISK (Red):** ATO disputes / high turnover. Senior Tax Partner review required before acceptance.

---

*Document Version:* `v1.1.0` (Non-Technical Client Edition)  
*Published By:* Financially Up Compliance & Tax Advisory Team  
*Reference Standard:* TPB Identity Guidelines | TASA 2009 | ETA 1999 | Privacy Act 1988
