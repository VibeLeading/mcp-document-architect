#!/usr/bin/env node

export interface MissionScript {
  outcome: string;
  scope: string[];
  constraints: string[];
  verification: string[];
}

export interface DraftSection {
  heading: string;
  kind: "intro" | "body" | "verification" | "conclusion";
  scaffold: string;
  requirement: string;
}

export interface Draft {
  title: string;
  mission: MissionScript;
  outline: DraftSection[];
  alignmentNotes: string[];
}

const SECTION_LABELS = {
  outcome: ["outcome", "objective", "goal", "mission"],
  scope: ["scope"],
  constraints: ["constraint", "limit", "boundary"],
  verification: ["verify", "verification", "measure", "success criteria"],
} as const;

function classifyLine(line: string): "outcome" | "scope" | "constraints" | "verification" | null {
  const lower = line.toLowerCase();
  for (const [key, labels] of Object.entries(SECTION_LABELS)) {
    if (labels.some((l) => lower.includes(l))) return key as keyof typeof SECTION_LABELS;
  }
  return null;
}

function stripMarker(line: string): string {
  return line.replace(/^[-*•\d.)\s]+/, "").trim();
}

/**
 * The DraftEngine: given a Mission Script (outcome, scope, constraints,
 * verification), produce a structured report outline with section scaffolds,
 * each annotated with the requirement it must fulfill.
 *
 * Parsing is a deterministic heuristic over line prefixes/keywords. For full
 * prose, plug an LLM provider into the same outline the renderer emits.
 */
export class DraftEngine {
  parse(script: string): MissionScript {
    const mission: MissionScript = { outcome: "", scope: [], constraints: [], verification: [] };
    let current: keyof MissionScript | null = null;
    for (const rawLine of script.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;
      const category = classifyLine(line);
      if (category) {
        current = category;
        const rest = stripMarker(line);
        if (rest) {
          if (category === "outcome") mission.outcome += (mission.outcome ? " " : "") + rest;
          else mission[category].push(rest);
        }
      } else if (current && current !== "outcome") {
        const bullet = stripMarker(line);
        if (bullet) mission[current].push(bullet);
      }
    }
    return mission;
  }

  buildOutline(title: string, mission: MissionScript, sections: string[] = []): DraftSection[] {
    const outline: DraftSection[] = [
      {
        heading: "Executive Summary",
        kind: "intro",
        scaffold: "State the outcome in 2–3 sentences.",
        requirement: `Reflect the outcome: "${mission.outcome || "not specified"}".`,
      },
      {
        heading: sections[0] ?? "Findings & Details",
        kind: "body",
        scaffold: "...",
        requirement: mission.scope.length
          ? `Cover the scope points: ${mission.scope.join("; ")}.`
          : "No explicit scope was provided.",
      },
      {
        heading: "Constraints & Risks",
        kind: "body",
        scaffold: "...",
        requirement: mission.constraints.length
          ? `Respect constraints: ${mission.constraints.join("; ")}.`
          : "No explicit constraints were provided.",
      },
      {
        heading: "Conclusion & Recommendations",
        kind: "conclusion",
        scaffold: "Recap and propose next steps.",
        requirement: "Reinforce that the outcome is achievable within stated constraints.",
      },
      {
        heading: "Verification",
        kind: "verification",
        scaffold: "Checklist of how each claim is verified.",
        requirement: mission.verification.length
          ? `Evidence must satisfy: ${mission.verification.join("; ")}.`
          : "No explicit verification criteria were provided.",
      },
    ];
    // Append any extra requested sections.
    for (let i = 1; i < sections.length; i++) {
      outline.splice(outline.length - 1, 0, {
        heading: sections[i],
        kind: "body",
        scaffold: "...",
        requirement: "TBD by author.",
      });
    }
    return outline;
  }

  draft(title: string, missionScript: string, sections?: string[]): Draft {
    const mission = this.parse(missionScript);
    const requested = sections ?? [];
    const outline = this.buildOutline(title, mission, requested);
    const alignmentNotes = [
      "This draft is anchored to the Pilot's Mission Script — every section maps back to outcome, scope, constraints, or verification.",
      "The Verification section must be traceable to the stated success criteria before sign-off.",
      mission.constraints.length
        ? `Ensure the final report stays within: ${mission.constraints.join("; ")}.`
        : "No constraints detected; confirm none apply before sign-off.",
    ];
    return { title, mission, outline, alignmentNotes };
  }
}
