# Finance data — local only

Everything in this folder except this file is gitignored. Statements, ledgers
and tax documents stay on this machine; the Taxes sheet reads them through
`/api/finance/ledger` when the dev server is running (`npm run dev`, then
`/finance/taxes`). On Vercel the folder does not exist and the sheet shows the
model without a ledger.

## What to drop here

Any number of CSV files. The format is detected from the header row.

| Source | How to export | Header the parser looks for |
|---|---|---|
| Apple Card | Wallet → Apple Card → Card Balance → a statement → Export Transactions (CSV) | `Transaction Date, Clearing Date, Description, Merchant, Category, Type, Amount (USD)` |
| Chase credit card | chase.com → the card → Download activity → CSV, full year | `Transaction Date, Post Date, Description, Category, Type, Amount, Memo` |
| Chase checking | chase.com → the account → Download activity → CSV, full year | `Details, Posting Date, Description, Amount, Type, Balance` |
| Your own expense or transaction log | Sheets → File → Download → CSV | Any header with a **date** column and an **amount** column; optional `Description`, `Category`, `Note`, `Deductible` (y/n) |

Positive amounts in a log are spend. A `Category` value that names a bucket
(`software`, `equipment`, `professional`, `education`, `travel`, `meals`,
`phone-internet`, `workspace`, `advertising`, `insurance`, `bank-fees`,
`health`, `retirement`, `taxes`) overrides the automatic classification.

PDFs and other non-CSV files are listed as documents on hand and not parsed.

## What the sheet does with them

1. Normalizes every line so spend is positive and payments, transfers and
   deposits are set aside.
2. Classifies each line into a bucket mapped to a Schedule C line
   (`lib/finance/categories.ts` holds the rules; add a merchant there when the
   sheet gets one wrong).
3. Reconciles the cards against the log by amount and date: card lines with
   no log entry are deductions not yet claimed; log lines with no card line
   need a receipt from somewhere else.
