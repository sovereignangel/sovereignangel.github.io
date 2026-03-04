import type {
  FundMetrics,
  Meeting,
  ProposalPhase,
  FinancialScenario,
  Risk,
  ScalingMilestone,
  AgreementClause,
  ActionItem,
} from './types'

// ── Fund Metrics ────────────────────────────────────────────────
export const FUND_METRICS: FundMetrics = {
  aum: 1_500_000,
  targetAum: 3_000_000,
  monthlyDividendRevenue: { low: 80_000, high: 104_000 },
  targetMonthlyRevenue: 250_000,
  seanTakePercent: 10,
  investorReturnRange: { low: 11, high: 14 },
  lockupMonths: 18,
  stockUniverse: 2_700,
  dailyHours: { low: 2, high: 3 },
  collateralType: 'U.S. Treasury Bonds',
  strategyName: 'Dividend Capture',
}

// ── Meetings ────────────────────────────────────────────────────
export const MEETINGS: Meeting[] = [
  {
    id: 'meeting-2026-02-26',
    date: '2026-02-26',
    title: 'Partnership Exploration & Fund Deep Dive',
    participants: ['Lori Corpuz', 'Sean Becker'],
    duration: '45 min',
    summary:
      'First deep operational dive into Alamo Bernal\'s dividend capture strategy. Covered fund structure (treasury bond collateral, line of credit leverage), daily workflow (Fidelity screening → manual selection → buy before ex-dividend → sell next morning), current AUM ($1.5M), revenue ($80-104K/month), and scaling targets ($3M AUM, $250K/month). Discussed technology automation opportunities, fundraising needs, and potential partnership structure.',
    insights: [
      {
        category: 'workflow',
        text: 'Sean screens stocks 1-2x/week using Fidelity filters (price, dividend yield 3-9%, NYSE/NASDAQ, no Puerto Rico withholding). Filters ~2,700 stocks down to 3-15 daily candidates.',
        confidence: 'high',
      },
      {
        category: 'workflow',
        text: 'Daily execution: Buy in last 10 minutes before market close → hold overnight → sell at market open via limit order capped at 50% dividend loss.',
        confidence: 'high',
      },
      {
        category: 'strategy',
        text: 'Alpha persists because the strategy is labor-intensive and not what institutional investors are paid to do. Professional finance focuses on finding "the next big thing" or preserving wealth in bonds.',
        confidence: 'medium',
      },
      {
        category: 'structure',
        text: 'Fund is fully de-risked via treasury bond collateral. All investor capital buys treasuries, trading done on line of credit proceeds. Not disclosed to all investors due to complexity.',
        confidence: 'high',
      },
      {
        category: 'structure',
        text: 'Investor returns structured like bonds: fixed quarterly payments (11-14% annualized), not tied to fund performance. Principal returned at end of term. 18-month lockup.',
        confidence: 'high',
      },
      {
        category: 'risk',
        text: 'Tax complexity is critical: Section 475 election required to offset dividend income with stock losses. Without it, tax burden would kill the strategy.',
        confidence: 'high',
      },
      {
        category: 'risk',
        text: 'Scaling bottleneck: large AUM makes it difficult to buy/sell small-cap dividend stocks with sufficient volume. $5M+ stake in small stocks would face liquidity issues.',
        confidence: 'medium',
      },
      {
        category: 'ambition',
        text: 'Sean\'s exit number: $250K/month dividend revenue → $25K/month personal take (10%) → quit law firm. Currently at $80-104K/month, needs ~$3M AUM.',
        confidence: 'high',
      },
      {
        category: 'opportunity',
        text: 'Three collaboration angles: (1) technology automation, (2) capital raising ($220M+ Lori experience), (3) long-term R&D for new strategies with frontier AI.',
        confidence: 'high',
      },
      {
        category: 'opportunity',
        text: 'AI could analyze historical ex-dividend price behavior across years of data to identify stocks that don\'t crash too much — the core risk mitigation need.',
        confidence: 'high',
      },
      {
        category: 'strategy',
        text: 'Margin trading amplifies returns but introduces additional risk. Sean uses margin on Fidelity to increase position sizes on high-conviction plays.',
        confidence: 'medium',
      },
    ],
    nextSteps: [
      'Lori: Research Series 7 requirements and legal constraints on securities advisory',
      'Lori: Review Sean\'s subscription agreement and federal disclosures',
      'Sean: Reflect on minimum comfortable lockup period (current: 18 months)',
      'Sean: Consider if lockup period would change if operating full-time',
      'Both: Schedule follow-up call for March 4, 2026 (Thursday)',
      'Lori: Think through fundraising positioning and investor pitch structure',
      'Lori: Assess technology build feasibility for stock screening automation',
    ],
    tags: ['strategy', 'structure', 'technology', 'fundraising'],
  },
  {
    id: 'meeting-2026-03-04',
    date: '2026-03-04',
    title: 'Phase 1 Scoping & Fidelity Workflow Deep Dive',
    participants: ['Lori Corpuz', 'Sean Becker'],
    duration: '42 min',
    summary:
      'Follow-up focused on Phase 1 scoping. Sean clarified his actual Fidelity workflow: the screener itself is "pretty good" (~1 hr/week), but record keeping is the real time sink — a massive spreadsheet tracking buys, sells, capture rates, % dividend lost, and days to execute. Historical nosedive analysis is entirely informal (Google/ChatGPT per stock). Sean confirmed $2K/month pricing works and called limit order optimization "the key to everything." Fundraising momentum is strong: Instagram story driving organic inbound, with Wells Fargo and Schwab contacts this week. Sean sent PPM, subscription agreement, and operating agreement for review.',
    insights: [
      {
        category: 'workflow',
        text: 'PROBLEM: Record keeping takes MORE time than screening. Massive spreadsheet tracking buys, sells, capture rate, % dividend lost, days to execute. Manual entry at end of each day + monthly roll-up on separate sheet.',
        confidence: 'high',
      },
      {
        category: 'workflow',
        text: 'Fidelity screener is "pretty good" — stock picking is ~1 hr/week (not the pain point). The 2,700→15 stock funnel works. But Fidelity\'s per-stock data is "too blunt" — Sean always double-checks manually.',
        confidence: 'high',
      },
      {
        category: 'workflow',
        text: 'PROBLEM: Historical nosedive analysis is fully informal. Sean manually Googles or asks ChatGPT "did this stock undergo a stock split?" to explain price drops. No systematic data across the 12 dividend cycles per stock.',
        confidence: 'high',
      },
      {
        category: 'risk',
        text: 'PROBLEM: Canadian stocks withhold 25% of dividends at source. Messes up cash flow projections ("I just don\'t have as much cash as I think I\'m going to have") AND record keeping. Currently excluded from universe to avoid complexity.',
        confidence: 'high',
      },
      {
        category: 'risk',
        text: 'PROBLEM: Trust gap with automation. Sean fears he\'ll "end up double checking against all of it anyway." Any tool needs to be trustworthy enough to trade on directly — not just another layer to verify.',
        confidence: 'high',
      },
      {
        category: 'strategy',
        text: 'Limit order optimization is "the key to everything" per Sean. Two scenarios: (1) stock nosediving — AI says sell now, don\'t wait for 50% threshold, cut losses. (2) stock rising — don\'t set limit order yet, wait and lose only 5% of dividend instead of 50%. Highest-value deliverable.',
        confidence: 'high',
      },
      {
        category: 'strategy',
        text: 'Sean\'s nosedive risk framework: Out of 12 dividend cycles (3 years), how many times did the stock drop below 50% dividend threshold on market open? Then layer: how many of those were explained by general market forces (S&P drop, VIX spike, industry headwind)?',
        confidence: 'high',
      },
      {
        category: 'opportunity',
        text: 'Fundraising momentum accelerating. Instagram story generated organic inbound. Cousin of existing investor wants Class A (11%). Calls scheduled with Wells Fargo contact and Schwab contact this week. Word of mouth from invested friends is the most effective channel.',
        confidence: 'high',
      },
      {
        category: 'ambition',
        text: 'PROBLEM: Legitimacy gap for big money. Sean worries: "I\'m not quite legit enough" — Wyoming LLC vs. Delaware partnerships with offshore versions. Wants to "learn the language" at investment conferences.',
        confidence: 'high',
      },
      {
        category: 'opportunity',
        text: 'Conference recommendations for Sean: Milken Global Conference (top tier), SALT, All-In Summit (baby step). Future of Finance (DC, happening today). Goal: learn institutional language, build peer network, identify LP prospects.',
        confidence: 'medium',
      },
      {
        category: 'structure',
        text: 'Sean sent PPM, subscription agreement, and operating agreement for Lori to review. Treasury bond process: start of month, buys 30-year treasuries with prior month\'s dividend cash, then draws on line of credit for trading capital.',
        confidence: 'high',
      },
      {
        category: 'risk',
        text: 'PROBLEM: Treasury bond concentration. Sean tried to diversify internationally (UK, Japan bonds) at Merrill Lynch — told "the US is the only one." Single-country sovereign exposure.',
        confidence: 'medium',
      },
      {
        category: 'risk',
        text: 'PROBLEM: Cost ceiling. Can\'t afford Bloomberg terminal or fund administrator yet. Any tech costs must stay within what the model supports. $2K/month tech + $200-300/month data feeds confirmed as workable.',
        confidence: 'high',
      },
      {
        category: 'opportunity',
        text: 'International exchanges as R&D opportunity. Idea: dividend capture on stable foreign markets (Scandinavian, Dutch utilities) where volatility is lower. Tax and regulatory complexity TBD. Sean\'s idea — filed as Phase 3 R&D.',
        confidence: 'low',
      },
      {
        category: 'workflow',
        text: 'FIDELITY FLOW vs. TECH BUILD: Screening (Fidelity good, ~1hr/week) → Record keeping (massive pain, manual spreadsheet, biggest time sink) → Historical nosedive check (informal, per-stock Google/ChatGPT) → Limit orders (fixed 50%, no dynamic optimization) → Canadian withholding (excluded entirely, lost opportunity).',
        confidence: 'high',
      },
    ],
    nextSteps: [
      'Lori: Review PPM, subscription agreement, and operating agreement',
      'Lori: Finalize data feed provider research with exact costs for Sean',
      'Lori: Send simplified Phase 1 proposal with feature themes from this call',
      'Sean: Wells Fargo contact call (this week)',
      'Sean: Schwab contact call (Thursday)',
      'Both: Schedule next weekly call',
      'Lori: Introduce Sean to Alec (VC) at South by Southwest investment event',
    ],
    tags: ['technology', 'fundraising', 'strategy', 'operations'],
    rawTranscript: `Sean Becker: Like, oh, I mean, let me not like, let me not notice all this like nose diving and stuff. Oh, my gosh. And how has that changed how you're feeling?

Lori Corpuz: Did you buy anything today? Go shopping? I didn't go shopping on the market.

Sean Becker: Oh, man.

Lori Corpuz: It was a Yeah, I mean, it's a spicy day.

Sean Becker: We'll just put it that way. But I mean, some beautiful, weather outside I'm going to the gym later and all will be well I had a cousin of mine like text me it's like hey I saw all these like investment fund documents that you sent to my dad because I had like my uncle with the stuff and she was like I want to get in on the class a like 11% returns like let's talk this week oh man that's great so how's your flow been with that in general It's been really good since I posted this Insta story, which I think was not, I mean, the one that you saw, I think, right?

Sean Becker: So, I mean, I can't really like advertise this per se, but I was just saying something about my life of like, hey, this thing that I'm doing is blowing up. And then just the idea of like texting people these little, you know, screenshot photos of it rather than these big formal emails I've been doing. It's generating some good interest. I'm talking tomorrow with a friend of a friend who works at Wells Fargo, like, like placing people's money into investments like cool.

Lori Corpuz: Oh, like a proper like, has serious all that stuff. Yeah, yeah, that would be like the legal most official way to fundraise, like scale your fundraising, because they have all the series licenses and stuff like that. Well, I mean, I don't know.

Sean Becker: Yeah, I mean, it's not like he would be doing it on my behalf. I think he just sort of matches people. But then another guy, another friend of a friend at Schwab, I have a call with him like Thursday. In addition, I love this. Oh, my gosh.

Lori Corpuz: Things are moving.

Sean Becker: I don't know. But in the back of my mind, I always worry I'm not quite legit enough. To like get big money on board because I don't know, there's like the really big hedge funds out there, you know, they're classified as, you know, partnerships, and they're headquartered in Delaware, and they have an offshore version for international investors. And I'm kind of like, here's me in my Wyoming LLC.

Lori Corpuz: Yeah, but I think it's like, I think these are different chapters. And it's worth looking at what you actually want to do, because there is a lot of value in being a solo GP that's doing quite well, you know, and is able to, you know, fund his lifestyle and kind of lifestyle fund, if you will. But then there's also different ways of approaching it, or it's like, you can bring in some GPs that you like to learn from are in a different strategy or something. Or if you really have big ambition, then it's worth, you know, looking at this stuff.

Sean Becker: Yeah, that's right. Yeah, there's a lot of ways to do it. But I was really impressed with what you put together. What is the name of the platform that you use to do this?

Lori Corpuz: So basically, it's all this code that I've been doing for Armstrong as well. There isn't a platform, I just built it. So badass. Yeah, well, it's kind of like my thinking is, especially in this day age that we're in, why not just kind of use a tool to keep all your minutes and everything and have it like synchronize, update stuff. You have a project management tool. You just log into your mobile. We can like update stuff together. I'm excited for this, Lori.

Sean Becker: I feel like we've been like such good vibe friends for so many years and like how cool would it be if we actually, I don't know, like ended up working together and value for each other. It would be so cool to keep this going.

Sean Becker: You know? Yeah, I love the idea.

Lori Corpuz: And just before we jump into that, I want to give you some context on Alec. Yeah, yeah. Thanks for introducing me.

Sean Becker: So he has this VC event at South by Southwest.

Lori Corpuz: His whole priority is investments and startups. So, you know, to whatever extent, you know, you could add value that way. That's his general prerogative. But he's a super chill guy, very fun. When I met him, basically it was at primary and we were looking at different startups out of Halliburton Labs. So this was, Halliburton is like an oil and gas conglomerate out of Austin.

Sean Becker: Do you remember them? Have you ever worked with them?

Lori Corpuz: I mean, no, just like it's like a Dick Cheney thing, right?

Sean Becker: That's my only association is like Dick Cheney went to war with Iraq for Halliburton.

Lori Corpuz: No, no, I mean, that's like stuff I keep forgetting. And his VC is across the Capitol. So a lot of their sort of, quote unquote, competitive advantage as a VC is the fact that they can have very easy lobbying conversations. So they do a lot in defense and stuff like that.

Lori Corpuz: That's a cool connection. I think he shared he's hosting this investment event thing. So there should be a lot of leads for you there, maybe.

Sean Becker: I mean, I signed up for what it is. And I think it's just of an event more of like a space that people can kind of like use to whatever like you get in there. That's cool too. If that's the case, then you can have your meetings there.

Lori Corpuz: Yes, I think so.

Sean Becker: Yeah, that's cool. I mean, I really don't know exactly what to expect with something like this. And I know that I need to actually attend something that's more formally for investment funds. I think I need to like locate some some big conference in North America or wherever where this sort of thing happens, probably New York. But I need to ingratiate myself more into this world because I am like I am like a true outsider with this.

Lori Corpuz: Well, OK, so I'm going to challenge you because this has been my world for like I don't even know how long when I was doing VC and investment banking. It's basically you're out there and you're socializing for a living.

Lori Corpuz: Um, and before you, uh, before you jump into this stuff, it's worth kind of like identifying your quote unquote ICP, which is like startup language for like ideal customer profile, right? Cause there's, there's different dynamics. Like, why are you going out to these events? Are you just building relationships for folks that could be your LPs? Are you trying to learn from other hedge funds that may be larger than you maybe get some? Intel insights, develop peers that you can kind of like work with, and then each of these will be completely different goals and different like events that you go to, you know?

Sean Becker: Yeah, well, God, I mean all of the above are, you know, valuable. I mean, for me, I guess the goal with these sort of events would be just to learn the language.

Lori Corpuz: What it is that people are talking about, what they're caring about, so that I can not seem like, you know, dude in his basement who's like, just the two events I would have you like, jot down would be Michael Milken, like the Milken Institute ones. Those are like top notch. And then SALT is pretty good.

Sean Becker: Oh, I have heard about that.

Lori Corpuz: Yeah, I went when SPF was at its peak. He was like on stage with this Victoria's Secret model in the Bahamas.

Sean Becker: I mean, I used to hang out in his childhood home because both of his parents are Stanford law professors and they used to have these book clubs.

Lori Corpuz: Well, it all seems tainted now.

Sean Becker: I mean, they were like in on it. His parents were like getting payments and all this stuff.

Lori Corpuz: I mean, I don't think they actually saw the extent of his risk, but I'm sure they understood layers of it, you know?

Lori Corpuz: Milken Global Conference? Any of those, even like the smaller subsets. Like I would say if you wanted to do All In Summit, that would be like a baby step in the direction of investors. But it's like it's not the high quality caliber ones.

Sean Becker: Yeah, there's like a future of finance one happening today in DC.

Lori Corpuz: So yeah, so those are the main things. Should we jump into any of this? How do we want to approach this? Basically, I guess from our last conversation, it was like, okay, what could working together look like, And I put like a phased idea. And by the way, phase two and three are just kind of like directional, which we can talk through the details which really comes down to the idea with this phase one is just like this tech idea that we've discussed since even our first conversation and the purpose of that is also building kind of like natural intuition and like awareness of the strategy so if anyone's speaking to it right they have to understand more and it takes some time to do that. And the other piece, so when I was doing investment banking, I would say like the top pro tips for fundraising generally were twofold. One is you have skin in the game. So basically like you invested in said person, if you will. So like we'd be going off and fundraising for clients, and then we'd bring the top investor that maybe had investments in all the clients and they'd like talk up the founder, and it'd be a lot easier for the investor to be interested. You know what I mean?

Sean Becker: Yeah, no, it's true. Live back channel. Yeah, I mean, really, because like, this is it's already sort of happening informally, because my best friend and his wife have whatever, like, for 25k. And so he's like, He just tells people about it. His wife told her coworker, and then he told his brother and his sister, and he's just like, yeah, this is great. I mean, I get all this money every quarter, and we know Sean, and we like Sean, and it's really word of mouth.

Lori Corpuz: Well, not even just word of mouth, but word of mouth from someone who's invested in it, right? If you have someone that's just selling it, you know what I mean? Yeah, skin in the game.

Sean Becker: Then it's just noise.

Lori Corpuz: So that's one piece. And the other idea of, yeah, skin in the game. And then I think, yeah, I think that was pretty much it. So it will take, yeah, it will take a little bit for me to understand a little bit. So understanding the strategy and skin in the game, right? And that will be a lot easier. For just socializing it because it's less of a sell and just more of a, this is what I'm doing and it's exciting and it's another option. And so that's been very successful in my personal experience as well as like others I know that have been doing this stuff for some time.

Sean Becker: Yeah, so that can definitely, I mean, that's definitely achievable. Just you know what I'm doing is pretty unorthodox and unique so we can just you know it's easy to just sort of talk through it and you'll ask me clarification questions on what I'm doing and what the process looks like.

Lori Corpuz: Yeah and so I think what's worth like talking through is the idea of like having tech. Have you thought through the idea of having a lot look like on your end? Do you think it would save a lot of time? Would you enjoy that? Is that something like that?

Sean Becker: Yeah, well, okay. So I mean, it would definitely save me some time, I think, to go through and kind of, I mean, there is already this filter I use on Fidelity. And it's pretty good. I mean, in order to like, go through and actually manually pick my stocks for the week, that's really more just like, that takes about an hour or so per week. So that's, that's not a huge lift. There might, there is just kind of like this advanced form of screening where if you could access the data and implement it, it would, it would really help me in terms of assessing the whole like past three years of nosedive risk, we'll call it, you know, like How many times in the past three years, which is, you know, 12 dividend payments, like out of those 12, how many times did it nosedive? How many times did the next day on market open, which is when my limit orders are set to execute, how many times on market open was it below the value of the dividend? Like it dropped more than the value of the dividend paid and stayed down and never came up to like this 50 percent threshold that I've said. If we could put that metric into place and say, number one, how many times has that happened in the past 12 dividend payment cycles or three years? And number two, to layer on top of that, how much of that can be explained by general market forces? So maybe it happened five or six of the past 12 and I'd say, Oh shit, that's too many times. That's too big of a risk. And then we look and see, well, you know, one on four of those days, there actually was just a big drop in the market in general. It could happen anyway. So we, we assess the nosedive risk that way, if that's clear.

Lori Corpuz: So what I'm saying is like, maybe you'd want an overlay of like, okay, against this stock trailing three years, nosedive risk, and then maybe you can map it against those. You could do a double-click. Okay, at these particular nosedive events, what was the S&P 500 or NASDAQ? What was VIX? What was their industry, macro, tailwind, headwind? I don't know, just different assessments.

Sean Becker: I collect this informally on my own where I actually say, How much of the, what percentage of the dividend captured did I lose on the sale? And I also just write down how many, how many days did it take to execute? So I set these limit orders. You know, if it's trading for $30 per share, I paid a $1 per share dividend. I set my limit order for 2950. So I only lose half of the value of the dividend. And if it drops way down below on the first day, I measure how many days how many days does it take to get back up to 2950? And so I can kind of just informally go through and be like, oh, should I buy this one tomorrow? Let me look back and I'll say, oh, damn, yeah, last time I got this, it took 10 days to pop back up or something. That's too much of a risk.

Lori Corpuz: And what's cool is I think even beyond this, now that we have AI, right? We could have those like, quantitative columns. And then we might also be able to pull in like, contextually, what might have been happening in the market with a business as well. Like maybe there was news that was within that timeframe.

Sean Becker: If you swing it, yeah, I mean, maybe that'd be nice. But I don't know.

Lori Corpuz: I guess the risk is to tinker with, you know, to see if it's like, is this Yeah, is this too much or valuable? Just to play with.

Sean Becker: I mean, because my concern is that, you know, Fidelity, for instance, has just some of this kind of data on every single stock. And it's just a little too blunt. Like, it's just like, it's just kind of their like automated tool. And it, you know, I always kind of have to go in on my own and just double check anyway. So my fear in having you develop this sort of thing, and like, maybe AI is good enough that I can do it, but my fear is that I'll see the filtered list and I'll see all the stats I need to see, but ultimately I'm too nervous. I just need to go in and double check anyway and say, Oh, technically it's this way. You know what I mean? So I, so my fear is that like, I'm going to have to end up double checking against all of it anyway. So anything that gets developed would need to be like, I'd really need to be able to trust it and be able to place my trades based on it.

Lori Corpuz: Um, so it would be kind of like, you know, that would, that would be kind of like, um, I think we'd have, uh, I don't know if I'd call it like a testing process, but like a, like, um, you and I working together process where there'd be like, uh, the term that you've been using is kind of like screening, but basically there will be one off things that neither of us have thought of to the intuition of that. And you might be like, hey, Lori, I actually go to Schwab when it comes to this particular nuance because, you know, for whatever reason, the stock split in five.

Lori Corpuz: So these are these are small nuances that like on Armstrong, we have to work through and we look at the analyst reports, too.

Sean Becker: I mean, that's really a thing, because, you know, sometimes I'll look at the dividend payment history. I'm like, whoa, there was a huge drop. And then I'll just, you know, like Google or chat, chat GPT, just like, hey, did so and so stock undergo a stock split like two years ago? Would that explain this? And sometimes they're like, yes, like, that's the reason. And then other times they're like, no, like, there's no history of that. And I'm like, oh, okay, this is, you know, sus that they're like, dropped a bunch or something. So, but again, it's all me.

Lori Corpuz: And it's like, how long, you know, how long it took you to get to this level of, you know, whatever intuition you're at right now. You know, I don't, I don't think you have a list out there of like, every edge case, right?

Sean Becker: No, I don't. But if you see it, it's like, Oh, I remember what this is looking like.

Lori Corpuz: Yeah, totally.

Sean Becker: Yeah, it's more kind of qualitative, which I guess is maybe a sort of selling point for my expertise is that I just do this, I just do this day in and day out. And that's my kind of value ad for somebody. Um, but yeah, so I guess, you know, in terms of kind of the pure, like amount of data that you'd have to like harness for all this, the, the screener process should go first so that we don't have to be doing the whole three years of of data for like every stock on the stock market. I mean like there's a ton of stocks that I'm just a large majority of the stocks listed on NASDAQ or New York Stock Exchange are just not of interest to me. Their dividend yield is too small or it's too big or their share price is really low or they don't pay it quarterly they pay at another frequencies or it's headquartered abroad where the dividend taxes get withheld. There's a number of different risk factors. So it's kind of like once we narrow that down for like my 15 stocks for the week or something like that, then those are the ones where we'd want to add another layer and say, how has it done the past three years on X dividend? Oh, great.

Lori Corpuz: That can be I wonder if there's if you're. I don't know if this is the right term, de-scoping some of these abroad stock dividends because of the annoyance of working through all the tax calculations, et cetera, et cetera, like because, you know, that might be another obvious easy win from a tech perspective, which is like these countries that this is the calculation.

Sean Becker: Is there a potential to still get them anyway, you mean, and still have it be worth it?

Lori Corpuz: So that would be an idea of like it expanding your scope of like possibility.

Sean Becker: I mean, maybe it's just that it's hard for me to keep track of the dividends I'm bringing in because they withhold it. So I actually get less in dividends right off the bat. Oh, so wait. So you're saying it's hard for you to track the dividends that Like if I write down, okay, this is paying a dollar per share and I got 5,000 shares, which means I should get $5,000 for this. You all of a sudden see on the payment day, well, it was, they're actually only paying you 4,000 because it would help 20% for dividends. Cause it was headquartered in, you know, God, let me, let me pull. I just had a few of this where it happened. I mean, um, Oh my God.

Lori Corpuz: For instance.

Sean Becker: It's really just Canadian ones. There's a ton of Canadian oil and gas companies and random Canadian ones where they withhold 25% because that's where you're going to owe to them, I guess, in taxes on it. I don't know. It's weird and it's annoying because I just don't have as much cash as I think I'm going to have, number one. And it's annoying, number two, because it fucks with my record keeping on all this. Oh, OK.

Lori Corpuz: So it sounds like record keeping is going to be like a very good help.

Sean Becker: Yeah, God, I have this massive spreadsheet that it's I've got I've got a system. It's my own little thing. Each day I go in, I record each thing. And then at the end of the month, I have a different sheet that I'm recording all this other stuff. And so I mean, yeah, really, I mean, someday that could all be automated. That probably takes me more time or, or just it takes me probably more time than the actual, um, screening process. Cause I go through and I say, okay, what did I buy this one for? What did I sell it for? How much did I capture? What percentage of the dividend I lose? I have all these columns and stuff. So, um, yeah. So, I mean, that's, that's another piece of it. That could be a value to me for sure. If that ended up being automated. Um, Hmm.

Lori Corpuz: So I mean, there's a lot of directions for us to explore.

Sean Becker: Yeah, that's great.

Lori Corpuz: Yeah, that's great.

Sean Becker: The thing about foreign stocks that you mentioned, too, is really interesting because it might be cool. I've had ideas about, you know, like real hedge funds aren't limited to the New York Stock Exchange or the Nasdaq. You can go buy stocks on, you know, the Indian Stock Exchange. You can buy in Singapore or whatever. So my thought is like, Like the New York Stock Exchange is super freaking volatile. What if we could do this dividend capture in a market that is super stable, like some Scandinavian country, like we're on the Stockholm, like, you know, Amsterdam Stock Exchange. And we're like capturing these things. And they're just these boring little, you know, like Dutch utilities or something.

Sean Becker: I think when I look into it, there's probably some tax issues or there's there's something that might mess with that. But there's so many stock exchanges around the world that I wonder.

Lori Corpuz: I wonder if there's arbitrage also across all of them.

Sean Becker: And in what sense, like people are already doing that.

Lori Corpuz: Well, the easiest one would basically just you be finding a better price point at a different stock exchange?

Sean Becker: Well, I mean, most companies, I think are just listed on one exchange. I mean, maybe they have subsidiaries.

Lori Corpuz: You mean, you mean specifically expanding scope outside of the US? So that that type of analysis would be very, would be very interesting to do. So it's almost like, okay, I kind of see from a perspective, there's the like, doing the automating a lot of the manual annoying stuff, right. And then there's another piece, which is sandboxing research, that can a scope that can expand a lot of scope with like, where you're generating alpha or like developing more of your intuition. So this would be kind of in this, like expanding scope.

Sean Becker: Yeah, in the R&D, like bucket. Yeah, I mean, and that's probably beyond what I would ask you to do. I mean, every couple of weeks or so, I feed chat GPT a huge prompt, and I'm like, here's all the background of what I'm doing, and here are the ways that I'm exploring. Tell me what I should be doing. Just generate some massive memo on this kind of thing, and it gives me some ideas with stuff, but it hasn't changed my overall strategy a ton.

Lori Corpuz: Like what part of the memo is actually valuable?

Sean Becker: Yeah, there's just a tiny piece of it usually. Anyway, the screener stuff, the ex-dividend, like history piece number two. I guess now, yeah, like being able to automatically put this all, have all the data funneled into a spreadsheet would be really cool. I mean, there's, it's going to be time intensive. For me to explain all that. I mean, the limit order optimization would be the, that would be the key to everything, really. I'm just looking down your deliverables. I mean, I would say all the stuff that we've been talking about makes my life more convenient and easier. And maybe there's some monetary add, but the limit order I mean, man, that is, if there is some tech out there, some AI that can tell us the story, like, hey, this stock's about to fucking nosedive way more. It doesn't matter if you lost 90% of your dividend, you gotta just sell it now, just do it now. Or, on the opposite, hey, don't set a 50% of your dividend.

Sean Becker: limit order, this thing has actually been going up and it's going to keep going up even on sex dividend date. Just don't set the order yet. Like, just wait, maybe you'll only lose 5% of your dividend or something. I mean, I that's like, you know, that's trying to like play God or whatever. I mean, there's probably you know, people just with all the charts up there on Bloomberg.

Lori Corpuz: Yeah, yeah. I mean, you know, nuances with that, like, And I think that would be better able to like intuit after like being in your strategy for a little bit, but basically it comes down to like, you know, what are you optimizing for when you're, you know, limiting your orders and trying to increase your yield with these dividends. So, yeah, it's tricky. Like if we were to put this in an order, I would probably put that at the, you know, at the end, get more comfort in the first build out, and then there'll be intuition to start talking about what type of models would make the most sense.

Sean Becker: Yeah, that's the big reward at the end of all this for me, using AI to actually execute my trades. I mean, it sounds kind of scary for me to my hand off the steering wheel, but I mean. Man, it's totally possible.

Lori Corpuz: I would suggest that at that point, we involve a cybersecurity person as well, right?

Sean Becker: I'm glad to hear that.

Lori Corpuz: Because I can do all the build, and then I know the process where we can start, just to talk ahead there. I can do the build where where we can see the recommendation algorithm of when it would order whatever, and it could show what the portfolio could end up looking like if it all automated. And depending on if Fidelity has this, there could be paper trading that I'm actually doing it, but with no money. And you basically see both and you're like, okay, I'm getting a little bit more comfortable here. And then ideally you're doing this for a certain amount of time, so that random outliers come up, and then we can see what to do with it. And then we have an intuition to bake in, what do you call it, emergency holds and stuff like that. So that stuff I feel very comfortable with. What I don't feel comfortable with is just cybersecurity in general.

Sean Becker: It's like, just write this all in code, write your whole thing into code, and they'll just do it all for you. And I'm like, man, that can fuck up everything so fast.

Lori Corpuz: Well, yes. And just the infrastructure is so fragile these days, because everyone's like coding and throwing stuff out there. So people who are quite effective at hacking, they're seeing vulnerabilities everywhere. And they're just like, they're like ready to eat lunch, you know.

Sean Becker: Oh, Jesus, that's a horror story. So but anyway, so just like building towards that direction, I feel pretty confident with. It's just a matter of, yeah, bringing in a like proper cybersecurity person. It's like, is this like up to snuff?

Sean Becker: Yeah, it's down the line.

Lori Corpuz: So you're going through this.

Sean Becker: Yeah, but God, I'm just looking at this website you put together, which I should tell you is on my bookmarks tab now. I mean, there's a lot here and I'm like, okay, I want to be able to reference this.

Lori Corpuz: Oh, yeah. So what was I going to say? The other tabs are kind more of a draft for us to start having conversations, but we don't need to talk on that now. I mean, I guess just on first glance, is there anything that strikes you that you'd want to just bring up or?

Sean Becker: Yeah, I mean, it's just next steps. I mean, I emailed you at the last minute. I don't think I had done this last time, but I just emailed over like a PPM, private placement memorandum, and a subscription agreement that I have people sign.

Lori Corpuz: Oh, great, yeah.

Sean Becker: I can also... Let me actually just follow up now too and send you the operating agreement for the fund.

Lori Corpuz: Okay, cool. That will be good.

Sean Becker: And then...

Lori Corpuz: Yeah, because I have questions with respect to... I guess the I forget the term that you use, but basically like what you have in place to reduce risk for investors, but you mentioned that and what was it? It's over here.

Lori Corpuz: Treasury bonds.

Sean Becker: Yeah, which is not maybe not something, it's not something that I advertise in my documents or whatever. Whatever, because I don't know, that piece is a little like untested, but that is how I do it. I mean, I literally just went in this morning and I bought eighty three thousand dollars worth of 30 year treasury bonds because that's how much cash I had on hand from the dividends I got last month. And so then I put it into my line of credit and said, hey, solid chunk out of this out and I'm going to use that cash to pump it back into Fidelity for buying more, more stocks. So that's, that's literally what I was just doing today. It's like the start of the month. So I do it every month. Um, but yeah, that's a piece of it. And I know you're not passing any of this information on to anybody yet, but we would want to just sort of like kind of screen, you know, what information gets shared in writing at least off the dock.

Lori Corpuz: Yeah, totally. And also, like, from the perspective of like, even sharing it with folks, I think I'd want to have a conversation on like, how you're thinking about risk and mitigating different things. So, and that can be like some other time.

Sean Becker: Yeah, I mean, it's not it's not even too complicated. I mean, it's mostly just that treasury bonds are the safest investment like out there. So, you know, if the stock market were to crash, those are stocks and, you know, treasury bonds typically go up in value during a stock market crash. And so I showed, you know, the screen to like my best friend and his wife. I was like, there's your money. There is the like 400k. Treasury bonds, you know, if you ever want it out, it's sitting right there. That is untouched. That's sitting there.

Lori Corpuz: So the real risk is if we go into World War Three and we lose to China.

Sean Becker: I tried to tell somebody I was in the offices yesterday of Merrill Lynch, and I was like, can I diversify my bonds? Like, what about the UK? What about Japan? They were just like, the US is the only one and I'm just like, bro, like, I don't know. Let me think that out.

Lori Corpuz: Oh my god, Sean, your colors are showing. You're so short the US. Oh my gosh. Yeah, let's short the US. Oh, just kidding. But yeah, let's hope not.

Sean Becker: Should we start our own fund called Short the US Fund? You and me?

Lori Corpuz: I wouldn't call it that. I would call it the Global Fund.

Sean Becker: Yeah, yeah, sure. I would like that.

Sean Becker: I know we're like hopping off in five minutes or so. But I mean, if you want to look through the agreements I sent you, they're pretty long. I'm sure you can like summarize them somehow. I mean, that's those are just like the official things that my investors need to see and that they need to sign when they join.

Sean Becker: But I also don't want you to do too much without getting paid. So please maybe put together like a proposal for how this would all look.

Sean Becker: idea of like a 2,000 retainer and then a monthly charge or a $2,000 payment and then a monthly retainer, but...

Lori Corpuz: Oh, sorry, I didn't update that. That would basically ignore the... That would be one solid thing, like subscription fee. But what I'm thinking is that it's kind of like... I don't know if you'd call it subscription fee or we could call it retainer.

Lori Corpuz: there'd be the main part of just developing the main stuff and if we want to keep going we can keep adding the R&D and all that stuff to continue like expanding scope and then looking at other places where you could look at stock and so I looked into what I looked into the fees for these particular data feeds and they're around two to 300, but I want to like hone in on the exact numbers and then I can give them to you because it might be like 200 month.

Sean Becker: Just, um, yeah, if there's, if there's something you want to put here in terms of like a proposal, I guess.

Lori Corpuz: And then anything else?

Sean Becker: I mean, just, I guess, keep me updated on this. I would love to develop this kind of automation technique. I would love to take advantage of all this and get the ball rolling. The price makes sense. There's a lot of things I would love to do with this fund that are out of reach, like hire an administrator to administer the fund, or to get a Bloomberg terminal, for instance. But I have to make sure the costs don't overrun the model that I have going.

Lori Corpuz: Oh, yeah, totally. That makes sense. I'm sure what you're going to propose, though, is fine.

Sean Becker: Yeah, it's basically this. I just, I don't know why I have monthly. I kind of wanted to frame it as more of tech subscription, but we can call it whatever we want, retainer or whatever. Let me get the actual numbers and the actual data feed so you know exactly what they are. And if for whatever reason you have other insight where you're like, you know what, I actually want to pay more, like 10 more, whatever, for this particular feed, because I know it or something like that, you can let me know. I'll send you that.

Sean Becker: I know nothing about data feeds or how they work, so I'll rely on you then.

Lori Corpuz: So I guess what I'm saying is, this is the stuff that you're looking at in Fidelity, you know? The only difference is we're pulling it ourselves.

Sean Becker: We're pulling that raw kind of out of there and doing with it what we specifically want to be doing, not just using them.

Sean Becker: Next week, if you want to, if that's the cadence you're thinking.

Lori Corpuz: Yeah, I should be able to send you like a more simplified version based on these feet, I would call them maybe features or themes that you shared with me. Like in the next day, 12 hours.

Sean Becker: I mean, no huge rush on it. But um, yeah, we can I'll look over whatever you send me and we can just chat more.

Lori Corpuz: Oh, yeah. Sounds good. I'll ping you when I'm done with these docs.

Sean Becker: All right, Sean.

Lori Corpuz: Don't get lost in the stock market craziness.

Sean Becker: Say hello to New York for me. I miss New York.

Lori Corpuz: Is this your house right now? Are you working from home?

Sean Becker: Yeah, this is one of the rooms. That's your office. Yeah, well, yeah, it's nice. Where are you? You're in Brentwood?

Lori Corpuz: It's two blocks from Beverly Hills, right by Beverly Hills.

Sean Becker: Oh, nice. That's a good area.

Lori Corpuz: Not too far from the Grove either if you know the Grove.

Lori Corpuz: All right, Sean.

Sean Becker: All right, we'll talk again soon. Yeah, thanks.`,
  },
]

