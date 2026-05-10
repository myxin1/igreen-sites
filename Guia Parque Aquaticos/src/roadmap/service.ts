import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ROADMAP_TASKS, type RoadmapTask } from "./tasks.js";

const ROADMAP_PATH = resolve(process.cwd(), "roadmap.md");

type RoadmapState = Record<RoadmapTask, boolean>;

function defaultState(): RoadmapState {
  return Object.fromEntries(ROADMAP_TASKS.map((task) => [task, false])) as RoadmapState;
}

function serialize(state: RoadmapState): string {
  const lines = ["# Roadmap", ""];
  for (const task of ROADMAP_TASKS) {
    lines.push(`- [${state[task] ? "x" : " "}] ${task}`);
  }
  lines.push("");
  return lines.join("\n");
}

async function readState(): Promise<RoadmapState> {
  try {
    const content = await readFile(ROADMAP_PATH, "utf8");
    const state = defaultState();

    for (const task of ROADMAP_TASKS) {
      const checked = new RegExp(`^- \\[x\\] ${task}$`, "m").test(content);
      const unchecked = new RegExp(`^- \\[ \\] ${task}$`, "m").test(content);
      state[task] = checked ? true : unchecked ? false : state[task];
    }

    return state;
  } catch {
    return defaultState();
  }
}

export async function ensureRoadmapFile(): Promise<void> {
  const state = await readState();
  await writeFile(ROADMAP_PATH, serialize(state), "utf8");
}

export async function updateRoadmapTask(task: RoadmapTask, done: boolean): Promise<void> {
  const state = await readState();
  state[task] = done;
  await writeFile(ROADMAP_PATH, serialize(state), "utf8");
}

export async function updateRoadmapTasks(patch: Partial<RoadmapState>): Promise<void> {
  const state = await readState();
  for (const [task, done] of Object.entries(patch)) {
    state[task as RoadmapTask] = Boolean(done);
  }
  await writeFile(ROADMAP_PATH, serialize(state), "utf8");
}
