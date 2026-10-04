"""Built for Today, quality gate (shared by the composer and the LLM writer).

A grammatical, coach-like message still FAILS if it does not quickly prove that this workout was built for this person today.

Checks:
  shape        2-3 sentences, 22-55 words (target 25-50)
  language     no clinical / feature / software language, no em or en dashes
  filler       no motivational phrase families that read the same on any workout ("where it counts", "quality work" ...)
  first        FIRST-SENTENCE TEST: sentence one names something MOOD knows about the user today (a State, soreness,
               or on a no-State day the strongest real input: Target, goal, level, duration, equipment, history), names a
               concrete change it caused, and makes the causality explicit. With two States, sentence one names both.
  personal     every State the user told us is visible in the first two sentences
  truthful     the facts it rests on exist; exercise names are today's (or named as what they replaced)
  fresh        not too similar to the user's recent messages
"""
from __future__ import annotations
import re

BANNED = [r'\beasier\b', r'\breduced?\b', r'\blower\b(?! back| body|-body| half| leg)', r'\bselected\b', r'\binputs?\b', r'\boptimi[sz]', r'\bpersonali[sz]',
          r'based on your', r'given your', r'\balgorithm', r'\bgenerat', r'\bstate\b', r'\brir\b', r'\brpe\b', r'\bdials?\b', '—', '–',
          r'\bcrush', r'\bbeast\b', r'\bjourney\b', r'\byou deserve\b', r'\bself-care\b']
# Motivational phrase families: fine once, but they read the same on every workout and prove nothing about today.
FILLER = [r'where it (counts|matters)', r'(work|things|stuff) that matters?', r'quality work', r'take care of itself', r'\breal work\b',
          r'has a purpose', r'really counts', r'\bfiller\b', r'do its job', r'take advantage', r'asks a little more of you',
          r'somewhere useful', r'wastes? energy', r'the fun part', r'not a test', r'walk out better', r'something in the tank',
          r'just (show up and )?work', r'\bown it\b', r'level up', r'make (it|today|every rep) count', r"let'?s go\b", r'you got this',
          r'built (just )?for you', r'tailored', r'dialed in for', r'every rep fast, every rest full', r'fresh, fast and crisp',
          r'keep it repeatable', r'steady output wins', r'nothing fancy', r'straightforward, (hard|focused)']
# Vague personalization: sounds natural, proves nothing. If the brief has the mechanism, name it.
VAGUE = [r'new stuff', r'chang(e|es|ed|ing) (things|it) up', r'mix(es|ed|ing)? (it|things) up', r'\bgets? harder\b', r'more intensity', r'different work',
         r'extra challenge', r'(us(e|ing)|spend(ing)?|put(ting)?) (that|the|your|this) energy', r'take advantage', r'work that matters',
         r'scal(e|ed|ing) (things|it|everything) back', r'dial(ed|s)? (it|things) (back|up|down)', r'\bmore effort\b', r'without the chaos',
         r'turn(s|ed)? (it|things) up', r'asks? (a little )?more of you', r'kick(s|ed)? it up', r'(more|less) complexity', r'familiar structure',
         r'\bshake things up', r'\btougher\b', r'\b(hits?|runs?|goes) harder\b', r'harder territory', r'adjusted (the|your) (session|workout)', r'tweak(ed)?', r'the (session|workout) (is )?adapt']
# Implementation / schema language
# Absolute safety promises (Oct 2026): the copy describes the programming decision ("keeps heavy loading away from your lower back",
# "uses supported rows while your back is sore"), never an outcome no workout can guarantee ("your back stays safe").
SAFETY = [r'\b(safe|safely|safety|unsafe|injur\w*|risk-free|harm\w*)\b',
          r'\bprotect\w*\s+(you\b|your\s+(joints?|back|lower back|knees?|shoulders?|spine|body|legs?|hips?|elbows?|wrists?|neck|recovery)|it\b|them\b|the sore)',
          r'\b(stays?|stayed|kept|keeps? \w+(?: \w+)?|remains?)\s+protected\b', r'\bto protect\b']

SCHEMA = [r'as your target', r'\byour target\b', r'\bselected\b', r'\bdirection\b', r'\barchetype', r'training profile', r"mood's pick",
          r'\bstates?\b', r'\bpersonaliz', r'\bvariant\b', r'\bcontract\b']
