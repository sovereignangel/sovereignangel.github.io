'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRLCurriculum } from '@/hooks/useRLCurriculum'
import ModuleCard from './ModuleCard'
import { RL_MODULES } from '@/lib/types/rl'
import type { RLModuleId } from '@/lib/types'

// ─── Module Content ───────────────────────────────────────────────────

const MODULE_CONTENT: Record<RLModuleId, {
  definition: React.ReactNode
  intuition: React.ReactNode
  systemMapping: React.ReactNode
  exercise: React.ReactNode
}> = {
  agent_environment: {
    definition: (
      <div className="space-y-1">
        <p>At each time step t, the <strong>agent</strong> observes state S_t, selects action A_t, and receives reward R_{'t+1'} from the <strong>environment</strong>.</p>
        <p>The boundary between agent and environment is not physical {'\u2014'} it is functional. The environment is everything the agent cannot arbitrarily change.</p>
        <p className="text-ink-muted">{'>'} Sutton & Barto, Ch. 3.1</p>
      </div>
    ),
    intuition: (
      <p>You are the agent. Reality is the environment. Your daily log is an observation of the state. Your choices are actions. The reward comes from how well your actions interact with the environment. The key insight: <strong>you cannot arbitrarily change your sleep quality, the market, or other people&apos;s behavior</strong> {'\u2014'} those are the environment.</p>
    ),
    systemMapping: (
      <div className="space-y-1">
        <p><strong>Agent:</strong> You (the decision-maker)</p>
        <p><strong>Environment:</strong> Your body (sleep physiology, nervous system), the market (customer reactions, revenue), your network (relationships, intros), project momentum</p>
        <p><strong>Observation:</strong> DailyLog with ~70 fields, compressed to 10-dim state vector (GE, GI, GVC, {'\u03BA'}, O, GD, GN, J, {'\u03A3'}, Gate)</p>
        <p><strong>Action:</strong> actionType: ship | ask | signal | regulate | explore | compound</p>
        <p><strong>Reward:</strong> g* {'\u2208'} [0, 10] computed by computeReward()</p>
      </div>
    ),
    exercise: (
      <p>Look at today&apos;s state vector in the Transitions tab. For each of the 10 components, classify it: is this something you <em>directly control</em> (agent-side) or something that <em>responds to your actions</em> (environment-side)? For example: focusHoursActual is agent-controlled. sleepHours is partially environment (biology) and partially agent (bedtime choice).</p>
    ),
  },

  reward_hypothesis: {
    definition: (
      <div className="space-y-1">
        <p><strong>Sutton&apos;s Reward Hypothesis:</strong> &ldquo;All of what we mean by goals and purposes can be well thought of as maximization of the expected value of the cumulative sum of a received scalar signal (reward).&rdquo;</p>
        <p><strong>Counter (Vamplew et al. 2022):</strong> Scalar reward is not enough when goals involve risk-sensitivity, multi-objective tradeoffs, or temporal inconsistency.</p>
        <p className="text-ink-muted">{'>'} Silver et al., &ldquo;Reward is Enough&rdquo; (2021)</p>
      </div>
    ),
    intuition: (
      <p>Can &ldquo;happy woman who&apos;s learning quickly and compounding value capture&rdquo; really be captured by a single number 0-10? That&apos;s the deepest question. Your reward function collapses 9 dimensions into one scalar via geometric mean. The compression works IF the dimensions are genuinely complementary (can&apos;t have one without the others). It breaks IF dimensions substitute for each other (high revenue could compensate for low energy).</p>
    ),
    systemMapping: (
      <div className="space-y-1">
        <p><strong>Your scalar:</strong> g* = Gate {'\u00D7'} (GE {'\u00D7'} GI {'\u00D7'} GVC {'\u00D7'} {'\u03BA'} {'\u00D7'} O {'\u00D7'} GD {'\u00D7'} GN {'\u00D7'} J {'\u00D7'} {'\u03A3'})^(1/9) - F{'\u00D7'}0.3</p>
        <p><strong>Geometric mean enforces ruin avoidance:</strong> any component at zero collapses everything. This aligns with ergodicity economics {'\u2014'} the time-average (geometric mean) captures long-run single-trajectory growth.</p>
        <p><strong>The risk:</strong> 9 equally-weighted components assumes GE matters exactly as much as GN. Is that true?</p>
      </div>
    ),
    exercise: (
      <p>Review the last 7 days in the Transitions tab. Find a day where your score was high but the day didn&apos;t <em>feel</em> great. Or a day where the score was low but you actually made important progress. This gap between score and subjective experience reveals where the reward function might be wrong.</p>
    ),
  },

  mdp_markov: {
    definition: (
      <div className="space-y-1">
        <p>A <strong>Markov Decision Process (MDP)</strong> is the tuple (S, A, R, P, {'\u03B3'}) where:</p>
        <p>S = states, A = actions, R: S{'\u00D7'}A{'\u00D7'}S {'\u2192'} {'\u211D'} = reward function</p>
        <p>P: S{'\u00D7'}A {'\u2192'} Pr(S) = transition dynamics, {'\u03B3'} {'\u2208'} [0,1] = discount factor</p>
        <p><strong>Markov property:</strong> P(S_{'t+1'} | S_t, A_t) = P(S_{'t+1'} | S_0, A_0, ..., S_t, A_t)</p>
        <p>The future depends only on the current state, not the history.</p>
        <p className="text-ink-muted">{'>'} Sutton & Barto, Ch. 3.5</p>
      </div>
    ),
    intuition: (
      <p>The Markov property says: if you know where you are right now, the past doesn&apos;t matter for predicting the future. In your life, this is <em>approximately</em> true {'\u2014'} today&apos;s energy, momentum, and pipeline predict tomorrow better than knowing what happened 3 weeks ago. But it&apos;s not perfectly Markov: a 90-day shipping streak creates compound reputation that a single day&apos;s state can&apos;t capture. Your state might need history features (rolling averages) to be truly sufficient.</p>
    ),
    systemMapping: (
      <div className="space-y-1">
        <p><strong>S:</strong> 10-dimensional vector (reward components). Is this sufficient?</p>
        <p><strong>A:</strong> 6 discrete actions. Selected daily.</p>
        <p><strong>P:</strong> Unknown! We don&apos;t know P(tomorrow&apos;s state | today&apos;s state, action). That&apos;s what we&apos;re learning.</p>
        <p><strong>{'\u03B3'} = 0.9:</strong> Tomorrow&apos;s reward counts 90%. 7 days out counts 48%. This means we value the near future heavily.</p>
        <p><strong>Markov test:</strong> Does today&apos;s state alone predict tomorrow&apos;s reward? Or does knowing the last 3 days predict better?</p>
      </div>
    ),
    exercise: (
      <p>Look at your V(s) estimates in the Value tab. The Monte Carlo method computes V(s) assuming the Markov property. If you see a state cluster with high variance in forward returns (large {'\u00B1'} range), that cluster may not be Markov-sufficient {'\u2014'} there&apos;s hidden information (recent history) that the state doesn&apos;t capture.</p>
    ),
  },

  value_bellman: {
    definition: (
      <div className="space-y-1">
        <p><strong>State-value function:</strong> V_{'\u03C0'}(s) = E_{'\u03C0'}[G_t | S_t = s]</p>
        <p>where G_t = {'\u03A3'}(k=0..{'\u221E'}) {'\u03B3'}^k {'\u00B7'} R_{'t+k+1'}</p>
        <p><strong>Bellman equation:</strong> V_{'\u03C0'}(s) = {'\u03A3'}_a {'\u03C0'}(a|s) {'\u03A3'}_{'s\''} P(s&apos;|s,a) [R(s,a,s&apos;) + {'\u03B3'} {'\u00B7'} V_{'\u03C0'}(s&apos;)]</p>
        <p>&ldquo;The value of a state is the immediate reward plus the discounted value of the next state.&rdquo;</p>
        <p className="text-ink-muted">{'>'} Sutton & Barto, Ch. 3.5; Silver Lecture 2</p>
      </div>
    ),
    intuition: (
      <p>V(s) answers: &ldquo;How good is it to <em>be</em> in this state?&rdquo; Not &ldquo;how good was today?&rdquo; but &ldquo;if I&apos;m here, what&apos;s my expected total future reward?&rdquo; Being in the &ldquo;high energy shipping&rdquo; state might have V=6.2, meaning: from here, you&apos;ll typically accumulate 6.2 points of discounted reward over the next week. Being in &ldquo;spiked gated&rdquo; might have V=2.1 {'\u2014'} a much worse position to be in.</p>
    ),
    systemMapping: (
      <div className="space-y-1">
        <p><strong>V(s) estimation method:</strong> Monte Carlo first-visit. For each state cluster, average the 7-day discounted forward return G_t = {'\u03A3'}(k=0..6) 0.9^k {'\u00B7'} r_{'t+k'}.</p>
        <p><strong>State clusters:</strong> Rule-based classification (not ML) for interpretability. You know exactly <em>why</em> you&apos;re in &ldquo;low energy recovery&rdquo; {'\u2014'} because GE {'<'} 0.4.</p>
        <p><strong>Confidence:</strong> V(s) with n=2 samples is unreliable. Need n {'\u2265'} 10 for reasonable estimates.</p>
      </div>
    ),
    exercise: (
      <p>Go to the Value tab. Which state cluster has the highest V(s)? Which has the lowest? Now ask: does this ranking match your intuition? If &ldquo;balanced steady&rdquo; has higher V than &ldquo;revenue hunting,&rdquo; what does that tell you about sustainable performance vs. sprinting?</p>
    ),
  },

  policy_improvement: {
    definition: (
      <div className="space-y-1">
        <p>A <strong>policy</strong> {'\u03C0'}(a|s) maps states to action probabilities.</p>
        <p><strong>Policy evaluation:</strong> Given {'\u03C0'}, compute V_{'\u03C0'}(s) for all s.</p>
        <p><strong>Policy improvement:</strong> For each state, greedily pick a* = argmax_a Q_{'\u03C0'}(s,a).</p>
        <p><strong>Policy iteration:</strong> Alternate evaluation and improvement until convergence.</p>
        <p className="text-ink-muted">{'>'} Sutton & Barto, Ch. 4.2-4.3; Silver Lecture 3</p>
      </div>
    ),
    intuition: (
      <p>Your daily routine IS a policy. &ldquo;When I wake up with low energy, I regulate instead of shipping&rdquo; {'\u2014'} that&apos;s {'\u03C0'}(regulate | low_energy) = 1.0. Policy evaluation asks: &ldquo;When I follow this rule, what happens to my reward?&rdquo; Policy improvement asks: &ldquo;Is there a better action I should take in this state?&rdquo;</p>
    ),
    systemMapping: (
      <div className="space-y-1">
        <p><strong>Your policy rules</strong> in the Policy tab are explicit {'\u03C0'}(a|s) rules: &ldquo;When [conditions], do [action].&rdquo;</p>
        <p><strong>Evidence scores</strong> track: how many times the rule triggered, how often you followed it, and the average reward when followed vs. ignored.</p>
        <p><strong>Policy improvement:</strong> If avgRewardWhenIgnored {'>'} avgRewardWhenFollowed, the rule is hurting you. Drop it or revise it.</p>
      </div>
    ),
    exercise: (
      <p>Go to the Policy tab. Find your two best-evidenced rules (highest matchCount). Compare their avgRewardWhenFollowed. Which rule produces better outcomes? Now ask: is there a state where you have NO rule? That&apos;s a gap in your policy {'\u2014'} you&apos;re acting randomly in that state.</p>
    ),
  },

  td_learning: {
    definition: (
      <div className="space-y-1">
        <p><strong>TD(0) update:</strong> V(S_t) {'\u2190'} V(S_t) + {'\u03B1'} [{' '}R_{'t+1'} + {'\u03B3'} V(S_{'t+1'}) - V(S_t) ]</p>
        <p><strong>TD error:</strong> {'\u03B4'}_t = R_{'t+1'} + {'\u03B3'} V(S_{'t+1'}) - V(S_t)</p>
        <p>{'\u03B4'} {'>'} 0 means &ldquo;better than expected&rdquo; (positive surprise)</p>
        <p>{'\u03B4'} {'<'} 0 means &ldquo;worse than expected&rdquo; (negative surprise)</p>
        <p className="text-ink-muted">{'>'} Sutton & Barto, Ch. 6.1; Silver Lecture 4</p>
      </div>
    ),
    intuition: (
      <p>TD error is the <strong>surprise signal</strong> {'\u2014'} the gap between what you expected and what happened. Large positive TD errors are &ldquo;surprisingly good days.&rdquo; Large negative are &ldquo;surprisingly bad days.&rdquo; Neuroscience shows dopamine neurons literally encode TD errors {'\u2014'} they fire more when reward exceeds expectation. TD learning means you can learn from <em>each day</em>, not just at the end of the week.</p>
    ),
    systemMapping: (
      <div className="space-y-1">
        <p><strong>{'\u03B4'}_t = r_t + 0.9 {'\u00D7'} V(s_{'t+1'}) - V(s_t)</strong></p>
        <p>Computed for each day using your V(s) estimates per state cluster.</p>
        <p><strong>Positive {'\u03B4'}:</strong> Today was better than the typical day in your state cluster. What did you do differently?</p>
        <p><strong>Negative {'\u03B4'}:</strong> Today underperformed expectations. What went wrong?</p>
        <p>The Audit tab shows TD errors as a bar chart {'\u2014'} green bars are learning opportunities, red bars are warning signals.</p>
      </div>
    ),
    exercise: (
      <p>Look at the TD error chart in the Audit tab. Find the day with the largest positive {'\u03B4'}. What was different about that day? Did you try a new action? Were you in an unusual state? Now find the largest negative {'\u03B4'}. What explains the disappointment? This analysis is literally how your brain learns {'\u2014'} through prediction errors.</p>
    ),
  },

  exploration_exploitation: {
    definition: (
      <div className="space-y-1">
        <p><strong>Multi-armed bandit:</strong> K actions, each with unknown reward distribution. Goal: maximize cumulative reward.</p>
        <p><strong>{'\u03B5'}-greedy:</strong> With probability {'\u03B5'}, explore randomly. Otherwise, exploit best-known action.</p>
        <p><strong>UCB:</strong> a* = argmax_a [Q(a) + c {'\u00B7'} {'\u221A'}(ln(N) / N_a)]</p>
        <p><strong>Thompson Sampling:</strong> Sample from posterior of each arm, pick the highest sample.</p>
        <p className="text-ink-muted">{'>'} Sutton & Barto, Ch. 2; Brunskill CS234 Lecture 11</p>
      </div>
    ),
    intuition: (
      <p>This is the central question of a well-lived life. <strong>Exploit</strong> = do what you know works (ship Armstrong every day). <strong>Explore</strong> = try something new (a different market, a new skill, a relationship you haven&apos;t invested in). You can&apos;t learn the value of actions you&apos;ve never tried. But every day exploring is a day not exploiting your best strategy. Your current reward function <em>systematically punishes exploration</em> because explore days have low GVC, low {'\u03BA'}, low {'\u03A3'}.</p>
    ),
    systemMapping: (
      <div className="space-y-1">
        <p><strong>Your exploration ratio</strong> = days with action=&ldquo;explore&rdquo; / total days. Check the sidebar.</p>
        <p><strong>Action frequency</strong> in Transitions tab shows which actions you over/under-use.</p>
        <p><strong>The fix (future):</strong> UCB-style exploration bonus: reward += c {'\u00B7'} {'\u221A'}(ln(N) / N_a) for under-explored actions.</p>
      </div>
    ),
    exercise: (
      <p>Look at your action stats in the Transitions tab. Which action have you tried the least? When was the last time you chose &ldquo;explore&rdquo;? If your exploration ratio is below 15%, you may be prematurely exploiting a local optimum. Consider: what would you learn from a dedicated exploration day?</p>
    ),
  },

  reward_shaping: {
    definition: (
      <div className="space-y-1">
        <p><strong>Ng&apos;s Theorem (1999):</strong> Potential-based reward shaping F(s, s&apos;) = {'\u03B3'}{'\u03A6'}(s&apos;) - {'\u03A6'}(s) is the ONLY form that preserves optimal policies.</p>
        <p>Any other reward modification can change what the &ldquo;optimal&rdquo; policy is.</p>
        <p><strong>Goodhart&apos;s Law:</strong> &ldquo;When a measure becomes a target, it ceases to be a good measure.&rdquo;</p>
        <p className="text-ink-muted">{'>'} Ng, Harada & Russell (1999); Goodhart (1975)</p>
      </div>
    ),
    intuition: (
      <p>Your hand-designed reward might be wrong, and you&apos;d never know from the score alone. If you can &ldquo;game&rdquo; your score without actually improving your life, the reward function is broken. The gate mechanism (multiplying by 0.3 when spiked) is NOT potential-based {'\u2014'} it changes optimal policies in ways Ng&apos;s framework would flag. It&apos;s still useful as a behavioral nudge, but be honest that it&apos;s a design choice, not a theoretically safe transformation.</p>
    ),
    systemMapping: (
      <div className="space-y-1">
        <p><strong>Gaming risks:</strong> Logging 2 low-effort revenue asks to hit {'\u03BA'} target. Counting a casual chat as a &ldquo;discovery conversation.&rdquo; Marking publicIteration=true for a trivial post.</p>
        <p><strong>Floor protection:</strong> REWARD_FLOOR = 0.05 prevents zero but also prevents a true &ldquo;wake-up call&rdquo; day.</p>
        <p><strong>Component correlation:</strong> GD and GN both measure outward engagement. Correlated components effectively double-weight those dimensions.</p>
      </div>
    ),
    exercise: (
      <p>Look at the Reward Health section in the Audit tab. Identify any component that&apos;s consistently at ceiling ({'>'}0.85) {'\u2014'} you might be gaming it. Identify any at floor ({'<'}0.15) {'\u2014'} it&apos;s not discriminating. For each, ask: &ldquo;If I removed this component entirely, would my behavior change?&rdquo; If no, the component isn&apos;t driving decisions and is just noise.</p>
    ),
  },

  bandit_to_mdp: {
    definition: (
      <div className="space-y-1">
        <p><strong>Contextual bandit:</strong> Choose action based on context (state), observe reward. No sequential dependencies.</p>
        <p><strong>Full MDP:</strong> Actions affect future states. Must plan over sequences, not just single steps.</p>
        <p><strong>Transition model:</strong> P(s&apos;|s, a) {'\u2014'} &ldquo;If I ship today with high energy, what state will I be in tomorrow?&rdquo;</p>
        <p><strong>Planning:</strong> Use the model to simulate trajectories and pick the best action sequence.</p>
        <p className="text-ink-muted">{'>'} Sutton & Barto, Ch. 8; Silver Lecture 8</p>
      </div>
    ),
    intuition: (
      <p>The bandit sees each day independently. The MDP sees a trajectory. &ldquo;Ship 3 days, then regulate 1 day&rdquo; might be a better <em>sequence</em> than &ldquo;ship every day&rdquo; {'\u2014'} even though shipping scores higher on any single day. This is where RL gets truly powerful: it reasons about the <em>consequences</em> of actions, not just their immediate reward.</p>
    ),
    systemMapping: (
      <div className="space-y-1">
        <p><strong>Current phase:</strong> You&apos;re between bandit (Phase 2) and MDP (Phase 3) in the roadmap.</p>
        <p><strong>With 90+ days of data,</strong> you can start asking: &ldquo;After I ship (a=ship), what state cluster do I typically end up in?&rdquo; This is the empirical transition model.</p>
        <p><strong>Sample budget:</strong> 365 days/year, 6 actions. A linear model has 54 parameters. You need 270-540 samples (1-2 years) for reliable estimation.</p>
      </div>
    ),
    exercise: (
      <p>In the Transitions tab, filter by action=&ldquo;ship.&rdquo; Look at the nextCluster column. What state do you typically transition to after shipping? Now filter by action=&ldquo;regulate.&rdquo; Where does regulation lead? If shipping often leads to &ldquo;low energy recovery&rdquo; but regulation leads to &ldquo;high energy shipping,&rdquo; you&apos;re seeing the transition model in action {'\u2014'} and it suggests a ship-ship-regulate cycle might be optimal.</p>
    ),
  },
}

