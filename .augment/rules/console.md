---
type: "manual"
---

warnOnce @ deprecations.ts:9
logDeprecation @ deprecations.ts:13
logV6DeprecationWarnings @ deprecations.ts:26
(anonymous) @ index.tsx:816
react-stack-bottom-frame @ react-dom-client.development.js:23949
runWithFiberInDEV @ react-dom-client.development.js:1518
commitHookEffectListMount @ react-dom-client.development.js:11886
commitHookPassiveMountEffects @ react-dom-client.development.js:12024
commitPassiveMountOnFiber @ react-dom-client.development.js:13840
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13813
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
commitPassiveMountOnFiber @ react-dom-client.development.js:13853
flushPassiveEffects @ react-dom-client.development.js:15737
(anonymous) @ react-dom-client.development.js:15379
performWorkUntilDeadline @ scheduler.development.js:45
<BrowserRouter>
(anonymous) @ react-jsx-dev-runtime.development.js:336
./src/index.tsx @ index.tsx:29
(anonymous) @ react refresh:37
__webpack_require__ @ bootstrap:22
(anonymous) @ startup:7
index.tsx:29  ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.
logV6DeprecationWarnings @ deprecations.ts:37
App.tsx:3802 🔍 Master file ID detected in URL: 0d79240e-52c9-4307-8189-06976551a4b7
App.tsx:5058 🔄 Loading for editing: {masterFileId: '0d79240e-52c9-4307-8189-06976551a4b7', isProjectMode: true}
App.tsx:5072 🔄 Project Mode: Attempting to load project state: {projectSlug: '2025-spring-east', layoutId: 'layout_1757774201594'}
App.tsx:3813 🎨 Canvas mode detected - enabling web creation mode
App.tsx:3819 🔍 Canvas-only mode: Master file ID detected for editing: 0d79240e-52c9-4307-8189-06976551a4b7
App.tsx:5087 ⚠️ API not available, trying localStorage fallback
App.tsx:5102 ✅ Loading specific layout from localStorage: {id: 'layout_1757774201594', name: 'Layout 1757774201594 (Updated 2025/9/16 06:56:55)', createdAt: '2025-09-15T22:56:55.738Z', updatedAt: '2025-09-15T22:56:55.738Z', canvasData: {…}, …}
App.tsx:5265 🔄 Loading project state: {id: 'layout_1757774201594', name: 'Layout 1757774201594 (Updated 2025/9/16 06:56:55)', createdAt: '2025-09-15T22:56:55.738Z', updatedAt: '2025-09-15T22:56:55.738Z', canvasData: {…}, …}
App.tsx:5269 🔄 Loading customer information for project state: mfgn93kdoj48yij0o3
customerService.ts:48   GET http://localhost:3001/api/customers/mfgn93kdoj48yij0o3 net::ERR_CONNECTION_REFUSED
getCustomerById @ customerService.ts:48
loadProjectState @ App.tsx:5271
loadMasterFileForEditing @ App.tsx:5103
await in loadMasterFileForEditing
(anonymous) @ App.tsx:3803
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
<App>
CanvasOnly @ CanvasOnly.tsx:55
react-stack-bottom-frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
performUnitOfWork @ react-dom-client.development.js:15130
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14417
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
<CanvasOnly>
./src/index.tsx @ index.tsx:104
customerService.ts:53  Backend not available, using local storage: TypeError: Failed to fetch
    at CustomerService.getCustomerById (customerService.ts:48:1)
    at loadProjectState (App.tsx:5271:1)
    at loadMasterFileForEditing (App.tsx:5103:1)