// ── Proposal Phases ─────────────────────────────────────────────
export const PROPOSAL_PHASES: ProposalPhase[] = [
  {
    id: 'phase-1',
    phase: 1,
    title: 'Proof of Value',
    subtitle: 'Build trust, prove tech value, warm fundraising pipeline',
    status: 'proposed',
    timeline: 'Months 1-3',
    description:
      'Dual purpose: Lori builds technology that immediately reduces Sean\'s screening workload while getting deeply comfortable with the dividend capture strategy. Trust is built through working together — shipping real tools, reviewing trades, and understanding risk firsthand. Skin in the game: Sean allocates capital from the fund for Lori on agreed milestones — giving Lori real exposure to the strategy and firsthand conviction when marketing the fund to investors.',
    deliverables: [
      'Automated dividend stock screener (NYSE + NASDAQ, 2,700+ universe)',
      'Historical ex-dividend price behavior database (3+ years)',
      'Daily candidate ranking dashboard with risk scores',
      'Limit order optimization engine (dynamic 50% threshold)',
      'Portfolio tracking dashboard (positions, P&L, dividends)',
      'Market fund to friends and network to warm Phase 2 pipeline',
    ],
    valueMetrics: [
      { label: 'Daily screening time', before: '2-3 hours', after: '15 minutes', impact: '85-92% time reduction' },
      { label: 'Opportunity delivery', before: '~30 tickers/week (manual, 2 sessions)', after: 'Daily filtered lists via text/email', impact: 'Dynamic daily opportunities vs. batch 2x/week' },
      { label: 'Historical crash analysis', before: 'None (gut feel)', after: 'Full 3-year backtest per stock', impact: 'TBD — needs discussion on methodology' },
    ],
    workingRhythm: [
      'Sean screens 2x/week at 2-3 hrs — surfaces ~30 tickers/week from 2,700 universe',
      'Standing 30-60 min weekly call: tech review, bugs, feature priorities',
      'Lori builds asynchronously, ships weekly iterations',
      'Lori markets fund to personal network in parallel (warm leads for Phase 2)',
    ],
    valueMap: [
      {
        dimension: 'Screening Time',
        current: '~5 hrs/week (2x at 2-3hrs)',
        withTech: '~1 hr/week',
        freed: '~4 hrs/week',
        impact: 'Freed time redirected to fundraising or expanded screening',
      },
      {
        dimension: 'Opportunity Delivery',
        current: '~30 tickers/week (manual, 2 sessions)',
        withTech: 'Daily filtered lists via text or email',
        freed: 'Daily vs. 2x/week',
        impact: 'Dynamic daily opportunities — never miss an ex-dividend window',
      },
      {
        dimension: 'Fundraising Capacity',
        current: 'Limited — Sean managing fund + full-time job',
        withTech: '4+ hrs/week freed for investor conversations',
        freed: '~200 hrs/year',
        impact: 'Faster path to $3M AUM and $250K/month target',
      },
      {
        dimension: 'Historical Analysis',
        current: 'Gut feel on stock crash behavior',
        withTech: '3+ year backtest per stock',
        freed: 'Data-driven risk scoring',
        impact: 'Sean knows which stocks historically recover vs. crash — avoids the losers',
        note: 'TBD — needs discussion on methodology and data sources',
      },
    ],
    scalingNotes: [
      'Automated screener live and reducing daily workload 80%+',
      'Historical analysis database covering 3+ years of ex-dividend data',
      'Risk monitoring dashboard with position-level alerts',
    ],
    loriValue: 'Full-stack engineering + AI/ML expertise + financial markets experience',
    seanCommitment: 'Domain knowledge transfer, strategy documentation, weekly tech review call, historical trade data access, API/data costs (~$200-300/month — Lori helps diligence providers)',
    financialTerms: '$2K/month technology subscription — includes full tech build. Sean covers API/data costs (~$200-300/mo). Skin in the game via fund capital allocation on milestones.',
    gateToNext: 'Tools deployed and actively reducing Sean\'s daily workflow by 50%+. Lori has deep understanding of dividend capture mechanics.',
  },
  {
    id: 'phase-2',
    phase: 2,
    title: 'Capital Markets Support',
    subtitle: 'Formalize fund structure, regulatory compliance, and accelerate AUM growth',
    status: 'future',
    timeline: 'Months 4-8',
    description:
      'With technology proven and strategy deeply understood, shift focus to institutional readiness and fundraising. Establish proper regulatory framework (ERA filing, partnership structure, Series 65), then leverage Lori\'s $220M+ capital raising experience to accelerate AUM from $1.5M toward $3M+. This phase transforms Alamo Bernal from an informal operation into a professionally structured investment firm.',
    deliverables: [
      // Regulatory & Legal Foundation
      'ERA (Exempt Reporting Adviser) filing — Form ADV via IARD system in NY',
      'Formal GP/partner structure with equity allocation — drafted by securities attorney',
      'Lori\'s role defined in writing: technology infrastructure, investor reporting, product development',
      'Series 65 licensure for Lori (~$187 exam fee, 6-8 week prep, no sponsor required)',
      'Firm-level recordkeeping policy — books, records, and communications archival',
      'Dedicated investor communications channel with compliance-grade logging',
      // Capital Markets
      'Investor pitch deck with technology-backed performance data',
      'Fundraising CRM and pipeline management',
      'Investor portal — secure login, quarterly statements, performance metrics',
      'Due diligence materials package',
      'Warm introductions to qualified investors',
      'Fund brand identity and web presence',
      'Refined investor structure (lockup terms, redemption windows)',
    ],
    valueMetrics: [
      { label: 'AUM raised', before: '$1.5M (current)', after: '$3M+ target', impact: '$1.5M+ new capital' },
      { label: 'Investor pipeline', before: 'Friends & family only', after: 'Structured pipeline with CRM', impact: 'Scalable fundraising process' },
      { label: 'Investor conversion', before: 'Ad hoc (word of mouth)', after: 'Tracked funnel with materials', impact: 'Measurable conversion rate' },
      { label: 'Regulatory status', before: 'Informal (no filing)', after: 'ERA-registered with Form ADV', impact: 'Institutional credibility + legal compliance' },
    ],
    loriValue: '$220M+ fundraising experience, investor network, pitch strategy, materials creation, Series 65 licensed',
    seanCommitment: 'Investor meetings, relationship management, ERA filing + securities attorney engagement (~$2-5K legal costs)',
    financialTerms: 'Retainer continues + formal fund role / advisory compensation. Structure TBD based on ERA filing and partnership agreement.',
    workingRhythm: [
      'Weekly investor pipeline review',
      'Monthly performance reports for prospects',
      'Regulatory workstream: ERA filing → partnership agreement → Series 65 prep',
      'Continued tech iteration based on live trading feedback',
    ],
    scalingNotes: [
      'ERA filing enables compliant fundraising without full SEC registration',
      'GP/partner structure gives Lori real equity — not a contractor arrangement',
      'Series 65 allows Lori to provide investment advice without needing a broker-dealer sponsor (unlike Series 7)',
      'Firm-level recordkeeping satisfies regulatory obligations without individual IAR burden',
      'Diversify brokerage relationships beyond Fidelity',
      'Formal risk limits and position sizing rules',
    ],
    gateToNext: 'AUM reaches $3M+. Fund generating $250K/month. ERA filed. Partnership structure formalized. Sean can consider leaving law firm.',
  },
  {
    id: 'phase-3',
    phase: 3,
    title: 'Investment R&D',
    subtitle: 'Apply frontier AI to discover new alpha and diversify strategy portfolio',
    status: 'future',
    timeline: 'Month 9+',
    description:
      'With stable AUM and proven technology, expand into research & development of new trading strategies. Apply frontier AI to discover novel alpha, enhance risk management, and build portfolio of complementary strategies.',
    deliverables: [
      'Strategy backtesting framework (multi-factor, multi-timeframe)',
      'New strategy candidates identified and backtested',
      'Enhanced risk management (dynamic stop-losses, correlation monitoring)',
      'Options strategy overlay (covered calls, protective puts)',
      'Macro signal integration for market regime detection',
      'Automated trade execution (with human approval gates)',
    ],
    valueMetrics: [
      { label: 'Strategies backtested', before: '1 (dividend capture)', after: '5+ candidates tested', impact: 'Strategy diversification' },
      { label: 'Risk-adjusted return (Sharpe)', before: 'Unknown (not measured)', after: 'Quantified per strategy', impact: 'Professional risk metrics' },
      { label: 'Max drawdown', before: 'Unmanaged (ad hoc sells)', after: 'Systematic risk limits', impact: 'Reduced tail risk' },
      { label: 'Revenue from new strategies', before: '$0', after: 'TBD based on backtest results', impact: 'Additional revenue streams' },
    ],
    loriValue: 'AI/ML research, strategy development, quantitative analysis, frontier technology',
    seanCommitment: 'Capital allocation decisions, strategy approval, risk oversight',
    financialTerms: 'Equity stake and/or revenue share in fund management entity and new strategies. Vesting and terms TBD.',
    workingRhythm: [
      'Quarterly strategy review and backtest evaluation',
      'Ongoing R&D sprints on new strategy candidates',
      'Risk committee meetings as portfolio complexity grows',
    ],
    scalingNotes: [
      'Full institutional-grade operations',
      'Fully automated trade execution with human approval gates',
      'Multi-strategy portfolio with correlation management',
      'AI-driven strategy discovery and optimization pipeline',
    ],
    gateToNext: 'N/A — this is the long-term vision of a full technology partnership',
  },
]

