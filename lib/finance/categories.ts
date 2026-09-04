/**
 * Expense buckets — how a card line becomes a Schedule C line.
 *
 * Rules run top to bottom against the description, merchant and the card's
 * own category; the first hit wins. Deductibility is a starting position for
 * review, never a verdict: `yes` is ordinary and necessary on its face,
 * `maybe` needs a business-share or a purpose note, `no` is personal.
 */

export type Deductible = 'yes' | 'maybe' | 'no'

export type Bucket =
  | 'software'
  | 'equipment'
  | 'professional'
  | 'education'
  | 'travel'
  | 'meals'
  | 'phone-internet'
  | 'workspace'
  | 'advertising'
  | 'insurance'
  | 'bank-fees'
  | 'health'
  | 'retirement'
  | 'taxes'
  | 'transfer'
  | 'income'
  | 'groceries'
  | 'dining'
  | 'shopping'
  | 'home'
  | 'transport'
  | 'fitness'
  | 'entertainment'
  | 'personal'
  | 'uncategorized'

export interface BucketDef {
  bucket: Bucket
  label: string
  /** Where it lands on Schedule C, or why it does not. */
  scheduleC: string
  deductible: Deductible
  /** Fraction of the spend that is deductible when it is business (meals are 50%). */
  share: number
}

export const BUCKETS: Record<Bucket, BucketDef> = {
  software: { bucket: 'software', label: 'Software & subscriptions', scheduleC: 'Line 18 · office expense', deductible: 'yes', share: 1 },
  equipment: { bucket: 'equipment', label: 'Equipment & hardware', scheduleC: 'Line 13 · depreciation (100% bonus after Jan 19, 2025)', deductible: 'yes', share: 1 },
  professional: { bucket: 'professional', label: 'Legal, accounting, contractors', scheduleC: 'Line 17 · legal and professional', deductible: 'yes', share: 1 },
  education: { bucket: 'education', label: 'Books, courses, research', scheduleC: 'Line 27a · other (education that maintains skills)', deductible: 'maybe', share: 1 },
  travel: { bucket: 'travel', label: 'Travel', scheduleC: 'Line 24a · travel (business purpose per trip)', deductible: 'maybe', share: 1 },
  meals: { bucket: 'meals', label: 'Business meals', scheduleC: 'Line 24b · meals, 50% (who and why)', deductible: 'maybe', share: 0.5 },
  'phone-internet': { bucket: 'phone-internet', label: 'Phone & internet', scheduleC: 'Line 25 · utilities (business share)', deductible: 'maybe', share: 0.5 },
  workspace: { bucket: 'workspace', label: 'Coworking & workspace', scheduleC: 'Line 20b · rent, other business property', deductible: 'yes', share: 1 },
  advertising: { bucket: 'advertising', label: 'Advertising & domains', scheduleC: 'Line 8 · advertising', deductible: 'yes', share: 1 },
  insurance: { bucket: 'insurance', label: 'Business insurance', scheduleC: 'Line 15 · insurance', deductible: 'maybe', share: 1 },
  'bank-fees': { bucket: 'bank-fees', label: 'Bank & payment fees', scheduleC: 'Line 27a · other (business accounts only)', deductible: 'maybe', share: 1 },
  health: { bucket: 'health', label: 'Health insurance & medical', scheduleC: 'Form 1040 Sch 1 · SE health insurance (premiums only)', deductible: 'maybe', share: 1 },
  retirement: { bucket: 'retirement', label: 'Retirement contributions', scheduleC: 'Form 1040 Sch 1 · SEP / solo 401(k)', deductible: 'maybe', share: 1 },
  taxes: { bucket: 'taxes', label: 'Tax payments', scheduleC: 'Not deductible federally; NYS + NYC payments count toward SALT', deductible: 'no', share: 0 },
  transfer: { bucket: 'transfer', label: 'Card payments & transfers', scheduleC: 'Not an expense', deductible: 'no', share: 0 },
  income: { bucket: 'income', label: 'Income & deposits', scheduleC: 'Line 1 · gross receipts (if from a client)', deductible: 'no', share: 0 },
  groceries: { bucket: 'groceries', label: 'Groceries', scheduleC: 'Personal', deductible: 'no', share: 0 },
  dining: { bucket: 'dining', label: 'Dining (personal)', scheduleC: 'Personal unless a business meal', deductible: 'no', share: 0 },
  shopping: { bucket: 'shopping', label: 'Shopping', scheduleC: 'Personal', deductible: 'no', share: 0 },
  home: { bucket: 'home', label: 'Home & rent', scheduleC: 'Personal; the home-office share goes on Form 8829', deductible: 'no', share: 0 },
  transport: { bucket: 'transport', label: 'Local transport', scheduleC: 'Personal unless to a client site', deductible: 'no', share: 0 },
  fitness: { bucket: 'fitness', label: 'Fitness & sport', scheduleC: 'Personal', deductible: 'no', share: 0 },
  entertainment: { bucket: 'entertainment', label: 'Entertainment', scheduleC: 'Personal (entertainment is never deductible)', deductible: 'no', share: 0 },
  personal: { bucket: 'personal', label: 'Personal', scheduleC: 'Personal', deductible: 'no', share: 0 },
  uncategorized: { bucket: 'uncategorized', label: 'Uncategorized', scheduleC: 'Review', deductible: 'maybe', share: 1 },
}

