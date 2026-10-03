"""Built for Today, coach-voice phrasing (magic-moment pass).

Editorial hierarchy for every message:
  1. Hook   sentence one names something MOOD knows about you TODAY and the change it caused (explicit cause -> effect)
  2. Proof  one or two concrete programming decisions caused by that information
  3. Cue    optional, and only when it is specific to a decision in the message (no motivational filler)

This file only knows how to say single facts: a CAUSE (what you told us), a DECISION clause (what the engine did), the
resolution between two States, and fact-specific cues. The composer decides which facts tell today's story.
Rules for every string: plain words, no programming jargon, no em dashes, never 'easier' / 'reduced' / 'lower'
(except 'lower back'), never a change the fact itself does not carry.
"""
from __future__ import annotations
import re


def _j(xs):
    xs = [x for x in xs if x]
    if not xs: return ''
    return xs[0] if len(xs) == 1 else ', '.join(xs[:-1]) + ' and ' + xs[-1]


def _a(w): return 'an' if (w or '')[:1].lower() in 'aeiou' else 'a'


NUM = {1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten'}


def sore_bits(d):
    pl = d.get('plural'); r = d.get('region', 'that area')
    return dict(region=r, be='are' if pl else 'is', them='them' if pl else 'it', they='they' if pl else 'it', theyre="they're" if pl else "it's")


# ---------------------------------------------------------------- CAUSE: what you told us (always names the State)
STATE_ADJ = {'low_energy': 'low on energy', 'amped': 'amped', 'irritated': 'irritated', 'stressed': 'stressed', 'bored': 'bored'}
CAUSE = {   # independent clause, used as "{cause}, so {decision}." (the State need not be named; it must be unmistakable)
    'low_energy': ["You're low on energy today", "You're running low today", "There's not much in the tank today", "You came in drained"],
    'amped': ["You're amped today", "You've got extra juice today", "You came in fired up", "You've got energy to burn"],
    'irritated': ["You're irritated today", "You came in wound up", "You came in frustrated"],
    'stressed': ["You're stressed today", "You've got a lot on your mind", "Your head's full today"],
    'bored': ["You're bored of the usual", "The usual routine feels stale", "You wanted something different"],
}
BECAUSE = {  # used as "{decision}, because {because}."
    'low_energy': ["you're low on energy", "your energy's low today"],
    'amped': ["you're amped", "you came in with extra energy"],
    'irritated': ["you're irritated", "you came in wound up"],
    'stressed': ["you're stressed", "you've got a lot on your mind"],
    'bored': ["you're bored of the usual", "you wanted something new"],
}
LABEL = {    # used as "{label}: {decision}."
    'low_energy': ["Low tank today", "Running low today"],
    'amped': ["Fired up today", "Plenty of juice today"],
    'irritated': ["Wound up today", "Frustrated today"],
    'stressed': ["Busy head today", "Stressed today"],
    'bored': ["Tired of the usual", "Bored today"],
}


# ---------------------------------------------------------------- DECISION: what the session does (short independent clauses, lowercase)
def do(tag, d):
    n = d.get('name'); names = d.get('names') or []
    nm0 = names[0] if names else n
    s = sore_bits(d)
    def ex(xs): return _j(xs)
    T = {
        # soreness (short clauses: they also sit inside resolution sentences)
        'sore_reroute': ([f"today is {_a(d.get('arch'))} {d.get('arch')} session that leaves {s['them']} alone", f"we built today around {d.get('arch')} so {s['they']} can recover",
                          f"the session moves to {d.get('arch')}, well away from {s['them']}", f"{d.get('arch')} replaces anything that would load {s['them']}"]
                         if (d.get('arch') or 'x')[:1].isupper() else
                         [f"today is {_a(d.get('arch'))} {d.get('arch')} session that leaves {s['them']} alone"]),
        'sore_narrowed': [f"the session keeps the {d.get('kept')} work and leaves the rest alone"],
        'sore_protected': [f"nothing in here loads {s['them']} heavily", f"every movement keeps {s['them']} out of the heavy lifting"],
        'sore_override': [f"we still train {s['them']} like you asked, with friendlier setups"],
        'sore_shift_upper': ["the power work moves to the upper body with no jumping or sprinting"],
        'sore_shift_lower': ["the explosive work stays in the legs and nothing goes overhead"],
        'sore_no_hinge': ["there are no loaded hinges, Olympic lifts or slams today"],
        # effort
        'further_from_failure': (["every working set stops a little further from failure", "every set leaves a couple of good reps in the tank"] if d.get('all') or not names else
                                 [f"{ex(names)} stop{'s' if len(names) == 1 else ''} a little further from failure", f"{ex(names)} leave{'s' if len(names) == 1 else ''} a couple of good reps in the tank"]),
        'moderate_loads': ["the main lifts use moderate weights with a few more reps"],
        'slow_eccentric': [f"{n} gets slow lowering instead of more weight"],
        'top_set': [f"{n} builds to one heavy top set before the back-off sets", f"{n} gets a heavy top set, then back-off sets"],
        'heavier_main': [f"{n} goes heavy for fewer reps" if n else "the main lifts go heavy for fewer reps", "the main lifts get heavier and the reps come down"],
        'closer_to_failure': (["the accessories get pushed a rep closer to failure", "the accessories run a rep closer to failure than usual"] if d.get('acc') else
                              [f"{ex(names)} get{'s' if len(names) == 1 else ''} pushed a rep closer to failure", f"{ex(names)} run{'s' if len(names) == 1 else ''} a rep closer to failure than usual"]),
        'explosive_intent': [f"every rep of {n} moves with full intent", f"{n} is about driving every rep hard"],
        'controlled_tempo': ["every rep moves at a steady, controlled tempo", "the reps stay controlled and rhythmic"],
        'harder_pace': ([f"the main block's effort moves up from {d.get('old')} to {d.get('new')}", f"the main block runs {d.get('new')} instead of {d.get('old')}"] if d.get('old') and d.get('old') != d.get('new') else
                        [f"the main block runs at a {d.get('new') or 'hard'} effort"]),
        'sustainable_pace': ([f"the main block drops from {d.get('old')} to a {d.get('new')} effort you can repeat", f"the main block runs {d.get('new')} instead of {d.get('old')}, a pace you can hold every round"] if d.get('old') and d.get('old') != d.get('new') else
                             [f"the main block sits at a {d.get('new') or 'steady'} effort you can hold every round"]),
        'strength_held_back': ["the strength sets stop well short of failure"],
        'heavier_strength': [f"{n} gets heavier", f"the strength work goes heavier, starting with {n}"],
        'yielded': ["there's no extra load or volume to chase"],
        # selection
        'stable_choices': ["the movements lean stable and supported", "you get stable, supported movements instead of balance-heavy ones"],
        'cheaper_choices': ["a couple of exercises swap for ones that cost less energy"],
        'simple_physical': ["the technical, fiddly movements are swapped for simple, physical ones"],
        'nothing_technical': ["the technical movements come out"],
        'simple_stations': [f"the stations stay simple and stable, like {nm0}" if nm0 else "the stations stay simple and stable"],
        'forceful_stations': [f"the stations are direct and forceful, like {nm0}" if nm0 else "the stations are direct and forceful"],
        'new_machine': [f"you're on the {n} instead of the {d.get('old')}", f"the {n} replaces the {d.get('old')}"],
        'less_impact': ["there's less jumping and landing", "the landings get cut back"],
        'simple_power': ["every movement is simple to coordinate"],
        'demanding_primary': [f"{n} becomes the main movement, a more demanding pick than the default", f"the main movement switches to {n}, a step up in demand from the default"],
        'forceful_athletic': [f"{nm0} comes in as a few hard reps per set so it stays explosive", f"{nm0} is programmed in short, low-rep sets you can hit hard"],
        # volume
        'trimmed_extras': ([f"{d['dropped'][0]} comes out"] if d.get('dropped') else []) + ([f"{_j(d['cut'])} {'each drop' if len(d['cut']) > 1 else 'drops'} a set"] if d.get('cut') else []) or ["some accessory work comes out"],
        'extra_set': [f"{n} gets an extra working set"],
        'trade_volume': ["accessory volume comes out and the main work gets heavier"],
        'one_less': ([f"{d['dropped'][0]} comes out, so there's one less thing to set up"] if d.get('dropped') else []) + ["there's one less exercise to set up"],
        'extra_round': ["you get one more round than usual", "there's an extra round"],
        'fewer_efforts': ["there are fewer explosive sets, each at full intent", "the explosive work drops to fewer sets, all still at full intent"],
        'extra_quality_set': [f"{n} gets an extra set, still low-rep and at full intent"],
        # rest
        'full_rest': ["the heavy sets get full rest"],
        'unhurried_rest': ["you get a little extra rest between sets", "the rest between sets is unhurried"],
        'more_recovery': ([f"you get about {d['after'] - d['before']} more seconds of rest {d.get('what')}", f"rest {d.get('what')} stretches to {d.get('after')} seconds"] if d.get('after') and d.get('before') else []) + ["the rest between efforts gets longer"],
        'less_downtime': ([f"rest {d.get('what')} gets about {d['before'] - d['after']} seconds shorter", f"rest {d.get('what')} tightens to {d.get('after')} seconds"] if d.get('after') and d.get('before') else []) + ["the rest between efforts gets shorter"],
        'full_recovery': ["you get longer recovery between the big efforts"],
        # structure / novelty
        'straight_sets': ["it's straight sets, one exercise at a time", "there's no pairing or circuit to manage"],
        'finisher': [f"{_a(n)} {n} finisher closes it out"],
        'shape_change': [f"it's {d.get('shape')} instead of {d.get('old')}"] if d.get('old') else [f"the session runs as {d.get('shape')}"],
        'contrast': [f"every heavy set of {d.get('heavy')} goes straight into {n}", f"{d.get('heavy')} is paired with {n} so the heavy set primes the explosive one"],
        'no_chaos': ["there are no reactive or complicated drills", "the order is simple and nothing asks you to react on the fly"],
        'intensifier': _intensifier(n, d.get('method')),
        'fresh_movements': ([f"{ex(names[:2])} {'come' if len(names) > 1 else 'comes'} in for your usual picks", f"{names[0]} replaces a usual pick"] if names else
                            [f"{'a couple of' if (d.get('n') or 0) >= 2 else 'one'} less-familiar movement{'s' if (d.get('n') or 0) >= 2 else ''} {'come' if (d.get('n') or 0) >= 2 else 'comes'} in"]),
        'fresh_athletic': ([f"{names[0]} brings something you haven't done lately"] if names else []) + ([f"there's {d['plane'].replace('/', ' and ')} work you don't usually see"] if d.get('plane') else []) + (["the movement mix is different from your usual session"] if not names and not d.get('plane') else []),
        # target
        'target_focus': [f"every movement trains your {d.get('prose') or d.get('label')}"],
        'target_split': [f"your {_j([x.lower() for x in d.get('order') or []])} each get direct work, in that order"],
        'target_lean': ([f"the stations lean toward your {d.get('prose') or d.get('label')}"] if d.get('engine') else [f"your {d.get('prose') or d.get('label')} shape the support work"]),
        'core_long': ["the core work becomes a full strength session: loaded bracing, carries and stability"],
    }
    return [x for x in T.get(tag, []) if x and 'None' not in x]


METHOD_WORDS = {'1.5 reps': 'one-and-a-half reps', 'eccentrics': 'slow lowering'}


def _intensifier(n, method):
    m = METHOD_WORDS.get((method or '').strip(), (method or '').strip())
    if not m or not n: return []
    if m.endswith('s'): return [f"{n} switches to {m} on the last set"]
    return [f"the last set of {n} turns into {_a(m)} {m}", f"{n} finishes with {_a(m)} {m}"]


# ---------------------------------------------------------------- RESOLUTION: two States judged as one decision
# Each template names both States, says how the tension was resolved, then shows the proof. {a} = first State's decision,
# {b} = second State's decision. Order in the key matters (it is the order the sentence names them in).
PAIRS = {
    ('amped', 'low_energy'): ["You're amped but low on energy, so energy sets the budget and the drive goes into one place: {a}.",
                              "Plenty of drive, not much fuel: the tank sets the budget and the drive goes into one place. {A}.",
                              "You're amped but low on energy, so energy sets the budget and the drive goes into one place: {a}, while {b}."],
    ('amped', 'stressed'): ["You're amped but stressed, so {a}, while {b}.", "You're fired up but your head's busy, so {a}, and {b}."],
    ('irritated', 'stressed'): ["You're irritated and stressed, so {a}, and {b}.", "Wound up and stretched thin: {a}, and {b}."],
    ('irritated', 'low_energy'): ["You're irritated but low on energy, so {a}, while {b}.", "Frustrated but running low: {a}, while {b}."],
    ('bored', 'stressed'): ["You're bored but stressed, so {a}, while {b}.", "You wanted something different without anything complicated, so {a}, while {b}."],
    ('bored', 'low_energy'): ["You're bored but low on energy, so {a}, and {b}.", "Tired of the usual but running low: {a}, and {b}."],
    ('amped', 'bored'): ["You're amped and bored of the usual, so {a}, and {b}.", "Energy to burn and tired of the usual: {a}, and {b}."],
    ('amped', 'irritated'): ["You're fired up and wound up, so {a}, and {b}."],
    ('bored', 'irritated'): ["You're bored and irritated, so {a}, and {b}."],
    ('low_energy', 'stressed'): ["You're low on energy and stressed, so {a}, and {b}.", "Running low with a busy head: {a}, and {b}."],
}
PAIR_ORDER = {frozenset(k): k for k in PAIRS}
YIELD = ["You're amped but low on energy, and the tank wins today: {a}, with no extra load to chase.",
         "Amped but low on energy: energy wins today, so {a} and there's no extra load to chase."]
# a State next to soreness: the sore area is protected and the State's change goes into the rest of the session
SORE_STATE = {
    'amped': ["You're amped but your {region} {be} sore, so {s}, and {a}.",
              "Your {region} {be} sore but you've got energy to burn, so {s}, and {a}."],
    '*': ["Your {region} {be} sore and you're {adj}, so {s}, and {a}.",
          "You're {adj} and your {region} {be} sore, so {s}, while {a}."],
}


# ---------------------------------------------------------------- inputs beyond States (the hook on a no-State day)
def input_sentence(tag, d, direction):
    n = d.get('name')
    if tag == 'target_split':
        o = [x.lower() for x in d.get('order') or []]
        return [f"You asked for {_j(o)}, so each gets direct work, {o[0]} first.", f"You wanted {_j(o)}, so {'both get' if len(o) == 2 else 'each gets'} direct work, {o[0]} first."]
    if tag == 'target_focus':
        p = d.get('prose') or d.get('label')
        return [f"You asked for {p}, so every movement today trains it." if not p.endswith('s') and ' and ' not in p else f"You asked for {p}, so every movement today trains them."]
    if tag == 'target_lean':
        p = d.get('prose') or d.get('label')
        if direction == 'sweat':
            return [f"You asked for {p}, so the stations lean that way" + (f" while the {d['engine']} keeps it a conditioning session." if d.get('engine') else ", and it's still a conditioning session.")]
        return [f"You asked for {p}, so it shapes the support work while the session stays athletic."]
    if tag == 'core_long':
        return ["You asked for an hour of core, so it becomes a core strength session: loaded bracing, carries and stability work."]
    if tag == 'rotation':
        return [f"You trained {d['prev']} last time, so today rotates to {d['arch']}.", f"Last session was {d['prev']}, so today moves on to {d['arch']}."]
    if tag == 'progression_target':
        return [f"Your last {n} session sets today's target, so you're building on real numbers.", f"Today's {n} target comes straight from what you logged last time."]
    if tag == 'progression_kept':
        return [f"{n} stays in from last time so your progress carries over."]
    if tag == 'goal_strength':
        if direction == 'athletic': return ["Strength is your goal, so the strength work in this session goes heavier."]
        if direction == 'sweat': return ["Strength is your goal, so loaded carries and sled work show up inside the conditioning."]
        return [f"Strength is your goal, so {n} gets heavy, low-rep work first and everything else supports it." if n else "Strength is your goal, so the main lift leads and everything else supports it."]
    if tag == 'goal_muscle':
        k = d.get('n')
        return [f"You're training for muscle, so {NUM.get(k, k)} accessory movements carry the volume at moderate reps." if k else "You're training for muscle, so the volume lives in the accessory work.",
                f"For your muscle goal, the volume sits in the accessories, with {n} up front." if n else "For your muscle goal, the volume sits in the accessories."]
    if tag == 'goal_conditioning':
        return ["Your goal is conditioning, so the rests stay short and the session keeps moving."]
    if tag == 'goal_feel':
        return ["You're training to feel better, so the main work stays two reps from failure."] if direction == 'strength' else ["You're training to feel better, so the work stays rhythmic and sustainable."]
    if tag == 'goal_athletic_lift':
        return [f"Athleticism is your goal, so {n} stays heavy and fast with full rest."]
    if tag == 'goal_athletic':
        return ["Athleticism is your goal, so speed and power lead and strength backs them up."] if direction == 'athletic' else ["Athleticism is your goal, so powerful output tools are in the mix."]
    if tag == 'level_beginner':
        if direction == 'strength':
            return [f"You're newer to lifting, so every movement is beginner-friendly and every set keeps {'at least two reps' if d.get('rir2') else 'reps'} in reserve."]
        if direction == 'sweat':
            bits = [('no high-impact work' if d.get('no_impact') else ''), ('a structure you can follow without a clock' if d.get('predictable') else '')]
            return [f"You're newer to conditioning, so there's {_j([b for b in bits if b]) or 'a simple, predictable structure'}."]
        return ["You're newer to this, so there are no Olympic lifts or high-impact jumps today."]
    if tag == 'level_advanced':
        if d.get('methods'):   # QA freeze: "paused reps ... stays in" was ungrammatical
            m = re.sub(r'^(drop set|top set|rest-pause)\b', r'a \1', d['methods'][0])
            return [f"You're advanced, so you get {m}."]
        if n: return [f"You're advanced, so {n} runs to a rep from failure."]
        return ["You're advanced, so the more demanding movements stay in."]
    if tag == 'short_window':
        if (d.get('n') or 0) < 3: return [f"You've got 30 minutes, so it's one focused block on the {n}."]
        k = NUM.get(d.get('n'), d.get('n'))
        return [f"You've got 30 minutes, so it's a tight {k}-exercise session with {n} up first.", f"With 30 minutes, the session trims to {k} exercises and {n} still leads."]
    if tag == 'equipment':
        return [f"You're working with {d.get('label')}, so every exercise here fits that setup."]
    return []


# ---------------------------------------------------------------- structure (only when no real input applies)
def intent(tag, d, direction):
    n = d.get('name')
    if tag == 'lead_lift':
        arch = d.get('arch'); day = f"It's {_a(arch)} {arch} day" if arch and ':' not in arch else None
        if d.get('heavy'): return [f"Heavy work leads today: {n} first, while you're fresh.", f"{n} anchors today, done heavy and early.",
                                   f"The big lift comes first: {n}, heavy, while you've got the most to give."] + ([f"{day}, and {n} leads it, heavy and early."] if day else [])
        return [f"{n} sets the tone today, and the rest of the session builds around it.", f"Today opens with {n} while you're fresh."] + ([f"{day}, starting with {n} while you're fresh."] if day else [])
    if tag == 'accessory_build':
        return ([f"After that, {NUM.get(d.get('n'), d.get('n'))} accessory movements add volume{', paired to keep things moving' if d.get('paired') else ''}."] +
                (["The accessories come in pairs, so the session keeps moving once the heavy work is done."] if d.get('paired') else []))
    if tag == 'sweat_shape':
        r = d.get('rhythm'); e = d.get('engine'); st = d.get('stations') or []
        if r == 'rounds': return [f"Today is built on repeatable rounds{(' of ' + _j(st)) if st else ''}, not one huge redline effort.",
                                  f"{_j(st[:3]) or 'The stations'} come around every round, so the goal is output you can repeat.",
                                  f"Same stations, every round{(': ' + _j(st[:3])) if st else ''}, so you can settle in and hold your pace."]
        if r == 'waves': return [f"The work comes in waves{(' on the ' + e) if e else ''} so you can keep producing without fading halfway through.",
                                 f"Hard efforts and short breaks{(' on the ' + e) if e else ''}, repeated until the block is done."]
        if r == 'steady': return [f"One steady, continuous effort{(' on the ' + e) if e else ''} today."]
        if r == 'pyramid': return [f"A pyramid{(' on the ' + e) if e else ''}: the efforts build, peak and come back down.", f"The efforts{(' on the ' + e) if e else ''} get longer, then shorter, so the hardest part sits in the middle."]
        if r == 'clock': return ["The clock runs this one: a new station every minute.", "Every minute on the minute, so the clock sets the pace."]
        if r == 'ladder': return ["A ladder today, so the reps climb as you go.", "The reps climb each round, so the session builds on itself."]
        if r == 'anchor': return [f"Every round starts on the {e or 'machine'}, then hands off to {_j(st[:2]) or 'the stations'}.", f"The {e or 'machine'} anchors every round, with {_j(st[:2]) or 'stations'} in between.",
                                  f"{_j(st[:2]) or 'The stations'} sit between trips to the {e or 'machine'}, so the engine work never stops for long."]
        return []
    if tag == 'quality_first':
        q = d.get('quality')
        return [f"Speed comes first while you're fresh: {n} sets up today's {q} work.", f"Today is built around {q}, starting with {n} before any fatigue sets in."]
    if tag == 'then_more':
        return [f"Then {_j(d.get('names') or [])} keep{'s' if len(d.get('names') or []) == 1 else ''} the explosive theme going."]
    if tag == 'strength_for_speed':
        return [f"The strength work ({_j((d.get('names') or [])[:2])}) comes last and is done for speed, not grinding."]
    if tag == 'second_piece':
        e = d.get('engine')
        return [f"A shorter second piece{(' on the ' + e) if e else ''} follows the main block.", f"Then a short{(' ' + e) if e else ''} block finishes the session.",
                f"After the main block, a quick{(' ' + e) if e else ''} piece tops off the conditioning."]
    if tag == 'effort_band':
        if d.get('hard'): return ["It's meant to feel hard, so pace the early rounds."]
        if d.get('easy'): return ["The effort is controlled, something you can hold the whole way."]
        return ["It should feel solidly hard, never frantic.", "Hard enough to count, controlled enough to repeat."]
    if tag == 'finisher':
        return [f"{_a(n).capitalize()} {n} finisher closes it out."]
    return []


# ---------------------------------------------------------------- cues: only ones tied to a decision in the message
CUE = {
    'further_from_failure': ["Stop each set with two good reps left.", "If a rep starts to grind, that set is done."],
    'top_set': ["Build to the top set, then keep the back-off sets crisp."],
    'heavier_main': ["Take your full rest between the heavy sets."],
    'explosive_intent': ["Move the weight as fast as you can on every rep."],
    'contrast': ["Rest fully after each pair so the explosive reps stay fast.", "Treat each pair as one effort, then rest until you feel fresh."],
    'fewer_efforts': ["If a rep slows down, the set is done."],
    'extra_quality_set': ["If a rep slows down, the set is done."],
    'sustainable_pace': ["Breathe through the transitions and keep the same pace all session."],
    'harder_pace': ["Expect the later rounds to bite."],
    'extra_round': ["Pace the first round so the last one still looks good."],
    'less_downtime': ["Pace the first round so the last one still looks good."],
    'unhurried_rest': ["Use the full rest between sets."],
    'fresh_movements': ["Go a little lighter on the new movements until they click."],
    'lead_lift': ["Take your full rest between the heavy sets."],
    'quality_first': ["If a rep slows down, the set is done."],
    'level_beginner': ["Focus on clean reps before adding weight."],
    'trimmed_extras': ["Put what you have into the main lifts."],
    'controlled_tempo': ["Keep every rep smooth; there's no clock on this one."],
    'stable_choices': ["Let the bench and machines do the balancing."],
    'closer_to_failure': ["Stop those sets with about one good rep left.", "Those sets should end with one clean rep still in you."],
    'intensifier': ["Keep that last set clean all the way through."],
    'new_machine': ["Give the new machine a round to settle in before you push."],
    'fresh_athletic': ["Give the new movements one crisp set before going full speed."],
    'demanding_primary': ["If a rep slows down, the set is done.", "Own the first rep of every set; speed beats load."],
    'heavier_strength': ["Take full rest so the heavy sets stay fast."],
    'forceful_athletic': ["Hit each rep hard, then reset fully."],
    'forceful_stations': ["Go hard on the stations and breathe on the transitions."],
    'simple_stations': ["Settle into a rhythm on the stations."],
    'no_chaos': ["Just follow the order; nothing needs a decision."],
    'straight_sets': ["Finish all your sets, then move on."],
    'more_recovery': ["Use the longer breaks fully."],
    'sore_shift_upper': ["Keep your legs quiet and let the upper body do the work."],
    'sore_shift_lower': ["Keep the shoulders quiet and let the legs drive."],
    'shape_change': ["Settle into the new format on the first round."],
}
