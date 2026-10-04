# Onboarding web harness (QA only, never shipped)

Renders the REAL V3 onboarding screens (app/onboarding-funnel/*, components/onboarding/*) with react-native-web,
stubbing only auth / funnel storage / analytics / native modules (stubs/ here + ../../v3/web/stubs).

    NODE_PATH_TOOLS=/path/with/node_modules node build.mjs   # needs esbuild, react, react-dom, react-native-web
    open dist/index.html#intro   (routes: intro, preference, goal, experience, frequency, barrier, proof, build, reveal)
    add &sel=1 to pre-select an answer, e.g. #barrier&sel=1

Answers come from the `answers` preset in main.tsx (a Strength / build-strength / "I train seriously" / 3-4x / bored athlete).
