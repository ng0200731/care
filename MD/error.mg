Compiled with problems:
×
ERROR in ./src/App.tsx
Module build failed (from ./node_modules/babel-loader/lib/index.js):
SyntaxError: C:\project\layout\ai-coordinate-viewer\src\App.tsx: Unexpected token, expected "," (8080:18)

  8078 |                           contentRects: existingContentRects
  8079 |                   // DEBUG: Log rendering for region #2
> 8080 |                   if (region.id.includes('_0_master_2')) {
       |                   ^
  8081 |                     console.log(`🎨 RENDERING content for ${region.id}:`, {
  8082 |                       content: c.content.text,
  8083 |                       lines: (c.content.text || '').split('\n').length,
    at constructor (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:367:19)
    at TypeScriptParserMixin.raise (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:6627:19)
    at TypeScriptParserMixin.unexpected (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:6647:16)
    at TypeScriptParserMixin.expect (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:6927:12)
    at TypeScriptParserMixin.parseObjectLike (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:11821:14)
    at TypeScriptParserMixin.parseExprAtom (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:11334:23)
    at TypeScriptParserMixin.parseExprAtom (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:4794:20)
    at TypeScriptParserMixin.parseExprSubscripts (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:11076:23)
    at TypeScriptParserMixin.parseUpdate (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:11061:21)
    at TypeScriptParserMixin.parseMaybeUnary (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:11041:23)
    at TypeScriptParserMixin.parseMaybeUnary (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:9852:18)
    at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10894:61)
    at TypeScriptParserMixin.parseExprOps (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10899:23)
    at TypeScriptParserMixin.parseMaybeConditional (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10876:23)
    at TypeScriptParserMixin.parseMaybeAssign (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10826:21)
    at TypeScriptParserMixin.parseMaybeAssign (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:9801:20)
    at C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10795:39
    at TypeScriptParserMixin.allowInAnd (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:12427:12)
    at TypeScriptParserMixin.parseMaybeAssignAllowIn (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10795:17)
    at TypeScriptParserMixin.parseMaybeAssignAllowInOrVoidPattern (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:12494:17)
    at TypeScriptParserMixin.parseExprListItem (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:12176:18)
    at TypeScriptParserMixin.parseCallExpressionArguments (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:11247:22)
    at TypeScriptParserMixin.parseCoverCallAndAsyncArrowHead (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:11181:29)
    at TypeScriptParserMixin.parseSubscript (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:11115:19)
    at TypeScriptParserMixin.parseSubscript (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:9353:18)
    at TypeScriptParserMixin.parseSubscripts (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:11089:19)
    at TypeScriptParserMixin.parseExprSubscripts (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:11080:17)
    at TypeScriptParserMixin.parseUpdate (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:11061:21)
    at TypeScriptParserMixin.parseMaybeUnary (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:11041:23)
    at TypeScriptParserMixin.parseMaybeUnary (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:9852:18)
    at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10894:61)
    at TypeScriptParserMixin.parseExprOps (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10899:23)
    at TypeScriptParserMixin.parseMaybeConditional (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10876:23)
    at TypeScriptParserMixin.parseMaybeAssign (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10826:21)
    at TypeScriptParserMixin.parseMaybeAssign (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:9801:20)
    at TypeScriptParserMixin.parseExpressionBase (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10779:23)
    at C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10775:39
    at TypeScriptParserMixin.allowInAnd (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:12422:16)
    at TypeScriptParserMixin.parseExpression (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:10775:17)
    at TypeScriptParserMixin.parseStatementContent (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:12895:23)
    at TypeScriptParserMixin.parseStatementContent (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:9527:18)
    at TypeScriptParserMixin.parseStatementLike (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:12767:17)
    at TypeScriptParserMixin.parseStatementListItem (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:12747:17)
    at TypeScriptParserMixin.parseBlockOrModuleBlockBody (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:13316:61)
    at TypeScriptParserMixin.parseBlockBody (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:13309:10)
    at TypeScriptParserMixin.parseBlock (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:13297:10)
    at TypeScriptParserMixin.parseStatementContent (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:12858:21)
    at TypeScriptParserMixin.parseStatementContent (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:9527:18)
    at TypeScriptParserMixin.parseStatementLike (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:12767:17)
    at TypeScriptParserMixin.parseStatementOrSloppyAnnexBFunctionDeclaration (C:\project\layout\ai-coordinate-viewer\node_modules\@babel\parser\lib\index.js:12757:17)
ERROR
[eslint] 
src\App.tsx
  Line 8080:18:  Parsing error: ',' expected

ERROR in src/App.tsx:8080:19
TS1005: ',' expected.
    8078 |                           contentRects: existingContentRects
    8079 |                   // DEBUG: Log rendering for region #2
  > 8080 |                   if (region.id.includes('_0_master_2')) {
         |                   ^^
    8081 |                     console.log(`🎨 RENDERING content for ${region.id}:`, {
    8082 |                       content: c.content.text,
    8083 |                       lines: (c.content.text || '').split('\n').length,
ERROR in src/App.tsx:8080:23
TS7006: Parameter 'region' implicitly has an 'any' type.
    8078 |                           contentRects: existingContentRects
    8079 |                   // DEBUG: Log rendering for region #2
  > 8080 |                   if (region.id.includes('_0_master_2')) {
         |                       ^^^^^^
    8081 |                     console.log(`🎨 RENDERING content for ${region.id}:`, {
    8082 |                       content: c.content.text,
    8083 |                       lines: (c.content.text || '').split('\n').length,
ERROR in src/App.tsx:8080:29
TS1005: ',' expected.
    8078 |                           contentRects: existingContentRects
    8079 |                   // DEBUG: Log rendering for region #2
  > 8080 |                   if (region.id.includes('_0_master_2')) {
         |                             ^
    8081 |                     console.log(`🎨 RENDERING content for ${region.id}:`, {
    8082 |                       content: c.content.text,
    8083 |                       lines: (c.content.text || '').split('\n').length,
ERROR in src/App.tsx:8080:56
TS1005: ',' expected.
    8078 |                           contentRects: existingContentRects
    8079 |                   // DEBUG: Log rendering for region #2
  > 8080 |                   if (region.id.includes('_0_master_2')) {
         |                                                        ^
    8081 |                     console.log(`🎨 RENDERING content for ${region.id}:`, {
    8082 |                       content: c.content.text,
    8083 |                       lines: (c.content.text || '').split('\n').length,
ERROR in src/App.tsx:8080:58
TS1005: ';' expected.
    8078 |                           contentRects: existingContentRects
    8079 |                   // DEBUG: Log rendering for region #2
  > 8080 |                   if (region.id.includes('_0_master_2')) {
         |                                                          ^
    8081 |                     console.log(`🎨 RENDERING content for ${region.id}:`, {
    8082 |                       content: c.content.text,
    8083 |                       lines: (c.content.text || '').split('\n').length,
ERROR in src/App.tsx:8082:32
TS2304: Cannot find name 'c'.
    8080 |                   if (region.id.includes('_0_master_2')) {
    8081 |                     console.log(`🎨 RENDERING content for ${region.id}:`, {
  > 8082 |                       content: c.content.text,
         |                                ^
    8083 |                       lines: (c.content.text || '').split('\n').length,
    8084 |                       fontSize: c.typography?.fontSize,
    8085 |                       color: c.typography?.fontColor,
ERROR in src/App.tsx:8083:31
TS2304: Cannot find name 'c'.
    8081 |                     console.log(`🎨 RENDERING content for ${region.id}:`, {
    8082 |                       content: c.content.text,
  > 8083 |                       lines: (c.content.text || '').split('\n').length,
         |                               ^
    8084 |                       fontSize: c.typography?.fontSize,
    8085 |                       color: c.typography?.fontColor,
    8086 |                     });
ERROR in src/App.tsx:8084:33
TS2304: Cannot find name 'c'.
    8082 |                       content: c.content.text,
    8083 |                       lines: (c.content.text || '').split('\n').length,
  > 8084 |                       fontSize: c.typography?.fontSize,
         |                                 ^
    8085 |                       color: c.typography?.fontColor,
    8086 |                     });
    8087 |                   }
ERROR in src/App.tsx:8085:30
TS2304: Cannot find name 'c'.
    8083 |                       lines: (c.content.text || '').split('\n').length,
    8084 |                       fontSize: c.typography?.fontSize,
  > 8085 |                       color: c.typography?.fontColor,
         |                              ^
    8086 |                     });
    8087 |                   }
    8088 |
ERROR in src/App.tsx:8089:26
TS1128: Declaration or statement expected.
    8087 |                   }
    8088 |
  > 8089 |                         });
         |                          ^
    8090 |
    8091 |                         // Store debug info using setTimeout to avoid re-render loop
    8092 |                         setTimeout(() => {
ERROR in src/App.tsx:8093:136
TS2304: Cannot find name 'existingContentRects'.
    8091 |                         // Store debug info using setTimeout to avoid re-render loop
    8092 |                         setTimeout(() => {
  > 8093 |                           const debugMsg = `🔍 LEFTOVER SPACE SEARCH:\nRegion: ${region.width}×${region.height}mm\nExisting content: ${existingContentRects.length} items\nContent rects: ${JSON.stringify(existingContentRects, null, 2)}`;
         |                                                                                                                                        ^^^^^^^^^^^^^^^^^^^^
    8094 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8095 |                         }, 0);
    8096 |
ERROR in src/App.tsx:8093:204
TS2304: Cannot find name 'existingContentRects'.
    8091 |                         // Store debug info using setTimeout to avoid re-render loop
    8092 |                         setTimeout(() => {
  > 8093 |                           const debugMsg = `🔍 LEFTOVER SPACE SEARCH:\nRegion: ${region.width}×${region.height}mm\nExisting content: ${existingContentRects.length} items\nContent rects: ${JSON.stringify(existingContentRects, null, 2)}`;
         |                                                                                                                                                                                                            ^^^^^^^^^^^^^^^^^^^^
    8094 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8095 |                         }, 0);
    8096 |
ERROR in src/App.tsx:8100:29
TS2304: Cannot find name 'existingContentRects'.
    8098 |                         // Instead of finding largest rectangle, use simple subtraction approach
    8099 |
  > 8100 |                         if (existingContentRects.length === 0) {
         |                             ^^^^^^^^^^^^^^^^^^^^
    8101 |                           // No existing content, use full region
    8102 |                           contentWidth = region.width;
    8103 |                           contentHeight = region.height;
ERROR in src/App.tsx:8102:27
TS2304: Cannot find name 'contentWidth'.
    8100 |                         if (existingContentRects.length === 0) {
    8101 |                           // No existing content, use full region
  > 8102 |                           contentWidth = region.width;
         |                           ^^^^^^^^^^^^
    8103 |                           contentHeight = region.height;
    8104 |                           (content as any)._calculatedPosition = { x: 0, y: 0 };
    8105 |                         } else {
ERROR in src/App.tsx:8103:27
TS2304: Cannot find name 'contentHeight'.
    8101 |                           // No existing content, use full region
    8102 |                           contentWidth = region.width;
  > 8103 |                           contentHeight = region.height;
         |                           ^^^^^^^^^^^^^
    8104 |                           (content as any)._calculatedPosition = { x: 0, y: 0 };
    8105 |                         } else {
    8106 |                           // Find the rightmost edge of existing content
ERROR in src/App.tsx:8104:28
TS2304: Cannot find name 'content'.
    8102 |                           contentWidth = region.width;
    8103 |                           contentHeight = region.height;
  > 8104 |                           (content as any)._calculatedPosition = { x: 0, y: 0 };
         |                            ^^^^^^^
    8105 |                         } else {
    8106 |                           // Find the rightmost edge of existing content
    8107 |                           const rightmostEdge = Math.max(...existingContentRects.map(rect => rect.x + rect.width));
ERROR in src/App.tsx:8107:61
TS2304: Cannot find name 'existingContentRects'.
    8105 |                         } else {
    8106 |                           // Find the rightmost edge of existing content
  > 8107 |                           const rightmostEdge = Math.max(...existingContentRects.map(rect => rect.x + rect.width));
         |                                                             ^^^^^^^^^^^^^^^^^^^^
    8108 |                           const bottomEdge = Math.max(...existingContentRects.map(rect => rect.y + rect.height));
    8109 |
    8110 |                           // Calculate remaining space to the right
ERROR in src/App.tsx:8107:86
TS7006: Parameter 'rect' implicitly has an 'any' type.
    8105 |                         } else {
    8106 |                           // Find the rightmost edge of existing content
  > 8107 |                           const rightmostEdge = Math.max(...existingContentRects.map(rect => rect.x + rect.width));
         |                                                                                      ^^^^
    8108 |                           const bottomEdge = Math.max(...existingContentRects.map(rect => rect.y + rect.height));
    8109 |
    8110 |                           // Calculate remaining space to the right
ERROR in src/App.tsx:8108:58
TS2304: Cannot find name 'existingContentRects'.
    8106 |                           // Find the rightmost edge of existing content
    8107 |                           const rightmostEdge = Math.max(...existingContentRects.map(rect => rect.x + rect.width));
  > 8108 |                           const bottomEdge = Math.max(...existingContentRects.map(rect => rect.y + rect.height));
         |                                                          ^^^^^^^^^^^^^^^^^^^^
    8109 |
    8110 |                           // Calculate remaining space to the right
    8111 |                           const remainingWidth = region.width - rightmostEdge;
ERROR in src/App.tsx:8108:83
TS7006: Parameter 'rect' implicitly has an 'any' type.
    8106 |                           // Find the rightmost edge of existing content
    8107 |                           const rightmostEdge = Math.max(...existingContentRects.map(rect => rect.x + rect.width));
  > 8108 |                           const bottomEdge = Math.max(...existingContentRects.map(rect => rect.y + rect.height));
         |                                                                                   ^^^^
    8109 |
    8110 |                           // Calculate remaining space to the right
    8111 |                           const remainingWidth = region.width - rightmostEdge;
ERROR in src/App.tsx:8116:29
TS2304: Cannot find name 'contentWidth'.
    8114 |                           if (remainingWidth > 0) {
    8115 |                             // Use the remaining space to the right
  > 8116 |                             contentWidth = remainingWidth;
         |                             ^^^^^^^^^^^^
    8117 |                             contentHeight = remainingHeight;
    8118 |                             (content as any)._calculatedPosition = { x: rightmostEdge, y: 0 };
    8119 |                           } else {
ERROR in src/App.tsx:8117:29
TS2304: Cannot find name 'contentHeight'.
    8115 |                             // Use the remaining space to the right
    8116 |                             contentWidth = remainingWidth;
  > 8117 |                             contentHeight = remainingHeight;
         |                             ^^^^^^^^^^^^^
    8118 |                             (content as any)._calculatedPosition = { x: rightmostEdge, y: 0 };
    8119 |                           } else {
    8120 |                             // No space to the right, try below
ERROR in src/App.tsx:8118:30
TS2304: Cannot find name 'content'.
    8116 |                             contentWidth = remainingWidth;
    8117 |                             contentHeight = remainingHeight;
  > 8118 |                             (content as any)._calculatedPosition = { x: rightmostEdge, y: 0 };
         |                              ^^^^^^^
    8119 |                           } else {
    8120 |                             // No space to the right, try below
    8121 |                             const remainingHeightBelow = region.height - bottomEdge;
ERROR in src/App.tsx:8123:31
TS2304: Cannot find name 'contentWidth'.
    8121 |                             const remainingHeightBelow = region.height - bottomEdge;
    8122 |                             if (remainingHeightBelow > 0) {
  > 8123 |                               contentWidth = region.width;
         |                               ^^^^^^^^^^^^
    8124 |                               contentHeight = remainingHeightBelow;
    8125 |                               (content as any)._calculatedPosition = { x: 0, y: bottomEdge };
    8126 |                             } else {
ERROR in src/App.tsx:8124:31
TS2304: Cannot find name 'contentHeight'.
    8122 |                             if (remainingHeightBelow > 0) {
    8123 |                               contentWidth = region.width;
  > 8124 |                               contentHeight = remainingHeightBelow;
         |                               ^^^^^^^^^^^^^
    8125 |                               (content as any)._calculatedPosition = { x: 0, y: bottomEdge };
    8126 |                             } else {
    8127 |                               // Fallback: minimal space
ERROR in src/App.tsx:8125:32
TS2304: Cannot find name 'content'.
    8123 |                               contentWidth = region.width;
    8124 |                               contentHeight = remainingHeightBelow;
  > 8125 |                               (content as any)._calculatedPosition = { x: 0, y: bottomEdge };
         |                                ^^^^^^^
    8126 |                             } else {
    8127 |                               // Fallback: minimal space
    8128 |                               contentWidth = 10;
ERROR in src/App.tsx:8128:31
TS2304: Cannot find name 'contentWidth'.
    8126 |                             } else {
    8127 |                               // Fallback: minimal space
  > 8128 |                               contentWidth = 10;
         |                               ^^^^^^^^^^^^
    8129 |                               contentHeight = 10;
    8130 |                               (content as any)._calculatedPosition = { x: 0, y: 0 };
    8131 |                             }
ERROR in src/App.tsx:8129:31
TS2304: Cannot find name 'contentHeight'.
    8127 |                               // Fallback: minimal space
    8128 |                               contentWidth = 10;
  > 8129 |                               contentHeight = 10;
         |                               ^^^^^^^^^^^^^
    8130 |                               (content as any)._calculatedPosition = { x: 0, y: 0 };
    8131 |                             }
    8132 |                           }
ERROR in src/App.tsx:8130:32
TS2304: Cannot find name 'content'.
    8128 |                               contentWidth = 10;
    8129 |                               contentHeight = 10;
  > 8130 |                               (content as any)._calculatedPosition = { x: 0, y: 0 };
         |                                ^^^^^^^
    8131 |                             }
    8132 |                           }
    8133 |                         }
ERROR in src/App.tsx:8136:34
TS2304: Cannot find name 'contentWidth'.
    8134 |
    8135 |                         console.log('✅ Found leftover space:', {
  > 8136 |                           width: contentWidth,
         |                                  ^^^^^^^^^^^^
    8137 |                           height: contentHeight,
    8138 |                           area: contentWidth * contentHeight,
    8139 |                           position: (content as any)._calculatedPosition
ERROR in src/App.tsx:8137:35
TS2304: Cannot find name 'contentHeight'.
    8135 |                         console.log('✅ Found leftover space:', {
    8136 |                           width: contentWidth,
  > 8137 |                           height: contentHeight,
         |                                   ^^^^^^^^^^^^^
    8138 |                           area: contentWidth * contentHeight,
    8139 |                           position: (content as any)._calculatedPosition
    8140 |                         });
ERROR in src/App.tsx:8138:33
TS2304: Cannot find name 'contentWidth'.
    8136 |                           width: contentWidth,
    8137 |                           height: contentHeight,
  > 8138 |                           area: contentWidth * contentHeight,
         |                                 ^^^^^^^^^^^^
    8139 |                           position: (content as any)._calculatedPosition
    8140 |                         });
    8141 |
ERROR in src/App.tsx:8138:48
TS2304: Cannot find name 'contentHeight'.
    8136 |                           width: contentWidth,
    8137 |                           height: contentHeight,
  > 8138 |                           area: contentWidth * contentHeight,
         |                                                ^^^^^^^^^^^^^
    8139 |                           position: (content as any)._calculatedPosition
    8140 |                         });
    8141 |
ERROR in src/App.tsx:8139:38
TS2304: Cannot find name 'content'.
    8137 |                           height: contentHeight,
    8138 |                           area: contentWidth * contentHeight,
  > 8139 |                           position: (content as any)._calculatedPosition
         |                                      ^^^^^^^
    8140 |                         });
    8141 |
    8142 |                         // Store debug info using setTimeout to avoid re-render loop
ERROR in src/App.tsx:8144:44
TS2304: Cannot find name 'content'.
    8142 |                         // Store debug info using setTimeout to avoid re-render loop
    8143 |                         setTimeout(() => {
  > 8144 |                           const calcPos = (content as any)._calculatedPosition;
         |                                            ^^^^^^^
    8145 |                           const debugMsg = `✅ FOUND LEFTOVER SPACE:\nSize: ${contentWidth}×${contentHeight}mm\nArea: ${contentWidth * contentHeight}mm²\nPosition: x=${calcPos.x}, y=${calcPos.y}`;
    8146 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8147 |                         }, 10);
ERROR in src/App.tsx:8145:78
TS2304: Cannot find name 'contentWidth'.
    8143 |                         setTimeout(() => {
    8144 |                           const calcPos = (content as any)._calculatedPosition;
  > 8145 |                           const debugMsg = `✅ FOUND LEFTOVER SPACE:\nSize: ${contentWidth}×${contentHeight}mm\nArea: ${contentWidth * contentHeight}mm²\nPosition: x=${calcPos.x}, y=${calcPos.y}`;
         |                                                                              ^^^^^^^^^^^^
    8146 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8147 |                         }, 10);
    8148 |                       } else {
ERROR in src/App.tsx:8145:94
TS2304: Cannot find name 'contentHeight'.
    8143 |                         setTimeout(() => {
    8144 |                           const calcPos = (content as any)._calculatedPosition;
  > 8145 |                           const debugMsg = `✅ FOUND LEFTOVER SPACE:\nSize: ${contentWidth}×${contentHeight}mm\nArea: ${contentWidth * contentHeight}mm²\nPosition: x=${calcPos.x}, y=${calcPos.y}`;
         |                                                                                              ^^^^^^^^^^^^^
    8146 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8147 |                         }, 10);
    8148 |                       } else {
ERROR in src/App.tsx:8145:120
TS2304: Cannot find name 'contentWidth'.
    8143 |                         setTimeout(() => {
    8144 |                           const calcPos = (content as any)._calculatedPosition;
  > 8145 |                           const debugMsg = `✅ FOUND LEFTOVER SPACE:\nSize: ${contentWidth}×${contentHeight}mm\nArea: ${contentWidth * contentHeight}mm²\nPosition: x=${calcPos.x}, y=${calcPos.y}`;
         |                                                                                                                        ^^^^^^^^^^^^
    8146 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8147 |                         }, 10);
    8148 |                       } else {
ERROR in src/App.tsx:8145:135
TS2304: Cannot find name 'contentHeight'.
    8143 |                         setTimeout(() => {
    8144 |                           const calcPos = (content as any)._calculatedPosition;
  > 8145 |                           const debugMsg = `✅ FOUND LEFTOVER SPACE:\nSize: ${contentWidth}×${contentHeight}mm\nArea: ${contentWidth * contentHeight}mm²\nPosition: x=${calcPos.x}, y=${calcPos.y}`;
         |                                                                                                                                       ^^^^^^^^^^^^^
    8146 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8147 |                         }, 10);
    8148 |                       } else {
ERROR in src/App.tsx:8148:25
TS1005: ')' expected.
    8146 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8147 |                         }, 10);
  > 8148 |                       } else {
         |                         ^^^^
    8149 |                         // Normal width calculation - CONSTRAINED TO REGION
    8150 |                         if (content.layout.fullWidth || content.layout.width.value === 100) {
    8151 |                           contentWidth = region.width;
ERROR in src/App.tsx:8150:25
TS1109: Expression expected.
    8148 |                       } else {
    8149 |                         // Normal width calculation - CONSTRAINED TO REGION
  > 8150 |                         if (content.layout.fullWidth || content.layout.width.value === 100) {
         |                         ^^
    8151 |                           contentWidth = region.width;
    8152 |                         } else if (content.layout.width.unit === 'mm') {
    8153 |                           contentWidth = Math.min(content.layout.width.value, region.width); // Constrain to region
ERROR in src/App.tsx:8151:27
TS2304: Cannot find name 'contentWidth'.
    8149 |                         // Normal width calculation - CONSTRAINED TO REGION
    8150 |                         if (content.layout.fullWidth || content.layout.width.value === 100) {
  > 8151 |                           contentWidth = region.width;
         |                           ^^^^^^^^^^^^
    8152 |                         } else if (content.layout.width.unit === 'mm') {
    8153 |                           contentWidth = Math.min(content.layout.width.value, region.width); // Constrain to region
    8154 |                         } else {
ERROR in src/App.tsx:8151:54
TS1005: '}' expected.
    8149 |                         // Normal width calculation - CONSTRAINED TO REGION
    8150 |                         if (content.layout.fullWidth || content.layout.width.value === 100) {
  > 8151 |                           contentWidth = region.width;
         |                                                      ^
    8152 |                         } else if (content.layout.width.unit === 'mm') {
    8153 |                           contentWidth = Math.min(content.layout.width.value, region.width); // Constrain to region
    8154 |                         } else {
ERROR in src/App.tsx:8152:25
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8150 |                         if (content.layout.fullWidth || content.layout.width.value === 100) {
    8151 |                           contentWidth = region.width;
  > 8152 |                         } else if (content.layout.width.unit === 'mm') {
         |                         ^
    8153 |                           contentWidth = Math.min(content.layout.width.value, region.width); // Constrain to region
    8154 |                         } else {
    8155 |                           contentWidth = Math.min((content.layout.width.value / 100) * region.width, region.width);
ERROR in src/App.tsx:8153:27
TS2304: Cannot find name 'contentWidth'.
    8151 |                           contentWidth = region.width;
    8152 |                         } else if (content.layout.width.unit === 'mm') {
  > 8153 |                           contentWidth = Math.min(content.layout.width.value, region.width); // Constrain to region
         |                           ^^^^^^^^^^^^
    8154 |                         } else {
    8155 |                           contentWidth = Math.min((content.layout.width.value / 100) * region.width, region.width);
    8156 |                         }
ERROR in src/App.tsx:8153:51
TS2304: Cannot find name 'content'.
    8151 |                           contentWidth = region.width;
    8152 |                         } else if (content.layout.width.unit === 'mm') {
  > 8153 |                           contentWidth = Math.min(content.layout.width.value, region.width); // Constrain to region
         |                                                   ^^^^^^^
    8154 |                         } else {
    8155 |                           contentWidth = Math.min((content.layout.width.value / 100) * region.width, region.width);
    8156 |                         }
ERROR in src/App.tsx:8153:92
TS1005: '}' expected.
    8151 |                           contentWidth = region.width;
    8152 |                         } else if (content.layout.width.unit === 'mm') {
  > 8153 |                           contentWidth = Math.min(content.layout.width.value, region.width); // Constrain to region
         |                                                                                            ^
    8154 |                         } else {
    8155 |                           contentWidth = Math.min((content.layout.width.value / 100) * region.width, region.width);
    8156 |                         }
ERROR in src/App.tsx:8154:25
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8152 |                         } else if (content.layout.width.unit === 'mm') {
    8153 |                           contentWidth = Math.min(content.layout.width.value, region.width); // Constrain to region
  > 8154 |                         } else {
         |                         ^
    8155 |                           contentWidth = Math.min((content.layout.width.value / 100) * region.width, region.width);
    8156 |                         }
    8157 |
ERROR in src/App.tsx:8155:27
TS2304: Cannot find name 'contentWidth'.
    8153 |                           contentWidth = Math.min(content.layout.width.value, region.width); // Constrain to region
    8154 |                         } else {
  > 8155 |                           contentWidth = Math.min((content.layout.width.value / 100) * region.width, region.width);
         |                           ^^^^^^^^^^^^
    8156 |                         }
    8157 |
    8158 |                         // Normal height calculation - CONSTRAINED TO REGION
ERROR in src/App.tsx:8155:52
TS2304: Cannot find name 'content'.
    8153 |                           contentWidth = Math.min(content.layout.width.value, region.width); // Constrain to region
    8154 |                         } else {
  > 8155 |                           contentWidth = Math.min((content.layout.width.value / 100) * region.width, region.width);
         |                                                    ^^^^^^^
    8156 |                         }
    8157 |
    8158 |                         // Normal height calculation - CONSTRAINED TO REGION
ERROR in src/App.tsx:8155:115
TS1005: '}' expected.
    8153 |                           contentWidth = Math.min(content.layout.width.value, region.width); // Constrain to region
    8154 |                         } else {
  > 8155 |                           contentWidth = Math.min((content.layout.width.value / 100) * region.width, region.width);
         |                                                                                                                   ^
    8156 |                         }
    8157 |
    8158 |                         // Normal height calculation - CONSTRAINED TO REGION
ERROR in src/App.tsx:8156:25
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8154 |                         } else {
    8155 |                           contentWidth = Math.min((content.layout.width.value / 100) * region.width, region.width);
  > 8156 |                         }
         |                         ^
    8157 |
    8158 |                         // Normal height calculation - CONSTRAINED TO REGION
    8159 |                         if (content.layout.fullHeight || content.layout.height.value === 100) {
ERROR in src/App.tsx:8160:27
TS2304: Cannot find name 'contentHeight'.
    8158 |                         // Normal height calculation - CONSTRAINED TO REGION
    8159 |                         if (content.layout.fullHeight || content.layout.height.value === 100) {
  > 8160 |                           contentHeight = region.height;
         |                           ^^^^^^^^^^^^^
    8161 |                         } else if (content.layout.height.unit === 'mm') {
    8162 |                           contentHeight = Math.min(content.layout.height.value, region.height); // Constrain to region
    8163 |                         } else {
ERROR in src/App.tsx:8160:56
TS1005: '}' expected.
    8158 |                         // Normal height calculation - CONSTRAINED TO REGION
    8159 |                         if (content.layout.fullHeight || content.layout.height.value === 100) {
  > 8160 |                           contentHeight = region.height;
         |                                                        ^
    8161 |                         } else if (content.layout.height.unit === 'mm') {
    8162 |                           contentHeight = Math.min(content.layout.height.value, region.height); // Constrain to region
    8163 |                         } else {
ERROR in src/App.tsx:8161:25
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8159 |                         if (content.layout.fullHeight || content.layout.height.value === 100) {
    8160 |                           contentHeight = region.height;
  > 8161 |                         } else if (content.layout.height.unit === 'mm') {
         |                         ^
    8162 |                           contentHeight = Math.min(content.layout.height.value, region.height); // Constrain to region
    8163 |                         } else {
    8164 |                           contentHeight = Math.min((content.layout.height.value / 100) * region.height, region.height);
ERROR in src/App.tsx:8162:27
TS2304: Cannot find name 'contentHeight'.
    8160 |                           contentHeight = region.height;
    8161 |                         } else if (content.layout.height.unit === 'mm') {
  > 8162 |                           contentHeight = Math.min(content.layout.height.value, region.height); // Constrain to region
         |                           ^^^^^^^^^^^^^
    8163 |                         } else {
    8164 |                           contentHeight = Math.min((content.layout.height.value / 100) * region.height, region.height);
    8165 |                         }
ERROR in src/App.tsx:8162:52
TS2304: Cannot find name 'content'.
    8160 |                           contentHeight = region.height;
    8161 |                         } else if (content.layout.height.unit === 'mm') {
  > 8162 |                           contentHeight = Math.min(content.layout.height.value, region.height); // Constrain to region
         |                                                    ^^^^^^^
    8163 |                         } else {
    8164 |                           contentHeight = Math.min((content.layout.height.value / 100) * region.height, region.height);
    8165 |                         }
ERROR in src/App.tsx:8162:95
TS1005: '}' expected.
    8160 |                           contentHeight = region.height;
    8161 |                         } else if (content.layout.height.unit === 'mm') {
  > 8162 |                           contentHeight = Math.min(content.layout.height.value, region.height); // Constrain to region
         |                                                                                               ^
    8163 |                         } else {
    8164 |                           contentHeight = Math.min((content.layout.height.value / 100) * region.height, region.height);
    8165 |                         }
ERROR in src/App.tsx:8163:25
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8161 |                         } else if (content.layout.height.unit === 'mm') {
    8162 |                           contentHeight = Math.min(content.layout.height.value, region.height); // Constrain to region
  > 8163 |                         } else {
         |                         ^
    8164 |                           contentHeight = Math.min((content.layout.height.value / 100) * region.height, region.height);
    8165 |                         }
    8166 |                       }
ERROR in src/App.tsx:8164:27
TS2304: Cannot find name 'contentHeight'.
    8162 |                           contentHeight = Math.min(content.layout.height.value, region.height); // Constrain to region
    8163 |                         } else {
  > 8164 |                           contentHeight = Math.min((content.layout.height.value / 100) * region.height, region.height);
         |                           ^^^^^^^^^^^^^
    8165 |                         }
    8166 |                       }
    8167 |
