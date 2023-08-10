import { got } from "got";
import { z } from "zod";
import { TypedEmitter } from "tiny-typed-emitter";
import OneSecMailAPI, { BASE_API_URL, FORBIDDEN_LOGIN } from "./OneSecMailAPI.js";
import { shortMessageSchema } from "./schemas.js";
import type { ShortMessage, Attachment, Message, Options } from "./types.js";

interface OneSecMailboxEvents {
  newMessage: (message: OneSecMailShortMessage) => void;
  error: (error: Error) => void;
}

export default async function OneSecMail(emailAddress?: string): Promise<OneSecMailbox>;
export default async function OneSecMail(options: Partial<Options>): Promise<OneSecMailbox>;
export default async function OneSecMail(
  emailAddress: string,
  options?: Partial<Options>,
): Promise<OneSecMailbox>;
export default async function OneSecMail(
  a?: string | Partial<Options>,
  b?: Partial<Options>,
): Promise<OneSecMailbox> {
  let emailAddress: string | null = null;
  let options: Partial<Options> = {};

  if (typeof a === "string" && typeof b === "undefined") {
    emailAddress = a;
  } else if (typeof a === "object" && typeof b === "undefined") {
    options = a;
  } else if (typeof a === "string" && typeof b === "object") {
    emailAddress = a;
    options = b;
  }

  const api = new OneSecMailAPI(options);

  if (!emailAddress) {
    [emailAddress] = await api.genRandomMailbox();
    return new OneSecMailbox(emailAddress, api);
  }

  const schema = z.string().email();

  if (!schema.safeParse(emailAddress).success) {
    throw new Error("Email address must be a valid email address");
  }

  const [local, domain] = emailAddress.toLowerCase().split("@");

  if (FORBIDDEN_LOGIN.includes(local)) {
    throw new Error(
      `For security reason you cannot read messages from addresses: ${FORBIDDEN_LOGIN.map(
        (local) => `${local}@${domain}`,
      ).join(", ")}`,
    );
  }

  const domainList = await api.getDomainList();

  if (!domainList.includes(domain)) {
    throw new Error(
      `Email address must contain a domain contained in the following list: ${domainList
        .map((domain) => `${local}@${domain}`)
        .join(", ")}`,
    );
  }

  return new OneSecMailbox(`${local}@${domain}`, api);
}

class OneSecMailbox extends TypedEmitter<OneSecMailboxEvents> {
  readonly #api: OneSecMailAPI;
  readonly #local: string;
  readonly #domain: string;
  readonly #controller: AbortController;
  #state: "STARTED" | "STOPPED" = "STOPPED";
  #lastMessageid = 0;
  #intervalTimer!: NodeJS.Timer;
  readonly emailAddress: string;

  constructor(emailAddress: string, api: OneSecMailAPI) {
    super();
    const [local, domain] = emailAddress.split("@");
    this.#api = api;
    this.#local = local;
    this.#domain = domain;
    this.#controller = new AbortController();
    this.emailAddress = emailAddress;
  }

