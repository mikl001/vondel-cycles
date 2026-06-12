import "server-only";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailAdapter {
  provider: "resend" | "console";
  send(message: EmailMessage): Promise<void>;
}

/** Dev/CI adapter: prints the mail instead of sending it. */
const consoleAdapter: EmailAdapter = {
  provider: "console",
  async send(message) {
    console.info(
      `[email:console] to=${message.to} subject="${message.subject}"\n${message.text}`,
    );
  },
};

function createResendAdapter(apiKey: string): EmailAdapter {
  return {
    provider: "resend",
    async send(message) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Vondel Cycles <demo@vondelcycles.example>",
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
      });
      if (!res.ok) {
        throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
      }
    },
  };
}

export function getEmailAdapter(): EmailAdapter {
  const key = process.env.RESEND_API_KEY;
  return key ? createResendAdapter(key) : consoleAdapter;
}
