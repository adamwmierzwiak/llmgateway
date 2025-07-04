import OpenAI, { toFile } from "openai";
import type { ChatCompletionMessageParam, ChatCompletion, ChatCompletionChunk } from "openai/resources/chat/completions";
import { createByModelName } from '@microsoft/tiktokenizer';
import type { CreateEmbeddingResponse } from 'openai/resources/embeddings';

interface ParsingError {
  error: string;
  result: boolean;
}

export class OpenAIService {
  private openai: OpenAI;
  private tokenizers: Map<string, Awaited<ReturnType<typeof createByModelName>>> = new Map();
  private readonly IM_START = "<|im_start|>";
  private readonly IM_END = "<|im_end|>";
  private readonly IM_SEP = "<|im_sep|>";

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        // You can add optional headers here, e.g. HTTP-Referer, X-Title.
        // Some OpenRouter models or providers may require specific headers for authentication, tracking, or usage policies.
        // Only set headers that are required by the API or your use case. Avoid exposing sensitive information.
        // For most use cases, you do NOT need to set any custom headers here.
      },
    });
  }

  private async getTokenizer(modelName: string) {
    if (!this.tokenizers.has(modelName)) {
      const specialTokens: ReadonlyMap<string, number> = new Map([
        [this.IM_START, 100264],
        [this.IM_END, 100265],
        [this.IM_SEP, 100266],
      ]);
      const tokenizer = await createByModelName(modelName, specialTokens);
      this.tokenizers.set(modelName, tokenizer);
    }
    return this.tokenizers.get(modelName)!;
  }

  async countTokens(messages: ChatCompletionMessageParam[], model: string = 'gpt-4o'): Promise<number> {
    const tokenizer = await this.getTokenizer(model);

    let formattedContent = '';
    messages.forEach((message) => {
      formattedContent += `${this.IM_START}${message.role}${this.IM_SEP}${message.content || ''}${this.IM_END}`;
    });
    formattedContent += `${this.IM_START}assistant${this.IM_SEP}`;

    const tokens = tokenizer.encode(formattedContent, [this.IM_START, this.IM_END, this.IM_SEP]);
    return tokens.length;
  }

  async completion(config: {
    messages: ChatCompletionMessageParam[],
    model?: string,
    stream?: boolean,
    temperature?: number,
    jsonMode?: boolean,
    maxTokens?: number
  }): Promise<OpenAI.Chat.Completions.ChatCompletion | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    const { messages, model = "deepseek/deepseek-r1-0528:free", stream = false, jsonMode = false, maxTokens = 4096, temperature = 0 } = config;
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        messages,
        model,
        stream,
        temperature,
        max_tokens: maxTokens,
        response_format: jsonMode ? { type: "json_object" } : { type: "text" }
      });
      
      if (stream) {
        return chatCompletion as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
      } else {
        return chatCompletion as OpenAI.Chat.Completions.ChatCompletion;
      }
    } catch (error) {
      console.error("Error in OpenAI completion:", error);
      throw error;
    }
  }

  isStreamResponse(response: ChatCompletion | AsyncIterable<ChatCompletionChunk>): response is AsyncIterable<ChatCompletionChunk> {
    return Symbol.asyncIterator in response;
  }

  parseJsonResponse<IResponseFormat>(response: ChatCompletion): IResponseFormat | ParsingError {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Invalid response structure');
      }
      const parsedContent = JSON.parse(content);
      return parsedContent;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return { error: 'Failed to process response', result: false };
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response: CreateEmbeddingResponse = await this.openai.embeddings.create({
        model: "text-embedding-3-large",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error creating embedding:", error);
      throw error;
    }
  }
}