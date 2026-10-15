// Body of the "Morgan Stanley Thread" memo — rendered only on
// /complexecon/memos/morgan-stanley-thread. Shares the memo CSS.
import { MEMO_CSS } from './memo-bodies'

export const MORGAN_STANLEY_THREAD_HTML = MEMO_CSS + `
<div class="memo-doc"><div class="wrap">
  <header>
    <div class="eyebrow">A Reading Guide &middot; Prepared for the Complexity Economics Program &middot; October 2026</div>
    <h1>The Morgan Stanley Thread</h1>
    <p class="subtitle">What Vasant Dhar built in Morgan Stanley&rsquo;s Data Mining Group, which of Doyne Farmer&rsquo;s research it descends from, and the four papers to read in order.</p>
    <div class="statgrid">
      <div class="stat"><div class="v">1994&ndash;97</div><div class="l">Dhar at Morgan Stanley</div></div>
      <div class="stat"><div class="v bad">0</div><div class="l">Documents linking Dhar to Farmer directly</div></div>
      <div class="stat"><div class="v">1</div><div class="l">Documented bridge &middot; Packard</div></div>
      <div class="stat"><div class="v">4</div><div class="l">Papers to read, in order</div></div>
    </div>
  </header>

  <h2>I &middot; The Question, and the Honest Answer</h2>
  <p class="lede">The question was: <em>which research of Doyne Farmer&rsquo;s did Vasant Dhar implement at Morgan Stanley?</em> The answer, after checking the record, is that <strong>no document says Dhar implemented Farmer&rsquo;s work</strong>, and no document by Farmer mentions Dhar or Morgan Stanley. What the record does show is a documented chain one link longer: <strong>Farmer &rarr; Norman Packard &rarr; Dhar.</strong> Dhar&rsquo;s Morgan-Stanley-era papers cite Packard &mdash; Farmer&rsquo;s co-founder at Prediction Company &mdash; for the genetic-algorithm method they built on, and Packard&rsquo;s paper is itself built on Farmer&rsquo;s nonlinear forecasting and acknowledges him.</p>

  <div class="reason">
    <div class="hd">What was checked, and came back empty</div>
    <p>Dhar (2011), <em>Prediction in Financial Markets: The Case for Small Disjuncts</em> &mdash; full text and all 60 references: no Farmer, Packard, Sidorowich or chaos. All 110 episodes of Dhar&rsquo;s <em>Brave New World</em> podcast (December 2020 to October 2026): no Farmer. The publisher&rsquo;s index to Dhar&rsquo;s <em>Thinking with Machines</em> (Wiley, 2025): no entries for Farmer, Packard, Santa Fe, chaos or Prediction Company &mdash; it does index <span class="cite">genetic algorithm (GA), 21&ndash;25</span> and <span class="cite">Morgan Stanley, 29&ndash;30, 33</span>. Dhar&rsquo;s 2015 CV: <span class="cite">Principal, Morgan Stanley and Company, Aug 1994 &ndash; Jan 1997</span>. The Prediction Company record: founded 1991 by Farmer and Packard; its trading was for O&rsquo;Connor &amp; Associates and then Swiss Bank Corporation, later UBS &mdash; not Morgan Stanley.</p>
  </div>
  <div class="reason">
    <div class="hd">What was found &mdash; the bridge</div>
    <p>GLOWER (Dhar, Chou &amp; Provost, NYU working paper IS-00-02, 2000): <em>&ldquo;Genetic algorithms (Packard, 1989; Goldberg, 1989, Holland, 1992) have been shown to be well suited to learning rule-like patterns&rdquo;</em> and, on its niching mechanism, <em>&ldquo;Packard (1989) proposed a similar penalty function.&rdquo;</em> The reference reads <span class="cite">Packard, N., A Genetic Learning Algorithm, Tech Report, University of Illinois at Urbana Champaign, 1989</span>; Dhar &amp; Chou (2001) carries the same reference. Packard&rsquo;s published version (<em>Complex Systems</em> 4, 1990) cites Farmer &amp; Sidorowich (1987), their 1988 Los Alamos preprint and Packard&ndash;Crutchfield&ndash;Farmer&ndash;Shaw (1980), and thanks <em>&ldquo;D. Farmer &hellip; stimulated by many interactions at the Santa Fe Institute Economics Program.&rdquo;</em></p>
  </div>
  <p class="note">Assumption, flagged: the 1989 UIUC technical report Dhar cites is taken to be the preprint of Packard&rsquo;s 1990 article (same author, institution and title stem) &mdash; confirm by comparing the report. A second, lexical echo: <em>Thinking with Machines</em> (p.&nbsp;30) has Dhar finding <em>&ldquo;pockets of predictability&rdquo;</em> with genetic algorithms; Kevin Kelly&rsquo;s 1994 account of Prediction Company has Packard calling his method&rsquo;s targets <em>&ldquo;pockets of predictability.&rdquo;</em> Plausible borrowing, nowhere stated.</p>

  <h2>II &middot; The Chain, Link by Link</h2>
  <ul class="tl">
    <li>
      <span class="yr">1980</span>
      <div class="hd">Geometry from a time series</div>
      <p>Packard, Crutchfield, Farmer and Shaw: a dynamical system can be reconstructed from one measured series. The idea every later forecasting method in this chain stands on; cited by Packard (1990).</p>
    </li>
    <li>
      <span class="yr">1987</span>
      <div class="hd">Farmer &amp; Sidorowich &mdash; Predicting chaotic time series</div>
      <p>Forecast by local approximation in the reconstructed state space: find the past states nearest to the present one and read off what happened next. No global model, and prediction error that grows with the horizon at a rate the dynamics set. The root of the thread.</p>
    </li>
    <li>
      <span class="yr">1990</span>
      <div class="hd">Packard &mdash; A genetic learning algorithm for the analysis of complex data</div>
      <p>Use a genetic algorithm to search for regions of a system&rsquo;s state space in which the future is predictable &mdash; conditions, not equations. Builds on Farmer &amp; Sidorowich; credits Farmer and the SFI Economics Program. The method Prediction Company took to market the next year.</p>
    </li>
    <li>
      <span class="yr">1991</span>
      <div class="hd">Prediction Company</div>
      <p>Farmer and Packard found the firm; its trading, automated from 1996, runs for O&rsquo;Connor and then Swiss Bank Corporation.</p>
    </li>
    <li>
      <span class="yr">1994&ndash;97</span>
      <div class="hd">Dhar at Morgan Stanley</div>
      <p>Founds the Data Mining Group: automated trading and client profiling with learning algorithms. <em>Thinking with Machines</em> (pp.&nbsp;29&ndash;38) describes the introduction to the firm&rsquo;s technology and proprietary-trading head and a genetic algorithm generating strategies of the form <em>&ldquo;if five-day volatility is less than 15, go long for five days.&rdquo;</em></p>
    </li>
    <li>
      <span class="yr">2000&ndash;01</span>
      <div class="hd">GLOWER, and the earnings-surprise comparison</div>
      <p>Dhar, Chou &amp; Provost publish GLOWER &mdash; a genetic learner overlaid with entropy reduction, finding rules ahead of earnings surprises &mdash; citing Packard for the method and for the niching penalty. Dhar &amp; Chou (IEEE Transactions on Neural Networks, 2001) compare it with other nonlinear learners on the same problem.</p>
    </li>
    <li>
      <span class="yr">2011</span>
      <div class="hd">The case for small disjuncts</div>
      <p>Dhar&rsquo;s retrospective on why rule learners work in markets when they do: the tradable patterns are rare, local and non-stationary &mdash; the lesson the policy backtest program re-learns every quarter.</p>
    </li>
  </ul>

  <h2>III &middot; The Four Papers, in Reading Order</h2>
  <div class="person">
    <div class="body">
      <ul class="works">
        <li><span class="t">1. Farmer &amp; Sidorowich (1987), Predicting chaotic time series.</span> <span class="m">Physical Review Letters 59(8), 845&ndash;848</span>
          <span class="take"><b>Read for</b> the forecasting idea the chain starts from, and the honest test it carries: how fast prediction error grows with the horizon tells you where structure stops. <a href="https://oms-inet.files.svdcdn.com/production/files/predictingchaotic.pdf?dm=1553075489">INET Oxford scan &rarr;</a></span></li>
        <li><span class="t">2. Packard (1990), A genetic learning algorithm for the analysis of complex data.</span> <span class="m">Complex Systems 4(5), 543&ndash;572</span>
          <span class="take"><b>Read for</b> the bridge: evolutionary search for conditions under which a system is predictable, with Farmer in the references and the acknowledgments. <a href="https://content.wolfram.com/sites/13/2018/02/04-5-4.pdf">Wolfram, Complex Systems archive &rarr;</a></span></li>
        <li><span class="t">3. Dhar, Chou &amp; Provost (2000), Discovering interesting patterns for investment decision making with GLOWER.</span> <span class="m">Data Mining and Knowledge Discovery 4(4), 251&ndash;280</span>
          <span class="take"><b>Read for</b> what was actually built at Morgan Stanley &mdash; the representation, the entropy-reduction overlay, the earnings-surprise results &mdash; and the two sentences that cite Packard. <a href="https://archive.nyu.edu/bitstream/2451/14171/1/IS-00-02.pdf">NYU Stern working paper IS-00-02 &rarr;</a> &middot; <a href="https://archive.nyu.edu/bitstream/2451/27752/2/CPP-01-00.pdf">journal preprint &rarr;</a></span></li>
        <li><span class="t">4. Dhar (2011), Prediction in financial markets: The case for small disjuncts.</span> <span class="m">ACM Transactions on Intelligent Systems and Technology 2(3)</span>
          <span class="take"><b>Read for</b> the retrospective: why the patterns such learners find are rare and local, why they decay, and what that implies for how much to trust any backtest. <a href="https://archive.nyu.edu/bitstream/2451/28304/2/Dhar%20Prediction%20April%202011.pdf">NYU archive &rarr;</a></span></li>
      </ul>
    </div>
  </div>
  <p class="note">Also on the shelf: Dhar, <em>Thinking with Machines</em> (Wiley, 2025), pp.&nbsp;21&ndash;38, for the first-person account of the genetic-algorithm work and the Morgan Stanley years. Unverified and not listed above: Meyer &amp; Packard (1992), <em>Local forecasting of high-dimensional chaotic dynamics</em>, the implementation Packard credits &mdash; no open copy found; and whether Thomas Bass&rsquo;s <em>The Predictors</em> (1999) discusses Morgan Stanley beyond its jacket copy.</p>

  <h2>IV &middot; What It Means for the Program</h2>
  <p>The lineage is one method: <strong>search for local pockets of predictability and trade them until they close.</strong> Armstrong&rsquo;s strategy is a different animal &mdash; a value gap anchored to analyst targets, held on a one-to-two-year clock &mdash; but the thread leaves two things it should keep. From Farmer and Sidorowich, the test: a claim of structure at a horizon is a claim about how slowly the forecast error grows to that horizon, and it can be measured. From Dhar, the warning: the patterns a learner finds are small disjuncts &mdash; rare, local, perishable &mdash; which is the reason the policy backtest program pre-registers its hypotheses and deflates its Sharpe ratios before it believes anything.</p>
  <p>The models that sit next to this memo on the <a href="/complexecon/models">Models tab</a> are the complementary tradition: not pattern search but mechanism &mdash; why a gap exists, who closes it, and on what clock.</p>

  <footer>
    <p>Verified 15 October 2026 against Crossref metadata, the NYU Faculty Digital Archive, the Wolfram <em>Complex Systems</em> archive, the INET Oxford publication list, Wiley&rsquo;s published index to <em>Thinking with Machines</em>, and the <em>Brave New World</em> episode archive. Quotations are from the GLOWER working paper and Packard (1990) as retrieved; everything marked as an assumption or unverified is exactly that.</p>
  </footer>
</div></div>
`