ERROR in src/App.tsx:8164:53
TS2304: Cannot find name 'content'.
    8162 |                           contentHeight = Math.min(content.layout.height.value, region.height); // Constrain to region
    8163 |                         } else {
  > 8164 |                           contentHeight = Math.min((content.layout.height.value / 100) * region.height, region.height);
         |                                                     ^^^^^^^
    8165 |                         }
    8166 |                       }
    8167 |
ERROR in src/App.tsx:8164:119
TS1005: '}' expected.
    8162 |                           contentHeight = Math.min(content.layout.height.value, region.height); // Constrain to region
    8163 |                         } else {
  > 8164 |                           contentHeight = Math.min((content.layout.height.value / 100) * region.height, region.height);
         |                                                                                                                       ^
    8165 |                         }
    8166 |                       }
    8167 |
ERROR in src/App.tsx:8165:25
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8163 |                         } else {
    8164 |                           contentHeight = Math.min((content.layout.height.value / 100) * region.height, region.height);
  > 8165 |                         }
         |                         ^
    8166 |                       }
    8167 |
    8168 |                       // ENFORCE REGION BOUNDARY CONSTRAINTS
ERROR in src/App.tsx:8166:23
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8164 |                           contentHeight = Math.min((content.layout.height.value / 100) * region.height, region.height);
    8165 |                         }
  > 8166 |                       }
         |                       ^
    8167 |
    8168 |                       // ENFORCE REGION BOUNDARY CONSTRAINTS
    8169 |                       contentWidth = Math.min(contentWidth, region.width);