getCustomerById @ customerService.ts:53
await in getCustomerById
App.tsx:5274 ✅ Customer loaded for project state: east
App.tsx:5295 ✅ Canvas data restored with layout name: {document: 'Project: east01', totalObjects: 3, objects: Array(3), width: 200, height: 150, …}
App.tsx:5305 ✅ Region contents restored: 5 regions with content
App.tsx:5313 ✅ View state restored: {zoom: 0.67578547419053, panX: -74.35234157609176, panY: 40.76123279666295}
App.tsx:5324 ✅ Overflow numbers state restored: false
App.tsx:5329 ✅ Content type names state restored: false
App.tsx:5334 ✅ Sewing lines state restored: true
App.tsx:5344 ✅ Overflow settings restored: 0 content items
App.tsx:5358 ✅ Overflow chains restored: 0 content types
App.tsx:5374 ✅ Expanded mothers restored: (5) [0, 1, 2, 3, 4]
App.tsx:5394 ✅ Project Loaded Successfully! Name: 2025 spring, Saved: undefined
App.tsx:11448 🎨 new-multi-line skipping old word wrapping, will use processed lines from preview
App.tsx:11570 🎯 Canvas: Applying Canvas-First Sync logic-slice to region
App.tsx:1354 🎯 Consistent font scaling: 10px → 10px → 6.7578547419053px (zoom: 0.67578547419053)
App.tsx:154 📐 Text measurement: "MINUS33..." | Canvas: 7.74mm | Wide chars: 1 | Final: 7.94mm
App.tsx:191  ⚠️ Wide characters detected: 1 characters (M) in "MINUS33..."
(anonymous) @ App.tsx:191
wrapTextToLines @ App.tsx:172
processChildRegionTextWrapping @ App.tsx:238
(anonymous) @ App.tsx:11591
(anonymous) @ App.tsx:11368
renderRegionWithChildren @ App.tsx:11832
(anonymous) @ App.tsx:12817
renderObject @ App.tsx:12818
(anonymous) @ App.tsx:13733
App @ App.tsx:13733
renderWithHooks @ react-dom-client.development.js:5529
App.tsx:194 🎯 Boundary check: "MINUS33..." | Text: 7.94mm | Available: 20.13mm | Buffer: 1.5mm | ✅ FITS
App.tsx:154 📐 Text measurement: "Minus33 Merino Wool2..." | Canvas: 63.80mm | Wide chars: 5 | Final: 64.80mm
App.tsx:191  ⚠️ Wide characters detected: 5 characters (M, M, W, M, A) in "Minus33 Merino Wool22 Mill Str..."
App.tsx:194 🎯 Boundary check: "Minus33 Merino Wool22 Mill Str..." | Text: 64.80mm | Available: 20.13mm | Buffer: 1.5mm | ❌ EXCEEDS
App.tsx:154 📐 Text measurement: "Minus33..." | Canvas: 6.75mm | Wide chars: 1 | Final: 6.95mm
App.tsx:154 📐 Text measurement: "Minus33 Merino..." | Canvas: 12.71mm | Wide chars: 2 | Final: 13.11mm
App.tsx:154 📐 Text measurement: "Minus33 Merino Wool2..." | Canvas: 19.22mm | Wide chars: 3 | Final: 19.82mm
App.tsx:154 📐 Text measurement: "Minus33 Merino Wool2..." | Canvas: 22.40mm | Wide chars: 4 | Final: 23.20mm
App.tsx:219 ✅ Line within boundaries: "Minus33 Merino Wool22" | Width: 19.82mm
App.tsx:154 📐 Text measurement: "Mill StreetAshland,..." | Canvas: 14.89mm | Wide chars: 2 | Final: 15.29mm
App.tsx:154 📐 Text measurement: "Mill StreetAshland, ..." | Canvas: 17.96mm | Wide chars: 2 | Final: 18.36mm
App.tsx:154 📐 Text measurement: "Mill StreetAshland, ..." | Canvas: 37.62mm | Wide chars: 2 | Final: 38.02mm
App.tsx:219 ✅ Line within boundaries: "Mill StreetAshland, NH" | Width: 18.36mm
App.tsx:154 📐 Text measurement: "03217minus33.comRN# ..." | Canvas: 25.62mm | Wide chars: 0 | Final: 25.62mm
App.tsx:154 📐 Text measurement: "03217minus33.comRN#..." | Canvas: 19.16mm | Wide chars: 0 | Final: 19.16mm
App.tsx:219 ✅ Line within boundaries: "03217minus33.comRN#" | Width: 19.16mm
App.tsx:154 📐 Text measurement: "CONTENTS85% Merino W..." | Canvas: 92.08mm | Wide chars: 3 | Final: 92.68mm
App.tsx:191  ⚠️ Wide characters detected: 3 characters (M, W, M) in "CONTENTS85% Merino Wool, 10%St..."
App.tsx:194 🎯 Boundary check: "CONTENTS85% Merino Wool, 10%St..." | Text: 92.68mm | Available: 20.13mm | Buffer: 1.5mm | ❌ EXCEEDS
App.tsx:154 📐 Text measurement: "CONTENTS85%..." | Canvas: 13.40mm | Wide chars: 0 | Final: 13.40mm
App.tsx:154 📐 Text measurement: "CONTENTS85% Merino..." | Canvas: 19.35mm | Wide chars: 1 | Final: 19.55mm
App.tsx:154 📐 Text measurement: "CONTENTS85% Merino W..." | Canvas: 24.38mm | Wide chars: 2 | Final: 24.78mm
App.tsx:219 ✅ Line within boundaries: "CONTENTS85% Merino" | Width: 19.55mm
App.tsx:154 📐 Text measurement: "Wool, 10%Stretch..." | Canvas: 14.26mm | Wide chars: 1 | Final: 14.46mm
App.tsx:154 📐 Text measurement: "Wool, 10%Stretch Nyl..." | Canvas: 19.82mm | Wide chars: 1 | Final: 20.02mm
App.tsx:154 📐 Text measurement: "Wool, 10%Stretch Nyl..." | Canvas: 22.90mm | Wide chars: 1 | Final: 23.10mm
App.tsx:219 ✅ Line within boundaries: "Wool, 10%Stretch Nylon," | Width: 20.02mm
App.tsx:154 📐 Text measurement: "5% Elastic85%..." | Canvas: 11.91mm | Wide chars: 0 | Final: 11.91mm
App.tsx:154 📐 Text measurement: "5% Elastic85% Laine..." | Canvas: 16.78mm | Wide chars: 0 | Final: 16.78mm
App.tsx:154 📐 Text measurement: "5% Elastic85% Laine ..." | Canvas: 32.26mm | Wide chars: 1 | Final: 32.46mm
App.tsx:219 ✅ Line within boundaries: "5% Elastic85% Laine" | Width: 16.78mm
App.tsx:154 📐 Text measurement: "Merinos,10%Nylon Ext..." | Canvas: 24.22mm | Wide chars: 1 | Final: 24.42mm
App.tsx:154 📐 Text measurement: "Merinos,10%Nylon..." | Canvas: 14.99mm | Wide chars: 1 | Final: 15.19mm
App.tsx:219 ✅ Line within boundaries: "Merinos,10%Nylon" | Width: 15.19mm
App.tsx:154 📐 Text measurement: "Extensible, 5%Elasti..." | Canvas: 19.16mm | Wide chars: 0 | Final: 19.16mm
App.tsx:154 📐 Text measurement: "Made in United State..." | Canvas: 45.76mm | Wide chars: 2 | Final: 46.16mm
App.tsx:191  ⚠️ Wide characters detected: 2 characters (M, A) in "Made in United States of Ameri..."
App.tsx:194 🎯 Boundary check: "Made in United States of Ameri..." | Text: 46.16mm | Available: 20.13mm | Buffer: 1.5mm | ❌ EXCEEDS
App.tsx:154 📐 Text measurement: "Made..." | Canvas: 4.47mm | Wide chars: 1 | Final: 4.67mm
App.tsx:154 📐 Text measurement: "Made in..." | Canvas: 6.35mm | Wide chars: 1 | Final: 6.55mm
App.tsx:154 📐 Text measurement: "Made in United..." | Canvas: 12.01mm | Wide chars: 1 | Final: 12.21mm
App.tsx:154 📐 Text measurement: "Made in United State..." | Canvas: 17.57mm | Wide chars: 1 | Final: 17.77mm
App.tsx:154 📐 Text measurement: "Made in United State..." | Canvas: 19.56mm | Wide chars: 1 | Final: 19.76mm
App.tsx:154 📐 Text measurement: "Made in United State..." | Canvas: 33.65mm | Wide chars: 2 | Final: 34.05mm
App.tsx:219 ✅ Line within boundaries: "Made in United States of" | Width: 19.76mm
App.tsx:154 📐 Text measurement: "AmericaFabriqué aux..." | Canvas: 16.97mm | Wide chars: 1 | Final: 17.17mm
App.tsx:154 📐 Text measurement: "AmericaFabriqué aux ..." | Canvas: 25.71mm | Wide chars: 1 | Final: 25.91mm
App.tsx:219 ✅ Line within boundaries: "AmericaFabriqué aux" | Width: 17.17mm
App.tsx:154 📐 Text measurement: "STYLE#:6520..." | Canvas: 11.12mm | Wide chars: 0 | Final: 11.12mm
App.tsx:194 🎯 Boundary check: "STYLE#:6520..." | Text: 11.12mm | Available: 20.13mm | Buffer: 1.5mm | ✅ FITS
App.tsx:154 📐 Text measurement: "PO#:530..." | Canvas: 7.05mm | Wide chars: 0 | Final: 7.05mm
App.tsx:194 🎯 Boundary check: "PO#:530..." | Text: 7.05mm | Available: 20.13mm | Buffer: 1.5mm | ✅ FITS
App.tsx:251 🎯 Child region text wrapping: {availableWidthMm: '21.63', availableHeightPx: '209.47', safeAvailableHeight: '204.06', fontSizePx: 6.7578547419053, lineHeight: 8.10942569028636, …}
App.tsx:11604 ✅ Canvas: Applied Canvas-First Sync logic-slice to region: {regionId: 'region_1757669892938_0', availableWidth: 81.74301095808653, availableHeight: 209.4664655800967, fontSize: 6.7578547419053, lines: 15, …}
App.tsx:11720 🎯 Text positioning: Anchor=middle, X=104.5px, SafetyMargin=2.6px
App.tsx:12856 🧵 Rendering sewing lines for position: top
App.tsx:12277 🎨 CHILD REGION RENDERING: {childRegionId: 'region_1757669892938_0_master_2_slice_1757774229622_0', contentCount: 1, contentTypes: Array(1)}
App.tsx:12294 🎨 child new-multi-line displayText: CARE INSTRUCTIONS content: {id: 'content_1757774249710_53xfmhgzq', type: 'new-multi-line', regionId: 'region_1757669892938_0_master_2_slice_1757774229622_0', layout: {…}, typography: {…}, …}
App.tsx:12360 🎨 child new-multi-line using processed lines from preview
App.tsx:12404 🎯 Child Canvas: Calculating text wrapping for child region dimensions
App.tsx:1354 🎯 Consistent font scaling: 11px → 11px → 7.433640216095831px (zoom: 0.67578547419053)
App.tsx:154 📐 Text measurement: "CARE INSTRUCTIONS..." | Canvas: 20.75mm | Wide chars: 1 | Final: 20.95mm
App.tsx:191  ⚠️ Wide characters detected: 1 characters (A) in "CARE INSTRUCTIONS..."
(anonymous) @ App.tsx:12429
(anonymous) @ App.tsx:12283
(anonymous) @ App.tsx:12634
renderRegionWithChildren @ App.tsx:12102
App.tsx:194 🎯 Boundary check: "CARE INSTRUCTIONS..." | Text: 20.95mm | Available: 20.13mm | Buffer: 1.5mm | ❌ EXCEEDS
App.tsx:154 📐 Text measurement: "CARE..." | Canvas: 5.46mm | Wide chars: 1 | Final: 5.66mm
App.tsx:219 ✅ Line within boundaries: "CARE" | Width: 5.66mm
App.tsx:251 🎯 Child region text wrapping: {availableWidthMm: '21.63', availableHeightPx: '25.54', safeAvailableHeight: '19.60', fontSizePx: 7.433640216095831, lineHeight: 8.920368259314996, …}
App.tsx:12442 ✅ Child Canvas: Calculated wrapping for child region: {availableWidth: 81.74301095808653, availableHeight: 25.544690924402033, fontSize: 7.433640216095831, lines: 2, hasOverflow: false}
App.tsx:12277 🎨 CHILD REGION RENDERING: {childRegionId: 'region_1757669892938_0_master_2_slice_1757774229622_1', contentCount: 1, contentTypes: Array(1)}
App.tsx:12294 🎨 child new-multi-line displayText: EN Wash with similar colors. Machine wash cold on gentle cycle. Use mild detergent. Lie flat to dry. DO NOT BLEACH. Do not iron.
FR Laver avec des couleurs similaires. Lavage en machine à froid sur cycle délicat. Utilisez un détergent doux. Allongez-vous à plat pour sécher. NE PAS JAVELLISER. Ne pas repasser content: {id: 'content_1757774282863_9ls5twf1k', type: 'new-multi-line', regionId: 'region_1757669892938_0_master_2_slice_1757774229622_1', layout: {…}, typography: {…}, …}
App.tsx:154 📐 Text measurement: "EN Wash with similar..." | Canvas: 103.53mm | Wide chars: 3 | Final: 104.13mm
App.tsx:191  ⚠️ Wide characters detected: 3 characters (W, M, A) in "EN Wash with similar colors. M..."
App.tsx:194 🎯 Boundary check: "EN Wash with similar colors. M..." | Text: 104.13mm | Available: 20.13mm | Buffer: 1.5mm | ❌ EXCEEDS
App.tsx:154 📐 Text measurement: "EN..." | Canvas: 2.48mm | Wide chars: 0 | Final: 2.48mm
App.tsx:154 📐 Text measurement: "EN Wash..." | Canvas: 7.48mm | Wide chars: 1 | Final: 7.68mm
App.tsx:154 📐 Text measurement: "EN Wash with..." | Canvas: 11.15mm | Wide chars: 1 | Final: 11.35mm
App.tsx:154 📐 Text measurement: "EN Wash with similar..." | Canvas: 16.80mm | Wide chars: 1 | Final: 17.00mm
App.tsx:154 📐 Text measurement: "EN Wash with similar..." | Canvas: 22.56mm | Wide chars: 1 | Final: 22.76mm
App.tsx:219 ✅ Line within boundaries: "EN Wash with similar" | Width: 17.00mm
App.tsx:154 📐 Text measurement: "colors. Machine..." | Canvas: 12.51mm | Wide chars: 1 | Final: 12.71mm
App.tsx:154 📐 Text measurement: "colors. Machine wash..." | Canvas: 17.17mm | Wide chars: 1 | Final: 17.37mm
App.tsx:154 📐 Text measurement: "colors. Machine wash..." | Canvas: 20.94mm | Wide chars: 1 | Final: 21.14mm
App.tsx:219 ✅ Line within boundaries: "colors. Machine wash" | Width: 17.37mm
App.tsx:154 📐 Text measurement: "cold on..." | Canvas: 5.76mm | Wide chars: 0 | Final: 5.76mm
App.tsx:154 📐 Text measurement: "cold on gentle..." | Canvas: 11.12mm | Wide chars: 0 | Final: 11.12mm
App.tsx:154 📐 Text measurement: "cold on gentle cycle..." | Canvas: 16.18mm | Wide chars: 0 | Final: 16.18mm
App.tsx:154 📐 Text measurement: "cold on gentle cycle..." | Canvas: 19.85mm | Wide chars: 0 | Final: 19.85mm
App.tsx:154 📐 Text measurement: "cold on gentle cycle..." | Canvas: 23.63mm | Wide chars: 0 | Final: 23.63mm
App.tsx:219 ✅ Line within boundaries: "cold on gentle cycle. Use" | Width: 19.85mm
App.tsx:154 📐 Text measurement: "mild detergent...." | Canvas: 11.81mm | Wide chars: 0 | Final: 11.81mm
App.tsx:154 📐 Text measurement: "mild detergent. Lie..." | Canvas: 14.69mm | Wide chars: 0 | Final: 14.69mm
App.tsx:154 📐 Text measurement: "mild detergent. Lie ..." | Canvas: 17.57mm | Wide chars: 0 | Final: 17.57mm
App.tsx:154 📐 Text measurement: "mild detergent. Lie ..." | Canvas: 19.56mm | Wide chars: 0 | Final: 19.56mm
App.tsx:154 📐 Text measurement: "mild detergent. Lie ..." | Canvas: 22.90mm | Wide chars: 0 | Final: 22.90mm
App.tsx:219 ✅ Line within boundaries: "mild detergent. Lie flat to" | Width: 19.56mm
App.tsx:154 📐 Text measurement: "dry. DO..." | Canvas: 6.02mm | Wide chars: 0 | Final: 6.02mm
App.tsx:154 📐 Text measurement: "dry. DO NOT..." | Canvas: 10.29mm | Wide chars: 0 | Final: 10.29mm
App.tsx:154 📐 Text measurement: "dry. DO NOT BLEACH...." | Canvas: 18.42mm | Wide chars: 1 | Final: 18.62mm
App.tsx:154 📐 Text measurement: "dry. DO NOT BLEACH. ..." | Canvas: 21.20mm | Wide chars: 1 | Final: 21.40mm
App.tsx:219 ✅ Line within boundaries: "dry. DO NOT BLEACH." | Width: 18.62mm
App.tsx:154 📐 Text measurement: "Do not..." | Canvas: 5.26mm | Wide chars: 0 | Final: 5.26mm
App.tsx:154 📐 Text measurement: "Do not iron...." | Canvas: 9.23mm | Wide chars: 0 | Final: 9.23mm
App.tsx:154 📐 Text measurement: "FR Laver avec des co..." | Canvas: 146.45mm | Wide chars: 4 | Final: 147.25mm
App.tsx:191  ⚠️ Wide characters detected: 4 characters (A, A, A, V) in "FR Laver avec des couleurs sim..."
App.tsx:194 🎯 Boundary check: "FR Laver avec des couleurs sim..." | Text: 147.25mm | Available: 20.13mm | Buffer: 1.5mm | ❌ EXCEEDS
App.tsx:154 📐 Text measurement: "FR..." | Canvas: 2.38mm | Wide chars: 0 | Final: 2.38mm
App.tsx:154 📐 Text measurement: "FR Laver..." | Canvas: 7.34mm | Wide chars: 0 | Final: 7.34mm
App.tsx:154 📐 Text measurement: "FR Laver avec..." | Canvas: 11.61mm | Wide chars: 0 | Final: 11.61mm
App.tsx:154 📐 Text measurement: "FR Laver avec des..." | Canvas: 14.99mm | Wide chars: 0 | Final: 14.99mm
App.tsx:154 📐 Text measurement: "FR Laver avec des co..." | Canvas: 22.24mm | Wide chars: 0 | Final: 22.24mm
App.tsx:219 ✅ Line within boundaries: "FR Laver avec des" | Width: 14.99mm
App.tsx:154 📐 Text measurement: "couleurs similaires...." | Canvas: 15.18mm | Wide chars: 0 | Final: 15.18mm
App.tsx:154 📐 Text measurement: "couleurs similaires...." | Canvas: 21.54mm | Wide chars: 0 | Final: 21.54mm
App.tsx:219 ✅ Line within boundaries: "couleurs similaires." | Width: 15.18mm
App.tsx:154 📐 Text measurement: "Lavage en..." | Canvas: 8.34mm | Wide chars: 0 | Final: 8.34mm
App.tsx:154 📐 Text measurement: "Lavage en machine..." | Canvas: 15.59mm | Wide chars: 0 | Final: 15.59mm
App.tsx:154 📐 Text measurement: "Lavage en machine à..." | Canvas: 17.08mm | Wide chars: 0 | Final: 17.08mm
App.tsx:154 📐 Text measurement: "Lavage en machine à ..." | Canvas: 21.05mm | Wide chars: 0 | Final: 21.05mm
App.tsx:219 ✅ Line within boundaries: "Lavage en machine à" | Width: 17.08mm
App.tsx:154 📐 Text measurement: "froid sur..." | Canvas: 6.45mm | Wide chars: 0 | Final: 6.45mm
App.tsx:154 📐 Text measurement: "froid sur cycle..." | Canvas: 11.02mm | Wide chars: 0 | Final: 11.02mm
App.tsx:154 📐 Text measurement: "froid sur cycle déli..." | Canvas: 17.17mm | Wide chars: 0 | Final: 17.17mm
App.tsx:154 📐 Text measurement: "froid sur cycle déli..." | Canvas: 23.42mm | Wide chars: 0 | Final: 23.42mm
App.tsx:219 ✅ Line within boundaries: "froid sur cycle délicat." | Width: 17.17mm
App.tsx:154 📐 Text measurement: "Utilisez un..." | Canvas: 8.24mm | Wide chars: 0 | Final: 8.24mm
App.tsx:154 📐 Text measurement: "Utilisez un détergen..." | Canvas: 16.28mm | Wide chars: 0 | Final: 16.28mm
App.tsx:154 📐 Text measurement: "Utilisez un détergen..." | Canvas: 21.15mm | Wide chars: 0 | Final: 21.15mm
App.tsx:219 ✅ Line within boundaries: "Utilisez un détergent" | Width: 16.28mm
App.tsx:154 📐 Text measurement: "doux. Allongez-vous..." | Canvas: 16.08mm | Wide chars: 1 | Final: 16.28mm
App.tsx:154 📐 Text measurement: "doux. Allongez-vous ..." | Canvas: 17.57mm | Wide chars: 1 | Final: 17.77mm
App.tsx:154 📐 Text measurement: "doux. Allongez-vous ..." | Canvas: 20.95mm | Wide chars: 1 | Final: 21.15mm
App.tsx:219 ✅ Line within boundaries: "doux. Allongez-vous à" | Width: 17.77mm
App.tsx:154 📐 Text measurement: "plat pour..." | Canvas: 6.95mm | Wide chars: 0 | Final: 6.95mm
App.tsx:154 📐 Text measurement: "plat pour sécher...." | Canvas: 13.20mm | Wide chars: 0 | Final: 13.20mm
App.tsx:154 📐 Text measurement: "plat pour sécher. NE..." | Canvas: 16.18mm | Wide chars: 0 | Final: 16.18mm
App.tsx:154 📐 Text measurement: "plat pour sécher. NE..." | Canvas: 20.12mm | Wide chars: 1 | Final: 20.32mm
App.tsx:219 ✅ Line within boundaries: "plat pour sécher. NE" | Width: 16.18mm
App.tsx:154 📐 Text measurement: "PAS JAVELLISER...." | Canvas: 14.92mm | Wide chars: 3 | Final: 15.52mm
App.tsx:154 📐 Text measurement: "PAS JAVELLISER. Ne..." | Canvas: 17.70mm | Wide chars: 3 | Final: 18.30mm
App.tsx:154 📐 Text measurement: "PAS JAVELLISER. Ne p..." | Canvas: 21.08mm | Wide chars: 3 | Final: 21.68mm
App.tsx:219 ✅ Line within boundaries: "PAS JAVELLISER. Ne" | Width: 18.30mm
App.tsx:154 📐 Text measurement: "pas repasser..." | Canvas: 10.32mm | Wide chars: 0 | Final: 10.32mm
App.tsx:251 🎯 Child region text wrapping: {availableWidthMm: '21.63', availableHeightPx: '145.60', safeAvailableHeight: '140.20', fontSizePx: 6.7578547419053, lineHeight: 8.10942569028636, …}
App.tsx:12442 ✅ Child Canvas: Calculated wrapping for child region: {availableWidth: 81.74301095808653, availableHeight: 145.60473826909163, fontSize: 6.7578547419053, lines: 15, hasOverflow: false}
App.tsx:12277 🎨 CHILD REGION RENDERING: {childRegionId: 'region_1757669892938_0_master_2_slice_1757774229622_2', contentCount: 1, contentTypes: Array(1)}
App.tsx:12297 🧺 child new-washing-care-symbol displayText: b G 5 B J content: {id: 'washing-care-symbol-1757774288638', type: 'new-washing-care-symbol', content: {…}, typography: {…}, layout: {…}, …}
App.tsx:12369 🧺 child new-washing-care-symbol using configuration: {symbols: Array(5), padding: {…}, alignment: {…}, typography: {…}, iconSize: 5}
App.tsx:1354 🎯 Consistent font scaling: 12px → 12px → 8.109425690286361px (zoom: 0.67578547419053)
App.tsx:11384 🌐 new-comp-trans displayText: 70% lino - lin - linen - linho - linnen - lino - ΛΙΝΑΡΙ - リネン - leinen - hør - lan - 亚麻 - 린넨 - linen - كتان - liño - lli - lihoaren