// ── Financial Scenarios ─────────────────────────────────────────
export const FINANCIAL_SCENARIOS: FinancialScenario[] = [
  {
    id: 'scenario-1.5m',
    label: '$1.5M (Current)',
    aum: 1_500_000,
    monthlyDividendRevenue: 90_000,
    seanMonthlyTake: 9_000,
    loriMonthlyTake: 2_000,
    investorReturns: '11-14% annualized',
    operatingCosts: 2_000,
    netToFund: 77_000,
  },
  {
    id: 'scenario-3m',
    label: '$3M (Target)',
    aum: 3_000_000,
    monthlyDividendRevenue: 180_000,
    seanMonthlyTake: 18_000,
    loriMonthlyTake: 3_600,
    investorReturns: '11-14% annualized',
    operatingCosts: 5_000,
    netToFund: 153_400,
  },
  {
    id: 'scenario-5m',
    label: '$5M',
    aum: 5_000_000,
    monthlyDividendRevenue: 300_000,
    seanMonthlyTake: 30_000,
    loriMonthlyTake: 6_000,
    investorReturns: '11-14% annualized',
    operatingCosts: 10_000,
    netToFund: 254_000,
  },
  {
    id: 'scenario-10m',
    label: '$10M',
    aum: 10_000_000,
    monthlyDividendRevenue: 600_000,
    seanMonthlyTake: 60_000,
    loriMonthlyTake: 12_000,
    investorReturns: '11-14% annualized',
    operatingCosts: 20_000,
    netToFund: 508_000,
  },
]