ERROR in src/App.tsx:8186:25
TS1109: Expression expected.
    8184 |                       if (content.layout.occupyLeftoverSpace && (content as any)._calculatedPosition) {
    8185 |                         // Use calculated position from leftover space algorithm
  > 8186 |                         const calcPos = (content as any)._calculatedPosition;
         |                         ^^^^^
    8187 |                         overlayX = regionStartX + (calcPos.x * scale);
    8188 |                         overlayY = regionStartY + (calcPos.y * scale);
    8189 |
ERROR in src/App.tsx:8191:27
TS2304: Cannot find name 'calcPos'.
    8189 |
    8190 |                         console.log('🎯 Positioning leftover content at calculated position:', {
  > 8191 |                           calcPos,
         |                           ^^^^^^^
    8192 |                           overlayX,
    8193 |                           overlayY,
    8194 |                           regionStart: { x: regionStartX, y: regionStartY }
ERROR in src/App.tsx:8191:27
TS2695: Left side of comma operator is unused and has no side effects.
    8189 |
    8190 |                         console.log('🎯 Positioning leftover content at calculated position:', {
  > 8191 |                           calcPos,
         |                           ^^^^^^^
    8192 |                           overlayX,
    8193 |                           overlayY,
    8194 |                           regionStart: { x: regionStartX, y: regionStartY }
ERROR in src/App.tsx:8191:27
TS2695: Left side of comma operator is unused and has no side effects.
    8189 |
    8190 |                         console.log('🎯 Positioning leftover content at calculated position:', {
  > 8191 |                           calcPos,
         |                           ^^^^^^^^
  > 8192 |                           overlayX,
         | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    8193 |                           overlayY,
    8194 |                           regionStart: { x: regionStartX, y: regionStartY }
    8195 |                         });
ERROR in src/App.tsx:8191:27
TS2695: Left side of comma operator is unused and has no side effects.
    8189 |
    8190 |                         console.log('🎯 Positioning leftover content at calculated position:', {
  > 8191 |                           calcPos,
         |                           ^^^^^^^^
  > 8192 |                           overlayX,
         | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  > 8193 |                           overlayY,
         | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    8194 |                           regionStart: { x: regionStartX, y: regionStartY }
    8195 |                         });
    8196 |
ERROR in src/App.tsx:8192:27
TS2304: Cannot find name 'overlayX'.
    8190 |                         console.log('🎯 Positioning leftover content at calculated position:', {
    8191 |                           calcPos,
  > 8192 |                           overlayX,
         |                           ^^^^^^^^
    8193 |                           overlayY,
    8194 |                           regionStart: { x: regionStartX, y: regionStartY }
    8195 |                         });
ERROR in src/App.tsx:8193:27
TS2304: Cannot find name 'overlayY'.
    8191 |                           calcPos,
    8192 |                           overlayX,
  > 8193 |                           overlayY,
         |                           ^^^^^^^^
    8194 |                           regionStart: { x: regionStartX, y: regionStartY }
    8195 |                         });
    8196 |
ERROR in src/App.tsx:8194:27
TS2304: Cannot find name 'regionStart'.
    8192 |                           overlayX,
    8193 |                           overlayY,
  > 8194 |                           regionStart: { x: regionStartX, y: regionStartY }
         |                           ^^^^^^^^^^^
    8195 |                         });
    8196 |
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
ERROR in src/App.tsx:8194:38
TS1005: '}' expected.
    8192 |                           overlayX,
    8193 |                           overlayY,
  > 8194 |                           regionStart: { x: regionStartX, y: regionStartY }
         |                                      ^
    8195 |                         });
    8196 |
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
ERROR in src/App.tsx:8194:42
TS2304: Cannot find name 'x'.
    8192 |                           overlayX,
    8193 |                           overlayY,
  > 8194 |                           regionStart: { x: regionStartX, y: regionStartY }
         |                                          ^
    8195 |                         });
    8196 |
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
ERROR in src/App.tsx:8194:43
TS1005: '}' expected.
    8192 |                           overlayX,
    8193 |                           overlayY,
  > 8194 |                           regionStart: { x: regionStartX, y: regionStartY }
         |                                           ^
    8195 |                         });
    8196 |
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
ERROR in src/App.tsx:8194:75
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8192 |                           overlayX,
    8193 |                           overlayY,
  > 8194 |                           regionStart: { x: regionStartX, y: regionStartY }
         |                                                                           ^
    8195 |                         });
    8196 |
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
ERROR in src/App.tsx:8195:25
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8193 |                           overlayY,
    8194 |                           regionStart: { x: regionStartX, y: regionStartY }
  > 8195 |                         });
         |                         ^
    8196 |
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
    8198 |                         setTimeout(() => {
ERROR in src/App.tsx:8198:40
TS1382: Unexpected token. Did you mean `{'>'}` or `&gt;`?
    8196 |
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
  > 8198 |                         setTimeout(() => {
         |                                        ^
    8199 |                           const debugMsg = `🎯 POSITIONING LEFTOVER CONTENT:\nCalculated pos: x=${calcPos.x}, y=${calcPos.y}\nOverlay pos: x=${overlayX}, y=${overlayY}\nRegion start: x=${regionStartX}, y=${regionStartY}`;
    8200 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8201 |                         }, 20);
ERROR in src/App.tsx:8199:27
TS1109: Expression expected.
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
    8198 |                         setTimeout(() => {
  > 8199 |                           const debugMsg = `🎯 POSITIONING LEFTOVER CONTENT:\nCalculated pos: x=${calcPos.x}, y=${calcPos.y}\nOverlay pos: x=${overlayX}, y=${overlayY}\nRegion start: x=${regionStartX}, y=${regionStartY}`;
         |                           ^^^^^
    8200 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8201 |                         }, 20);
    8202 |                       } else {
ERROR in src/App.tsx:8199:99
TS2304: Cannot find name 'calcPos'.
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
    8198 |                         setTimeout(() => {
  > 8199 |                           const debugMsg = `🎯 POSITIONING LEFTOVER CONTENT:\nCalculated pos: x=${calcPos.x}, y=${calcPos.y}\nOverlay pos: x=${overlayX}, y=${overlayY}\nRegion start: x=${regionStartX}, y=${regionStartY}`;
         |                                                                                                   ^^^^^^^
    8200 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8201 |                         }, 20);
    8202 |                       } else {
ERROR in src/App.tsx:8199:115
TS2304: Cannot find name 'calcPos'.
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
    8198 |                         setTimeout(() => {
  > 8199 |                           const debugMsg = `🎯 POSITIONING LEFTOVER CONTENT:\nCalculated pos: x=${calcPos.x}, y=${calcPos.y}\nOverlay pos: x=${overlayX}, y=${overlayY}\nRegion start: x=${regionStartX}, y=${regionStartY}`;
         |                                                                                                                   ^^^^^^^
    8200 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8201 |                         }, 20);
    8202 |                       } else {
ERROR in src/App.tsx:8199:144
TS2304: Cannot find name 'overlayX'.
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
    8198 |                         setTimeout(() => {
  > 8199 |                           const debugMsg = `🎯 POSITIONING LEFTOVER CONTENT:\nCalculated pos: x=${calcPos.x}, y=${calcPos.y}\nOverlay pos: x=${overlayX}, y=${overlayY}\nRegion start: x=${regionStartX}, y=${regionStartY}`;
         |                                                                                                                                                ^^^^^^^^
    8200 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8201 |                         }, 20);
    8202 |                       } else {
ERROR in src/App.tsx:8199:159
TS2304: Cannot find name 'overlayY'.
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
    8198 |                         setTimeout(() => {
  > 8199 |                           const debugMsg = `🎯 POSITIONING LEFTOVER CONTENT:\nCalculated pos: x=${calcPos.x}, y=${calcPos.y}\nOverlay pos: x=${overlayX}, y=${overlayY}\nRegion start: x=${regionStartX}, y=${regionStartY}`;
         |                                                                                                                                                               ^^^^^^^^
    8200 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8201 |                         }, 20);
    8202 |                       } else {
ERROR in src/App.tsx:8199:188
TS2304: Cannot find name 'regionStartX'.
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
    8198 |                         setTimeout(() => {
  > 8199 |                           const debugMsg = `🎯 POSITIONING LEFTOVER CONTENT:\nCalculated pos: x=${calcPos.x}, y=${calcPos.y}\nOverlay pos: x=${overlayX}, y=${overlayY}\nRegion start: x=${regionStartX}, y=${regionStartY}`;
         |                                                                                                                                                                                            ^^^^^^^^^^^^
    8200 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8201 |                         }, 20);
    8202 |                       } else {
ERROR in src/App.tsx:8199:207
TS2304: Cannot find name 'regionStartY'.
    8197 |                         // Store debug info using setTimeout to avoid re-render loop
    8198 |                         setTimeout(() => {
  > 8199 |                           const debugMsg = `🎯 POSITIONING LEFTOVER CONTENT:\nCalculated pos: x=${calcPos.x}, y=${calcPos.y}\nOverlay pos: x=${overlayX}, y=${overlayY}\nRegion start: x=${regionStartX}, y=${regionStartY}`;
         |                                                                                                                                                                                                               ^^^^^^^^^^^^
    8200 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8201 |                         }, 20);
    8202 |                       } else {
ERROR in src/App.tsx:8200:46
TS1382: Unexpected token. Did you mean `{'>'}` or `&gt;`?
    8198 |                         setTimeout(() => {
    8199 |                           const debugMsg = `🎯 POSITIONING LEFTOVER CONTENT:\nCalculated pos: x=${calcPos.x}, y=${calcPos.y}\nOverlay pos: x=${overlayX}, y=${overlayY}\nRegion start: x=${regionStartX}, y=${regionStartY}`;
  > 8200 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
         |                                              ^
    8201 |                         }, 20);
    8202 |                       } else {
    8203 |                         // In Project Mode, content should occupy the whole region
ERROR in src/App.tsx:8201:25
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8199 |                           const debugMsg = `🎯 POSITIONING LEFTOVER CONTENT:\nCalculated pos: x=${calcPos.x}, y=${calcPos.y}\nOverlay pos: x=${overlayX}, y=${overlayY}\nRegion start: x=${regionStartX}, y=${regionStartY}`;
    8200 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
  > 8201 |                         }, 20);
         |                         ^
    8202 |                       } else {
    8203 |                         // In Project Mode, content should occupy the whole region
    8204 |                         if (isProjectMode) {
ERROR in src/App.tsx:8202:23
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8200 |                           setDebugInfo(prev => [...prev.slice(-4), debugMsg]);
    8201 |                         }, 20);
  > 8202 |                       } else {
         |                       ^
    8203 |                         // In Project Mode, content should occupy the whole region
    8204 |                         if (isProjectMode) {
    8205 |                           overlayX = regionStartX;
ERROR in src/App.tsx:8204:25
TS1109: Expression expected.
    8202 |                       } else {
    8203 |                         // In Project Mode, content should occupy the whole region
  > 8204 |                         if (isProjectMode) {
         |                         ^^
    8205 |                           overlayX = regionStartX;
    8206 |                           overlayY = regionStartY;
    8207 |                         } else {
ERROR in src/App.tsx:8205:27
TS2304: Cannot find name 'overlayX'.
    8203 |                         // In Project Mode, content should occupy the whole region
    8204 |                         if (isProjectMode) {
  > 8205 |                           overlayX = regionStartX;
         |                           ^^^^^^^^
    8206 |                           overlayY = regionStartY;
    8207 |                         } else {
    8208 |                           // Use normal stacking position for other modes
ERROR in src/App.tsx:8205:38
TS2304: Cannot find name 'regionStartX'.
    8203 |                         // In Project Mode, content should occupy the whole region
    8204 |                         if (isProjectMode) {
  > 8205 |                           overlayX = regionStartX;
         |                                      ^^^^^^^^^^^^
    8206 |                           overlayY = regionStartY;
    8207 |                         } else {
    8208 |                           // Use normal stacking position for other modes
ERROR in src/App.tsx:8205:50
TS1005: '}' expected.
    8203 |                         // In Project Mode, content should occupy the whole region
    8204 |                         if (isProjectMode) {
  > 8205 |                           overlayX = regionStartX;
         |                                                  ^
    8206 |                           overlayY = regionStartY;
    8207 |                         } else {
    8208 |                           // Use normal stacking position for other modes
ERROR in src/App.tsx:8207:25
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8205 |                           overlayX = regionStartX;
    8206 |                           overlayY = regionStartY;
  > 8207 |                         } else {
         |                         ^
    8208 |                           // Use normal stacking position for other modes
    8209 |                           overlayX = regionStartX;
    8210 |                           overlayY = regionStartY + (currentY * scale);
ERROR in src/App.tsx:8209:27
TS2304: Cannot find name 'overlayX'.
    8207 |                         } else {
    8208 |                           // Use normal stacking position for other modes
  > 8209 |                           overlayX = regionStartX;
         |                           ^^^^^^^^
    8210 |                           overlayY = regionStartY + (currentY * scale);
    8211 |                         }
    8212 |                       }
ERROR in src/App.tsx:8209:38
TS2304: Cannot find name 'regionStartX'.
    8207 |                         } else {
    8208 |                           // Use normal stacking position for other modes
  > 8209 |                           overlayX = regionStartX;
         |                                      ^^^^^^^^^^^^
    8210 |                           overlayY = regionStartY + (currentY * scale);
    8211 |                         }
    8212 |                       }
ERROR in src/App.tsx:8209:50
TS1005: '}' expected.
    8207 |                         } else {
    8208 |                           // Use normal stacking position for other modes
  > 8209 |                           overlayX = regionStartX;
         |                                                  ^
    8210 |                           overlayY = regionStartY + (currentY * scale);
    8211 |                         }
    8212 |                       }
