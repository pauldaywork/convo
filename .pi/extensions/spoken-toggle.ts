import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const entryType = "spoken-coding-mode";
const skillUrl = new URL("../skills/spoken-coding/SKILL.md", import.meta.url);

function isEnabled(ctx: ExtensionContext): boolean {
	const entries = ctx.sessionManager.getBranch();
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (entry.type === "custom" && entry.customType === entryType) {
			return (entry.data as { enabled?: boolean } | undefined)?.enabled === true;
		}
	}
	return false;
}

function readSkill(): string {
	const source = readFileSync(fileURLToPath(skillUrl), "utf8");
	return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
}

export default function spokenToggle(pi: ExtensionAPI) {
	pi.registerCommand("spoken", {
		description: "Toggle natural spoken-response formatting: /spoken on|off|status",
		handler: async (args, ctx) => {
			const action = args.trim().toLowerCase() || "status";
			if (action === "status") {
				ctx.ui.notify(`Spoken formatting is ${isEnabled(ctx) ? "on" : "off"}.`, "info");
				return;
			}
			if (action !== "on" && action !== "off") {
				ctx.ui.notify("Use /spoken on, /spoken off, or /spoken status.", "warning");
				return;
			}
			if (action === "on") {
				try {
					readSkill();
				} catch (error) {
					ctx.ui.notify(`Cannot load spoken-coding skill: ${String(error)}`, "error");
					return;
				}
			}
			const enabled = action === "on";
			if (isEnabled(ctx) !== enabled) {
				pi.appendEntry(entryType, { enabled });
			}
			ctx.ui.notify(`Spoken formatting is ${action} for this session.`, "info");
		},
	});

	pi.on("before_agent_start", (_event, ctx) => {
		if (isEnabled(ctx)) {
			_event.systemPromptOptions.sections.spoken_coding = readSkill();
		} else {
			delete _event.systemPromptOptions.sections.spoken_coding;
		}
	});
}
