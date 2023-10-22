import { test } from "@japa/runner";
import nock from "nock";
import OneSecMailAPI, { BASE_API_URL } from "../src/OneSecMailAPI.js";
import { type Options } from "../src/types.js";
import { IncomingMessage } from "node:http";

const options: Options = {
  retry: 0,
  timeout: 1000,
};

const api = new OneSecMailAPI(options);

const login = "demo";
const domain = "1secmail.com";

test.group("request()", () => {
  test("it should return a response", async ({ expect }) => {
    nock(BASE_API_URL).get("/").query({ action: "example" }).reply(200);

    const result = await api.request({ action: "example" });

    expect(result).toBeInstanceOf(IncomingMessage);
  });

  test("it should throw an error", async ({ expect }) => {
    nock(BASE_API_URL).get("/").query({ action: "example" }).delay(200);

    const promise = api.request({ action: "example" }, { timeout: 100 });

    await expect(promise).rejects.toThrow(Error);
  });
});

test.group("genRandomMailbox()", () => {
  test("it should throw an error", async ({ expect }) => {
    const tooSmallPromise = api.genRandomMailbox(0);
    const tooBigPromise = api.genRandomMailbox(501);

    await expect(tooSmallPromise).rejects.toThrow(RangeError);
    await expect(tooBigPromise).rejects.toThrow(RangeError);
  });

  test("it should throw an error (with options)", async ({ expect }) => {
    const tooSmallPromise = api.genRandomMailbox(0, options);
    const tooBigPromise = api.genRandomMailbox(501, options);

    await expect(tooSmallPromise).rejects.toThrow(RangeError);
    await expect(tooBigPromise).rejects.toThrow(RangeError);
  });

  test("it should return one email address", async ({ expect }) => {
    const mockedResponse = ["demo@1secmail.com"];

    nock(BASE_API_URL)
      .get("/")
      .query({ action: "genRandomMailbox", count: 1 })
      .reply(200, mockedResponse);

    const mailboxList = await api.genRandomMailbox();

    expect(mailboxList).toStrictEqual(mockedResponse);
  });

  test("it should return one email address (with options)", async ({ expect }) => {
    const mockedResponse = ["demo@1secmail.com"];

    nock(BASE_API_URL)
      .get("/")
      .query({ action: "genRandomMailbox", count: 1 })
      .reply(200, mockedResponse);

    const mailboxList = await api.genRandomMailbox(options);

    expect(mailboxList).toStrictEqual(mockedResponse);
  });

  test("it should return many email addresses", async ({ expect }) => {
    const mockedResponse = [
      "514adm2s0c@wwjmp.com",
      "9q6fv8wkwr4@wwjmp.com",
      "xi9pw5ry@1secmail.com",
      "xpni3u25w@1secmail.net",
      "pkbds55jep@1secmail.com",
      "jeil65xzv8@1secmail.org",
      "cg89o9i0thml@1secmail.net",
      "0tw2rcoc3id@1secmail.org",
      "bdnlnm@1secmail.org",
      "p8axfdpf65@wwjmp.com",
    ];

    const count = 10;

    nock(BASE_API_URL)
      .get("/")
      .query({ action: "genRandomMailbox", count })
      .reply(200, mockedResponse);

    const emailAddresses = await api.genRandomMailbox(count);

    expect(emailAddresses).toStrictEqual(mockedResponse);
  });

  test("it should return many email addresses (with options)", async ({ expect }) => {
    const mockedResponse = [
      "514adm2s0c@wwjmp.com",
      "9q6fv8wkwr4@wwjmp.com",
      "xi9pw5ry@1secmail.com",
      "xpni3u25w@1secmail.net",
      "pkbds55jep@1secmail.com",
      "jeil65xzv8@1secmail.org",
      "cg89o9i0thml@1secmail.net",
      "0tw2rcoc3id@1secmail.org",
      "bdnlnm@1secmail.org",
      "p8axfdpf65@wwjmp.com",
    ];

    const count = 10;

    nock(BASE_API_URL)
      .get("/")
      .query({ action: "genRandomMailbox", count })
      .reply(200, mockedResponse);

    const emailAddresses = await api.genRandomMailbox(count, options);

    expect(emailAddresses).toStrictEqual(mockedResponse);
  });
});