  async getMessages(options?: Partial<Options>): Promise<OneSecMailShortMessage[]> {
    const messages = await this.#api.getMessages(this.#local, this.#domain, options);

    return messages.map((message) => {
      return new OneSecMailShortMessage(this.emailAddress, message, this.#api);
    });
  }

  async clearMessages(options?: Partial<Options>): Promise<void> {
    try {
      await got.post("https://www.1secmail.com/mailbox", {
        form: {
          action: "deleteMailbox",
          login: this.#local,
          domain: this.#domain,
        },
        retry: {
          limit: options?.retry ?? this.#api.retry,
        },
        timeout: {
          request: options?.timeout ?? this.#api.timeout,
        },
      });
    } catch (e) {
      throw new Error("HTTP request failed");
    }
  }

  async #polling(intervalTime: number) {
    const start = new Date().getTime();
    let rerun = false;
    try {
      const { body } = await got.get(BASE_API_URL, {
        searchParams: { action: "getMessages", login: this.#local, domain: this.#domain },
        retry: { limit: 0 },
        timeout: { request: 5_000 },
        signal: this.#controller.signal,
      });

      const schema = z.array(shortMessageSchema);

      let messages: ShortMessage[];
      try {
        messages = schema.parse(JSON.parse(body));
      } catch (e) {
        throw new Error("Malformed response");
      }

      messages.sort((a, b) => a.id - b.id);
      messages = messages.filter((message) => message.id > this.#lastMessageid);
      this.#lastMessageid = messages.at(-1)?.id ?? this.#lastMessageid;

      for (const message of messages) {
        this.emit("newMessage", new OneSecMailShortMessage(this.emailAddress, message, this.#api));
      }

      rerun = true;
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        this.emit("error", error);
        rerun = true;
      }
    }

    if (rerun) {
      const end = new Date().getTime();
      const diff = end - start;
      this.#intervalTimer = setTimeout(this.#polling.bind(this), intervalTime - diff, intervalTime);
    }
  }

  startPolling(intervalTime = 5000): boolean {
    if (intervalTime < 1000) throw new RangeError("`intervalTime` must be at least 1000");
    if (this.#state === "STARTED") return false;
    this.#polling(intervalTime);
    this.#state = "STARTED";
    return true;
  }

  stopPolling(): boolean {
    if (this.#state === "STOPPED") return false;
    this.#controller.abort();
    clearTimeout(this.#intervalTimer);
    this.#state = "STOPPED";
    return true;
  }
}

class OneSecMailShortMessage {
  readonly #api: OneSecMailAPI;
  readonly #local: string;
  readonly #domain: string;
  readonly #emailAddress: string;
  readonly id: number;
  readonly from: string;
  readonly subject: string;
  readonly date: string;

  constructor(emailAddress: string, message: ShortMessage, api: OneSecMailAPI) {
    const [local, domain] = emailAddress.split("@");
    this.#api = api;
    this.#local = local;
    this.#domain = domain;
    this.#emailAddress = emailAddress;
    this.id = message.id;
    this.from = message.from;
    this.subject = message.subject;
    this.date = message.date;
  }

  async fetchFullMessage(options?: Partial<Options>): Promise<OneSecMailMessage> {
    const message = await this.#api.readMessage(this.#local, this.#domain, this.id, options);

    if (!message) throw new Error("Message no longer exists");

    return new OneSecMailMessage(this.#emailAddress, message, this.#api);
  }

  serialize(): ShortMessage {
    return {
      id: this.id,
      from: this.from,
      subject: this.subject,
      date: this.date,
    };
  }
}

class OneSecMailMessage {
  readonly id: number;
  readonly from: string;
  readonly subject: string;
  readonly date: string;
  readonly attachments: OneSecMailAttachment[];
  readonly body: string;
  readonly textBody: string;
  readonly htmlBody: string;

  constructor(emailAddress: string, message: Message, api: OneSecMailAPI) {
    this.id = message.id;
    this.from = message.from;
    this.subject = message.subject;
    this.date = message.date;
    this.attachments = message.attachments.map((attachment) => {
      return new OneSecMailAttachment(emailAddress, message.id, attachment, api);
    });
    this.body = message.body;
    this.textBody = message.textBody;
    this.htmlBody = message.htmlBody;
  }

  serialize(): Message {
    return {
      id: this.id,
      from: this.from,
      subject: this.subject,
      date: this.date,
      attachments: this.attachments.map((attachment) => attachment.serialize()),
      body: this.body,
      textBody: this.textBody,
      htmlBody: this.htmlBody,
    };
  }
}

class OneSecMailAttachment {
  readonly #api: OneSecMailAPI;
  readonly #local: string;
  readonly #domain: string;
  readonly #messageId: number;
  readonly filename: string;
  readonly contentType: string;
  readonly size: number;

  constructor(emailAddress: string, messageId: number, attachment: Attachment, api: OneSecMailAPI) {
    const [local, domain] = emailAddress.split("@");
    this.#api = api;
    this.#local = local;
    this.#domain = domain;
    this.#messageId = messageId;
    this.filename = attachment.filename;
    this.contentType = attachment.contentType;
    this.size = attachment.size;
  }

  async download(options?: Partial<Options>): Promise<Buffer> {
    const file = await this.#api.download(
      this.#local,
      this.#domain,
      this.#messageId,
      this.filename,
      options,
    );

    if (!file) throw new Error("File no longer exists");

    return file;
  }

  serialize(): Attachment {
    return {
      filename: this.filename,
      contentType: this.contentType,
      size: this.size,
    };
  }
}
