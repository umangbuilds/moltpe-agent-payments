# Multi-Sprint Template

A template for work that requires both parallel and sequential phases.

## Structure

```
Phase 1 (Parallel):
  Sprint A: [Independent task 1]
  Sprint B: [Independent task 2]
  Sprint C: [Independent task 3]

Quality Gate 1:
  - All Phase 1 sprints pass verification

Phase 2 (Sequential):
  Sprint D: [Depends on A + B]
  Sprint E: [Depends on D]

Quality Gate 2:
  - All Phase 2 sprints pass verification
  - Integration tests pass
```

## Checklist

### Phase 1 — Parallel Work
1. [ ] Identify independent tasks
2. [ ] Assign each to a separate agent or worktree
3. [ ] Execute in parallel
4. [ ] Run quality gate checks

### Phase 2 — Sequential Work
1. [ ] Confirm Phase 1 quality gate passed
2. [ ] Execute dependent tasks in order
3. [ ] Run integration checks after each step
4. [ ] Run final quality gate

## When to Use

- Large features with independent sub-components
- Refactors that touch multiple systems
- Initial project scaffolding (like this repo)