// ── Risks ───────────────────────────────────────────────────────
export const RISKS: Risk[] = [
  {
    id: 'risk-alpha-squeeze',
    title: 'Alpha Squeeze — Strategy Becomes Crowded',
    category: 'market',
    description:
      'As more participants adopt dividend capture strategies (especially via AI tools), the alpha may compress. Ex-dividend price drops could become more predictable and fully priced in.',
    probability: 2,
    impact: 5,
    mitigations: [
      'Monitor strategy returns monthly for degradation trends',
      'Diversify into complementary strategies (Phase 3)',
      'Build proprietary edge through better historical data and ML models',
      'Focus on small-cap stocks where institutional participation is lower',
    ],
    owner: 'both',
    status: 'open',
  },
  {
    id: 'risk-tech-overfit',
    title: 'Technology Overfitting — ML Models Fail Live',
    category: 'technology',
    description:
      'AI models trained on historical data may not generalize to live market conditions. Backtested performance may overestimate real-world results.',
    probability: 3,
    impact: 3,
    mitigations: [
      'Walk-forward validation on out-of-sample data',
      'Paper trade all models for 30+ days before live deployment',
      'Keep human approval gates on all trade recommendations',
      'Use ensemble methods to reduce single-model risk',
    ],
    owner: 'lori',
    status: 'open',
  },
  {
    id: 'risk-liquidity',
    title: 'Liquidity Crunch at Scale',
    category: 'operational',
    description:
      'As AUM grows, it becomes harder to take meaningful positions in small-cap dividend stocks. Volume may not support $5M+ trades in micro/small-cap names.',
    probability: 3,
    impact: 4,
    mitigations: [
      'Build position sizing algorithm that respects average daily volume',
      'Diversify across more stocks per day to reduce per-stock exposure',
      'Add mid-cap and large-cap dividend stocks to expand universe',
      'Implement gradual position building over multiple days',
    ],
    owner: 'both',
    status: 'open',
  },
  {
    id: 'risk-tax-structure',
    title: 'Section 475 Election Denied or Changed',
    category: 'regulatory',
    description:
      'The IRS could challenge the Section 475 election or change tax treatment of short-term dividends. This would dramatically increase the tax burden and potentially kill strategy economics.',
    probability: 2,
    impact: 5,
    mitigations: [
      'Maintain meticulous trading records for IRS compliance',
      'Engage specialized tax counsel for annual review',
      'Structure fund to maximize tax efficiency',
      'Monitor regulatory changes in dividend/securities taxation',
    ],
    owner: 'sean',
    status: 'open',
  },
  {
    id: 'risk-margin-call',
    title: 'Margin Call During Market Crash',
    category: 'market',
    description:
      'A severe market downturn could trigger margin calls on the line of credit, forcing liquidation of positions at the worst possible time.',
    probability: 2,
    impact: 4,
    mitigations: [
      'Treasury bond collateral provides natural buffer (flight to safety)',
      'Set conservative margin utilization limits (max 60%)',
      'Build automated position liquidation triggers before margin call levels',
      'Maintain cash reserve buffer for margin requirements',
    ],
    owner: 'sean',
    status: 'open',
  },
  {
    id: 'risk-single-person',
    title: 'Single Person Dependency (Sean)',
    category: 'operational',
    description:
      'All trading knowledge and investor relationships currently reside with Sean. If he is unable to trade for any reason, the fund has no backup operator.',
    probability: 2,
    impact: 5,
    mitigations: [
      'Document all trading procedures and decision frameworks',
      'Build technology that encodes trading logic (reduces bus factor)',
      'Lori learns strategy deeply in Phase 1 as backup operator',
      'Consider key-person insurance for fund continuity',
    ],
    owner: 'both',
    status: 'open',
  },
  {
    id: 'risk-tech-security',
    title: 'Technology Security — Trading System Compromise',
    category: 'technology',
    description:
      'Automated trading tools connected to brokerage accounts represent a cybersecurity risk. Unauthorized access could result in unauthorized trades or fund theft.',
    probability: 1,
    impact: 5,
    mitigations: [
      'Read-only API access for analysis tools (no automated execution in Phase 1)',
      'Multi-factor authentication on all brokerage and tool accounts',
      'Audit logging for all system access and trade recommendations',
      'Regular security reviews of all deployed tools',
    ],
    owner: 'lori',
    status: 'open',
  },
  {
    id: 'risk-ft-transition',
    title: 'Full-Time Transition Risk (Sean Leaves Law)',
    category: 'partnership',
    description:
      'If Sean leaves his law firm prematurely (before fund reaches stable $250K/month), personal financial pressure could lead to suboptimal trading decisions or forced strategy changes.',
    probability: 3,
    impact: 3,
    mitigations: [
      'Set clear financial milestones before full-time transition',
      'Build 6-month personal runway before leaving employment',
      'Ensure fund has 12+ months of operating capital',
      'Technology reduces daily time commitment, allowing gradual transition',
    ],
    owner: 'sean',
    status: 'open',
  },
  {
    id: 'risk-partnership-misalign',
    title: 'Partnership Misalignment on Direction',
    category: 'partnership',
    description:
      'Lori and Sean may have different views on risk tolerance, strategy direction, or technology investment priorities as the partnership evolves.',
    probability: 2,
    impact: 3,
    mitigations: [
      'Clear written agreement with decision-making framework',
      'Regular strategy alignment meetings (weekly during Phase 1)',
      'Defined roles: Sean = trading & investors, Lori = technology & research',
      'Exit clauses that protect both parties if alignment breaks down',
    ],
    owner: 'both',
    status: 'open',
  },
  {
    id: 'risk-regulatory-aum',
    title: 'Regulatory Requirements at $100M+ AUM',
    category: 'regulatory',
    description:
      'As the fund grows, SEC registration requirements kick in. Under $100M allows certain exemptions; above triggers full compliance requirements.',
    probability: 1,
    impact: 3,
    mitigations: [
      'Plan compliance infrastructure well before $100M threshold',
      'Engage fund administration and compliance counsel early',
      'Build reporting and audit capabilities into technology from the start',
      'Budget for compliance costs in financial model',
    ],
    owner: 'both',
    status: 'open',
  },
]

