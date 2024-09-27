// npx ts-node --skipProject wehere-bot/scripts/manage-webhook.ts

import * as $ from "@inquirer/prompts";

type PreparedRequest = {
  url: string;
  body: Record<string, unknown>;
};

function getUrl(token: string, action: string) {
  return `https://api.telegram.org/bot${token}/${action}`;
}

async function prepareSetWebhook(token: string): Promise<PreparedRequest> {
  const webhookUrl = await $.input({
    message: "Webhook URL (HTTPS URL to send updates to)\n ",
    required: true,
    validate: (value) => value === value.trim() && value.startsWith("https://"),
  });

  const secretToken = await $.input({
    message: "Secret token\n ",
    validate: (value) => value === value.trim(),
  });

  return {
    url: getUrl(token, "setWebhook"),
    body: {
      url: webhookUrl,
      secret_token: secretToken || undefined,
      allowed_updates: ["message", "callback_query", "message_reaction"],
    },
  };
}

async function prepareDeleteWebhook(token: string): Promise<PreparedRequest> {
  return {
    url: getUrl(token, "deleteWebhook"),
    body: {},
  };
}

async function prepareGetWebhookInfo(token: string): Promise<PreparedRequest> {
  return {
    url: getUrl(token, "getWebhookInfo"),
    body: {},
  };
}

async function main() {
  const token = await $.input({
    message: "Telegram bot token (46 characters)\n ",
    required: true,
    validate: (value) => value === value.trim() && value.length === 46,
  });

  const action = await $.select<string>({
    message: "What do you want to do?",
    choices: ["setWebhook", "deleteWebhook", "getWebhookInfo"],
  });

  const preparedRequest = await (async () => {
    switch (action) {
      case "setWebhook":
        return await prepareSetWebhook(token);
      case "deleteWebhook":
        return await prepareDeleteWebhook(token);
      case "getWebhookInfo":
        return await prepareGetWebhookInfo(token);
      default:
        throw new Error(`invalid action: ${encodeURIComponent(action)}`);
    }
  })();

  console.log(preparedRequest.url);
  console.log(JSON.stringify(preparedRequest.body, null, 2));

  const confirmation = await $.confirm({
    message: "Do you want to send a POST request?",
  });

  if (!confirmation) {
    console.log("Aborted.");
    process.exit(0);
  }

  const response = await fetch(preparedRequest.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preparedRequest.body, null, 2),
  });
  console.log(response.status);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