ERROR in src/App.tsx:8211:25
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8209 |                           overlayX = regionStartX;
    8210 |                           overlayY = regionStartY + (currentY * scale);
  > 8211 |                         }
         |                         ^
    8212 |                       }
    8213 |
    8214 |                       // In Project Mode, content occupies the whole region
ERROR in src/App.tsx:8212:23
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8210 |                           overlayY = regionStartY + (currentY * scale);
    8211 |                         }
  > 8212 |                       }
         |                       ^
    8213 |
    8214 |                       // In Project Mode, content occupies the whole region
    8215 |                       let overlayWidth = isProjectMode ? (region.width * scale) : (contentWidth * scale);
ERROR in src/App.tsx:8219:51
TS1382: Unexpected token. Did you mean `{'>'}` or `&gt;`?
    8217 |
    8218 |                       // Ensure content doesn't exceed region boundaries
  > 8219 |                       if (overlayX + overlayWidth > regionEndX) {
         |                                                   ^
    8220 |                         overlayWidth = regionEndX - overlayX;
    8221 |                       }
    8222 |                       if (overlayY + overlayHeight > regionEndY) {
ERROR in src/App.tsx:8220:25
TS2304: Cannot find name 'overlayWidth'.
    8218 |                       // Ensure content doesn't exceed region boundaries
    8219 |                       if (overlayX + overlayWidth > regionEndX) {
  > 8220 |                         overlayWidth = regionEndX - overlayX;
         |                         ^^^^^^^^^^^^
    8221 |                       }
    8222 |                       if (overlayY + overlayHeight > regionEndY) {
    8223 |                         overlayHeight = regionEndY - overlayY;
ERROR in src/App.tsx:8220:40
TS2304: Cannot find name 'regionEndX'.
    8218 |                       // Ensure content doesn't exceed region boundaries
    8219 |                       if (overlayX + overlayWidth > regionEndX) {
  > 8220 |                         overlayWidth = regionEndX - overlayX;
         |                                        ^^^^^^^^^^
    8221 |                       }
    8222 |                       if (overlayY + overlayHeight > regionEndY) {
    8223 |                         overlayHeight = regionEndY - overlayY;
ERROR in src/App.tsx:8220:53
TS2304: Cannot find name 'overlayX'.
    8218 |                       // Ensure content doesn't exceed region boundaries
    8219 |                       if (overlayX + overlayWidth > regionEndX) {
  > 8220 |                         overlayWidth = regionEndX - overlayX;
         |                                                     ^^^^^^^^
    8221 |                       }
    8222 |                       if (overlayY + overlayHeight > regionEndY) {
    8223 |                         overlayHeight = regionEndY - overlayY;
ERROR in src/App.tsx:8220:61
TS1005: '}' expected.
    8218 |                       // Ensure content doesn't exceed region boundaries
    8219 |                       if (overlayX + overlayWidth > regionEndX) {
  > 8220 |                         overlayWidth = regionEndX - overlayX;
         |                                                             ^
    8221 |                       }
    8222 |                       if (overlayY + overlayHeight > regionEndY) {
    8223 |                         overlayHeight = regionEndY - overlayY;
ERROR in src/App.tsx:8221:23
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8219 |                       if (overlayX + overlayWidth > regionEndX) {
    8220 |                         overlayWidth = regionEndX - overlayX;
  > 8221 |                       }
         |                       ^
    8222 |                       if (overlayY + overlayHeight > regionEndY) {
    8223 |                         overlayHeight = regionEndY - overlayY;
    8224 |                       }
ERROR in src/App.tsx:8222:52
TS1382: Unexpected token. Did you mean `{'>'}` or `&gt;`?
    8220 |                         overlayWidth = regionEndX - overlayX;
    8221 |                       }
  > 8222 |                       if (overlayY + overlayHeight > regionEndY) {
         |                                                    ^
    8223 |                         overlayHeight = regionEndY - overlayY;
    8224 |                       }
    8225 |
ERROR in src/App.tsx:8223:25
TS2304: Cannot find name 'overlayHeight'.
    8221 |                       }
    8222 |                       if (overlayY + overlayHeight > regionEndY) {
  > 8223 |                         overlayHeight = regionEndY - overlayY;
         |                         ^^^^^^^^^^^^^
    8224 |                       }
    8225 |
    8226 |                       // Update currentY for next content - but only for non-leftover content
ERROR in src/App.tsx:8223:41
TS2304: Cannot find name 'regionEndY'.
    8221 |                       }
    8222 |                       if (overlayY + overlayHeight > regionEndY) {
  > 8223 |                         overlayHeight = regionEndY - overlayY;
         |                                         ^^^^^^^^^^
    8224 |                       }
    8225 |
    8226 |                       // Update currentY for next content - but only for non-leftover content
ERROR in src/App.tsx:8223:54
TS2304: Cannot find name 'overlayY'.
    8221 |                       }
    8222 |                       if (overlayY + overlayHeight > regionEndY) {
  > 8223 |                         overlayHeight = regionEndY - overlayY;
         |                                                      ^^^^^^^^
    8224 |                       }
    8225 |
    8226 |                       // Update currentY for next content - but only for non-leftover content
ERROR in src/App.tsx:8223:62
TS1005: '}' expected.
    8221 |                       }
    8222 |                       if (overlayY + overlayHeight > regionEndY) {
  > 8223 |                         overlayHeight = regionEndY - overlayY;
         |                                                              ^
    8224 |                       }
    8225 |
    8226 |                       // Update currentY for next content - but only for non-leftover content
