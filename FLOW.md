# 1. Clone your base repo
git clone your-template-repo new-project-name
cd new-project-name

# 2. Open Claude Code
claude

# 3. Run project agent
Read .agents/project-agent.md and follow its instructions.
Output: PROJECT_CONTEXT.md, src/styles.css @theme updated, src/config/seo.config.ts updated.

# 4. Build starter pages with your confirmed branding
Read .agents/frontend-agent.md and follow its instructions.
Then build the starter pages task defined in frontend-agent.md.
Prerequisite: PROJECT_CONTEXT.md must exist and @theme must have real hex values — not placeholders.

# 5. Plan features — spec agent
Read .agents/spec-agent.md and follow its instructions.
Output: one specs/[feature]-mvp-[n].json file per MVP.

# 5b. Reflect on spec output — before proceeding to any code
Review the generated spec JSON against the spec-agent quality checklist:
  - Scope matches PROJECT_CONTEXT.md exactly — no additions, no omissions
  - All roles match PROJECT_CONTEXT.md → Roles & Permissions
  - No conflicts with User or Session base Prisma models
  - All file paths match structure in CLAUDE.md
  - Each procedure specifies publicProcedure or protectedProcedure correctly
  - Hook files follow use-[actor]-[feature]-queries/mutations.ts naming
  - Every form has a schema_file and zod_rule per field
  - out_of_scope names anything that could be confused as in-scope
  - JSON is valid

If any item fails — revise the spec and re-check before moving to step 6.
Do not proceed to backend-agent with a spec that has not passed this checklist.

# 6. Build backend (per MVP)
Prerequisite: specs/[feature]-mvp-[n].json must exist and have passed step 5b.
Read .agents/backend-agent.md and follow its instructions.
Then implement specs/[feature]-mvp-[n].json

# 7. Build frontend (per MVP)
Prerequisite: backend-agent must have completed step 6 for this MVP.
Read .agents/frontend-agent.md and follow its instructions.
Then implement specs/[feature]-mvp-[n].json

# 8. Unit tests (after BOTH backend + frontend)
Prerequisite: steps 6 AND 7 must both be complete for this MVP before running this step.
Read .agents/unit-test-agent.md and follow its instructions.
Then write unit tests for specs/[feature]-mvp-[n].json

# 9. E2E tests
Prerequisite: step 7 (frontend) must be complete for this MVP.
Read .agents/e2e-agent.md and follow its instructions.
Then write e2e tests for specs/[feature]-mvp-[n].json

# 10. Review anytime
Read .agents/clean-code-agent.md and review [filepath]

# --- Repeating steps 6–9 for each MVP ---
# For each subsequent MVP, repeat steps 6 → 7 → 8 → 9 in order.
# Always start from step 5 (spec) if the feature is new.
# Example sequence for a feature with 3 MVPs:
#   specs/orders-mvp-1.json → steps 6, 7, 8, 9
#   specs/orders-mvp-2.json → steps 6, 7, 8, 9
#   specs/orders-mvp-3.json → steps 6, 7, 8, 9