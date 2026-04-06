# Multi-Batch Development Process v2.0

A process for building software in parallel batches with AI-assisted development.

## Overview

The multi-batch process splits work into independent batches that run in parallel, with quality gates between phases. Each batch contains tasks that do not depend on each other, allowing concurrent execution by multiple agents or developers.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  ORCHESTRATOR                     │
│  Reads plan file. Dispatches batches.            │
│  Runs verification. Never writes code.           │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Agent A  │  │ Agent B  │  │ Agent C  │       │
│  │ Batch 1  │  │ Batch 1  │  │ Batch 1  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │              │
│       ▼              ▼              ▼              │
│  ┌─────────────────────────────────────────┐     │
│  │          QUALITY GATE 1                  │     │
│  │  Grep checks · Test run · Lint pass      │     │
│  └─────────────────────────────────────────┘     │
│       │              │              │              │
│       ▼              ▼              ▼              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Agent A  │  │ Agent B  │  │ Agent C  │       │
│  │ Batch 2  │  │ Batch 2  │  │ Batch 2  │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                   │
└─────────────────────────────────────────────────┘
```

## Process Steps

### Step 1: Write the Plan File

The plan file is the single source of truth. It must contain:
- Complete directory structure
- Full content specification for every file
- Status checkboxes for tracking
- Verification commands

Store the plan file outside the repo (e.g., `/tmp/plan.md`). Sub-agents read ONLY this file for their instructions.

### Step 2: Batch Assignment

Group tasks into batches where:
- Tasks within a batch have NO dependencies on each other
- Tasks across batches may have sequential dependencies
- Each batch can be assigned to a separate agent

### Step 3: Parallel Execution

Dispatch agents for each batch. Each agent:
1. Reads the plan file
2. Creates the files assigned to their batch
3. Reports completion status and any issues

### Step 4: Quality Gates

After each batch completes, run verification:
- Banned-string checks (grep for terms that should not appear)
- Linting and formatting checks
- Test execution (if applicable)
- File count verification

Zero failures required to proceed to the next batch.

### Step 5: Integration

After all batches pass quality gates:
1. Stage all changes
2. Run final verification
3. Commit with descriptive message
4. Push to remote

## Model Selection

Use the most capable model for orchestration and planning. Use a fast, cost-effective model for file creation tasks that follow a clear specification. Never use reasoning models for batch execution — they add latency without benefit for spec-driven work.

## Working with Git Worktrees

For parallel work on different branches, use git worktrees:

```bash
# Create a worktree for a feature branch
git worktree add ../feature-branch feature/your-feature

# List active worktrees
git worktree list

# Clean up when done
git worktree remove ../feature-branch
```

Worktrees let multiple agents work on separate branches without conflicts.

## Sprint Templates

See `templates/basic-feature.md` for single-sprint work and `templates/multi-sprint.md` for parallel+sequential sprints.

## Quality Gate Checklist

Before declaring a batch complete:
- [ ] All files from spec created
- [ ] No banned strings present
- [ ] No secrets or credentials committed
- [ ] File count matches plan
- [ ] All placeholder content is clearly marked
- [ ] Lint passes (if configured)
- [ ] Tests pass (if configured)

## Resuming After Failure

If a session dies mid-execution:
1. Read the plan file
2. Check status of each checkbox
3. Resume from the first incomplete task
4. Re-run verification for the entire batch

The plan file is the recovery mechanism. Keep it updated as tasks complete.
