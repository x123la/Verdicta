export class ProviderPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderPolicyError";
  }
}
