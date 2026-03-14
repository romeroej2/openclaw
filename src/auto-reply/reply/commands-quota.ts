import { logVerbose } from "../../globals.js";
import { formatUsageReportLines, loadProviderUsageSummary } from "../../infra/provider-usage.js";
import type { UsageProviderId } from "../../infra/provider-usage.types.js";
import type { CommandHandler } from "./commands-types.js";

// This command covers GPT (Codex) and Claude quota only.
const QUOTA_PROVIDERS: UsageProviderId[] = ["openai-codex", "anthropic"];

export const handleQuotaCommand: CommandHandler = async (params, allowTextCommands) => {
  if (!allowTextCommands) {
    return null;
  }
  const normalized = params.command.commandBodyNormalized;
  if (normalized !== "/quota" && !normalized.startsWith("/quota ")) {
    return null;
  }
  if (!params.command.isAuthorizedSender) {
    logVerbose(
      `Ignoring /quota from unauthorized sender: ${params.command.senderId || "<unknown>"}`,
    );
    return { shouldContinue: false };
  }

  let text: string;
  try {
    const summary = await loadProviderUsageSummary({
      timeoutMs: 5000,
      providers: QUOTA_PROVIDERS,
    });
    const lines = formatUsageReportLines(summary, { now: Date.now() });
    text = lines.join("\n");
  } catch (err) {
    text = `Usage: error fetching quota — ${String(err)}`;
  }

  return {
    shouldContinue: false,
    reply: { text },
  };
};