// ── Scaling Milestones ──────────────────────────────────────────
export const SCALING_MILESTONES: ScalingMilestone[] = [
  {
    id: 'milestone-3m',
    aumThreshold: '$3M',
    operationalNeeds: [
      'Sean transitions to full-time fund management',
      'Formalize investor communication cadence (quarterly reports)',
      'Set up dedicated fund bank accounts and accounting',
      'Establish formal record-keeping for all trades',
    ],
    infrastructureNeeds: [
      'Dedicated trading workstation with redundant internet',
      'Automated backup of all trading data and communications',
      'Cloud-hosted dashboard accessible from anywhere',
    ],
    complianceNeeds: [
      'Annual Section 475 election filing with IRS',
      'Quarterly investor statements with audited returns',
      'Update subscription agreement for new investors',
      'Review state-level fund registration requirements',
    ],
    teamNeeds: [
      'Sean: Full-time fund manager and primary trader',
      'Lori: Technology partner (part-time transitioning to more)',
      'Tax accountant: Quarterly filing and annual tax strategy',
      'Legal counsel: Fund structure review (annual)',
    ],
    technologyDeliverables: [
      'Automated screener live and reducing daily workload 80%+',
      'Historical analysis database covering 3+ years of ex-dividend data',
      'Investor reporting portal with quarterly performance data',
      'Risk monitoring dashboard with position-level alerts',
    ],
  },
  {
    id: 'milestone-5m',
    aumThreshold: '$5M',
    operationalNeeds: [
      'Diversify brokerage relationships (beyond Fidelity alone)',
      'Implement formal risk limits and position sizing rules',
      'Create operational manual documenting all procedures',
      'Set up systematic cash management and margin monitoring',
    ],
    infrastructureNeeds: [
      'Multi-broker execution capability',
      'Real-time P&L and risk dashboards',
      'Automated trade journaling and compliance logging',
      'Disaster recovery plan for trading systems',
    ],
    complianceNeeds: [
      'Consider fund audit by external accounting firm',
      'Review SEC exemption status and registration thresholds',
      'Implement anti-money laundering (AML) procedures',
      'Formalize insider trading policies',
    ],
    teamNeeds: [
      'Part-time operations/admin support',
      'Lori: Increased R&D time for new strategies',
      'Consider external fund administrator',
    ],
    technologyDeliverables: [
      'Multi-strategy backtesting framework',
      'Options overlay tooling (covered calls, protective puts)',
      'Advanced position sizing with volume-aware algorithms',
      'Macro regime detection for risk management',
    ],
  },
  {
    id: 'milestone-10m',
    aumThreshold: '$10M',
    operationalNeeds: [
      'Full institutional-grade operations',
      'Formal board or advisory committee',
      'Monthly performance attribution reporting',
      'Systematic investor onboarding process',
    ],
    infrastructureNeeds: [
      'Co-located or low-latency execution infrastructure',
      'Enterprise-grade security and access controls',
      'Automated compliance monitoring and reporting',
      'Multi-strategy portfolio management system',
    ],
    complianceNeeds: [
      'Annual third-party audit',
      'Formal compliance officer (part-time or outsourced)',
      'SEC Form ADV filing (if applicable)',
      'Disaster recovery and business continuity plan',
    ],
    teamNeeds: [
      'Sean: Chief Investment Officer',
      'Lori: Chief Technology Officer / Head of Research',
      'Full-time operations manager',
      'External fund administrator',
      'Compliance consultant (quarterly review)',
    ],
    technologyDeliverables: [
      'Fully automated trade execution with human approval gates',
      'Multi-strategy portfolio with correlation management',
      'Institutional-grade risk reporting',
      'AI-driven strategy discovery and optimization pipeline',
    ],
  },
]

