# prod

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.26. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Debugging

To enable detailed request logging for the `/api/chat` endpoint, run the server with the `DEBUG_LOGGING` environment variable set to `true`.

```bash
DEBUG_LOGGING=true bun src/app.ts
```