interface Rule {
  bucket: Bucket
  pattern: RegExp
}

/** Order matters: transfers and income first, then business, then personal. */
export const RULES: Rule[] = [
  // Transfers, card payments, tax payments
  { bucket: 'transfer', pattern: /\b(payment thank you|autopay|automatic payment|applecard gsbank|apple card|goldman sachs bank|chase credit crd|epay|online transfer|zelle|venmo|paypal transfer|wire|ach transfer|savings)\b/i },
  { bucket: 'taxes', pattern: /\b(irs|usataxpymt|us treasury|nys dtf|nys tax|nyc dept of fin|estimated tax|tax payment|dtf pit)\b/i },
  { bucket: 'retirement', pattern: /\b(sep ira|sep-ira|solo 401|401k|401\(k\)|fidelity|vanguard|schwab|ira contribution)\b/i },
  { bucket: 'health', pattern: /\b(oscar|healthfirst|emblem|aetna|cigna|united ?health|blue cross|health insurance|nystateofhealth|one medical|dental|medical|pharmacy|cvs|walgreens|duane reade)\b/i },
  { bucket: 'income', pattern: /\b(deposit|direct dep|payroll|invoice|stripe transfer|gusto|bill\.com|alamo|remittance)\b/i },
  // Business
  { bucket: 'software', pattern: /\b(anthropic|claude|openai|chatgpt|github|vercel|google (cloud|workspace|gsuite)|gsuite|notion|figma|slack|zoom|dropbox|1password|cursor|linear|supabase|firebase|aws|amazon web services|heroku|render\.com|netlify|cloudflare|namecheap|godaddy|mapbox|twilio|sendgrid|resend|adobe|microsoft 365|office 365|apple\.com\/bill|icloud|jetbrains|replit|perplexity|midjourney|bloomberg|refinitiv|koyfin|tradingview|quandl|polygon\.io|substack|medium|wsj|financial times|ft\.com|economist|nyt digital|arxiv|overleaf|calendly|loom|superhuman|granola|otter\.ai|wave\.ai|readwise|obsidian|roam)\b/i },
  { bucket: 'equipment', pattern: /\b(apple store|b&h|bhphoto|best buy|micro center|dell|lenovo|logitech|monitor|keyboard|macbook|ipad|iphone)\b/i },
  { bucket: 'professional', pattern: /\b(cpa|accountant|accounting|tax prep|turbotax|h&r block|legal|attorney|law office|legalzoom|clerky|stripe atlas|upwork|fiverr|contractor|toptal)\b/i },
  { bucket: 'education', pattern: /\b(amazon|kindle|audible|books?|bookstore|strand|barnes|coursera|udemy|edx|stanford|mit press|oreilly|o'reilly|springer|elsevier|jstor|conference|summit|workshop|ticket.*(conf|summit)|sfi|santa fe institute|masterclass)\b/i },
  { bucket: 'travel', pattern: /\b(airlines?|airways|delta|united|jetblue|american air|lufthansa|klm|air france|norwegian|ryanair|wizz|easyjet|amtrak|hotel|marriott|hilton|hyatt|airbnb|vrbo|booking\.com|expedia|kayak|hertz|avis|enterprise rent|lyft.*airport|jfk|lga|ewr|tsa|global entry|priority pass)\b/i },
  { bucket: 'meals', pattern: /\b(client (lunch|dinner)|business (lunch|dinner)|meeting)\b/i },
  { bucket: 'phone-internet', pattern: /\b(verizon|at&t|att\*|t-mobile|tmobile|mint mobile|google fi|spectrum|optimum|xfinity|comcast|starlink|fios)\b/i },
  { bucket: 'workspace', pattern: /\b(wework|industrious|coworking|regus|the wing|soho works|neuehouse|desk rental)\b/i },
  { bucket: 'advertising', pattern: /\b(google ads|meta ads|facebook ads|linkedin premium|linkedin ads|twitter|x corp|domain|squarespace|wix|mailchimp|beehiiv|convertkit)\b/i },
  { bucket: 'insurance', pattern: /\b(hiscox|next insurance|thimble|errors and omissions|e&o|liability insurance|professional insurance)\b/i },
  { bucket: 'bank-fees', pattern: /\b(monthly service fee|wire fee|foreign transaction fee|interest charge|annual fee|late fee|overdraft|atm fee|mercury|brex|relay)\b/i },
  // Personal
  { bucket: 'groceries', pattern: /\b(whole foods|trader joe|wegmans|key food|fairway|west side market|morton williams|gristedes|d'agostino|citarella|zabar|fresh direct|freshdirect|instacart|grocery|market|deli|bodega|union market|foodtown|h mart|costco|aldi)\b/i },
  { bucket: 'dining', pattern: /\b(restaurant|cafe|café|coffee|starbucks|blue bottle|dunkin|pizza|sushi|ramen|taco|burger|bar\b|pub\b|bistro|kitchen|grill|diner|bakery|doordash|uber ?eats|grubhub|seamless|caviar|sweetgreen|chipotle|dig inn|cava|just salad|juice|smoothie|tea\b|matcha|wine|liquor)\b/i },
  { bucket: 'transport', pattern: /\b(mta|metrocard|omny|nyc transit|lirr|metro-north|nj transit|path\b|uber|lyft|citi bike|citibike|revel|taxi|cab\b|parking|tolls?|ez ?pass|gas station|shell|exxon|bp\b|mobil)\b/i },
  { bucket: 'fitness', pattern: /\b(equinox|gym|crossfit|peloton|barry|soulcycle|yoga|pilates|climbing|swim|pool|triathlon|ironman|strava|whoop|garmin|kite|surf|bike shop|running|nike|lululemon|rei\b)\b/i },
  { bucket: 'entertainment', pattern: /\b(netflix|spotify|hulu|hbo|max\b|disney|apple tv|prime video|youtube|cinema|theater|theatre|amc\b|regal|concert|ticketmaster|stubhub|museum|moma|met museum|steam|playstation|nintendo|xbox)\b/i },
  { bucket: 'shopping', pattern: /\b(target|walmart|zara|uniqlo|h&m|sephora|ulta|nordstrom|macy|bloomingdale|ikea|wayfair|etsy|ebay|shein|everlane|madewell|j\.?crew|aritzia|cos\b|arket|muji)\b/i },
  { bucket: 'home', pattern: /\b(rent|landlord|management co|con ?edison|coned|national grid|utility|electric|renters insurance|lemonade|laundry|dry clean|cleaner|home depot|lowes|bed bath)\b/i },
  { bucket: 'personal', pattern: /\b(salon|barber|haircut|spa\b|massage|nails|therapy|therapist|counsel|gift|flowers|1-800|amazon prime|usps|fedex|ups store)\b/i },
]

/** Card-native categories that settle a bucket when no rule fires. */
const CARD_CATEGORY: { pattern: RegExp; bucket: Bucket }[] = [
  { pattern: /^(groceries|grocery)$/i, bucket: 'groceries' },
  { pattern: /^(food & drink|restaurants?|dining)$/i, bucket: 'dining' },
  { pattern: /^(travel|hotels?|airfare)$/i, bucket: 'travel' },
  { pattern: /^(gas|automotive|transportation|transit)$/i, bucket: 'transport' },
  { pattern: /^(entertainment)$/i, bucket: 'entertainment' },
  { pattern: /^(shopping|merchandise)$/i, bucket: 'shopping' },
  { pattern: /^(health & wellness|health|personal)$/i, bucket: 'personal' },
  { pattern: /^(bills & utilities|utilities)$/i, bucket: 'home' },
  { pattern: /^(professional services|services)$/i, bucket: 'professional' },
  { pattern: /^(education)$/i, bucket: 'education' },
  { pattern: /^(fees & adjustments|fees)$/i, bucket: 'bank-fees' },
  { pattern: /^(home)$/i, bucket: 'home' },
]

export function classify(text: string, cardCategory?: string): Bucket {
  const hay = text.replace(/\s+/g, ' ')
  for (const r of RULES) if (r.pattern.test(hay)) return r.bucket
  if (cardCategory) for (const c of CARD_CATEGORY) if (c.pattern.test(cardCategory.trim())) return c.bucket
  return 'uncategorized'
}

/** Buckets that feed the deductible-candidates view, in the order they are shown. */
export const BUSINESS_BUCKETS: Bucket[] = [
  'software',
  'equipment',
  'professional',
  'education',
  'travel',
  'meals',
  'phone-internet',
  'workspace',
  'advertising',
  'insurance',
  'bank-fees',
  'uncategorized',
]

export const ABOVE_LINE_BUCKETS: Bucket[] = ['health', 'retirement']