// ── Agreement Clauses ───────────────────────────────────────────
export const AGREEMENT_CLAUSES: AgreementClause[] = [
  {
    id: 'clause-roles',
    section: 'Roles & Responsibilities',
    label: 'Role Definitions',
    terms:
      'Sean Becker: Fund Manager — responsible for all trading decisions, investor relations, and regulatory compliance. Lori Corpuz: Technology Partner — responsible for technology development, research & development, and fundraising support. All trading decisions require Sean\'s explicit approval.',
    status: 'draft',
    notes: 'Need to clarify decision-making authority for technology investments',
  },
  {
    id: 'clause-compensation-phase1',
    section: 'Compensation',
    label: 'Phase 1: Technology Build',
    terms:
      'Monthly retainer for dedicated technology development work. Amount TBD based on scope and time commitment. Retainer paid from fund operating budget, not investor capital.',
    status: 'needs_discussion',
    notes: 'Need to determine fair market rate and time commitment (full-time vs part-time)',
  },
  {
    id: 'clause-compensation-phase2',
    section: 'Compensation',
    label: 'Phase 2: Capital Raising',
    terms:
      'Retainer continues plus success fee on capital raised. Success fee structure TBD (% of new AUM raised). Critical constraint: Sean must still net 10% of dividend revenue ($25K/month at $250K target). Lori\'s compensation comes from incremental value created.',
    status: 'needs_discussion',
    notes: 'Model economics at multiple AUM levels to ensure Sean\'s take-home is preserved',
  },
  {
    id: 'clause-compensation-phase3',
    section: 'Compensation',
    label: 'Phase 3: Equity & Revenue Share',
    terms:
      'Equity stake in fund management company and/or revenue share on new strategies developed by Lori. Specific terms to be negotiated after Phase 2 success. Vesting schedule to be determined.',
    status: 'draft',
    notes: 'This is the long-term alignment mechanism. Needs careful structuring.',
  },
  {
    id: 'clause-ip',
    section: 'Intellectual Property',
    label: 'Technology & Strategy IP',
    terms:
      'Technology built by Lori is owned by the partnership/fund entity. If partnership dissolves, Lori retains rights to generic technology components (frameworks, tools) but fund-specific models and strategy IP remain with the fund. Sean retains full ownership of the dividend capture strategy and all trading knowledge.',
    status: 'draft',
  },
  {
    id: 'clause-investment',
    section: 'Capital Commitment',
    label: 'Lori\'s Investment (Skin in the Game)',
    terms:
      'Lori to invest personal capital into the fund on same terms as other investors. Amount TBD. This aligns incentives and demonstrates conviction to future investors. Subject to same lockup and return terms.',
    status: 'needs_discussion',
    notes: 'Need to determine amount and timing. Also need to verify Series 7/securities regulations.',
  },
  {
    id: 'clause-exit',
    section: 'Exit & Termination',
    label: 'Exit Clauses',
    terms:
      'Either party may terminate with 90 days written notice. Upon termination: (1) outstanding retainer fees are paid through notice period, (2) IP provisions apply per IP clause, (3) vested equity/revenue share continues per vesting schedule, (4) Lori provides 30-day transition support for technology handoff.',
    status: 'draft',
  },
  {
    id: 'clause-confidentiality',
    section: 'Confidentiality',
    label: 'Information Protection',
    terms:
      'Both parties agree to keep fund strategy details, investor information, and financial performance confidential. Technology architecture may be discussed in general terms for Lori\'s portfolio purposes. No disclosure of specific trading signals, models, or investor identities without written consent.',
    status: 'draft',
  },
]

