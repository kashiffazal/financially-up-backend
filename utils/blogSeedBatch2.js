/**
 * Blog Seed — batch 2 (one-time import)
 * =====================================
 * Five more articles, written in the admin editor format (HTML content), so
 * they can be edited like any post created at /admin/blog.
 *
 * Runs once: afterwards the settings row `system.blogSeededBatch2` is set, so
 * these posts are never re-imported after being edited or deleted. A post
 * whose slug already exists is skipped.
 *
 * Images live in the website's public folder (financially-up-frontend/public/images/blog),
 * CC0 photos from Openverse (StockSnap, rawpixel, Wikimedia Commons).
 */

const { sequelize, Setting, BlogPost, BlogCategory, BlogTag, BlogPostCategory, BlogPostTag } = require("../models");
const { slugify, sanitizePostHtml, computeReadTime } = require("../services/blog.service");

const SEED_MARKER = "system.blogSeededBatch2";

const AUTHORS = {
  MV: { authorName: "Marcus Vance", authorRole: "Senior Registered Tax Agent", authorQualifications: "CPA Australia, B.Com (Taxation)" },
  CH: { authorName: "Chloe Harrison", authorRole: "Principal Corporate Advisor", authorQualifications: "Chartered Accountant (CA), Tax Advisory Lead" },
  DC: { authorName: "David Chen", authorRole: "Expatriate & Migration Tax Specialist", authorQualifications: "CPA, Registered Tax Agent" },
};

