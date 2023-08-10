import { got, type Got, type SearchParameters } from "got";
import { z } from "zod";
import { shortMessageSchema, messageSchema } from "./schemas.js";
import type { ShortMessage, Message, Options } from "./types.js";

export const BASE_API_URL = "https://www.1secmail.com/api/v1/";

export const FORBIDDEN_LOGIN = [
  "abuse",
  "admin",
  "contact",
  "hostmaster",
  "postmaster",
  "webmaster",
];

export default class OneSecMailAPI {
  readonly #got: Got;
  readonly retry: number;
  readonly timeout: number;

  constructor(options?: Partial<Options>) {
    this.#got = got.extend({ prefixUrl: BASE_API_URL });
    this.retry = options?.retry ?? 2;
    this.timeout = options?.timeout ?? 10_000;
  }

  async request(searchParams: SearchParameters, options?: Partial<Options>) {
    try {
      return await this.#got({
        searchParams,
        retry: {
          limit: options?.retry ?? this.retry,
        },
        timeout: {
          request: options?.timeout ?? this.timeout,
        },
      });
    } catch (e) {
      throw new Error("HTTP request failed");
    }
  }

  async genRandomMailbox(count?: number): Promise<string[]>;
  async genRandomMailbox(options: Partial<Options>): Promise<string[]>;
  async genRandomMailbox(count: number, options?: Partial<Options>): Promise<string[]>;
  async genRandomMailbox(a?: number | Partial<Options>, b?: Partial<Options>): Promise<string[]> {
    let count = 1;
    let options: Partial<Options> = {};

    if (typeof a === "number" && typeof b === "undefined") {
      count = a;
    } else if (typeof a === "object" && typeof b === "undefined") {
      options = a;
    } else if (typeof a === "number" && typeof b === "object") {
      count = a;
      options = b;
    }

    if (count < 1 || count > 500) throw new RangeError("`count` must be between 1 and 500");

    const { body } = await this.request({ action: "genRandomMailbox", count }, options);

    const schema = z.array(z.string().email()).length(count);

    try {
      return schema.parse(JSON.parse(body));
    } catch (e) {
      throw new Error("Malformed response");
    }
  }

  async getDomainList(options?: Partial<Options>): Promise<string[]> {
    const { body } = await this.request({ action: "getDomainList" }, options);

    const schema = z.array(z.string().regex(/([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}/)).nonempty();

    try {
      return schema.parse(JSON.parse(body));
    } catch (e) {
      throw new Error("Malformed response");
    }
  }

  async getMessages(
    login: string,
    domain: string,
    options?: Partial<Options>,
  ): Promise<ShortMessage[]> {
    const { body } = await this.request({ action: "getMessages", login, domain }, options);

    const schema = z.array(shortMessageSchema);

    try {
      return schema.parse(JSON.parse(body));
    } catch (e) {
      throw new Error("Malformed response");
    }
  }

  async readMessage(
    login: string,
    domain: string,
    id: number,
    options?: Partial<Options>,
  ): Promise<Message | null> {
    const { body } = await this.request({ action: "readMessage", login, domain, id }, options);

    if (body === "Messagenotfound") return null;

    try {
      return messageSchema.parse(JSON.parse(body));
    } catch (e) {
      throw new Error("Malformed response");
    }
  }

  async download(
    login: string,
    domain: string,
    id: number,
    file: string,
    options?: Partial<Options>,
  ): Promise<Buffer | null> {
    const { body, headers } = await this.request(
      { action: "download", login, domain, id, file },
      options,
    );

    if (headers["content-disposition"] !== `attachment; filename="${file}"`) return null;

    return Buffer.from(body);
  }
}
