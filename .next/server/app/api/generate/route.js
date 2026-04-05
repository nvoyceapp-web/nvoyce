/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/generate/route";
exports.ids = ["app/api/generate/route"];
exports.modules = {

/***/ "(rsc)/./app/api/generate/route.ts":
/*!***********************************!*\
  !*** ./app/api/generate/route.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _anthropic_ai_sdk__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @anthropic-ai/sdk */ \"(rsc)/./node_modules/@anthropic-ai/sdk/index.mjs\");\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/index.mjs\");\n\n\n\nconst anthropic = new _anthropic_ai_sdk__WEBPACK_IMPORTED_MODULE_1__[\"default\"]({\n    apiKey: process.env.ANTHROPIC_API_KEY\n});\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_2__.createClient)(\"https://ukswmynscatbjanqxcjk.supabase.co\", process.env.SUPABASE_SERVICE_ROLE_KEY);\nasync function POST(req) {\n    // Auth temporarily disabled while debugging Clerk session issue\n    const userId = 'test-user';\n    const body = await req.json();\n    const { docType, clientName, clientEmail, businessName, serviceDescription, price, timeline, paymentTerms, notes } = body;\n    // 2. Build the Claude prompt\n    // This is where the AI magic happens — we give Claude structured instructions\n    // and ask for structured output so we can render it beautifully\n    const systemPrompt = `You are a professional document generator for freelancers and small businesses.\nGenerate a professional ${docType} in JSON format. The output must be ONLY valid JSON — absolutely no markdown formatting, no triple backticks, no code blocks, no extra text. Return only the raw JSON object with this structure:\n{\n  \"documentNumber\": \"string (e.g. INV-2024-001 or PROP-2024-001)\",\n  \"date\": \"string (today's date formatted as Month DD, YYYY)\",\n  \"dueDate\": \"string (based on payment terms)\",\n  \"from\": {\n    \"name\": \"string\",\n    \"tagline\": \"string (a short professional tagline for their business)\"\n  },\n  \"to\": {\n    \"name\": \"string\",\n    \"email\": \"string\"\n  },\n  \"subject\": \"string (a brief professional subject line for this ${docType})\",\n  \"introduction\": \"string (2-3 sentence professional intro paragraph)\",\n  \"lineItems\": [\n    {\n      \"description\": \"string\",\n      \"quantity\": number,\n      \"unitPrice\": number,\n      \"total\": number\n    }\n  ],\n  \"subtotal\": number,\n  \"tax\": number,\n  \"total\": number,\n  \"paymentTerms\": \"string\",\n  \"timeline\": \"string\",\n  \"notes\": \"string\",\n  \"closingMessage\": \"string (warm, professional closing 1-2 sentences)\"\n}`;\n    const userPrompt = `Generate a professional ${docType} with these details:\n- Business name: ${businessName}\n- Client name: ${clientName}\n- Client email: ${clientEmail}\n- Service: ${serviceDescription}\n- Price: $${price}\n- Timeline: ${timeline}\n- Payment terms: ${paymentTerms}\n- Additional notes: ${notes || 'None'}\n\nIMPORTANT: Return ONLY the JSON object, nothing else. No markdown, no code blocks, no explanation.`;\n    try {\n        // 3. Call Claude API\n        const message = await anthropic.messages.create({\n            model: 'claude-sonnet-4-6',\n            max_tokens: 2000,\n            messages: [\n                {\n                    role: 'user',\n                    content: userPrompt\n                }\n            ],\n            system: systemPrompt\n        });\n        // 4. Parse the JSON response from Claude\n        const content = message.content[0];\n        if (content.type !== 'text') {\n            throw new Error('Unexpected response type from Claude');\n        }\n        const generatedDoc = JSON.parse(content.text);\n        // 5. Save to Supabase\n        const { data, error } = await supabase.from('documents').insert({\n            user_id: userId,\n            doc_type: docType,\n            client_name: clientName,\n            client_email: clientEmail,\n            business_name: businessName,\n            price: parseFloat(price.replace(',', '')),\n            status: 'draft',\n            generated_content: generatedDoc,\n            form_data: body\n        }).select('id').single();\n        if (error) {\n            console.error('Supabase insert error:', error);\n            throw error;\n        }\n        console.log('Document saved successfully:', data.id);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            id: data.id,\n            document: generatedDoc\n        });\n    } catch (err) {\n        console.error('Generation error full:', JSON.stringify(err?.error || err, null, 2));\n        console.error('Status:', err?.status);\n        console.error('Message:', err?.message);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Failed to generate document'\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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dkM7WUFBRVUsUUFBUTtRQUFJO0lBRWxCO0FBQ0YiLCJzb3VyY2VzIjpbIi9Vc2Vycy9ubmFtZGl1em91a3d1L0RvY3VtZW50cy9DbGF1ZGUvUHJvamVjdHMvTm5hbWRpIGNyZWF0ZSdzIGFuIGFwcC9udm95Y2UvYXBwL2FwaS9nZW5lcmF0ZS9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInXG5pbXBvcnQgQW50aHJvcGljIGZyb20gJ0BhbnRocm9waWMtYWkvc2RrJ1xuaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ1xuXG5jb25zdCBhbnRocm9waWMgPSBuZXcgQW50aHJvcGljKHtcbiAgYXBpS2V5OiBwcm9jZXNzLmVudi5BTlRIUk9QSUNfQVBJX0tFWSEsXG59KVxuXG5jb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChcbiAgcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMISxcbiAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSFcbilcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxOiBOZXh0UmVxdWVzdCkge1xuICAvLyBBdXRoIHRlbXBvcmFyaWx5IGRpc2FibGVkIHdoaWxlIGRlYnVnZ2luZyBDbGVyayBzZXNzaW9uIGlzc3VlXG4gIGNvbnN0IHVzZXJJZCA9ICd0ZXN0LXVzZXInXG5cbiAgY29uc3QgYm9keSA9IGF3YWl0IHJlcS5qc29uKClcbiAgY29uc3Qge1xuICAgIGRvY1R5cGUsXG4gICAgY2xpZW50TmFtZSxcbiAgICBjbGllbnRFbWFpbCxcbiAgICBidXNpbmVzc05hbWUsXG4gICAgc2VydmljZURlc2NyaXB0aW9uLFxuICAgIHByaWNlLFxuICAgIHRpbWVsaW5lLFxuICAgIHBheW1lbnRUZXJtcyxcbiAgICBub3RlcyxcbiAgfSA9IGJvZHlcblxuICAvLyAyLiBCdWlsZCB0aGUgQ2xhdWRlIHByb21wdFxuICAvLyBUaGlzIGlzIHdoZXJlIHRoZSBBSSBtYWdpYyBoYXBwZW5zIOKAlCB3ZSBnaXZlIENsYXVkZSBzdHJ1Y3R1cmVkIGluc3RydWN0aW9uc1xuICAvLyBhbmQgYXNrIGZvciBzdHJ1Y3R1cmVkIG91dHB1dCBzbyB3ZSBjYW4gcmVuZGVyIGl0IGJlYXV0aWZ1bGx5XG4gIGNvbnN0IHN5c3RlbVByb21wdCA9IGBZb3UgYXJlIGEgcHJvZmVzc2lvbmFsIGRvY3VtZW50IGdlbmVyYXRvciBmb3IgZnJlZWxhbmNlcnMgYW5kIHNtYWxsIGJ1c2luZXNzZXMuXG5HZW5lcmF0ZSBhIHByb2Zlc3Npb25hbCAke2RvY1R5cGV9IGluIEpTT04gZm9ybWF0LiBUaGUgb3V0cHV0IG11c3QgYmUgT05MWSB2YWxpZCBKU09OIOKAlCBhYnNvbHV0ZWx5IG5vIG1hcmtkb3duIGZvcm1hdHRpbmcsIG5vIHRyaXBsZSBiYWNrdGlja3MsIG5vIGNvZGUgYmxvY2tzLCBubyBleHRyYSB0ZXh0LiBSZXR1cm4gb25seSB0aGUgcmF3IEpTT04gb2JqZWN0IHdpdGggdGhpcyBzdHJ1Y3R1cmU6XG57XG4gIFwiZG9jdW1lbnROdW1iZXJcIjogXCJzdHJpbmcgKGUuZy4gSU5WLTIwMjQtMDAxIG9yIFBST1AtMjAyNC0wMDEpXCIsXG4gIFwiZGF0ZVwiOiBcInN0cmluZyAodG9kYXkncyBkYXRlIGZvcm1hdHRlZCBhcyBNb250aCBERCwgWVlZWSlcIixcbiAgXCJkdWVEYXRlXCI6IFwic3RyaW5nIChiYXNlZCBvbiBwYXltZW50IHRlcm1zKVwiLFxuICBcImZyb21cIjoge1xuICAgIFwibmFtZVwiOiBcInN0cmluZ1wiLFxuICAgIFwidGFnbGluZVwiOiBcInN0cmluZyAoYSBzaG9ydCBwcm9mZXNzaW9uYWwgdGFnbGluZSBmb3IgdGhlaXIgYnVzaW5lc3MpXCJcbiAgfSxcbiAgXCJ0b1wiOiB7XG4gICAgXCJuYW1lXCI6IFwic3RyaW5nXCIsXG4gICAgXCJlbWFpbFwiOiBcInN0cmluZ1wiXG4gIH0sXG4gIFwic3ViamVjdFwiOiBcInN0cmluZyAoYSBicmllZiBwcm9mZXNzaW9uYWwgc3ViamVjdCBsaW5lIGZvciB0aGlzICR7ZG9jVHlwZX0pXCIsXG4gIFwiaW50cm9kdWN0aW9uXCI6IFwic3RyaW5nICgyLTMgc2VudGVuY2UgcHJvZmVzc2lvbmFsIGludHJvIHBhcmFncmFwaClcIixcbiAgXCJsaW5lSXRlbXNcIjogW1xuICAgIHtcbiAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJzdHJpbmdcIixcbiAgICAgIFwicXVhbnRpdHlcIjogbnVtYmVyLFxuICAgICAgXCJ1bml0UHJpY2VcIjogbnVtYmVyLFxuICAgICAgXCJ0b3RhbFwiOiBudW1iZXJcbiAgICB9XG4gIF0sXG4gIFwic3VidG90YWxcIjogbnVtYmVyLFxuICBcInRheFwiOiBudW1iZXIsXG4gIFwidG90YWxcIjogbnVtYmVyLFxuICBcInBheW1lbnRUZXJtc1wiOiBcInN0cmluZ1wiLFxuICBcInRpbWVsaW5lXCI6IFwic3RyaW5nXCIsXG4gIFwibm90ZXNcIjogXCJzdHJpbmdcIixcbiAgXCJjbG9zaW5nTWVzc2FnZVwiOiBcInN0cmluZyAod2FybSwgcHJvZmVzc2lvbmFsIGNsb3NpbmcgMS0yIHNlbnRlbmNlcylcIlxufWBcblxuICBjb25zdCB1c2VyUHJvbXB0ID0gYEdlbmVyYXRlIGEgcHJvZmVzc2lvbmFsICR7ZG9jVHlwZX0gd2l0aCB0aGVzZSBkZXRhaWxzOlxuLSBCdXNpbmVzcyBuYW1lOiAke2J1c2luZXNzTmFtZX1cbi0gQ2xpZW50IG5hbWU6ICR7Y2xpZW50TmFtZX1cbi0gQ2xpZW50IGVtYWlsOiAke2NsaWVudEVtYWlsfVxuLSBTZXJ2aWNlOiAke3NlcnZpY2VEZXNjcmlwdGlvbn1cbi0gUHJpY2U6ICQke3ByaWNlfVxuLSBUaW1lbGluZTogJHt0aW1lbGluZX1cbi0gUGF5bWVudCB0ZXJtczogJHtwYXltZW50VGVybXN9XG4tIEFkZGl0aW9uYWwgbm90ZXM6ICR7bm90ZXMgfHwgJ05vbmUnfVxuXG5JTVBPUlRBTlQ6IFJldHVybiBPTkxZIHRoZSBKU09OIG9iamVjdCwgbm90aGluZyBlbHNlLiBObyBtYXJrZG93biwgbm8gY29kZSBibG9ja3MsIG5vIGV4cGxhbmF0aW9uLmBcblxuICB0cnkge1xuICAgIC8vIDMuIENhbGwgQ2xhdWRlIEFQSVxuICAgIGNvbnN0IG1lc3NhZ2UgPSBhd2FpdCBhbnRocm9waWMubWVzc2FnZXMuY3JlYXRlKHtcbiAgICAgIG1vZGVsOiAnY2xhdWRlLXNvbm5ldC00LTYnLFxuICAgICAgbWF4X3Rva2VuczogMjAwMCxcbiAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgY29udGVudDogdXNlclByb21wdCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBzeXN0ZW06IHN5c3RlbVByb21wdCxcbiAgICB9KVxuXG4gICAgLy8gNC4gUGFyc2UgdGhlIEpTT04gcmVzcG9uc2UgZnJvbSBDbGF1ZGVcbiAgICBjb25zdCBjb250ZW50ID0gbWVzc2FnZS5jb250ZW50WzBdXG4gICAgaWYgKGNvbnRlbnQudHlwZSAhPT0gJ3RleHQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgcmVzcG9uc2UgdHlwZSBmcm9tIENsYXVkZScpXG4gICAgfVxuXG4gICAgY29uc3QgZ2VuZXJhdGVkRG9jID0gSlNPTi5wYXJzZShjb250ZW50LnRleHQpXG5cbiAgICAvLyA1LiBTYXZlIHRvIFN1cGFiYXNlXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAgIC5mcm9tKCdkb2N1bWVudHMnKVxuICAgICAgLmluc2VydCh7XG4gICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgZG9jX3R5cGU6IGRvY1R5cGUsXG4gICAgICAgIGNsaWVudF9uYW1lOiBjbGllbnROYW1lLFxuICAgICAgICBjbGllbnRfZW1haWw6IGNsaWVudEVtYWlsLFxuICAgICAgICBidXNpbmVzc19uYW1lOiBidXNpbmVzc05hbWUsXG4gICAgICAgIHByaWNlOiBwYXJzZUZsb2F0KHByaWNlLnJlcGxhY2UoJywnLCAnJykpLFxuICAgICAgICBzdGF0dXM6ICdkcmFmdCcsXG4gICAgICAgIGdlbmVyYXRlZF9jb250ZW50OiBnZW5lcmF0ZWREb2MsXG4gICAgICAgIGZvcm1fZGF0YTogYm9keSxcbiAgICAgIH0pXG4gICAgICAuc2VsZWN0KCdpZCcpXG4gICAgICAuc2luZ2xlKClcblxuICAgIGlmIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignU3VwYWJhc2UgaW5zZXJ0IGVycm9yOicsIGVycm9yKVxuICAgICAgdGhyb3cgZXJyb3JcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnRG9jdW1lbnQgc2F2ZWQgc3VjY2Vzc2Z1bGx5OicsIGRhdGEuaWQpXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgaWQ6IGRhdGEuaWQsIGRvY3VtZW50OiBnZW5lcmF0ZWREb2MgfSlcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICBjb25zb2xlLmVycm9yKCdHZW5lcmF0aW9uIGVycm9yIGZ1bGw6JywgSlNPTi5zdHJpbmdpZnkoZXJyPy5lcnJvciB8fCBlcnIsIG51bGwsIDIpKVxuICAgIGNvbnNvbGUuZXJyb3IoJ1N0YXR1czonLCBlcnI/LnN0YXR1cylcbiAgICBjb25zb2xlLmVycm9yKCdNZXNzYWdlOicsIGVycj8ubWVzc2FnZSlcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oXG4gICAgICB7IGVycm9yOiAnRmFpbGVkIHRvIGdlbmVyYXRlIGRvY3VtZW50JyB9LFxuICAgICAgeyBzdGF0dXM6IDUwMCB9XG4gICAgKVxuICB9XG59XG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiQW50aHJvcGljIiwiY3JlYXRlQ2xpZW50IiwiYW50aHJvcGljIiwiYXBpS2V5IiwicHJvY2VzcyIsImVudiIsIkFOVEhST1BJQ19BUElfS0VZIiwic3VwYWJhc2UiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwiLCJTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZIiwiUE9TVCIsInJlcSIsInVzZXJJZCIsImJvZHkiLCJqc29uIiwiZG9jVHlwZSIsImNsaWVudE5hbWUiLCJjbGllbnRFbWFpbCIsImJ1c2luZXNzTmFtZSIsInNlcnZpY2VEZXNjcmlwdGlvbiIsInByaWNlIiwidGltZWxpbmUiLCJwYXltZW50VGVybXMiLCJub3RlcyIsInN5c3RlbVByb21wdCIsInVzZXJQcm9tcHQiLCJtZXNzYWdlIiwibWVzc2FnZXMiLCJjcmVhdGUiLCJtb2RlbCIsIm1heF90b2tlbnMiLCJyb2xlIiwiY29udGVudCIsInN5c3RlbSIsInR5cGUiLCJFcnJvciIsImdlbmVyYXRlZERvYyIsIkpTT04iLCJwYXJzZSIsInRleHQiLCJkYXRhIiwiZXJyb3IiLCJmcm9tIiwiaW5zZXJ0IiwidXNlcl9pZCIsImRvY190eXBlIiwiY2xpZW50X25hbWUiLCJjbGllbnRfZW1haWwiLCJidXNpbmVzc19uYW1lIiwicGFyc2VGbG9hdCIsInJlcGxhY2UiLCJzdGF0dXMiLCJnZW5lcmF0ZWRfY29udGVudCIsImZvcm1fZGF0YSIsInNlbGVjdCIsInNpbmdsZSIsImNvbnNvbGUiLCJsb2ciLCJpZCIsImRvY3VtZW50IiwiZXJyIiwic3RyaW5naWZ5Il0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/generate/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgenerate%2Froute&page=%2Fapi%2Fgenerate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgenerate%2Froute.ts&appDir=%2FUsers%2Fnnamdiuzoukwu%2FDocuments%2FClaude%2FProjects%2FNnamdi%20create's%20an%20app%2Fnvoyce%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fnnamdiuzoukwu%2FDocuments%2FClaude%2FProjects%2FNnamdi%20create's%20an%20app%2Fnvoyce&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgenerate%2Froute&page=%2Fapi%2Fgenerate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgenerate%2Froute.ts&appDir=%2FUsers%2Fnnamdiuzoukwu%2FDocuments%2FClaude%2FProjects%2FNnamdi%20create's%20an%20app%2Fnvoyce%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fnnamdiuzoukwu%2FDocuments%2FClaude%2FProjects%2FNnamdi%20create's%20an%20app%2Fnvoyce&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_nnamdiuzoukwu_Documents_Claude_Projects_Nnamdi_create_s_an_app_nvoyce_app_api_generate_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/generate/route.ts */ \"(rsc)/./app/api/generate/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/generate/route\",\n        pathname: \"/api/generate\",\n        filename: \"route\",\n        bundlePath: \"app/api/generate/route\"\n    },\n    resolvedPagePath: \"/Users/nnamdiuzoukwu/Documents/Claude/Projects/Nnamdi create's an app/nvoyce/app/api/generate/route.ts\",\n    nextConfigOutput,\n    userland: _Users_nnamdiuzoukwu_Documents_Claude_Projects_Nnamdi_create_s_an_app_nvoyce_app_api_generate_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZnZW5lcmF0ZSUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGZ2VuZXJhdGUlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZnZW5lcmF0ZSUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRm5uYW1kaXV6b3Vrd3UlMkZEb2N1bWVudHMlMkZDbGF1ZGUlMkZQcm9qZWN0cyUyRk5uYW1kaSUyMGNyZWF0ZSdzJTIwYW4lMjBhcHAlMkZudm95Y2UlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGbm5hbWRpdXpvdWt3dSUyRkRvY3VtZW50cyUyRkNsYXVkZSUyRlByb2plY3RzJTJGTm5hbWRpJTIwY3JlYXRlJ3MlMjBhbiUyMGFwcCUyRm52b3ljZSZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDc0Q7QUFDbkk7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi9Vc2Vycy9ubmFtZGl1em91a3d1L0RvY3VtZW50cy9DbGF1ZGUvUHJvamVjdHMvTm5hbWRpIGNyZWF0ZSdzIGFuIGFwcC9udm95Y2UvYXBwL2FwaS9nZW5lcmF0ZS9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvZ2VuZXJhdGUvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9nZW5lcmF0ZVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvZ2VuZXJhdGUvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCIvVXNlcnMvbm5hbWRpdXpvdWt3dS9Eb2N1bWVudHMvQ2xhdWRlL1Byb2plY3RzL05uYW1kaSBjcmVhdGUncyBhbiBhcHAvbnZveWNlL2FwcC9hcGkvZ2VuZXJhdGUvcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgenerate%2Froute&page=%2Fapi%2Fgenerate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgenerate%2Froute.ts&appDir=%2FUsers%2Fnnamdiuzoukwu%2FDocuments%2FClaude%2FProjects%2FNnamdi%20create's%20an%20app%2Fnvoyce%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fnnamdiuzoukwu%2FDocuments%2FClaude%2FProjects%2FNnamdi%20create's%20an%20app%2Fnvoyce&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "node:fs":
/*!**************************!*\
  !*** external "node:fs" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:fs");

/***/ }),

