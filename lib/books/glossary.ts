/**
 * Terms the shelf assumes.
 *
 * Defined where they are used rather than in a preface, and each with a worked
 * example rather than a paraphrase — a definition you cannot apply to a live
 * position is not a definition.
 */
export const SHELF_GLOSSARY: { term: string; definition: string }[] = [
  {
    term: 'Variant perception',
    definition:
      'A view that differs from the price-implied consensus, held with a stated reason the consensus is wrong and a stated catalyst that forces it to converge. Example: the market prices airBaltic equity for a recapitalisation at par; the variant is that lessor claims subordinate the equity entirely, and the catalyst is the restructuring plan filing.',
  },
  {
    term: 'Price-implied expectations',
    definition:
      'The revenue growth, margin and capital-intensity path a current share price already embeds. Example: a stock at 40x implies a decade of 20% growth — the trade is not whether growth is good, it is whether 20% gets revised up or down.',
  },
  {
    term: 'Capital structure seniority',
    definition:
      'The order in which claims are paid in a bankruptcy — secured debt, then unsecured, then preferred, then equity. Example: in most Chapter 11 outcomes the unsecured bonds convert into the new equity and the old equity is cancelled, which is why the asymmetry sits in the debt.',
  },
  {
    term: 'Performativity',
    definition:
      'When a model does not describe a market but helps produce it. Example: Black-Scholes option prices were wrong on arrival and became right as traders adopted the model and traded to it — MacKenzie’s case, and the bridge between the two lanes on this shelf.',
  },
]