# Narrative phrase families. Repeating the programming truth is fine; repeating the storytelling device is not.
FAMILIES = {
    'fresh': r"while (you're|your \w+ (is|are)) fresh", 'fatigue': r'before (any )?fatigue', 'pushed_failure': r'pushed (a rep )?closer to failure',
    'day_off': r'day off', 'takes_over': r'takes over', 'extra_energy_today': r'extra (energy|juice) today', 'explosive_theme': r'explosive theme',
    'anchors': r'\banchors?\b', 'leads_heavy': r'heavy and early|leads the way|leads it', 'comes_first': r'comes first', 'sets_tone': r'sets the tone',
    'in_the_tank': r'in the tank', 'lean_stable': r'lean(s)? stable', 'rep_slows': r'if a rep slows', 'full_rest': r'take your full rest|rest fully',
    'budget': r'sets the budget', 'one_place': r'into one place', 'last_clean_rep': r'last clean rep', 'controlled_tempo': r'controlled tempo',
    'usual_picks': r'usual picks?', 'leaves_alone': r'leaves (it|them) alone', 'built_around': r'built (today|it) around',
    'concentrates': r'concentrat', 'round_out': r'round(s)? out', 'planes': r'across (all )?planes', 'drive_goes': r'(drive|readiness) (goes|lands|lives)',
    'sweat_home': r'(drive|finish) the sweat', 'readiness_there': r'(readiness|drive) is there',
    'calls_shots': r'calling the shots|rules the session|picks the (session|rest)', 'tank_match': r'match(es)? your tank',
}
CONSTRUCTIONS = [('cause_so', r"^(you('re|'ve| came| wanted)|your |there's |the usual)[^:.]*?, so "), ('label_colon', r'^[^,.:]{3,40}: '),
                 ('since', r'^since '), ('because_end', r', because [^.]*\.$'), ('means', r'\bmeans\b'), ('you_asked', r'^you (asked|wanted) ')]
MIN_WORDS, MAX_WORDS, IDEAL = 22, 55, 38


def families(t):
    low = t.lower(); return {k for k, p in FAMILIES.items() if re.search(p, low)}


def construction(t):
    s1 = (sentences(t) or [''])[0].lower()
    return next((k for k, p in CONSTRUCTIONS if re.search(p, s1)), 'other')

