![logo](https://i.imgur.com/FJhgTTl.jpg)

---

[![npm version][npm-version-badge]][npm-url]
[![npm downloads][npm-downloads-badge]][npm-url]
[![npm install size][npm-install-size-badge]][npm-install-size-url]
[![node version][node-version-badge]][node-version-url]

Create and receive email in only 1 second.

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

# Example

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

Soon...

## OneSecMailAPI

This class is an exact reproduction of the official [1secmail.com API](https://www.1secmail.com/api).

### Create an instance

```ts
const api = new OneSecMailAPI();
const api = new OneSecMailAPI(options);
```

### Instance methods

All methods return a _Promise_.

#### genRandomMailbox([count[, options]])

`count` must be between 1 and 500

```ts
const emailAddresses = await api.genRandomMailbox(); // same to: genRandomMailbox(1)
const emailAddresses = await api.genRandomMailbox(5);
const emailAddresses = await api.genRandomMailbox(options); // same to: genRandomMailbox(1, options)
const emailAddresses = await api.genRandomMailbox(5, options);
```

#### getDomainList([options])

```ts
const domainList = await api.getDomainList();
const domainList = await api.getDomainList(options);
```

#### getMessages(login, domain[, options])

```ts
const messages = await api.getMessages("demo", "1secmail.com");
const messages = await api.getMessages("demo", "1secmail.com", options);
```

#### readMessage(login, domain, id[, options])

```ts
const message = await api.readMessage("demo", "1secmail.com", 639);
const message = await api.readMessage("demo", "1secmail.com", 639, options);
```

Returns _null_ if message do not exists.

#### download(login, domain, id, file[, options])

```ts
const file = await api.download("demo", "1secmail.com", 639, "iometer.pdf");
const file = await api.download("demo", "1secmail.com", 639, "iometer.pdf", options);
```

Returns _null_ if file do not exists.

[npm-url]: https://www.npmjs.com/package/onesecmail
[npm-version-badge]: https://img.shields.io/npm/v/onesecmail
[npm-downloads-badge]: https://img.shields.io/npm/dt/onesecmail
[npm-install-size-badge]: https://packagephobia.com/badge?p=onesecmail
[npm-install-size-url]: https://packagephobia.com/result?p=onesecmail
[node-version-badge]: https://img.shields.io/node/v/onesecmail
[node-version-url]: https://nodejs.org
