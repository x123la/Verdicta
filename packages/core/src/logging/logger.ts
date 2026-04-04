const redact = (value: string) => value.replace(/(api[_-]?key|authorization)["':=\s]+[^\s,}]+/gi, "$1=[redacted]");

export const logger = {
  info(message: string, payload?: unknown) {
    console.info(message, payload ? redact(JSON.stringify(payload)) : "");
  },
  error(message: string, payload?: unknown) {
    console.error(message, payload ? redact(JSON.stringify(payload)) : "");
  }
};