// ── Action Items ────────────────────────────────────────────────
export const ACTION_ITEMS: ActionItem[] = [
  {
    id: 'action-series7',
    description: 'Research Series 7 requirements and legal constraints on securities advisory',
    owner: 'lori',
    dueDate: '2026-03-04',
    status: 'pending',
    meetingId: 'meeting-2026-02-26',
  },
  {
    id: 'action-sub-agreement',
    description: 'Review Sean\'s subscription agreement and federal disclosures',
    owner: 'lori',
    dueDate: '2026-03-04',
    status: 'pending',
    meetingId: 'meeting-2026-02-26',
  },
  {
    id: 'action-lockup',
    description: 'Reflect on minimum comfortable lockup period (current: 18 months) and whether it changes if operating full-time',
    owner: 'sean',
    dueDate: '2026-03-04',
    status: 'pending',
    meetingId: 'meeting-2026-02-26',
  },
  {
    id: 'action-fundraising',
    description: 'Think through fundraising positioning and investor pitch structure',
    owner: 'lori',
    dueDate: '2026-03-11',
    status: 'pending',
    meetingId: 'meeting-2026-02-26',
  },
  {
    id: 'action-tech-feasibility',
    description: 'Assess technology build feasibility for stock screening automation — scope, timeline, cost',
    owner: 'lori',
    dueDate: '2026-03-11',
    status: 'pending',
    meetingId: 'meeting-2026-02-26',
  },
  {
    id: 'action-followup',
    description: 'Follow-up call — Thursday March 4, 2026',
    owner: 'both',
    dueDate: '2026-03-04',
    status: 'completed',
    meetingId: 'meeting-2026-02-26',
  },
  {
    id: 'action-vc-intro',
    description: 'Introduce Sean to VC friend attending South by Southwest',
    owner: 'lori',
    dueDate: '2026-03-10',
    status: 'completed',
    meetingId: 'meeting-2026-02-26',
  },
  // ── From March 4 meeting ──
  {
    id: 'action-review-ppm',
    description: 'Review PPM, subscription agreement, and operating agreement',
    owner: 'lori',
    dueDate: '2026-03-11',
    status: 'pending',
    meetingId: 'meeting-2026-03-04',
  },
  {
    id: 'action-data-feeds',
    description: 'Finalize data feed provider research with exact costs for Sean',
    owner: 'lori',
    dueDate: '2026-03-11',
    status: 'pending',
    meetingId: 'meeting-2026-03-04',
  },
  {
    id: 'action-phase1-proposal',
    description: 'Send simplified Phase 1 proposal with feature themes from March 4 call',
    owner: 'lori',
    dueDate: '2026-03-11',
    status: 'pending',
    meetingId: 'meeting-2026-03-04',
  },
  {
    id: 'action-wells-fargo',
    description: 'Wells Fargo contact call',
    owner: 'sean',
    dueDate: '2026-03-07',
    status: 'pending',
    meetingId: 'meeting-2026-03-04',
  },
  {
    id: 'action-schwab',
    description: 'Schwab contact call',
    owner: 'sean',
    dueDate: '2026-03-06',
    status: 'pending',
    meetingId: 'meeting-2026-03-04',
  },
  {
    id: 'action-next-weekly',
    description: 'Schedule next weekly call',
    owner: 'both',
    status: 'pending',
    meetingId: 'meeting-2026-03-04',
  },
  {
    id: 'action-alec-intro',
    description: 'Introduce Sean to Alec (VC) at South by Southwest investment event',
    owner: 'lori',
    dueDate: '2026-03-10',
    status: 'pending',
    meetingId: 'meeting-2026-03-04',
  },
]