ERROR in src/App.tsx:8224:23
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8222 |                       if (overlayY + overlayHeight > regionEndY) {
    8223 |                         overlayHeight = regionEndY - overlayY;
  > 8224 |                       }
         |                       ^
    8225 |
    8226 |                       // Update currentY for next content - but only for non-leftover content
    8227 |                       if (!content.layout.occupyLeftoverSpace) {
ERROR in src/App.tsx:8228:25
TS1109: Expression expected.
    8226 |                       // Update currentY for next content - but only for non-leftover content
    8227 |                       if (!content.layout.occupyLeftoverSpace) {
  > 8228 |                         const nextY = currentY + contentHeight;
         |                         ^^^^^
    8229 |                         currentY = Math.min(nextY, region.height);
    8230 |                       }
    8231 |                       // Leftover content doesn't affect stacking position since it uses calculated position
ERROR in src/App.tsx:8230:23
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8228 |                         const nextY = currentY + contentHeight;
    8229 |                         currentY = Math.min(nextY, region.height);
  > 8230 |                       }
         |                       ^
    8231 |                       // Leftover content doesn't affect stacking position since it uses calculated position
    8232 |
    8233 |                       return (
ERROR in src/App.tsx:8234:65
TS2304: Cannot find name 'contentIndex'.
    8232 |
    8233 |                       return (
  > 8234 |                         <g key={`${region.id}-content-overlay-${contentIndex}`}>
         |                                                                 ^^^^^^^^^^^^
    8235 |                           {/* Content overlay rectangle - More visible background */}
    8236 |                           <rect
    8237 |                             x={overlayX}
ERROR in src/App.tsx:8237:32
TS2304: Cannot find name 'overlayX'.
    8235 |                           {/* Content overlay rectangle - More visible background */}
    8236 |                           <rect
  > 8237 |                             x={overlayX}
         |                                ^^^^^^^^
    8238 |                             y={overlayY}
    8239 |                             width={overlayWidth}
    8240 |                             height={overlayHeight}
ERROR in src/App.tsx:8238:32
TS2304: Cannot find name 'overlayY'.
    8236 |                           <rect
    8237 |                             x={overlayX}
  > 8238 |                             y={overlayY}
         |                                ^^^^^^^^
    8239 |                             width={overlayWidth}
    8240 |                             height={overlayHeight}
    8241 |                             fill={(() => {
ERROR in src/App.tsx:8239:36
TS2304: Cannot find name 'overlayWidth'.
    8237 |                             x={overlayX}
    8238 |                             y={overlayY}
  > 8239 |                             width={overlayWidth}
         |                                    ^^^^^^^^^^^^
    8240 |                             height={overlayHeight}
    8241 |                             fill={(() => {
    8242 |                               // Use content-type specific background color with higher opacity for visibility
ERROR in src/App.tsx:8240:37
TS2304: Cannot find name 'overlayHeight'.
    8238 |                             y={overlayY}
    8239 |                             width={overlayWidth}
  > 8240 |                             height={overlayHeight}
         |                                     ^^^^^^^^^^^^^
    8241 |                             fill={(() => {
    8242 |                               // Use content-type specific background color with higher opacity for visibility
    8243 |                               const contentType = content.type;
ERROR in src/App.tsx:8243:51
TS2304: Cannot find name 'content'.
    8241 |                             fill={(() => {
    8242 |                               // Use content-type specific background color with higher opacity for visibility
  > 8243 |                               const contentType = content.type;
         |                                                   ^^^^^^^
    8244 |                               const backgroundColors: { [key: string]: string } = {
    8245 |                                 'line-text': 'rgba(59, 130, 246, 0.25)',           // Light blue background
    8246 |                                 'pure-english-paragraph': 'rgba(16, 185, 129, 0.25)',  // Light green background
ERROR in src/App.tsx:8255:59
TS2304: Cannot find name 'content'.
    8253 |                             })()}
    8254 |                             opacity={0.8}
  > 8255 |                             stroke={getContentObjectColor(content.type, contentIndex)}
         |                                                           ^^^^^^^
    8256 |                             strokeWidth={2}
    8257 |                             strokeOpacity={0.9}
    8258 |                             rx={3}
ERROR in src/App.tsx:8255:73
TS2304: Cannot find name 'contentIndex'.
    8253 |                             })()}
    8254 |                             opacity={0.8}
  > 8255 |                             stroke={getContentObjectColor(content.type, contentIndex)}
         |                                                                         ^^^^^^^^^^^^
    8256 |                             strokeWidth={2}
    8257 |                             strokeOpacity={0.9}
    8258 |                             rx={3}
ERROR in src/App.tsx:8274:56
TS2304: Cannot find name 'content'.
    8272 |                             onDoubleClick={(e) => {
    8273 |                               e.stopPropagation();
  > 8274 |                               handleContentDoubleClick(content, region.id);
         |                                                        ^^^^^^^
    8275 |                             }}
    8276 |                           />
    8277 |
ERROR in src/App.tsx:8279:102
TS2304: Cannot find name 'content'.
    8277 |
    8278 |                           {/* Overflow dots for text-based content */}
  > 8279 |                           {['line-text', 'pure-english-paragraph', 'translation-paragraph'].includes(content.type) && isOverflowEnabled(content.id) && (() => {
         |                                                                                                      ^^^^^^^
    8280 |                             const role = getOverflowRole(content.id);
    8281 |                             const dotRadius = 4;
    8282 |                             const centerX = overlayX + overlayWidth / 2;
ERROR in src/App.tsx:8279:137
TS2304: Cannot find name 'content'.
    8277 |
    8278 |                           {/* Overflow dots for text-based content */}
  > 8279 |                           {['line-text', 'pure-english-paragraph', 'translation-paragraph'].includes(content.type) && isOverflowEnabled(content.id) && (() => {
         |                                                                                                                                         ^^^^^^^
    8280 |                             const role = getOverflowRole(content.id);
    8281 |                             const dotRadius = 4;
    8282 |                             const centerX = overlayX + overlayWidth / 2;
ERROR in src/App.tsx:8280:58
TS2304: Cannot find name 'content'.
    8278 |                           {/* Overflow dots for text-based content */}
    8279 |                           {['line-text', 'pure-english-paragraph', 'translation-paragraph'].includes(content.type) && isOverflowEnabled(content.id) && (() => {
  > 8280 |                             const role = getOverflowRole(content.id);
         |                                                          ^^^^^^^
    8281 |                             const dotRadius = 4;
    8282 |                             const centerX = overlayX + overlayWidth / 2;
    8283 |
ERROR in src/App.tsx:8282:45
TS2304: Cannot find name 'overlayX'.
    8280 |                             const role = getOverflowRole(content.id);
    8281 |                             const dotRadius = 4;
  > 8282 |                             const centerX = overlayX + overlayWidth / 2;
         |                                             ^^^^^^^^
    8283 |
    8284 |                             return (
    8285 |                               <g>
ERROR in src/App.tsx:8282:56
TS2304: Cannot find name 'overlayWidth'.
    8280 |                             const role = getOverflowRole(content.id);
    8281 |                             const dotRadius = 4;
  > 8282 |                             const centerX = overlayX + overlayWidth / 2;
         |                                                        ^^^^^^^^^^^^
    8283 |
    8284 |                             return (
    8285 |                               <g>
ERROR in src/App.tsx:8290:41
TS2304: Cannot find name 'overlayY'.
    8288 |                                   <circle
    8289 |                                     cx={centerX}
  > 8290 |                                     cy={overlayY - dotRadius}
         |                                         ^^^^^^^^
    8291 |                                     r={dotRadius}
    8292 |                                     fill="#f44336"
    8293 |                                     stroke="white"
ERROR in src/App.tsx:8302:39
TS2304: Cannot find name 'overlayY'.
    8300 |                                 <circle
    8301 |                                   cx={centerX}
  > 8302 |                                   cy={overlayY + overlayHeight + dotRadius}
         |                                       ^^^^^^^^
    8303 |                                   r={dotRadius}
    8304 |                                   fill="#4caf50"
    8305 |                                   stroke="white"
ERROR in src/App.tsx:8302:50
TS2304: Cannot find name 'overlayHeight'.
    8300 |                                 <circle
    8301 |                                   cx={centerX}
  > 8302 |                                   cy={overlayY + overlayHeight + dotRadius}
         |                                                  ^^^^^^^^^^^^^
    8303 |                                   r={dotRadius}
    8304 |                                   fill="#4caf50"
    8305 |                                   stroke="white"
ERROR in src/App.tsx:8316:21
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8314 |                         </g>
    8315 |                       );
  > 8316 |                     });
         |                     ^
    8317 |                   })()}
    8318 |
    8319 |                   {/* Region Label */}
ERROR in src/App.tsx:8317:19
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8315 |                       );
    8316 |                     });
  > 8317 |                   })()}
         |                   ^
    8318 |
    8319 |                   {/* Region Label */}
    8320 |                   <text
ERROR in src/App.tsx:8317:23
TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
    8315 |                       );
    8316 |                     });
  > 8317 |                   })()}
         |                       ^
    8318 |
    8319 |                   {/* Region Label */}
    8320 |                   <text