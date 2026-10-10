/**
 * Blog Seed (one-time import)
 * ===========================
 * Imports the articles that were hardcoded in the website
 * (financially-up-frontend/app/(web)/blog/data/blogData.js) into the database
 * the first time the blog tables exist, so the website keeps its content.
 *
 * Runs once: afterwards the settings row `system.blogSeeded` is set, so posts
 * deleted in the admin are never re-imported.
 */

const { sequelize, Setting, BlogPost, BlogCategory, BlogTag, BlogPostCategory, BlogPostTag } = require("../models");
const { slugify, computeReadTime } = require("../services/blog.service");

const SEED_MARKER = "system.blogSeeded";

// Filter-bar order on the website
const CATEGORIES = [
  { name: "Latest Posts", sortOrder: 1, description: "Our newest tax and accounting updates." },
  { name: "Announcements", sortOrder: 2, description: "Important ATO changes and practice announcements." },
  { name: "Tips & Articles", sortOrder: 3, description: "Practical tax tips for individuals and small businesses." },
  { name: "Tax Planning", sortOrder: 4, description: "Strategies to legally reduce tax and build wealth." },
];

// "#IndividualTax" (old post tags) -> tag name (old "Popular Tags" list)
const TAGS = {
  IndividualTax: "Individual Tax",
  WFHDeductions: "WFH Deductions",
  CompanyPtyLtd: "Company (Pty Ltd)",
  AssetProtection: "Asset Protection",
  TrustStructuring: "Trust Structuring",
  SMSFStrategies: "SMSF Strategies",
  BASLodgement: "BAS Lodgement",
  ATOCompliance: "ATO Compliance",
  MedicareExemption: "Medicare Exemption",
  TaxPlanning: "Tax Planning",
  PropertyTax: "Property Tax",
};

const AUTHORS = {
  MV: { authorName: "Marcus Vance", authorRole: "Senior Registered Tax Agent", authorQualifications: "CPA Australia, B.Com (Taxation)" },
  CH: { authorName: "Chloe Harrison", authorRole: "Principal Corporate Advisor", authorQualifications: "Chartered Accountant (CA), Tax Advisory Lead" },
  DC: { authorName: "David Chen", authorRole: "Expatriate & Migration Tax Specialist", authorQualifications: "CPA, Registered Tax Agent" },
};