# What the user told us, as the words a reader recognises
TOLD = {   # the State does not have to be named; it has to be unmistakable
    'low_energy': r"low on energy|energy'?s low|low energy|energy is (low|down)|energy dip|running low|running on (empty|fumes)|tank('s| is)? (sets|wins|low|empty)|full tank|low tank|not much (in the tank|fuel)|short on (energy|fuel)|low on fuel|tired\b|drained|low battery|out of gas|on empty",
    'amped': r"\bamped\b|extra (energy|juice)|plenty of (juice|drive)|energy (to burn|is up|is there)|ready to go|came in ready|fired up|primed|readiness|\bdrive\b|charged up|got the fuel",
    'irritated': r"irritat|wound up|frustrat|\bedge\b|annoyed|agitated|something to (hit|push)|blow off steam",
    'stressed': r"stress|busy head|head'?s (full|busy)|on your mind|stretched thin|frazzled|overloaded",
    'bored': r"\bbored|boredom|novelty|something (new|different)|same old|of the usual|routine|stale\b|done to death",
}
INPUT_WORDS = {
    'target': None, 'duration': r'\b30 minutes|thirty minutes|\b30-minute', 'level': r'newer to|beginner|advanced|intermediate',
    'goal': r'\bgoal\b|training (for|to)|feel better|strength is|athleticism is|conditioning', 'equipment': r'working with|equipment|setup',
    'history': r'last time|last session|you logged|from last|you trained',
}
CAUSAL = r"\b(so|because|since|which is why|that's why|means?|calls for|shifts?|sends?|sets|brings?|brought|steers?|steered|scales?|reshapes?|pulls?|routes?|rules?|picks?|drives?|goes into|concentrates?|gets? solved)\b|:|, and that's"
# What a decision sounds like, by fact tag (plus any exercise name the fact carries)
DECISION = {
    'further_from_failure': r'failure|in the tank|reps left|in reserve|back(s)? off|stop(s)? early|well short', 'moderate_loads': r'moderate|more reps|higher rep', 'slow_eccentric': r'slow lowering',
    'top_set': r'top set', 'heavier_main': r'heav|load up|fewer reps|rep count drops', 'closer_to_failure': r'failure', 'explosive_intent': r'intent|driving',
    'controlled_tempo': r'tempo|controlled', 'harder_pace': r'harder|very hard|goes hard|effort (goes )?up', 'sustainable_pace': r'moderately hard|pulls? back|steady|repeat',
    'strength_held_back': r'failure', 'heavier_strength': r'heav', 'yielded': r'no extra load|energy wins|tank wins',
    'stable_choices': r'stable|supported', 'cheaper_choices': r'cost', 'simple_physical': r'simple|physical', 'nothing_technical': r'technical',
    'simple_stations': r'simple|stable', 'forceful_stations': r'forceful|direct', 'new_machine': r'instead of|replaces', 'less_impact': r'landing|jump|impact',
    'simple_power': r'simple', 'demanding_primary': r'main movement|demanding|steps up|leads', 'forceful_athletic': r'forceful|hard reps|hit hard|direct',
    'trimmed_extras': r'comes out|come out|drops? a set|is gone|is out|loses? a set|volume (drops|comes down)', 'extra_set': r'extra (working )?set', 'trade_volume': r'heavier|comes out', 'one_less': r'one less|comes out|is out|sits (this one )?out',
    'extra_round': r'extra round|one more round|more rounds?', 'fewer_efforts': r'fewer|instead of|shrinks?|down to|cuts?', 'extra_quality_set': r'extra set', 'full_rest': r'rest', 'unhurried_rest': r'rest',
    'more_recovery': r'break|recovery|\brest\b', 'less_downtime': r'break|downtime|\brest\b', 'full_recovery': r'recovery', 'straight_sets': r'straight sets|no pairing|no supersets',
    'finisher': r'finisher|finish', 'shape_change': r'instead of|runs as|straight rounds', 'contrast': r'paired|straight into', 'no_chaos': r'reactive|complicated|simple',
    'intensifier': r'drop set|rest-pause|one-and-a-half|finishes with|switches', 'fresh_movements': r"replac|come in|comes in|less-familiar|new\b|haven't",
    'fresh_athletic': r"haven't done|don't usually|different", 'sore_reroute': r'session|built today|leaves|today (is|stays|moves|becomes|goes)|skips?|clear of|away from|only|demand', 'sore_narrowed': r'keeps',
    'sore_protected': r'nothing|out of (the )?(heavy|loading)|off the|avoid|keeps? (it|them) out|clear of|spare|demand|supported|loading away', 'sore_override': r'kept|friendlier', 'sore_shift_upper': r'upper body', 'sore_shift_lower': r'legs|overhead',
    'sore_no_hinge': r'hinges|olympic|slams|demand', 'target_split': r'direct work|its own', 'target_focus': r'every movement|trains', 'target_lean': r'lean|shape',
    'core_long': r'bracing|carries|strength session', 'rotation': r'rotates|moves you', 'progression_target': r'target|logged', 'progression_kept': r'stays',
    'goal_strength': r'heav|first|leads|carries|sled', 'goal_muscle': r'accessor|volume', 'goal_conditioning': r'rests? stay short|keeps moving', 'goal_feel': r'failure|rhythmic|sustainable',
    'goal_athletic_lift': r'heavy|fast', 'goal_athletic': r'speed|power|output', 'level_beginner': r'reserve|beginner-friendly|high-impact|olympic|clock',
    'level_advanced': r'stays in|failure', 'short_window': r'exercise', 'equipment': r'fits',
}
INPUT_TOPICS = ('target', 'goal', 'level', 'history', 'duration', 'equipment')


def words(t): return re.findall(r"[a-z0-9']+", t.lower())


def sentences(t): return [s for s in re.split(r'(?<=[.!?])\s+', t.strip()) if s]


def trigrams(t):
    w = words(t); return {tuple(w[i:i + 3]) for i in range(len(w) - 2)}


