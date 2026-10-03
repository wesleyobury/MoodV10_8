// Onboarding web harness: bundles the REAL onboarding screens with react-native-web (QA only). See README.
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const here = path.dirname(new URL(import.meta.url).pathname);
const NM = process.env.NODE_PATH_TOOLS || path.join(here, 'node_modules');
const nm = (p) => path.join(NM, p);
const esbuild = createRequire(path.join(NM, 'x.js'))('esbuild');
const own = (f) => path.join(here, 'stubs', f);
const v3 = (f) => path.join(here, '../../v3/web/stubs', f);
const EDGE = [
  [/(^|\/)contexts\/AuthContext$/, own('AuthContext.tsx')], [/(^|\/)contexts\/OnboardingFunnelContext$/, own('OnboardingFunnelContext.tsx')],
  [/(^|\/)utils\/analytics$/, own('analytics.ts')], [/^\.\/api$|(^|\/)utils\/api$/, v3('api.ts')], [/SafeLinearGradient$/, v3('SafeLinearGradient.tsx')],
];
const PKG = { 'react-native': nm('react-native-web'), react: nm('react'), 'react-dom': nm('react-dom'), '@expo/vector-icons': v3('icons.tsx'),
  'react-native-safe-area-context': own('safearea.tsx'), 'expo-router': v3('router.tsx'), '@react-navigation/native': v3('nav.ts'),
  '@react-native-async-storage/async-storage': v3('storage.ts'), 'expo-haptics': v3('native.tsx'), 'expo-av': v3('native.tsx'),
  'expo-image': v3('native.tsx'), 'react-native-svg': v3('svg.tsx'), 'expo-constants': v3('native.tsx') };
function rr(p) {
  for (const c of [p, p + '.js', p + '/index.js', path.join(p, JSON.parse(fs.existsSync(path.join(p, 'package.json')) ? fs.readFileSync(path.join(p, 'package.json')) : '{}').main || 'index.js')]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return p;
}
const edges = { name: 'edges', setup(b) {
  b.onResolve({ filter: /.*/ }, (a) => {
    for (const [re, f] of EDGE) if (re.test(a.path)) return { path: f };
    const top = a.path.startsWith('@') ? a.path.split('/').slice(0, 2).join('/') : a.path.split('/')[0];
    if (PKG[top] && !a.path.startsWith('.')) {
      const rest = a.path.slice(top.length);
      if (!rest) return { path: /\.(tsx?|js)$/.test(PKG[top]) ? PKG[top] : rr(PKG[top]) };
      return { path: rr(PKG[top] + rest) };
    }
    return undefined;
  });
} };
fs.mkdirSync(path.join(here, 'dist'), { recursive: true });
fs.writeFileSync(path.join(here, 'dist/index.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0;background:#0A0A0A;font-family:-apple-system,"SF Pro Display","Helvetica Neue",Inter,Arial,sans-serif}#root{display:flex}</style></head><body><div id="root"></div><script src="bundle.js"></script></body></html>');
await esbuild.build({ entryPoints: [path.join(here, 'main.tsx')], bundle: true, outfile: path.join(here, 'dist/bundle.js'), loader: { '.json': 'json', '.png': 'file', '.jpg': 'file', '.mp4': 'file' }, jsx: 'automatic',
  banner: { js: 'window.process = window.process || { env: { NODE_ENV: "development" } };' }, nodePaths: [NM],
  define: { 'process.env.NODE_ENV': '"development"', __DEV__: 'true', global: 'window' }, plugins: [edges],
  resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'], logLevel: 'error' });
console.log('built', path.join(here, 'dist'));
