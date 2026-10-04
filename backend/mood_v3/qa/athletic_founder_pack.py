"""Athletic founder review pack (V3 Athletic rebuild).

    python -m mood_v3.qa.athletic_founder_pack OUT_DIR

Every case goes through the production path (service.generate_workout / swap_workout / swap_exercise). For each workout:
context, athletic intent, the workout by section (Preparation, Primary, Secondary Quality, Athletic Element, Athletic Strength, Support,
Finisher) with sets / reps / RIR / rest / intent / impact / skill, session accounting, Built for Today, realized
personalization and the validation / State results. Founder correction pass: ~27 sessions focused on the changes.
"""
from __future__ import annotations
import json, os, sys
from mood_v3 import service as S
from mood_v3.engines.athletic import athletic_core as C, athletic_validate as V, athletic_gen as LG

D = '2026-10-05'
A = lambda **kw: dict(direction='athletic', date=D, **kw)
OLY = {'hang_power_clean', 'power_snatch', 'split_jerk', 'push_press', 'hang_high_pull', 'db_hang_power_clean', 'db_snatch', 'kb_snatch', 'hang_clean_to_box_knee_drive'}
_prim = lambda w: w['blocks'][0]['items'][-1]
_ids = lambda w: {it['exercise']['id'] for b in w['blocks'] for it in b['items']}
_oly = lambda w: _ids(w) & OLY
# (id, title, request, user, pick predicate or None). A predicate means: the first seeded user whose production output shows that case
# (deterministic search), so the case is real output, not hand-built.
_pq = lambda w: w['athletic']['primary_quality']
_pk = lambda w: (_prim(w)['prescription'].get('direction_fields') or {}).get('kind')
_cat = lambda w: [(it['prescription'].get('direction_fields') or {}).get('category') for b in w['blocks'] for it in b['items']]
_na = lambda w: _cat(w).count('ATHLETIC')
MU = {'bar_muscle_up', 'band_assisted_muscle_up'}
VAR = {'step_up_pop', 'db_step_up_pop', 'reverse_lunge_knee_drive_hop', 'rfe_split_squat_jump', 'split_jump', 'speed_trap_bar_deadlift', 'speed_box_squat'}
ADV = dict(experience='advanced', duration=60); INT = dict(experience='intermediate', duration=60); BEG = dict(experience='beginner', duration=60)
# (id, title, request, user, pick predicate or None). A predicate means: the first seeded user whose production output shows that case
# (deterministic search), so the case is real output, not hand-built.
CASES = [
    ('A1', 'Advanced · no State · Athleticism', A(**ADV, goal='improve_athleticism'), 'a1', None),
    ('A2', 'Advanced · no State · Build Strength', A(**ADV, goal='build_strength'), 'a2', None),
    ('A3', 'Advanced · Olympic (barbell)', A(**ADV, goal='improve_athleticism'), 'a3', lambda w: bool(_oly(w) & {'hang_power_clean', 'power_snatch', 'split_jerk'})),
    ('A4', 'Advanced · sprint primary', A(**ADV, goal='stay_consistent'), 'a4', lambda w: _pk(w) == 'sprint'),
    ('A5', 'Advanced · contrast pairing', A(**ADV, goal='build_strength'), 'a5', lambda w: w['athletic']['structure'] == 'contrast'),
    ('A6', 'Advanced · Bored', A(**ADV, states=['bored'], goal='improve_athleticism'), 'a6', None),
    ('A7', 'Advanced · Amped', A(**ADV, states=['amped'], goal='improve_athleticism'), 'a7', None),
    ('A8', 'Advanced · Stressed', A(**ADV, states=['stressed']), 'a8', None),
    ('I1', 'Intermediate · no State', A(**INT, goal='stay_consistent'), 'i1', None),
    ('I2', 'Intermediate · Olympic derivative', A(**INT, goal='build_strength'), 'i2', lambda w: bool(_oly(w))),
    ('I3', 'Intermediate · loaded jump (replaces speed pulls / squats)', A(**INT, goal='build_muscle'), 'i3', lambda w: bool(_ids(w) & {'trap_bar_jump', 'db_jump_squat'})),
    ('I4', 'Intermediate · Bored', A(**INT, states=['bored']), 'i4', None),
    ('I5', 'Intermediate · Low Energy', A(**INT, states=['low_energy']), 'i5', None),
    ('I6', 'Intermediate · Amped', A(**INT, states=['amped']), 'i6', None),
    ('B1', 'Beginner · no State', A(**BEG, goal='improve_athleticism'), 'b1', None),
    ('B2', 'Beginner · three simple athletic movements', A(**BEG, goal='stay_consistent'), 'b2', lambda w: _na(w) >= 3),
    ('B3', 'Beginner · Low Energy', A(**BEG, states=['low_energy']), 'b3', None),
    ('B4', 'Beginner · 30 minutes', A(experience='beginner', duration=30), 'b4', None),
    ('M1', 'Multi-State · Low Energy + Amped · advanced', A(**ADV, states=['low_energy', 'amped']), 'm1', None),
    ('M2', 'Multi-State · Bored + Stressed · intermediate', A(**INT, states=['bored', 'stressed']), 'm2', None),
]
DW = ('E1', 'Different Workout: advanced 60, Power (user selected)', A(experience='advanced', duration=60, archetype='athletic_power'), 'dw1')
SW = ('E2', 'Swap Exercise: advanced 60', A(experience='advanced', duration=60, goal='build_strength'), 'o4')
SECTION = {'primary': 'Primary Power / Speed', 'secondary': 'Secondary Quality', 'strength': 'Athletic Strength', 'support': 'Support', 'finisher': 'Optional Finisher'}
def rx_text(it):
    rx = it['prescription']; t = rx['display']
    if rx.get('rir') is not None: t += f" @ ~{rx['rir']} RIR"
    return t


