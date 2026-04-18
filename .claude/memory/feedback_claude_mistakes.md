---
name: Claude accountability standards
description: High standards for implementation quality, testing, and communication
type: feedback
---

**Rule: Thorough verification before committing**
- Do NOT commit changes without understanding their full impact
- Test changes locally mentally before pushing
- When changes affect data loading, verify the query syntax is correct
- Check git diffs carefully before committing

**Why:** Made dashboard changes on April 11 that broke stats loading. User had to troubleshoot and reinstall node_modules. Changes to success notification handler shouldn't have affected stats, but insufficient review of impact led to wasted time.

**How to apply:**
- Read the entire function before editing any part of it
- Trace through the data flow: where does data come from → where does it go → what displays it
- For dashboard changes: verify both the success banner useEffect AND the main fetchStats useEffect are correct
- When reverting: ensure the revert fully restores original behavior, not a hybrid broken state
- Commit messages must accurately describe what changed AND why

**Also:**
- Use memory system to document completed work
- Use TodoWrite to track multi-step tasks before starting
- Don't blame environment issues when the code might be wrong
- Own mistakes immediately and clearly explain what went wrong