def jaccard(a, b):
    A, B = trigrams(a), trigrams(b)
    return len(A & B) / len(A | B) if A and B else 0.0


def opener(t): return ' '.join(words(t)[:3])


def closer(t): return ' '.join(words(t)[-4:])


def similarity(text, recent):
    recent = [r for r in (recent or []) if r]
    mj = max((jaccard(text, r) for r in recent), default=0.0)
    op = opener(text) in {opener(r) for r in recent[:6]}
    cl = closer(text) in {closer(r) for r in recent[:6]}
    mine = {s.lower().strip() for s in sentences(text)}
    sc = any(s.lower().strip() in mine for r in recent[:3] for s in sentences(r))
    reuse = sum(1 for r in recent[3:] for s in sentences(r) if s.lower().strip() in mine)
    fam = families(text)
    fam_overlap = max((len(fam & families(r)) for r in recent[:3]), default=0)       # shared storytelling devices with one recent message
    fam_recent = len(fam & set().union(*[families(r) for r in recent[:5]])) if recent else 0
    con = construction(text)
    con_run = bool(recent[:2]) and len(recent) >= 2 and all(construction(r) == con for r in recent[:2]) and con != 'other'
    return dict(max_jaccard=round(mj, 3), opener_clash=op, closer_clash=cl, sentence_clash=sc, older_reuse=reuse,
                family_overlap=fam_overlap, family_recent=fam_recent, construction=con, construction_run=con_run)


def _told_states(brief):
    """States the user told us AND that verifiably changed the workout (yielded States count: the copy must say they lost)."""
    out = []
    for f in brief.facts:
        for c in f['claims']:
            if c and c[0] in ('state', 'state_yielded') and c[1] not in out: out.append(c[1])
    return out


MECHANISM = r"\b(sets?|reps?|rest|rounds?|failure|load|weight|heav(y|ier)|tempo|effort|pace|interval|station|drops?|extra|swap|replac|instead|pair|straight sets|seconds|landings?|jumps?|rest-pause|drop set|top set|eccentric|volume|cut|comes? out|sits? (this one )?out|fewer|more|stable|supported|machine|finisher)"


def _decision_hit(sentence, brief, kinds):
    low = sentence.lower()
    if re.search(r'as planned|as usual|doesn\'t (soften|change)|stays? the same|nothing changes', low): return False
    tags = {f['tag'] for f in brief.facts if any(c and c[0] in kinds for c in f['claims'])}
    if any(re.search(p, low) and (allowed & tags) for p, allowed in CLAIMS): return True
    for f in brief.facts:
        if not any(c and c[0] in kinds for c in f['claims']): continue
        pat = DECISION.get(f['tag'])
        if pat and re.search(pat, low): return True
        nm = [f['data'].get('name')] + list(f['data'].get('names') or [])
        if any(n and n.lower() in low for n in nm): return True
    return False


def first_sentence_test(text, brief):
    """-> (ok, reason). Sentence one must make 'MOOD understood me today' unmistakable."""
    ss = sentences(text)
    if not ss: return False, 'empty'
    s1 = ss[0]; low = s1.lower()
    states = _told_states(brief)
    sore = any(f['topic'] == 'sore' for f in brief.facts)
    causal = bool(re.search(CAUSAL, low))
    if states or sore:
        named = [s for s in states if re.search(TOLD[s], low)]
        if sore and re.search(r'\bsore(ness)?\b', low): named.append('sore')
        if not named: return False, 'sentence one does not reflect what the user told us today'
        if states and not [s for s in named if s != 'sore']:
            return False, 'sentence one reflects the soreness but not how they feel'
        if len(states) >= 2 and len([s for s in named if s != 'sore']) < 2:
            return False, 'two States told, sentence one reflects only one'
        if not causal: return False, 'sentence one does not make the cause explicit'
        if not _decision_hit(s1, brief, ('state', 'state_yielded', 'soreness')):
            return False, 'sentence one names the State but no concrete change it caused'
        return True, 'state'
    inputs = [f for f in brief.facts if f['topic'] in INPUT_TOPICS and f['claims']]
    if inputs:
        hit = False
        for f in inputs:
            pat = INPUT_WORDS.get(f['topic'])
            if f['topic'] == 'target':
                lab = (getattr(brief, 'target_prose', None) or getattr(brief, 'target_label', None) or '').lower()
                hit = hit or bool(lab and any(w in low for w in re.split(r',? and |, ', lab)))
            elif pat and re.search(pat, low): hit = True
        if not hit: return False, 'no-State day: sentence one ignores the strongest real input'
        if not causal: return False, 'no-State day: sentence one does not make the cause explicit'
        if not _decision_hit(s1, brief, ('target', 'goal', 'experience', 'history', 'duration', 'equipment')):
            return False, 'no-State day: sentence one names an input but no change it caused'
        return True, 'input'
    return True, 'structure'   # nothing real to personalise: explaining the session's intent is the honest answer


