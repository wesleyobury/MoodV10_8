// Web harness for the V3 screens: bundles the REAL app/v3 + components/v3 + utils/v3* sources with react-native-web,
// replacing only platform / auth / network edges with stubs (see README). Output: dist/bundle.js + dist/index.html.
import * as esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
const here = path.dirname(new URL(import.meta.url).pathname);
const nm = (p) => path.join(here, 'node_modules', p);
const stub = (f) => path.join(here, 'stubs', f);
const EDGE = [
  [/(^|\/)contexts\/AuthContext$/, 'AuthContext.tsx'], [/(^|\/)utils\/analytics$|^\.\.\/analytics$/, 'analytics.ts'], [/(^|\/)utils\/devFlags$/, 'devFlags.ts'],
  [/^\.\/api$|(^|\/)utils\/api$/, 'api.ts'], [/SafeLinearGradient$/, 'SafeLinearGradient.tsx'], [/(^|\/)constants\/brand$/, 'brand.ts'],
];
const PKG = { 'react-native': nm('react-native-web'), react: nm('react'), 'react-dom': nm('react-dom'), '@expo/vector-icons': stub('icons.tsx'),
  'react-native-safe-area-context': stub('safearea.tsx'), 'expo-router': stub('router.tsx'), '@react-navigation/native': stub('nav.ts'),
  '@react-native-async-storage/async-storage': stub('storage.ts'),
  // Guided Session QA: native-only modules recorded on window.__native (stubs/native.tsx), SVG as DOM SVG
  'expo-haptics': stub('native.tsx'), 'expo-keep-awake': stub('native.tsx'), 'expo-notifications': stub('native.tsx'), 'expo-constants': stub('native.tsx'),
  'expo-localization': stub('native.tsx'), 'expo-image': stub('native.tsx'), 'expo-av': stub('native.tsx'), 'react-native-svg': stub('svg.tsx'),
  'expo-modules-core': stub('native.tsx'), '@react-native-masked-view/masked-view': stub('masked.tsx'), 'react-native-view-shot': stub('native.tsx'), 'expo-media-library': stub('native.tsx'), 'expo-sharing': stub('native.tsx') };
const edges = { name: 'edges', setup(b) {
  b.onResolve({ filter: /.*/ }, (a) => {
    for (const [re, f] of EDGE) if (re.test(a.path)) return { path: stub(f) };
    const top = a.path.startsWith('@') ? a.path.split('/').slice(0, 2).join('/') : a.path.split('/')[0];
    if (PKG[top] && !a.path.startsWith('.')) {
      const rest = a.path.slice(top.length);
      if (!rest) return { path: PKG[top].endsWith('x') || PKG[top].endsWith('.ts') ? PKG[top] : require_resolve(PKG[top]) };
      return { path: require_resolve(PKG[top] + rest) };
    }
    return undefined;
  });
} };
function require_resolve(p) {
  for (const c of [p, p + '.js', p + '/index.js', path.join(p, JSON.parse(fs.existsSync(path.join(p, 'package.json')) ? fs.readFileSync(path.join(p, 'package.json')) : '{}').main || 'index.js')]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return p;
}
fs.mkdirSync(path.join(here, 'dist'), { recursive: true });
fs.writeFileSync(path.join(here, 'dist/index.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0;background:#0A0A0A;font-family:-apple-system,"SF Pro Text","Helvetica Neue",Arial,sans-serif}#root{display:flex}</style></head><body><div id="root"></div><script src="bundle.js"></script></body></html>');
await esbuild.build({ entryPoints: [path.join(here, 'main.tsx')], bundle: true, outfile: path.join(here, 'dist/bundle.js'), loader: { '.json': 'json', '.png': 'file', '.jpg': 'file' }, jsx: 'automatic', banner: { js: 'window.process = window.process || { env: { NODE_ENV: "development" } };' },
  define: { 'process.env.NODE_ENV': '"development"', __DEV__: 'true', global: 'window' }, plugins: [edges],
  resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'], logLevel: 'error' });
console.log('built', path.join(here, 'dist'));