// ─── Component ────────────────────────────────────────────────────────

export default function ConceptsView() {
  const { user } = useAuth()
  const { progress, loading, completeModule, completeExercise, completedCount } = useRLCurriculum(user?.uid)

  if (loading) {
    return <div className="flex items-center justify-center h-32 text-[10px] text-ink-muted font-sans">Loading curriculum...</div>
  }

  return (
    <div className="space-y-2">
      {/* Progress header */}
      <div className="flex items-center justify-between px-1">
        <span className="font-serif text-[11px] text-ink-muted">
          {completedCount}/9 modules completed
        </span>
        <div className="flex-1 mx-3 h-1 bg-cream rounded-sm overflow-hidden">
          <div
            className="h-full bg-burgundy rounded-sm transition-all"
            style={{ width: `${Math.round(completedCount / 9 * 100)}%` }}
          />
        </div>
      </div>

      {/* Modules */}
      {RL_MODULES.map(mod => {
        const moduleProgress = progress?.modules?.[mod.id]
        const content = MODULE_CONTENT[mod.id]

        return (
          <ModuleCard
            key={mod.id}
            moduleId={mod.id}
            number={mod.symbol}
            title={mod.title}
            isCompleted={moduleProgress?.completed ?? false}
            exerciseCompleted={moduleProgress?.exerciseCompleted ?? false}
            onCompleteModule={() => completeModule(mod.id)}
            onCompleteExercise={() => completeExercise(mod.id)}
            definition={content.definition}
            intuition={content.intuition}
            systemMapping={content.systemMapping}
            exercise={content.exercise}
          />
        )
      })}
    </div>
  )
}
