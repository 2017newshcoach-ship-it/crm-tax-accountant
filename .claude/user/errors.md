# Error Log

[context] Error: Told user "WSL is already a sandbox" — WSL2 is NOT a sandbox, it has full access to host filesystem via /mnt/c/ | Reality: Only Docker provides true isolation for YOLO mode. WSL is convenient but not safe for --dangerously-skip-permissions.

[config] Error: ALL hook scripts (28/30) had CRLF line endings — every hook crashed with `$'\r': command not found` and never actually executed | Fix: `sed -i 's/\r$//'` all scripts + SessionStart hook auto-fixes on every session + PostToolUse auto-fixes .sh files on write + `.gitattributes` forces eol=lf

[code] Error: `plan-mode-session-start.sh` used `xargs -0 ls -t` without `--no-run-if-empty` — when `find` returned nothing, `ls -t` listed CWD, always finding a "recent spec" and bypassing the gate | Fix: Added `--no-run-if-empty` flag

[code] Error: `audit-spec.sh` used `grep -cE ... || echo 0` which produces "0\n0" (doubled output) when grep returns 0 matches — causes syntax error in arithmetic comparison | Fix: Use `var=$(grep -c ...) || var=0` pattern instead

[config] Error: No TDD enforcement hook existed — after spec was written, nothing prevented writing implementation before tests | Fix: Created `enforce-tdd-order.sh` with `.tdd-needs-test`/`.tdd-test-written` state files

[config] Error: Spec template `.claude/templates/spec.md.template` was referenced everywhere but didn't exist | Fix: Created the template file