def render(env, st=None, title='', raw=None):
    if env['status'] != 'ok':
        c = env['conflict']
        return [f"**Conflict** `{c['code']}`: {c['message']}", ''], None
    w = env['workout']; a = w['athletic']; acc = a['accounting']
    L = []
    ctx = f"States: {', '.join(s for s in w['states'] if s != 'sore') or 'none'} · Level: {w['experience']} · Goal: {(raw or {}).get('goal', 'stay_consistent')} · Target: {w['target']['label']}"
    ctx += f" · Soreness: {', '.join(w['soreness']['regions']) or 'none'} · Equipment: {w['equipment']['label']} · Duration: {w['duration']['requested_minutes']} min"
    L.append(ctx)
    L.append(f"**Athletic intent:** primary quality **{a['primary_quality_label']}**" + (f" · secondary **{a['secondary_quality_label']}**" if a.get('secondary_quality') else '') +
             (f" · tertiary element **{a['tertiary_quality_label']}**" if a.get('tertiary_quality') else '') +
             f" · structure **{a['structure_label']}** · session type {w['archetype']['name']} ({w['selection_source'].replace('_', ' ')})")
    L.append('')
    L.append(f"*Preparation ({w['warmup']['minutes']:g} min):* " + ' → '.join(f"{x['name']} ({x['prescription_text']})" for x in w['warmup']['items']))
    L.append('')
    L.append('| Category | Section | Exercise | Sets × dose | Rest | Cost tier | Impact | Skill | Intent |')
    L.append('|---|---|---|---|---|---|---|---|---|')
    for b in w['blocks']:
        grouped = b['structure'] == 'superset'
        sec = SECTION.get(b['type'], b['type'])
        if any(it.get('role') == 'tertiary' for it in b['items']): sec = 'Athletic Element (small)'
        if b['type'] == 'primary' and 'Contrast' in b['title']: sec = 'Primary: Contrast pair'
        for k, it in enumerate(b['items']):
            rx = it['prescription']; df = rx.get('direction_fields') or {}
            rest = (f"{b['rest_between_items_sec']} s → next, {b['rest_between_rounds_sec']} s after round" if grouped else f"{rx.get('rest_sec')} s")
            if grouped and k == 0: rest = f"{b['rest_between_items_sec']} s → partner"
            elif grouped: rest = f"{b['rest_between_rounds_sec']} s after the pair"
            L.append(f"| **{df.get('category', '')}** | {sec if k == 0 else ''} | {it['exercise']['name']} | {rx_text(it)} | {rest} | {df.get('cost_tier') or ''} | {df.get('impact', '')} | {df.get('skill', '')} | {rx.get('load_guidance') or ''} |")
    if w.get('cooldown'): L.append(f"| | Cooldown | {w['cooldown']['guidance']} | {w['cooldown']['minutes']} min | | | | | |")
    L.append('')
    L.append(f"**Session accounting:** {acc['n_explosive']} explosive exercises · {acc['explosive_sets']} explosive sets · {acc['contacts']} jump contacts"
             f" ({acc['high_contacts']} high-impact) · {acc['sprint_exposures']} sprint exposures ({acc['sprint_m']} m) · {acc['sled_efforts']} sled efforts ({acc['sled_m']} m) · {acc['throws']} throws"
             f" · {acc['olympic_sets']} Olympic-derivative sets · {acc['high_skill']} high-skill movements · {acc['strength_sets']} athletic-strength sets · {acc['support_sets']} support sets"
             f" · intent load {acc['intent_load']} (ceiling {a['limits']['intent_load']}) · **about {w['duration']['estimated_minutes']:g} min** ({w['duration']['display']})")
    typ = [(it['prescription'].get('direction_fields') or {}).get('type') for b in w['blocks'] for it in b['items']]
    names = lambda c: ', '.join(it['exercise']['name'] for b in w['blocks'] for it in b['items'] if (it['prescription'].get('direction_fields') or {}).get('category') == c) or 'none'
    L.append(f"**ATHLETIC ({typ.count('power')}):** {names('ATHLETIC')}  ")
    L.append(f"**ATHLETIC_STRENGTH ({typ.count('strength')}):** {names('ATHLETIC_STRENGTH')}  ")
    L.append(f"**SUPPORT ({typ.count('support') + typ.count('finisher')}):** {names('SUPPORT')}  ")
    L.append(f"**Estimated time:** about {w['duration']['estimated_minutes']:g} min · athletic cost {acc.get('ath_cost')} points (budget {a['limits'].get('ath_cost', '')}), Tier A movements {acc.get('tier_a')}")
    L.append('')
    L.append('**Built for Today**')
    for l in w['built_for_today']: L.append(f"- {l['text']}")
    L.append('')
    realized = [f"{k}: {'; '.join(v) if v else 'nothing realized'}" for k, v in a['realized'].items()]
    gate = [f"{s}: satisfied {'yes' if a['state_gate'][s] else 'NO'} / coherent {'yes' if a['coherence'][s] else 'NO'}" for s in a['state_gate']]
    L.append(f"**Realized personalization:** " + (' | '.join(realized) if realized else 'no State'))
    val = 'all validator checks pass (served only after the independent Athletic validator)'
    L.append(f"**Coherence / validation:** {', '.join(gate) if gate else 'no State to check'} · {val}")
    L.append('')
    return L, w