const POSTS = [
  {
    slug: "partnership-tax-return-guide-australia",
    title: "Partnership Tax Returns Explained: How Profits, Losses and Partner Salaries Are Taxed",
    date: "2026-09-02",
    author: "CH",
    category: "Tips & Articles",
    tags: ["Partnerships", "ATO Compliance", "Tax Planning"],
    badge: "BUSINESS TAX",
    image: "/images/blog/partnership-tax-return.webp",
    focusKeyword: "partnership tax return",
    metaTitle: "Partnership Tax Return Guide for Australian Partners",
    metaDescription:
      "How a partnership tax return works in Australia: who pays the tax, how profits and losses are shared, why partner salaries aren't deductions, and key dates.",
    excerpt:
      "A partnership lodges its own tax return but doesn't pay tax itself. Here is how profits, losses and partner drawings flow through to each partner's personal return.",
    content: `
<p>Running a business with a partner is one of the simplest ways to share ownership, but the tax side often surprises people. A partnership has its own Tax File Number and lodges its own <strong>partnership tax return</strong> every year, yet the partnership itself pays no income tax. Instead, the net income is divided between the partners, and each partner pays tax on their share at their own marginal rate.</p>
<h2>How partnership income is taxed</h2>
<p>The partnership return reports the business's total income and deductions and shows how the net result is split. That split normally follows your partnership agreement; without one, the law generally treats partners as sharing equally. Each partner then includes their distribution in the "Partnerships and trusts" section of their individual return.</p>
<h2>Partner "salaries" are not deductions</h2>
<p>A common mistake is to treat money paid to partners as wages. Payments to partners — whether called salaries, drawings or allowances — are not deductible to the partnership. They are an advance of each partner's share of profit. Only genuine employees (who are not partners) are paid wages that go through payroll, PAYG withholding and super.</p>
<h2>What happens when there is a loss?</h2>
<p>A partnership loss is passed to the partners in the same proportions as profit. Partners can generally offset it against other income, but the <em>non-commercial loss rules</em> may require the loss to be deferred unless the business passes one of the income, profit, real property or other assets tests, or you meet the income requirement.</p>
<h2>Registrations a partnership needs</h2>
<ul>
<li>A partnership TFN and its own ABN</li>
<li>GST registration once annual turnover reaches $75,000</li>
<li>PAYG withholding registration if you employ staff</li>
<li>A registered business name if you trade under anything other than the partners' own names</li>
</ul>
<h2>Key dates</h2>
<table>
<tbody>
<tr><th>Situation</th><th>Usual lodgement date</th></tr>
<tr><td>Lodging the partnership return yourself</td><td>31 October</td></tr>
<tr><td>Lodging through a registered tax agent</td><td>Later dates under the agent's lodgement program</td></tr>
</tbody>
</table>
<blockquote>Put a written partnership agreement in place early. It decides how profits, losses and drawings are shared, and it protects every partner if the business changes or ends.</blockquote>
<h3>Key Takeaways</h3>
<ul>
<li>The partnership lodges a return, but each partner pays the tax on their share.</li>
<li>Partner salaries and drawings are profit distributions, not deductions.</li>
<li>Losses flow to partners but can be limited by the non-commercial loss rules.</li>
<li>A clear partnership agreement prevents most disputes with partners and the ATO.</li>
</ul>`,
  },
  {
    slug: "small-business-bookkeeping-essentials",
    title: "Bookkeeping Basics for Small Business: 7 Habits That Keep the ATO Happy",
    date: "2026-09-12",
    author: "MV",
    category: "Tips & Articles",
    tags: ["Bookkeeping", "BAS Lodgement", "ATO Compliance"],
    badge: "SMALL BUSINESS",
    image: "/images/blog/small-business-bookkeeping.webp",
    focusKeyword: "small business bookkeeping",
    metaTitle: "Small Business Bookkeeping: 7 Habits for ATO Compliance",
    metaDescription:
      "Seven simple small business bookkeeping habits that make BAS time faster, protect your deductions and keep your records ready for an ATO review.",
    excerpt:
      "Good books mean faster BAS lodgements, fewer missed deductions and no panic when the ATO asks questions. These seven habits make small business bookkeeping painless.",
    content: `
<p>Most small business tax problems don't start at tax time — they start months earlier with receipts in a shoebox and a bank account shared with personal spending. Solid <strong>small business bookkeeping</strong> doesn't need to be complicated. These seven habits cover what matters most.</p>
<h2>1. Keep a separate business bank account</h2>
<p>Mixing business and personal transactions is the fastest way to lose deductions and confuse your BAS. A dedicated account (and card) gives you a clean record of every business dollar.</p>
<h2>2. Use cloud accounting software</h2>
<p>Xero, MYOB or QuickBooks connect to your bank feed, calculate GST automatically and lodge BAS and Single Touch Payroll reports directly with the ATO.</p>
<h2>3. Reconcile every week or month</h2>
<p>Match each bank transaction to an invoice, bill or receipt while it's fresh. Reconciling quarterly means hunting for paperwork you no longer remember.</p>
<h2>4. Capture receipts digitally</h2>
<p>Snap receipts into your software or a receipt app as you go. The ATO accepts digital copies as long as they are clear, complete and kept for <strong>five years</strong>.</p>
<h2>5. Put GST and PAYG aside</h2>
<p>The GST you collect and the tax you withhold from wages belong to the ATO. Moving them into a separate savings account each week makes BAS payments stress-free.</p>
<h2>6. Stay on top of payroll and super</h2>
<p>Report wages through Single Touch Payroll each pay run and pay super on time — the super guarantee rate is <strong>12%</strong>, and under the Payday Super rules starting 1 July 2026, contributions are due shortly after each payday rather than quarterly.</p>
<h2>7. Review your reports monthly</h2>
<p>A ten-minute look at your profit and loss and aged receivables each month shows cash-flow problems and unpaid invoices before they become serious.</p>
<blockquote>If your books are behind, catching up before your next BAS is far cheaper than fixing errors after the ATO finds them.</blockquote>
<h3>Key Takeaways</h3>
<ul>
<li>Separate business and personal money from day one.</li>
<li>Reconcile regularly and keep digital records for five years.</li>
<li>Set aside GST and withheld tax so BAS is never a cash-flow shock.</li>
<li>Plan for Payday Super from 1 July 2026.</li>
</ul>`,
  },
  {
    slug: "capital-gains-tax-shares-crypto-australia",
    title: "Capital Gains Tax on Shares and Crypto: What Australian Investors Must Report",
    date: "2026-09-22",
    author: "DC",
    category: "Tax Planning",
    tags: ["Capital Gains Tax", "Individual Tax", "Tax Planning"],
    badge: "INVESTOR GUIDE",
    image: "/images/blog/capital-gains-tax-shares-crypto.webp",
    focusKeyword: "capital gains tax",
    metaTitle: "Capital Gains Tax on Shares and Crypto in Australia",
    metaDescription:
      "When capital gains tax applies to shares and crypto in Australia, how the 50% CGT discount works, using capital losses, and the records the ATO expects.",
    excerpt:
      "Selling shares or swapping one crypto for another can trigger capital gains tax. Learn when CGT applies, how the 50% discount works and how to use losses legally.",
    content: `
<p>The ATO receives data from share registries and Australian crypto exchanges, so investment disposals are one of the easiest things for it to check. Understanding <strong>capital gains tax</strong> (CGT) helps you report correctly — and keep more of your return.</p>
<h2>When does CGT apply?</h2>
<p>A CGT event usually happens when you dispose of an asset. For investors that includes:</p>
<ul>
<li>Selling shares, ETFs or units</li>
<li>Selling crypto for Australian dollars</li>
<li>Swapping one crypto for another (each swap is a disposal)</li>
<li>Using crypto to pay for goods or services</li>
<li>Gifting shares or crypto to someone else</li>
</ul>
<p>Simply buying and holding, or moving crypto between wallets you own, is not a CGT event.</p>
<h2>Working out your gain</h2>
<p>Your capital gain is what you received minus your <em>cost base</em>. The cost base includes the purchase price plus costs such as brokerage and exchange fees. The net gain for the year is added to your taxable income and taxed at your marginal rate.</p>
<h2>The 50% CGT discount</h2>
<p>Individuals and trusts that hold an asset for <strong>at least 12 months</strong> before disposing of it can usually reduce the gain by 50%. Timing a sale a few weeks later can therefore halve the tax on it.</p>
<h2>Using capital losses</h2>
<p>Capital losses can only be offset against capital gains, not wages. Unused losses carry forward indefinitely. Be careful with "wash sales" — selling an asset only to buy it back straight away to create a loss — as the ATO actively targets this.</p>
<table>
<tbody>
<tr><th>Scenario</th><th>Taxable gain</th></tr>
<tr><td>$10,000 gain, held 8 months</td><td>$10,000</td></tr>
<tr><td>$10,000 gain, held 14 months</td><td>$5,000 (after 50% discount)</td></tr>
</tbody>
</table>
<h3>Key Takeaways</h3>
<ul>
<li>Crypto-to-crypto swaps are taxable disposals.</li>
<li>Hold for 12 months or more to access the 50% CGT discount.</li>
<li>Capital losses offset capital gains only and carry forward.</li>
<li>Keep records of every purchase, sale, fee and wallet transfer.</li>
</ul>`,
  },
  {
    slug: "tax-return-checklist-31-october-deadline",
    title: "2025–26 Tax Return Checklist: What to Gather Before the 31 October Deadline",
    date: "2026-10-01",
    author: "MV",
    category: "Latest Posts",
    tags: ["Individual Tax", "ATO Compliance", "EOFY"],
    badge: "LODGE BY 31 OCT",
    image: "/images/blog/eofy-tax-checklist.webp",
    focusKeyword: "tax return checklist",
    metaTitle: "2025–26 Tax Return Checklist: Lodge Before 31 October",
    metaDescription:
      "Our 2025–26 tax return checklist: the income, deduction and private health records to gather before the 31 October deadline, plus how to get more time.",
    excerpt:
      "Lodging your own 2025–26 return? It's due by 31 October. Use this tax return checklist to gather everything first — or book in with us to access a later lodgement date.",
    content: `
<p>If you lodge your own return, your 2025–26 individual tax return is due by <strong>31 October 2026</strong>. Gathering everything before you start is the easiest way to avoid amendments later. Use this <strong>tax return checklist</strong> as your guide.</p>
<h2>Income to include</h2>
<ul>
<li>Income statements from every employer (check they are marked "tax ready" in myGov)</li>
<li>Bank and term deposit interest</li>
<li>Dividend statements and managed fund annual tax statements</li>
<li>Rental income and expense summaries from your property manager</li>
<li>Capital gains from shares, crypto or property sold during the year</li>
<li>Government payments and any foreign income</li>
</ul>
<h2>Deductions to claim</h2>
<ul>
<li>Working from home hours (the fixed rate method is 70 cents per hour) and records of the hours worked</li>
<li>Work-related car travel — logbook or kilometre records</li>
<li>Tools, equipment, uniforms and professional subscriptions</li>
<li>Self-education costs directly related to your current job</li>
<li>Donations of $2 or more to registered charities</li>
<li>The cost of managing your tax affairs, including last year's agent fee</li>
</ul>
<h2>Other documents</h2>
<ul>
<li>Private health insurance statement (affects the Medicare levy surcharge and rebate)</li>
<li>Spouse's taxable income, if you have one</li>
<li>HELP or other study loan balances</li>
</ul>
<h2>Need more time?</h2>
<p>If you're on a registered tax agent's client list before 31 October, you can usually access a later lodgement date under the agent's lodgement program. Late lodgement without an agent can attract failure-to-lodge penalties.</p>
<blockquote>Don't lodge too early: wait until your income statements are "tax ready" and pre-fill data has loaded, or you may need to amend your return.</blockquote>
<h3>Key Takeaways</h3>
<ul>
<li>Self-lodgers must lodge by 31 October 2026.</li>
<li>Gather income statements, investment records and deduction receipts first.</li>
<li>Working from home is 70 cents per hour under the fixed rate method.</li>
<li>Registering with a tax agent before 31 October can give you more time.</li>
</ul>`,
  },
  {
    slug: "car-expense-deductions-logbook-vs-cents-per-km",
    title: "Car Expense Deductions: Logbook Method vs Cents per Kilometre — Which Saves More?",
    date: "2026-10-08",
    author: "CH",
    category: "Tips & Articles",
    tags: ["Car Expenses", "Individual Tax", "ATO Compliance"],
    badge: "DEDUCTIONS GUIDE",
    image: "/images/blog/car-expense-deductions.webp",
    focusKeyword: "car expense deductions",
    metaTitle: "Car Expense Deductions: Logbook vs Cents per Km",
    metaDescription:
      "Compare the logbook and cents per kilometre methods for car expense deductions, see what counts as work travel, and learn which records the ATO expects.",
    excerpt:
      "Using your own car for work? Compare the cents per kilometre and logbook methods to see which gives the bigger car expense deduction — and what the ATO needs from you.",
    content: `
<p>Car expenses are one of the most claimed — and most reviewed — deductions in Australia. If you use your own car for work, there are two ways to work out your <strong>car expense deductions</strong>, and choosing the right one can make a big difference.</p>
<h2>What counts as work travel?</h2>
<p>You can claim trips made in the course of your work: visiting clients, travelling between two workplaces, or carrying bulky tools that you can't leave at work. Normal trips between home and your regular workplace are private and can't be claimed, even if you take a work call on the way.</p>
<h2>Method 1: cents per kilometre</h2>
<p>Multiply your work kilometres by the ATO's set rate (88 cents per kilometre for 2024–25 — check the rate for the year you're claiming). It covers all running costs, including fuel, servicing, insurance and depreciation.</p>
<ul>
<li>Claim up to <strong>5,000 work kilometres</strong> per car</li>
<li>No receipts needed, but you must be able to show how you worked out your kilometres (for example, a diary)</li>
</ul>
<h2>Method 2: logbook</h2>
<p>Keep a logbook for <strong>12 continuous weeks</strong> that represents your usual travel. It gives you a business-use percentage, which you apply to all your actual car costs: fuel, rego, insurance, servicing, interest and depreciation.</p>
<ul>
<li>No kilometre cap</li>
<li>A logbook stays valid for five years, unless your work travel changes significantly</li>
<li>You need receipts for your car costs (fuel can be estimated from odometer readings)</li>
</ul>
<h2>Which one is better?</h2>
<table>
<tbody>
<tr><th>You drive…</th><th>Usually better</th></tr>
<tr><td>Under 5,000 work km a year in a low-cost car</td><td>Cents per kilometre</td></tr>
<tr><td>Over 5,000 work km, or a high proportion of work use</td><td>Logbook</td></tr>
<tr><td>A newer or more expensive car</td><td>Logbook (depreciation and interest add up)</td></tr>
</tbody>
</table>
<blockquote>Start a logbook this year even if you plan to use cents per kilometre — it lets you compare both methods at tax time and choose the bigger deduction.</blockquote>
<h3>Key Takeaways</h3>
<ul>
<li>Home-to-work commuting is not deductible.</li>
<li>Cents per kilometre: simple, but capped at 5,000 km.</li>
<li>Logbook: more records, but often a much larger claim.</li>
<li>You can choose the method that gives the better result each year.</li>
</ul>`,
  },
];

