/**
 * Agent Runner — abstraction layer for agent-driven skills
 *
 * Lets the pipeline run with ANY coding agent (OpenCode, Claude Code,
 * Codex) or with NO agent at all (QA_AGENT=none).
 *
 * Skills that need LLM reasoning (2: Exploratory Testing, 4: Test
 * Generation) go through this module. Skills that are pure code
 * (1, 3, 5, 6) bypass it entirely.
 *
 * Adapter selection:
 *   QA_AGENT=none       → skills are skipped gracefully (default)
 *   QA_AGENT=opencode   → dispatched via opencode sub-agents
 *   QA_AGENT=claude-code → dispatched via claude-code (stub)
 *   QA_AGENT=codex      → dispatched via codex (stub)
 */

const SKILLS_REQUIRING_AGENT = {
  'exploratory-testing': {
    description: 'Discover pages, forms, and user flows via Playwright',
    agent: 'qa-explorer',
    output_dir: '04-exploration',
  },
  'test-generation': {
    description: 'Generate .spec.ts files from requirements + DOM',
    agent: 'qa-generator',
    output_dir: '06-playwright',
  },
};

/**
 * Get the active agent adapter from env.
 */
export function getAdapter() {
  return process.env.QA_AGENT || 'none';
}

/**
 * Run an agent-driven skill.
 *
 * Returns:
 *   - { skipped: true, reason, output_dir } if no agent configured
 *   - { success: true, summary, output_dir } if agent ran successfully
 *   - { success: false, error, output_dir } if agent failed
 */
export async function runAgent(skillName, input, options = {}) {
  const adapter = options.adapter || getAdapter();
  const skill = SKILLS_REQUIRING_AGENT[skillName];

  if (!skill) {
    return { success: false, error: `Unknown agent skill: ${skillName}` };
  }

  if (adapter === 'none') {
    return {
      skipped: true,
      reason: `QA_AGENT=none — ${skillName} requires an AI agent (${skill.agent})`,
      output_dir: skill.output_dir,
      description: skill.description,
    };
  }

  if (adapter === 'opencode') {
    return runOpenCodeAgent(skillName, skill, input, options);
  }

  if (adapter === 'claude-code') {
    return runClaudeCodeAgent(skillName, skill, input, options);
  }

  if (adapter === 'codex') {
    return runCodexAgent(skillName, skill, input, options);
  }

  return {
    skipped: true,
    reason: `Unknown QA_AGENT value: ${adapter}. Set QA_AGENT=none, opencode, claude-code, or codex.`,
    output_dir: skill.output_dir,
  };
}

async function runOpenCodeAgent(skillName, skill, input, options) {
  return {
    success: false,
    error: `OpenCode adapter not yet implemented for ${skillName}. Set QA_AGENT=none to skip agent skills.`,
    output_dir: skill.output_dir,
  };
}

async function runClaudeCodeAgent(skillName, skill, input, options) {
  return {
    success: false,
    error: `Claude Code adapter not yet implemented for ${skillName}. Set QA_AGENT=none to skip agent skills.`,
    output_dir: skill.output_dir,
  };
}

async function runCodexAgent(skillName, skill, input, options) {
  return {
    success: false,
    error: `Codex adapter not yet implemented for ${skillName}. Set QA_AGENT=none to skip agent skills.`,
    output_dir: skill.output_dir,
  };
}

/**
 * Check if a skill requires an agent.
 */
export function requiresAgent(skillName) {
  return skillName in SKILLS_REQUIRING_AGENT;
}

export { SKILLS_REQUIRING_AGENT };
