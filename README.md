<p align="center">
  <img src="https://i.imgur.com/FJhgTTl.jpg" alt="logo">
</p>

[![npm version][npm-version-badge]][npm-url]
[![npm downloads][npm-downloads-badge]][npm-url]
[![npm install size][npm-install-size-badge]][npm-install-size-url]
[![node version][node-version-badge]][node-version-url]

Package using the [1secmail.com](https://www.1secmail.com) service.

**Create and receive email in only 1 second.**

---

# Installation

**Warning:** This package is native [ES modules](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Modules) and does not provide a CommonJS export. If your project uses CommonJS, you will have to convert to ESM or use the [dynamic import()](https://v8.dev/features/dynamic-import) function.

Using npm:

```bash
npm install onesecmail
```

Using yarn:

```bash
yarn add onesecmail
```

Using pnpm:

```bash
pnpm add onesecmail
```

# Usage

Once the package is installed, you can import the library using `import`:

```ts
import { OneSecMail, OneSecMailAPI } from "onesecmail";
```

# Examples

## OneSecMail

```ts
import { OneSecMail } from "onesecmail";

const mailbox = await OneSecMail("demo@1secmail.com");

const messages = await mailbox.getMessages();

for (const message of messages) {
  const fullMessage = await message.fetchFullMessage();
  console.log(fullMessage.serialize());
}

await mailbox.clearMessages();
```

## OneSecMailAPI

```ts
import { OneSecMailAPI } from "onesecmail";

const options = {
  retry: 5,
  timeout: 3000,
};

const api = new OneSecMailAPI(options);

const [email] = await api.genRandomMailbox();

const [login, domain] = email.split("@");

const messages = await api.getMessages(login, domain);

for (const message of messages) {
  const fullMessage = await api.readMessage(login, domain, message.id);
  console.log(fullMessage);
}
```

# API

## Options

Options can be passed to the constructor and to each method.

```ts
// default options
const options: Partial<Options> = {
  retry: 2, // max retry failed requests
  timeout: 10_000, // milliseconds
};
```

## OneSecMail

### Create a mailbox

```ts
const mailbox = await OneSecMail();
const mailbox = await OneSecMail("demo@1secmail.com");
const mailbox = await OneSecMail(options);
const mailbox = await OneSecMail("demo@1secmail.com", options);
```

Returns an instance of `OneSecMailbox`.

### OneSecMailbox.getMessages([options])

```ts
const messages = await mailbox.getMessages();
const messages = await mailbox.getMessages(options);
```

Returns an array of `OneSecMailShortMessage` instances.

### OneSecMailbox.clearMessages([options])

```ts
await mailbox.clearMessages();
await mailbox.clearMessages(options);
```

### OneSecMailbox.startPolling([intervalTime])

`intervalTime` must be at least 1000.

```ts
mailbox.startPolling(); // default intervalTime: 5000 milliseconds
mailbox.startPolling(30_000);
```

### OneSecMailbox.stopPolling()

```ts
mailbox.stopPolling();
```

### OneSecMailbox `events`

```ts
mailbox.on("newMessage", (message: OneSecMailShortMessage) => {
  console.log(message.serialize());
});
```

```ts
mailbox.on("error", (error: Error) => {
  console.error(error);
});
```

### OneSecMailShortMessage.fetchFullMessage([options])

```ts
const fullMessage = await message.fetchFullMessage();
const fullMessage = await message.fetchFullMessage(options);
```

Returns an instance of `OneSecMailMessage` if the message still exists, otherwise throw an error.

`OneSecMailMessage` has an **attachments** field that contains an array of `OneSecMailAttachment` instances.

### OneSecMailAttachment.download([options])

```ts
const file = await attachment.download();
const file = await attachment.download(options);
```

Returns a Buffer if the file still exists, otherwise throw an error.

## OneSecMailAPI

This class is an exact reproduction of the official [1secmail.com API](https://www.1secmail.com/api).

### Create an instance

```ts
const api = new OneSecMailAPI();
const api = new OneSecMailAPI(options);
```

### Instance methods

All methods return a **Promise**.

#### genRandomMailbox([count[, options]])

`count` must be between 1 and 500.

```ts
const emailAddresses = await api.genRandomMailbox(); // same to: genRandomMailbox(1)
const emailAddresses = await api.genRandomMailbox(5);
const emailAddresses = await api.genRandomMailbox(options); // same to: genRandomMailbox(1, options)
const emailAddresses = await api.genRandomMailbox(5, options);
```

Returns an array of generated email addresses.

#### getDomainList([options])

```ts
const domainList = await api.getDomainList();
const domainList = await api.getDomainList(options);
```

Returns an array of active domains.

#### getMessages(login, domain[, options])

```ts
const messages = await api.getMessages("demo", "1secmail.com");
const messages = await api.getMessages("demo", "1secmail.com", options);
```

Returns an array of ShortMessage (message with no body and attachments).

#### readMessage(login, domain, id[, options])

```ts
const message = await api.readMessage("demo", "1secmail.com", 639);
const message = await api.readMessage("demo", "1secmail.com", 639, options);
```

Returns a Message if the message exists, otherwise returns null.

#### download(login, domain, id, file[, options])

```ts
const file = await api.download("demo", "1secmail.com", 639, "iometer.pdf");
const file = await api.download("demo", "1secmail.com", 639, "iometer.pdf", options);
```

Returns a Buffer if the file exists, otherwise returns null.

[npm-url]: https://www.npmjs.com/package/onesecmail
[npm-version-badge]: https://img.shields.io/npm/v/onesecmail
[npm-downloads-badge]: https://img.shields.io/npm/dt/onesecmail
[npm-install-size-badge]: https://packagephobia.com/badge?p=onesecmail
[npm-install-size-url]: https://packagephobia.com/result?p=onesecmail
[node-version-badge]: https://img.shields.io/node/v/onesecmail
[node-version-url]: https://nodejs.org