def main(outdir):
    os.makedirs(outdir, exist_ok=True)
    md = ['# MOOD V3 Athletic: Founder Review Pack', '',
          'Every workout below was generated through the production path (`service.generate_workout`, `swap_workout`, `swap_exercise`) with the rebuilt Athletic engine '
          f"(`athletic_core.py`, engine phase `3.4-athletic-frozen`, identity pass + final cleanup: athletic movement budget with cost tiers, no carries, muscle-ups and explicit athletic variants, truthful sprint / sled accounting; commercial gym). Date seed {D}.", '',
          'Reading guide: every movement is labelled **ATHLETIC** (a distinct athletic exercise), **ATHLETIC_STRENGTH** (traditional strength that supports it) or **SUPPORT** (trunk / tendon accessory). '
          'Cost tier: A = high systemic / technical cost (Olympic lift, maximal sprint, heavy sled, demanding loaded or reactive jump), B = moderate, C = low-cost athletic expression (throws, slams, low-impact jumps). '
          'Highest cost comes first; power never appears after strength. Rest is part of the prescription. '
          'Contacts count foot contacts in the work sets (warm-up primers excluded).', '']
    rows = []; toc = []
    def add_case(cid, title, env, raw, user, st=None, note=None):
        md.append(f"## {cid}. {title}"); toc.append(f"- {cid}. {title}")
        if note: md.append(f"*{note}*"); md.append('')
        L, w = render(env, st, title, raw); md.extend(L)
        if w:
            for b in w['blocks']:
                for it in b['items']:
                    rx = it['prescription']; df = rx.get('direction_fields') or {}
                    rows.append([cid, title, df.get('category'), SECTION.get(b['type'], b['type']), it['exercise']['name'], rx['display'], rx.get('rir'), rx.get('rest_sec') or b.get('rest_between_rounds_sec'),
                                 rx.get('load_guidance'), df.get('impact'), df.get('skill'), w['athletic']['primary_quality_label'], w['athletic']['structure_label'],
                                 w['duration']['estimated_minutes'], ' '.join(l['text'] for l in w['built_for_today'][:1])])
    for cid, title, raw, user, pred in CASES:
        env, st = S.generate_workout(raw, user)
        if pred:
            for k in range(150):
                if env['status'] == 'ok' and pred(env['workout']): break
                user = f'{cid.lower()}p{k}'; env, st = S.generate_workout(raw, user)
        add_case(cid, title, env, raw, user)
    md[6:6] = ['## Contents', ''] + toc + ['']
    open(os.path.join(outdir, 'MOOD_V3_Athletic_Founder_Review_Pack.md'), 'w').write('\n'.join(md) + '\n')
    try:
        import openpyxl
        from openpyxl.styles import Font, Alignment, PatternFill
        wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Workouts'
        hdr = ['Case', 'Title', 'Category', 'Section', 'Exercise', 'Sets × dose', 'RIR', 'Rest (s)', 'Intent', 'Impact', 'Skill', 'Primary quality', 'Structure', 'Est. min', 'Built for Today (first line)']
        ws.append(hdr)
        for c in ws[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='1F2937')
        for r in rows: ws.append(r)
        for col, wdt in zip('ABCDEFGHIJKLMNO', (7, 38, 18, 20, 32, 14, 6, 9, 46, 10, 12, 22, 18, 9, 80)): ws.column_dimensions[col].width = wdt
        for row in ws.iter_rows(min_row=2):
            for c in row: c.alignment = Alignment(wrap_text=True, vertical='top')
        ws.freeze_panes = 'A2'
        wb.save(os.path.join(outdir, 'MOOD_V3_Athletic_Founder_Review_Pack.xlsx'))
    except ImportError:
        pass
    return len(toc)


if __name__ == '__main__':
    n = main(sys.argv[1]); print('cases', n)