const seedBlogBatch2 = async () => {
  if (await Setting.findOne({ where: { key: SEED_MARKER } })) return;

  let created = 0;
  await sequelize.transaction(async (transaction) => {
    for (const p of POSTS) {
      if (await BlogPost.findOne({ where: { slug: p.slug }, transaction })) continue;

      const [category] = await BlogCategory.findOrCreate({
        where: { slug: slugify(p.category) },
        defaults: { name: p.category, slug: slugify(p.category) },
        transaction,
      });
      const tagIds = [];
      for (const name of p.tags) {
        const [tag] = await BlogTag.findOrCreate({ where: { slug: slugify(name) }, defaults: { name, slug: slugify(name) }, transaction });
        tagIds.push(tag.id);
      }

      const content = sanitizePostHtml(p.content.trim());
      const post = await BlogPost.create(
        {
          title: p.title,
          slug: p.slug,
          content,
          structuredContent: null,
          excerpt: p.excerpt,
          status: "published",
          publishedAt: new Date(`${p.date}T09:00:00+10:00`),
          featured: false,
          badge: p.badge,
          featuredImage: p.image,
          ...AUTHORS[p.author],
          readTimeMinutes: computeReadTime({ content }),
          focusKeyword: p.focusKeyword,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
        },
        { transaction }
      );
      await BlogPostCategory.create({ postId: post.id, categoryId: category.id }, { transaction });
      await BlogPostTag.bulkCreate(tagIds.map((tagId) => ({ postId: post.id, tagId })), { transaction });
      created++;
    }
    await Setting.create({ key: SEED_MARKER, value: "1", label: "Blog sample posts (batch 2) imported", group: "system" }, { transaction });
  });
  if (created) console.log(`✅ Blog: imported ${created} more articles (batch 2).`);
};

module.exports = { seedBlogBatch2 };
