# Code Cleanup Tracking

This file tracks obsolete code that should be removed after testing the JSON refactoring.

## Files to Delete

### Backend
- [x] `backend/prompts_markdown.py.backup` - Backup of old markdown prompts (safe to delete after testing)

## Code to Remove from Existing Files

### frontend/src/ResearchForm.js

**Old PDF Generation Function (~294 lines, lines 170-460)**
- Location: Lines starting with old `downloadResults` implementation
- Reason: Replaced by `PdfGenerator.js` with `generatePDFFromJSON()`
- Safe to remove: After confirming new PDF generation works
- Estimated lines: ~294

**Markdown Parsing Functions (No longer used)**
1. `parseMarkdownTable(text)` - Line ~464
   - Used to parse markdown tables into arrays
   - Now handled by JSON structure directly
   
2. `renderMarkdown(text)` - Line ~561
   - Used to render markdown with table detection
   - Now handled by JsonRenderers components
   
3. `renderTextContent(text)` - Line ~590
   - Used to render markdown text with headers, bullets, etc.
   - Now handled by JsonRenderers components
   
4. `renderTable(tableData)` - Location TBD
   - Used to render markdown tables as HTML
   - Now handled by Table components in JsonRenderers

**Helper Functions**
- `stripMarkdown()` function (if still present in old PDF code)
- Any markdown regex parsing utilities

**Estimated Total Cleanup:**
- ~400-500 lines of markdown parsing code in ResearchForm.js
- These functions are no longer called after switching to JSON renderers

## Imports to Remove

### frontend/src/ResearchForm.js
After removing old PDF function:
- ~~`import { jsPDF } from 'jspdf';`~~ (Keep - used by PdfGenerator.js)
- Check if any lucide-react icons are unused (Gem, Pickaxe, Hammer) after mining theme removal

## Testing Checklist Before Cleanup

- [ ] Run full research with JSON output
- [ ] Verify all 7 steps render correctly with JsonRenderers
- [ ] Test PDF download with new PdfGenerator
- [ ] Verify PDF contains all data properly formatted
- [ ] Test database save/load cycle
- [ ] Confirm no errors in browser console
- [ ] Test on actual research (not just mock data)

## Cleanup Order (After Testing)

1. **Phase 1 - Safe Deletions**
   - Delete `backend/prompts_markdown.py.backup`
   
2. **Phase 2 - Remove Dead Code** (After confirming JSON works)
   - Remove old PDF function from ResearchForm.js (~300 lines)
   - Remove `parseMarkdownTable` function
   - Remove `renderMarkdown` function
   - Remove `renderTextContent` function
   - Remove `renderTable` function

3. **Phase 3 - Final Cleanup**
   - Remove any unused imports
   - Remove any commented-out markdown code
   - Update comments referencing markdown

## Notes

- Keep markdown parsing functions temporarily as fallback until JSON is fully validated
- Old PDF function is currently unreachable but harmless (downloadResults now calls PdfGenerator)
- All markdown code can be safely removed once JSON flow is confirmed working

## Files Created (New - Keep These)

- ✅ `frontend/src/JsonRenderers.js` - 7 specialized rendering components
- ✅ `frontend/src/PdfGenerator.js` - New JSON-based PDF generation
- ✅ `backend/prompts.py` - Rewritten with JSON schemas

Last Updated: January 22, 2026