const POSTS = [
  {
    slug: "maximize-wfh-tax-deductions-ato-guidelines",
    readTime: 5,
    title: "How to Maximize Working from Home (WFH) Tax Deductions Under Fixed Rate Method",
    category: "Tips & Articles",
    badge: "TAX TIPS 2026",
    image: "/images/services/individual-tax-return.webp",
    excerpt: "Learn how the ATO revised fixed-rate method works for home office expenses, what records you must keep, and whether actual cost claims deliver a higher refund.",
    summary: "The ATO revised fixed-rate method allows eligible taxpayers to claim 67 cents per hour worked from home. Discover record-keeping rules and how combining depreciation on office technology delivers maximum refund returns.",
    date: "2026-08-14",
    author: "MV",
    featured: true,
    tags: ["IndividualTax", "WFHDeductions", "ATOCompliance"],
    content: {
      intro: "Working from home continues to be the norm for hundreds of thousands of Australian professionals. However, claiming home office deductions has evolved significantly under ATO guidelines. Understanding the difference between the Revised Fixed Rate method and the Actual Cost method can put hundreds of dollars back in your tax refund.",
      sections: [
        { heading: "1. The Revised Fixed Rate Method (67c Per Hour)", body: "The ATO fixed-rate method allows eligible taxpayers to claim 67 cents per hour worked from home. This rate covers energy expenses (electricity and gas), phone and internet usage, and computer consumables/stationery. Crucially, you do not need a dedicated home office room to use this method; working from a kitchen bench or shared space is acceptable." },
        { heading: "2. Record-Keeping Requirements (No Estimates Allowed)", body: "The Australian Taxation Office strictly rejects generalized estimates or 4-week sample extrapolation. You must maintain a continuous record of all hours worked from home across the entire financial year (e.g., timesheets, digital logs, or calendar entries), along with at least one representative bill for each covered utility expense." },
        { heading: "3. What Can You Claim Separately?", body: "Expenses NOT included in the 67c hourly rate can still be claimed separately via depreciation. This includes office furniture (desks, ergonomic chairs), laptops, monitors, printers, and professional technology items costing over $300." },
        { heading: "4. Fixed Rate vs. Actual Cost Method: Which Wins?", body: "If you have dedicated home office space and significant internet or mobile phone business usage percentages, calculating actual expenses often yields a substantially higher deduction than the hourly flat rate." },
      ],
      keyTakeaways: [
        "Keep a daily logbook or calendar record of every hour worked from home.",
        "Retain at least one electricity and internet bill in your name.",
        "Depreciate computer equipment and ergonomic furniture over $300 separately.",
        "Consult your registered tax agent to calculate which method yields maximum savings.",
      ],
    },
  },
  {
    slug: "sole-trader-vs-pty-ltd-company-tax-asset-protection",
    readTime: 7,
    title: "Sole Trader vs Pty Ltd Company: Choosing the Right Structure for Tax & Asset Protection",
    category: "Tips & Articles",
    badge: "BUSINESS STRUCTURING",
    image: "/images/services/company.webp",
    excerpt: "A comprehensive breakdown of corporate tax rates (25%), personal liability shielding, ASIC compliance, and division 7A rules when incorporating in Australia.",
    summary: "Base rate companies enjoy a flat 25% tax rate compared to top individual rates of 45%. Explore personal liability protection, division 7A loan rules, and when your business should incorporate.",
    date: "2026-08-10",
    author: "CH",
    tags: ["CompanyPtyLtd", "AssetProtection", "TaxPlanning"],
    content: {
      intro: "As Australian small businesses and freelancers scale past $100,000 in net profit, transitioning from a Sole Trader structure to a Proprietary Limited (Pty Ltd) company becomes one of the most critical financial decisions. Here is what every business founder needs to evaluate.",
      sections: [
        { heading: "1. Corporate Tax Cap vs. Individual Marginal Rates", body: "Base rate entities (businesses with aggregated turnover under $50M receiving less than 80% passive income) pay a flat 25% company tax rate. Compared to the top individual marginal tax rate of 45% (plus 2% Medicare Levy), retaining profits inside a company offers substantial tax reinvestment efficiency." },
        { heading: "2. Personal Liability & Asset Protection", body: "A Pty Ltd company is a distinct legal entity. Directors and shareholders generally enjoy limited liability, protecting personal assets such as family homes and private savings from business debts or commercial litigation." },
        { heading: "3. ASIC Reporting & Compliance Costs", body: "Running a company involves higher compliance obligations, including annual ASIC review fees, corporate registers, separate company tax returns, and strict adherence to Division 7A loan agreements for director drawings." },
      ],
      keyTakeaways: [
        "Companies benefit from the flat 25% base rate corporate tax rate.",
        "Sole traders bear unlimited personal liability for commercial debts.",
        "Company profits cannot be drawn freely without PAYG wages or franked dividends.",
        "Transitioning requires formal business name and ABN/ACN transfer lodgements.",
      ],
    },
  },
  {
    slug: "medicare-levy-exemption-eligibility-guide-australia",
    readTime: 4,
    title: "Medicare Levy Exemption: Are You Eligible to Save 2% on Your Tax Return?",
    category: "Announcements",
    badge: "EXEMPTION GUIDE",
    image: "/images/services/home-Why-Choose-Us.webp",
    excerpt: "Discover how temporary visa holders (482, 485, 500) and foreign residents can apply for a Medicare Entitlement Statement to eliminate the 2% levy.",
    summary: "Temporary visa holders without Medicare access can legally eliminate the 2% Medicare Levy on their annual Australian taxable income by securing an official Medicare Entitlement Statement.",
    date: "2026-08-06",
    author: "DC",
    tags: ["MedicareExemption", "ATOCompliance", "IndividualTax"],
    content: {
      intro: "Most Australian residents pay a 2% Medicare Levy on their taxable income. However, individuals not eligible for Medicare benefits (such as temporary visa holders) are legally exempt from this surcharge if they obtain an official Medicare Entitlement Statement.",
      sections: [
        { heading: "1. The 3 Medicare Exemption Categories", body: "The ATO recognizes three categories of Medicare exemption: Category 1 (Not entitled to Medicare benefits), Category 2 (Foreign residents / Norfolk Island residents), and Category 3 (Individuals eligible for specific defense/repatriation benefits)." },
        { heading: "2. Temporary Visa Holders & Required Evidence", body: "Holders of 482 TSS, 485 Graduate, 500 Student, or other temporary visas who do not hold reciprocal healthcare access can claim full exemption for every day they were not eligible for Medicare." },
        { heading: "3. How Much Can You Save?", body: "On a taxable income of $90,000, a full year Medicare Levy Exemption returns exactly $1,800 in cash back to your tax refund. For high-income earners on $150,000, savings reach $3,000." },
      ],
      keyTakeaways: [
        "Obtain your Medicare Entitlement Statement (MES) before lodging your tax return.",
        "Save 2% on your entire annual taxable income.",
        "Ensure your private health insurance includes appropriate hospital cover if required.",
      ],
    },
  },
  {
    slug: "family-trust-distributions-section-100a-ato-rules",
    readTime: 6,
    title: "Family Discretionary Trusts: Navigating Section 100A & Resolution Deadlines",
    category: "Latest Posts",
    badge: "ASSET STRUCTURING",
    image: "/images/services/Trust.webp",
    excerpt: "Essential trustee guidelines on annual trust distribution resolutions by 30 June and navigating ATO Section 100A reimbursement agreements.",
    summary: "Discretionary Family Trusts provide asset protection and tax streaming flexibility. Learn about the 30 June resolution deadline and ATO Section 100A compliance rules.",
    date: "2026-08-01",
    author: "CH",
    tags: ["TrustStructuring", "AssetProtection", "TaxPlanning"],
    content: {
      intro: "Discretionary Family Trusts offer unparalleled flexibility for streaming capital gains and franked dividends while protecting family assets. However, heightened ATO scrutiny under Section 100A requires rigorous adherence to distribution timing and genuine beneficiary economic entitlement.",
      sections: [
        { heading: "1. The 30 June Trustee Resolution Requirement", body: "Trustees must execute written distribution resolutions on or before 30 June of each financial year. Failure to do so results in trust income being taxed at the highest individual marginal tax rate (47%) in the hands of the trustee." },
        { heading: "2. Understanding ATO Section 100A Risks", body: "Section 100A targets reimbursement agreements where trust income is distributed to a low-tax beneficiary (e.g., adult student child) but the economic benefit is retained by someone else (e.g., parents)." },
      ],
      keyTakeaways: [
        "Always execute trust distribution minutes on or before 30 June.",
        "Ensure beneficiaries receive the actual financial benefit of distributions.",
        "Stream capital gains and franked dividends in accordance with trust deed powers.",
      ],
    },
  },
  {
    slug: "quarterly-bas-gst-lodgement-mistakes-to-avoid",
    readTime: 5,
    title: "Top 5 Costly BAS & GST Lodgement Mistakes Small Businesses Make (And How to Fix Them)",
    category: "Tips & Articles",
    badge: "BAS & GST GUIDE",
    image: "/images/services/gst.webp",
    excerpt: "Avoid ATO audit triggers by mastering GST credits on motor vehicles, private use adjustments, and cash vs accruals accounting methods.",
    summary: "Business Activity Statements are the pulse of Australian small business compliance. Avoid costly mistakes regarding GST on vehicle purchases, private use adjustments, and international software.",
    date: "2026-07-26",
    author: "MV",
    tags: ["BASLodgement", "ATOCompliance", "IndividualTax"],
    content: {
      intro: "Business Activity Statements (BAS) are the pulse of small business compliance in Australia. Inaccurate reporting can result in heavy ATO penalties, interest charges, and unexpected cash flow deficits.",
      sections: [
        { heading: "1. Claiming GST on Non-GST Purchases", body: "One of the most frequent errors is claiming input tax credits on items with no GST, such as bank fees, ASIC fees, water rates, council rates, and international software subscriptions." },
        { heading: "2. Forgetting Private Use Adjustments", body: "If business assets (such as motor vehicles or smartphones) are used for personal purposes, GST credits must be apportioned strictly to the business-use percentage." },
      ],
      keyTakeaways: [
        "Check tax invoices for valid Australian Business Numbers (ABNs) and GST breakdowns.",
        "Exclude GST-free purchases like stamp duty and council rates from 1B credits.",
        "Reconcile bank accounts in your accounting software before quarterly BAS sign-off.",
      ],
    },
  },
  {
    slug: "smsf-contribution-caps-concessional-carry-forward",
    readTime: 6,
    title: "SMSF Contribution Strategies: Maximizing Concessional & Carry-Forward Caps",
    category: "Tax Planning",
    badge: "SUPERANNUATION",
    image: "/images/services/investment-property.webp",
    excerpt: "How to leverage the $30,000 concessional super cap and carry-forward unused caps to significantly reduce your taxable income.",
    summary: "Strategic super contributions remain one of the most effective tax-saving vehicles. Learn how to optimize the $30,000 concessional cap and 5-year catch-up carry forward rules.",
    date: "2026-07-20",
    author: "DC",
    tags: ["SMSFStrategies", "TaxPlanning", "AssetProtection"],
    content: {
      intro: "Strategic superannuation contributions remain one of the most effective methods for legally minimizing individual and corporate tax liability in Australia while building tax-sheltered retirement wealth.",
      sections: [
        { heading: "1. The $30,000 Annual Concessional Cap", body: "Concessional contributions (including employer Super Guarantee, salary sacrifice, and personal deductible contributions) are taxed at just 15% inside the super fund rather than your personal marginal tax rate." },
        { heading: "2. Utilizing Catch-Up Concessional Contributions", body: "If your total superannuation balance is below $500,000 at the start of the financial year, you can carry forward unused concessional caps from the prior five financial years." },
      ],
      keyTakeaways: [
        "Concessional contributions are taxed at a low 15% within the fund.",
        "Unused cap space can be carried forward for up to 5 consecutive years.",
        "Submit your Notice of Intent to Claim a Tax Deduction (s290-170) before lodging your return.",
      ],
    },
  },
  {
    slug: "property-investment-tax-deductions-negative-gearing",
    readTime: 6,
    title: "Property Investment Tax Deductions: Depreciation Schedules & Negative Gearing",
    category: "Tax Planning",
    badge: "PROPERTY TAX",
    image: "/images/services/sole-trader.webp",
    excerpt: "Maximize rental property tax benefits by claiming Division 40 & 43 depreciation, loan interest, and valid repairs according to ATO rules.",
    summary: "Rental property owners can significantly reduce their taxable income by combining negative gearing with quantity surveyor tax depreciation schedules for capital works and plant equipment.",
    date: "2026-07-12",
    author: "MV",
    tags: ["PropertyTax", "TaxPlanning", "IndividualTax"],
    content: {
      intro: "Property investment is one of Australia's most favoured wealth creation paths. Claiming every legitimate deduction—from interest on mortgages to quantity surveyor depreciation schedules—maximizes your annual tax return while preserving capital growth.",
      sections: [
        { heading: "1. Division 40 vs Division 43 Depreciation", body: "Capital works deductions (Division 43) allow you to claim 2.5% per year on the construction cost of the building over 40 years. Plant and equipment (Division 40)—such as hot water systems, ovens, and air conditioners—can be depreciated based on their effective life." },
        { heading: "2. Repairs vs Initial Capital Improvements", body: "The ATO closely scrutinizes repairs claimed immediately against initial improvements. Repairs that restore a damaged asset to its original state are deductible immediately, whereas improvements made before tenant occupancy must be depreciated." },
      ],
      keyTakeaways: [
        "Order a certified Quantity Surveyor depreciation report for investment properties.",
        "Deduct 100% of property management fees, landlord insurance, and council rates.",
        "Maintain clean loan accounts to substantiate all interest deductions.",
      ],
    },
  },
];