test.group("getDomainList()", () => {
  const mockedResponse = [
    "1secmail.com",
    "1secmail.org",
    "1secmail.net",
    "wwjmp.com",
    "esiix.com",
    "xojxe.com",
    "yoggm.com",
  ];

  test("it should return a list of domain", async ({ expect }) => {
    nock(BASE_API_URL).get("/").query({ action: "getDomainList" }).reply(200, mockedResponse);

    const domains = await api.getDomainList();

    expect(domains).toStrictEqual(mockedResponse);
  });

  test("it should return a list of domain (with options)", async ({ expect }) => {
    nock(BASE_API_URL).get("/").query({ action: "getDomainList" }).reply(200, mockedResponse);

    const domains = await api.getDomainList(options);

    expect(domains).toStrictEqual(mockedResponse);
  });
});

test.group("getMessages()", () => {
  const mockedResponse = [
    {
      id: 639,
      from: "someone@example.com",
      subject: "Some subject",
      date: "2018-06-08 14:33:55",
    },
    {
      id: 640,
      from: "someoneelse@example.com",
      subject: "Other subject",
      date: "2018-06-08 14:40:55",
    },
  ];

  test("it should return a list of message", async ({ expect }) => {
    nock(BASE_API_URL)
      .get("/")
      .query({ action: "getMessages", login, domain })
      .reply(200, mockedResponse);

    const messages = await api.getMessages(login, domain);

    expect(messages).toStrictEqual(mockedResponse);
  });

  test("it should return a list of message (with options)", async ({ expect }) => {
    nock(BASE_API_URL)
      .get("/")
      .query({ action: "getMessages", login, domain })
      .reply(200, mockedResponse);

    const messages = await api.getMessages(login, domain, options);

    expect(messages).toStrictEqual(mockedResponse);
  });
});

test.group("readMessage()", () => {
  const mockedResponse = {
    id: 639,
    from: "someone@example.com",
    subject: "Some subject",
    date: "2018-06-08 14:33:55",
    attachments: [
      {
        filename: "iometer.pdf",
        contentType: "application/pdf",
        size: 47412,
      },
    ],
    body: "Some message body\n\n",
    textBody: "Some message body\n\n",
    htmlBody: "",
  };

  test("it should return a message or null", async ({ expect }) => {
    nock(BASE_API_URL)
      .get("/")
      .query({ action: "readMessage", login, domain, id: 639 })
      .reply(200, mockedResponse);

    nock(BASE_API_URL)
      .get("/")
      .query({ action: "readMessage", login, domain, id: 640 })
      .reply(200, "Messagenotfound");

    const message = await api.readMessage(login, domain, 639);
    const messageNotFound = await api.readMessage(login, domain, 640);

    expect(message).toStrictEqual(mockedResponse);
    expect(messageNotFound).toBeNull();
  });

  test("it should return a message or null (with options)", async ({ expect }) => {
    nock(BASE_API_URL)
      .get("/")
      .query({ action: "readMessage", login, domain, id: 639 })
      .reply(200, mockedResponse);

    nock(BASE_API_URL)
      .get("/")
      .query({ action: "readMessage", login, domain, id: 640 })
      .reply(200, "Messagenotfound");

    const message = await api.readMessage(login, domain, 639, options);
    const messageNotFound = await api.readMessage(login, domain, 640, options);

    expect(message).toStrictEqual(mockedResponse);
    expect(messageNotFound).toBeNull();
  });
});

test.group("download()", () => {
  const id = 639;
  const fileName = "iometer.pdf";
  const fileContent = "file content";

  test("it should return a file or null", async ({ expect }) => {
    nock(BASE_API_URL)
      .get("/")
      .query({ action: "download", login, domain, id, file: fileName })
      .reply(200, fileContent, {
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

    nock(BASE_API_URL)
      .get("/")
      .query({ action: "download", login, domain, id, file: fileName })
      .reply(200);

    const file = await api.download(login, domain, id, fileName);
    const noFile = await api.download(login, domain, id, fileName);

    expect(file).toStrictEqual(Buffer.from(fileContent));
    expect(noFile).toBeNull();
  });

  test("it should return a file or null (with options)", async ({ expect }) => {
    nock(BASE_API_URL)
      .get("/")
      .query({ action: "download", login, domain, id, file: fileName })
      .reply(200, fileContent, {
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

    nock(BASE_API_URL)
      .get("/")
      .query({ action: "download", login, domain, id, file: fileName })
      .reply(200);

    const file = await api.download(login, domain, id, fileName, options);
    const noFile = await api.download(login, domain, id, fileName, options);

    expect(file).toStrictEqual(Buffer.from(fileContent));
    expect(noFile).toBeNull();
  });
});
