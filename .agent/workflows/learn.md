---
description: Log a new lesson learned to AGENTS.md files across all repos
---

# Log Lesson Learned

When the user wants to document a lesson, gotcha, or important discovery:

1. Ask the user to describe the lesson in 1-2 sentences
2. Add the lesson to **both** AGENTS.md files with today's date:
   - `c:\Users\Epic\Documents\GitHub\seeker-eats\AGENTS.md`
   - `c:\Users\Epic\Documents\GitHub\seekereats-relay\AGENTS.md`
3. Place the entry under "## Recent Lessons Learned" section
4. Format: `- **YYYY-MM-DD**: [Description of lesson]`
5. If it's a common mistake, also add to "## Common Mistakes to Avoid"
6. Commit the changes with message: `docs: add lesson learned - [brief summary]`