const seedBlog = async () => {
  const marker = await Setting.findOne({ where: { key: SEED_MARKER } });
  if (marker) return;
  if ((await BlogPost.count()) > 0) {
    // Blog already has content (created in the admin) — never import over it
    await Setting.create({ key: SEED_MARKER, value: "skipped", label: "Blog sample posts imported", group: "system" });
    return;
  }

  await sequelize.transaction(async (transaction) => {
    const categoryIds = {};
    for (const c of CATEGORIES) {
      const [row] = await BlogCategory.findOrCreate({
        where: { slug: slugify(c.name) },
        defaults: { name: c.name, slug: slugify(c.name), description: c.description, sortOrder: c.sortOrder },
        transaction,
      });
      categoryIds[c.name] = row.id;
    }

    const tagIds = {};
    for (const [key, name] of Object.entries(TAGS)) {
      const [row] = await BlogTag.findOrCreate({ where: { slug: slugify(name) }, defaults: { name, slug: slugify(name) }, transaction });
      tagIds[key] = row.id;
    }

    for (const p of POSTS) {
      const structuredContent = { ...p.content, summary: p.summary };
      const post = await BlogPost.create(
        {
          title: p.title,
          slug: p.slug,
          structuredContent,
          content: null,
          excerpt: p.excerpt,
          status: "published",
          publishedAt: new Date(`${p.date}T09:00:00+10:00`),
          featured: Boolean(p.featured),
          badge: p.badge,
          featuredImage: p.image,
          ...AUTHORS[p.author],
          readTimeMinutes: p.readTime || computeReadTime({ structuredContent }), // original read time
          metaTitle: p.title.slice(0, 60),
          metaDescription: p.excerpt.slice(0, 160),
        },
        { transaction }
      );
      await BlogPostCategory.create({ postId: post.id, categoryId: categoryIds[p.category] }, { transaction });
      await BlogPostTag.bulkCreate(p.tags.map((t) => ({ postId: post.id, tagId: tagIds[t] })), { transaction });
    }

    await Setting.create({ key: SEED_MARKER, value: "1", label: "Blog sample posts imported", group: "system" }, { transaction });
  });
  console.log(`✅ Blog: imported ${POSTS.length} existing articles.`);
};

module.exports = { seedBlog };
