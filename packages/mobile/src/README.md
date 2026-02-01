Critical Patch: React Native Reanimated v4 & Bottom Sheet
Context: React Native 0.72+ triggers a crash when using react-native-reanimated v4 alongside @gorhom/bottom-sheet due to a removed API (unstable_getBoundingClientRect).

The Fix
You must apply this patch to node_modules/@gorhom/bottom-sheet to prevent the app from crashing on mount.

1. Manual Patch
   Edit node_modules/@gorhom/bottom-sheet/src/hooks/useBoundingClientRect.ts.

Find the useLayoutEffect hook (approx line 53) and replace the unsafe code:

Change (Unsafe):

if (ref.current.unstable_getBoundingClientRect !== null) { ... }
To (Safe):

// Check if it is a function before calling it
if (typeof ref.current.unstable_getBoundingClientRect === 'function') {
const layout = ref.current.unstable_getBoundingClientRect();
handler(layout);
return;
}
if (typeof ref.current.getBoundingClientRect === 'function') {
const layout = ref.current.getBoundingClientRect();
handler(layout);
}

Persist with patch-package
To ensure this fix survives yarn install, run:

npx patch-package @gorhom/bottom-sheet
This will create a file in patches/. Ensure "postinstall": "patch-package" is in your package.json scripts.