_UNITS = {w: i for i, w in enumerate('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split())}
_TENS = {w: 10 * i for i, w in enumerate('_ _ twenty thirty forty fifty sixty seventy eighty ninety'.split()) if w != '_'}
_U = '|'.join(sorted(_UNITS, key=len, reverse=True)); _T = '|'.join(_TENS)
SPELLED = re.compile(rf"\b(?:(?:a|one|two|three|four|five|six|seven|eight|nine) hundred(?:(?: and)? (?:(?:{_T})(?:[- ](?:{_U}))?|{_U}))?|(?:{_T})(?:[- ](?:{_U}))?|{_U})\b", re.I)


def _spelled_value(m):
    w = re.split(r'[- ]+', m.lower().replace(' and ', ' ')); v = 0; cur = 0
    for x in w:
        if x == 'hundred': cur = (cur or 1) * 100
        elif x == 'a': cur = 1
        elif x in _TENS: cur += _TENS[x]
        elif x in _UNITS: cur += _UNITS[x]
    return v + cur


def numbers_in(text):
    """Every quantity a sentence states, digits or spelled out ('thirty-nine', 'one hundred five')."""
    out = [int(n) for n in re.findall(r'\d+', text or '')]
    out += [_spelled_value(m.group(0)) for m in SPELLED.finditer(text or '')]
    return out


def normalize(text):
    """Mechanical style fixes for model output: em/en dashes become commas (ranges become 'to'), whitespace collapses."""
    t = re.sub(r'(\d)\s*[\u2013\u2014]\s*(\d)', r'\1 to \2', str(text or ''))
    t = re.sub(r'\s*[\u2014\u2013]\s*', ', ', t)
    t = re.sub(r',\s*,', ',', t)
    # spelled-out quantities from 10 up read as digits ("105 seconds", not "one hundred five seconds")
    t = SPELLED.sub(lambda m: str(_spelled_value(m.group(0))) if _spelled_value(m.group(0)) >= 10 else m.group(0), t)
    return re.sub(r'\s+', ' ', t).strip()


# Claims that need a fact behind them: a mechanism the copy asserts must be one the engine actually made today.
CLAIMS = [
    (r'closer to failure|to failure than usual', {'closer_to_failure', 'top_set', 'level_advanced'}),
    (r'further from failure|short of failure|reps? (left )?in (the tank|reserve)|before failure|from failure', {'further_from_failure', 'strength_held_back', 'goal_feel', 'level_beginner', 'level_advanced', 'moderate_loads'}),
    (r'extra (working |quality )?set|one more set|more sets?\b', {'extra_set', 'extra_quality_set'}),
    (r'extra round|one more round|fourth round|more rounds?', {'extra_round'}),
    (r'rest-pause|drop set|one-and-a-half|1\.5 reps', {'intensifier', 'level_advanced'}),
    (r'top set|back-off', {'top_set', 'level_advanced', 'goal_strength'}),
    (r'straight sets', {'straight_sets'}),
    (r'eccentric|slow lowering', {'slow_eccentric', 'level_advanced', 'intensifier'}),
    (r'stable|supported|balance', {'stable_choices', 'simple_stations'}),
    (r'moderate (load|weight)|higher reps|(?<!or )more reps', {'moderate_loads'}),
    (r'(drops?|loses?|lose) a set|one fewer set|fewer sets', {'trimmed_extras', 'fewer_efforts', 'one_less', 'trade_volume'}),
    (r'finisher', {'finisher'}),
    (r'paired|straight into|contrast', {'contrast', 'accessory_build', 'shape_change'}),
    (r'heavier|more weight', {'heavier_main', 'heavier_strength', 'top_set', 'trade_volume', 'demanding_primary', 'goal_strength', 'lead_lift'}),
    (r'(longer|more) (rest|recovery|breaks?)|rest (stretches|goes up)', {'more_recovery', 'full_recovery', 'unhurried_rest', 'full_rest'}),
    (r'(shorter|less) (rest|downtime|breaks?)|rest (tightens|drops)|without (rest|a break)|no (rest|breaks?)|minimal rest', {'less_downtime', 'goal_conditioning'}),
    (r"haven't (done|seen|tried)|never (done|tried)|first time|new to you", {'fresh_athletic'}),
    (r'(?<!-)\b(half|double|twice|triple)\b(?!-)', set()),   # approximations of the facts' numbers are never verified
    (r'fewer (landings|jumps)|less (jumping|landing)|landings? (drop|instead)', {'less_impact'}),
]


def unsupported_claims(text, brief):
    low = re.sub(r'instead of [^,.;:]+', '', text.lower()); tags = {f['tag'] for f in brief.facts}   # what was replaced is not a claim
    return [p for p, allowed in CLAIMS if re.search(p, low) and not (tags & allowed)]


def text_problems(text, brief, names_only=None):
    """Hard, sentence-local checks (language, claims, exercise names). Used by check() on the whole message and by the
    streaming writer on each sentence before it may be shown. names_only: True -> only the name check, False -> all but it,
    None -> everything."""
    problems = []
    if names_only is not True:
        plain = text
        for proper in [getattr(brief, 'arch_name', None), getattr(brief, 'target_label', None)] + list(getattr(brief, 'names', []) or []) + list(getattr(brief, 'mentionable', []) or []):
            if proper: plain = plain.replace(proper, '')
        for p in BANNED:
            if re.search(p, plain, re.I): problems.append(f'banned: {p}')
        for p in FILLER:
            if re.search(p, plain, re.I): problems.append(f'filler: {p}')
        for p in VAGUE:
            if re.search(p, plain, re.I): problems.append(f'vague: {p} (name the actual change)')
        for p in SCHEMA:
            if re.search(p, plain, re.I): problems.append(f'internal language: {p}')
        for p in SAFETY:
            if re.search(p, plain, re.I): problems.append(f'absolute safety claim: {p} (describe the programming decision instead)')
        if getattr(brief, 'direction', None) == 'athletic' and re.search(r'all-out|max(imal)? effort', plain, re.I):
            problems.append('athletic: explosive work is full intent, not all-out')
        if re.search(r'\bMOOD\b', text) and "MOOD's Pick" not in text: problems.append('software voice: MOOD')
        if re.search(r'\{|\}|None\b', text): problems.append('unfilled slot')
        for p in unsupported_claims(plain, brief): problems.append(f'unsupported claim: {p}')
        # QA freeze: "X replaces <exercise that is still in today's session>" is self-contradicting, so it is invented
        low = text.lower()
        for nm in getattr(brief, 'names', []) or []:
            if nm and re.search(r"(replac\w*|instead of|in place of|swaps? out|takes the place of)\s+(the |your |heavy |usual )*" + re.escape(nm.lower()), low):
                problems.append(f'unsupported claim: {nm} is still in the session, so nothing replaced it')
    if names_only is not False:
        for nm in re.findall(r"\b(?:[A-Z][\w'-]+(?: [A-Z][\w'()+-]+)+)\b", text):
            if any(nm in x or x in nm for x in list(brief.names) + list(getattr(brief, 'mentionable', []) or [])): continue
            if (brief.arch_name and nm in brief.arch_name) or (brief.target_label and nm in brief.target_label): continue
            if nm.split()[0] in ('You', 'Your', 'Today', 'Heavy', 'Amped', 'Bored', 'Irritated', 'Stressed', 'Low', 'Extra', 'Wound', 'Busy', 'Running',
                                 'Every', 'The', 'Then', 'It', 'A', 'An', 'With', 'Since', 'For', 'After', 'Strength', 'Speed', 'Athleticism', 'Pick', 'Take',
                                 'Stop', 'Build', 'Move', 'Rest', 'Pace', 'Expect', 'Use', 'Go', 'Focus', 'If', "MOOD's", 'Last', 'One', 'Everything'):
                continue
            problems.append(f'unknown name: {nm}')
    return problems


def check(text, brief, used_tags=(), recent=()):
    """-> (ok, problems, sim)."""
    problems = []
    n = len(words(text)); ss = sentences(text)
    if n < MIN_WORDS: problems.append(f'too short ({n} words)')
    if n > MAX_WORDS: problems.append(f'too long ({n} words)')
    if not 2 <= len(ss) <= 3: problems.append(f'{len(ss)} sentences')
    problems += text_problems(text, brief, names_only=False)
    facts = {f['tag']: f for f in brief.facts}
    used = [facts[t] for t in used_tags if t in facts]
    if not used: problems.append('not specific: no workout fact')
    ok1, why = first_sentence_test(text, brief)
    if not ok1: problems.append('first sentence: ' + why)
    first_two = ' '.join(ss[:2]).lower()
    for s in _told_states(brief):
        if not re.search(TOLD[s], first_two): problems.append(f'personal: {s} not visible in the first two sentences')
    if any(f['topic'] == 'sore' for f in brief.facts) and not re.search(r'\bsore(ness)?\b', first_two): problems.append('soreness not acknowledged up front')
    problems += text_problems(text, brief, names_only=True)
    sim = similarity(text, recent)
    if sim['max_jaccard'] > 0.30: problems.append(f"too similar to a recent message ({sim['max_jaccard']})")
    if sim['sentence_clash']: problems.append('repeats a recent sentence')
    if sim['family_overlap'] >= 2: problems.append(f"reuses {sim['family_overlap']} storytelling devices from a recent message")
    if sim['construction_run']: problems.append(f"third message in a row opening as '{sim['construction']}'")
    return (not problems), problems, sim


def sentence_problems(sentence, idx, shown, brief, used_tags=(), recent=(), evidence=''):
    """Streaming gate: may sentence number `idx` (0-based) be shown after the already-shown sentences `shown`?
    Only hard checks run here (facts, claims, names, numbers, banned / internal / filler / vague language, the first-sentence
    test and 'every State visible by sentence two'). Softer, message-level editorial checks (similarity, constructions,
    length floor) run on the finished message in check(); they are logged but can no longer take back text already shown."""
    problems = text_problems(sentence, brief)
    nm = sorted([x for x in list(getattr(brief, 'names', []) or []) + list(getattr(brief, 'mentionable', []) or []) if x], key=len, reverse=True)
    def _plain(t):
        for x in nm: t = t.replace(x, ' ')
        return t
    ev_nums = set(numbers_in(_plain(evidence or '')))           # exercise names ('Two-Arm', '45°', '5-10 m') are not quantities
    bad_num = sorted({n for n in numbers_in(_plain(sentence)) if n >= 2 and n not in ev_nums})   # 'one' is mostly not a quantity
    if bad_num: problems.append(f'number not in facts: {bad_num}')
    mine = sentence.lower().strip()
    if any(mine == s.lower().strip() for r in (recent or [])[:3] for s in sentences(r or '')): problems.append('repeats a recent sentence')
    facts = {f['tag'] for f in brief.facts}
    if idx == 0:
        if not [t for t in used_tags if t in facts]: problems.append('not specific: no workout fact')
        ok1, why = first_sentence_test(sentence, brief)
        if not ok1: problems.append('first sentence: ' + why)
    if idx == 1:
        first_two = ' '.join(list(shown[:1]) + [sentence]).lower()
        for s in _told_states(brief):
            if not re.search(TOLD[s], first_two): problems.append(f'personal: {s} not visible in the first two sentences')
        if any(f['topic'] == 'sore' for f in brief.facts) and not re.search(r'\bsore(ness)?\b', first_two): problems.append('soreness not acknowledged up front')
    return problems


def over_budget(sentence, shown):
    """True when showing this sentence would break the shape (more than 3 sentences or more than MAX_WORDS words)."""
    return len(shown) >= 3 or len(words(' '.join(list(shown) + [sentence]))) > MAX_WORDS
