"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyRequestError =
  exports.UnusableAnswerError =
  exports.AiRequestError =
  exports.OPENAI_CLIENT =
    void 0;
exports.createOpenAiClient = createOpenAiClient;
const common_1 = require("@nestjs/common");
const openai_1 = __importStar(require("openai"));
exports.OPENAI_CLIENT = Symbol("OPENAI_CLIENT");
class AiRequestError extends common_1.BadGatewayException {
  retryable;
  constructor(message, retryable) {
    super(message);
    this.retryable = retryable;
  }
}
exports.AiRequestError = AiRequestError;
class UnusableAnswerError extends AiRequestError {
  usage;
  constructor(message, retryable, usage) {
    super(message, retryable);
    this.usage = usage;
  }
}
exports.UnusableAnswerError = UnusableAnswerError;
const KEY_PATTERN = /sk-[A-Za-z0-9_-]+/g;
const QUOTA_CODE = "insufficient_quota";
const RETRYABLE_STATUSES = new Set([408, 409]);
const MIN_SERVER_ERROR_STATUS = 500;
const retryableStatus = (status) =>
  typeof status === "number" &&
  (RETRYABLE_STATUSES.has(status) || status >= MIN_SERVER_ERROR_STATUS);
const redact = (text) => text.replace(KEY_PATTERN, "[redacted]");
const apiField = (error, field) => {
  const body = error.error;
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const value = Reflect.get(body, field);
  return typeof value === "string" ? value : null;
};
const apiMessage = (error) => {
  const detail = apiField(error, "message");
  return detail === null ? "no details" : redact(detail);
};
const classifyRequestError = (error, model) => {
  if (error instanceof openai_1.AuthenticationError) {
    return new AiRequestError(
      "OpenAI rejected the API key. Check OPENAI_API_KEY.",
      false,
    );
  }
  if (error instanceof openai_1.PermissionDeniedError) {
    return new AiRequestError(`The OpenAI key cannot use ${model}.`, false);
  }
  if (error instanceof openai_1.NotFoundError) {
    return new AiRequestError(
      `OpenAI does not offer the model ${model}. Check AI_MODEL.`,
      false,
    );
  }
  if (error instanceof openai_1.BadRequestError) {
    return new AiRequestError(
      `OpenAI refused the request: ${apiMessage(error)}`,
      false,
    );
  }
  if (error instanceof openai_1.RateLimitError) {
    return apiField(error, "code") === QUOTA_CODE
      ? new AiRequestError("The OpenAI account has no remaining quota.", false)
      : new AiRequestError("OpenAI is rate limiting requests.", true);
  }
  if (error instanceof openai_1.InternalServerError) {
    return new AiRequestError("OpenAI had an internal error.", true);
  }
  if (error instanceof openai_1.APIConnectionTimeoutError) {
    return new AiRequestError("OpenAI did not answer in time.", true);
  }
  if (error instanceof openai_1.APIConnectionError) {
    return new AiRequestError("Could not reach OpenAI.", true);
  }
  return new AiRequestError(
    "OpenAI request failed.",
    error instanceof openai_1.APIError && retryableStatus(error.status),
  );
};
exports.classifyRequestError = classifyRequestError;
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;
const toContentPart = (part) =>
  part.type === "text"
    ? { type: "text", text: part.text }
    : {
        type: "image_url",
        image_url: { url: part.url, detail: part.detail },
      };
const usageOf = (completion) =>
  completion.usage
    ? {
        inputTokens: completion.usage.prompt_tokens,
        cachedInputTokens:
          completion.usage.prompt_tokens_details?.cached_tokens ?? 0,
        outputTokens: completion.usage.completion_tokens,
      }
    : null;
class OpenAiClient {
  openai;
  model;
  constructor(openai, model) {
    this.openai = openai;
    this.model = model;
  }
  async structured(request) {
    const messages = [
      { role: "system", content: request.system },
      { role: "user", content: request.content.map(toContentPart) },
    ];
    let completion;
    try {
      completion = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_completion_tokens:
          request.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: request.schema.name,
            schema: request.schema.schema,
            strict: true,
          },
        },
      });
    } catch (error) {
      throw (0, exports.classifyRequestError)(error, this.model);
    }
    const usage = usageOf(completion);
    const choice = completion.choices[0];
    if (!choice) {
      throw new UnusableAnswerError("OpenAI returned no choices.", true, usage);
    }
    if (choice.message.refusal) {
      throw new UnusableAnswerError(
        "OpenAI refused to analyze this listing.",
        false,
        usage,
      );
    }
    if (choice.finish_reason === "length") {
      throw new UnusableAnswerError(
        "The model ran out of output tokens.",
        false,
        usage,
      );
    }
    if (choice.finish_reason === "content_filter") {
      throw new UnusableAnswerError(
        "OpenAI filtered the response.",
        false,
        usage,
      );
    }
    const content = choice.message.content;
    if (!content) {
      throw new UnusableAnswerError(
        "OpenAI returned an empty response.",
        true,
        usage,
      );
    }
    try {
      let output;
      try {
        output = JSON.parse(content);
      } catch {
        const blocks = [
          ...content.matchAll(/```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```/gi),
        ];
        if (blocks.length !== 1) throw new Error("No single JSON code block");
        output = JSON.parse(blocks[0][1]);
      }
      return { output, usage };
    } catch {
      throw new UnusableAnswerError(
        "OpenAI returned an unreadable response.",
        true,
        usage,
      );
    }
  }
}
function createOpenAiClient(config) {
  const apiKey = config.get("OPENAI_API_KEY", { infer: true });
  if (!apiKey) {
    return null;
  }
  const model = config.get("AI_MODEL", { infer: true });
  return new OpenAiClient(
    new openai_1.default({
      apiKey,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
    }),
    model,
  );
}
//# sourceMappingURL=openai.client.js.map
