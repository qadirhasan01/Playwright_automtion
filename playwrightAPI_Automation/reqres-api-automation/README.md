# ReqRes API Automation Framework

An industry-standard **API automation framework** built with **Playwright + TypeScript**, testing the public [ReqRes](https://reqres.in) API. It uses a clean, layered architecture (client → services → fixtures → tests) so test code stays short, readable, and free of duplicated request logic.

> **Contract vs. persistence:** ReqRes is a *demo* API. `POST`/`PUT`/`PATCH`/`DELETE` responses are **echoed, not saved** (responses even include `_meta.persisted: false`). This framework validates the **API contract** — status codes, body shape, data types, headers, timing — **not** database persistence. That distinction is called out in the write tests.

---

## 1. Prerequisites

- **Node.js** 18+ (LTS recommended) and npm
- Internet access (tests hit the live `https://reqres.in` API)
- No browsers needed — these are pure HTTP/API tests

## 2. Install

From **this** folder (`reqres-api-automation/`):

```bash
npm install
```

> In this repo the required packages (`@playwright/test`, `dotenv`, `allure-playwright`) are already available from the parent project, so the suite runs even without a local install. Running `npm install` here just makes the folder fully standalone.

## 3. Configure environment

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

| Variable | Purpose | Default |
|---|---|---|
| `BASE_URL` | API root | `https://reqres.in/api` |
| `API_KEY` | ReqRes key (free shared key works out of the box) | `reqres-free-v1` |
| `API_KEY_HEADER` | Header the key is sent in | `x-api-key` |
| `API_TIMEOUT` | Per-request timeout (ms) | `30000` |
| `MAX_RESPONSE_TIME_MS` | Limit for response-time assertions | `3000` |

The `.env` file is git-ignored, so **no secrets are committed**. The API key is injected as a default header once in `playwright.config.ts`, and it is **masked** in every report attachment.

---

## 4. Project structure

```
reqres-api-automation/
├── src/
│   ├── clients/apiClient.ts        # Reusable GET/POST/PUT/PATCH/DELETE wrapper (+timing, +masked logging)
│   ├── services/
│   │   ├── userService.ts          # /users operations
│   │   ├── resourceService.ts      # /unknown (resources) operations
│   │   └── authService.ts          # /register, /login (for negative tests)
│   ├── utils/
│   │   ├── assertions.ts           # Reusable expect-based assertions + timeRequest()
│   │   └── testDataGenerator.ts    # Unique/dynamic test data
│   ├── config/environment.ts       # Typed env loader (dotenv)
│   ├── types/reqres.types.ts       # API contract interfaces
│   └── fixtures/apiFixture.ts      # Injects services into tests (custom test/expect)
├── test-data/
│   ├── users.json                  # Static + combination data
│   └── invalidData.json            # Negative-case data
├── tests/
│   ├── get/    getUsers.spec.ts · getSingleUser.spec.ts · getResources.spec.ts
│   ├── post/   createUser.spec.ts
│   ├── put/    updateUser.spec.ts
│   ├── patch/  patchUser.spec.ts
│   ├── delete/ deleteUser.spec.ts
│   └── negative/ additionalScenarios.spec.ts
├── reports/                        # HTML report output (generated)
├── .env / .env.example
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

### How the layers fit together

1. **`apiClient`** knows *how* to send an HTTP request (and times + logs it). It never knows about users.
2. **Services** (`userService`, etc.) know the *endpoints* for one resource. Tests call `userService.getSingleUser(2)` — never a raw URL.
3. **`apiFixture`** wires a client + services onto Playwright's `request` context and hands them to each test.
4. **Tests** only describe *intent* and *assertions*, using the reusable `apiAssertions` helpers.

Change an endpoint once (in a service) and every test follows — no duplication.

---

## 5. Run the tests

| Command | Runs |
|---|---|
| `npm test` | All tests |
| `npm run test:get` | GET tests |
| `npm run test:post` | POST tests |
| `npm run test:put` | PUT tests |
| `npm run test:patch` | PATCH tests |
| `npm run test:delete` | DELETE tests |
| `npm run test:negative` | Negative / cross-cutting tests |
| `npm run test:headed` | Headed mode |
| `npm run test:debug` | Playwright Inspector (step-through) |

Run a single file or filter by title:

```bash
npx playwright test tests/post/createUser.spec.ts
npx playwright test -g "correlation"
```

---

## 6. Reports

### Playwright HTML report (default)

The HTML reporter writes to `reports/html-report`. After a run:

```bash
npm run report
```

This opens an interactive report showing: total/passed/failed/skipped, duration, each test name, and — because the client attaches a **masked request/response log** to every call — the HTTP **method, endpoint, query params, request body, status, timing, and response body** per step, which makes debugging failures straightforward.

### Allure report (optional)

Results are emitted to `allure-results` on every run. To view:

```bash
npm run allure:report      # generate + open
# or individually:
npm run allure:generate
npm run allure:open
```

> Allure needs Java installed (the `allure-commandline` package downloads the CLI). If you don't use Allure, ignore these scripts — the HTML report is fully self-contained.

---

## 7. What's covered

- **GET** — all users, single user, non-existing user (404), resources list, single resource, non-existing resource (404), pagination, request **correlation** (list → fetch by returned id)
- **POST** — create user, multiple data combinations, validate echoed body, generated `id` (string) + `createdAt`
- **PUT** — full update, validate echoed `name`/`job` + `updatedAt`
- **PATCH** — name-only and job-only, validate that **only the requested field** is echoed
- **DELETE** — `204 No Content`, empty-body contract
- **Cross-cutting** — invalid endpoint, missing/invalid data (`400 Missing password`), status codes, response time, Content-Type

---

## 8. Coding standards used

TypeScript interfaces for the contract · `async/await` throughout · reusable client + services + assertions · API-adapted "page-object style" separation · no hardcoded secrets (all via `.env`, masked in reports) · meaningful test titles · zero duplicated request logic.
