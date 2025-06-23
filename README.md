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

## OpenRouter integration

The server uses OpenRouter (https://openrouter.ai/) and by default uses the model `deepseek/deepseek-r1-0528:free`.

To make it work, set the following environment variable:

```
OPENROUTER_API_KEY=sk-...
```

You can get your API key from https://openrouter.ai/keys

## Model selection

You can specify the model to use for chat completions by adding a `model` field to the POST `/api/chat` request body. If not provided, a default model will be used.

Example request body:

```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "model": "gpt-4o"
}
```