/***/ "node:stream":
/*!******************************!*\
  !*** external "node:stream" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:stream");

/***/ }),

/***/ "node:stream/web":
/*!**********************************!*\
  !*** external "node:stream/web" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:stream/web");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "worker_threads":
/*!*********************************!*\
  !*** external "worker_threads" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("worker_threads");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tslib","vendor-chunks/iceberg-js","vendor-chunks/formdata-node","vendor-chunks/@anthropic-ai","vendor-chunks/form-data-encoder","vendor-chunks/whatwg-url","vendor-chunks/agentkeepalive","vendor-chunks/tr46","vendor-chunks/web-streams-polyfill","vendor-chunks/node-fetch","vendor-chunks/webidl-conversions","vendor-chunks/ms","vendor-chunks/humanize-ms","vendor-chunks/event-target-shim","vendor-chunks/abort-controller"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgenerate%2Froute&page=%2Fapi%2Fgenerate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgenerate%2Froute.ts&appDir=%2FUsers%2Fnnamdiuzoukwu%2FDocuments%2FClaude%2FProjects%2FNnamdi%20create's%20an%20app%2Fnvoyce%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fnnamdiuzoukwu%2FDocuments%2FClaude%2FProjects%2FNnamdi%20create's%20an%20app%2Fnvoyce&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();