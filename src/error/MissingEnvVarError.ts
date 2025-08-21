// Custom error for missing environment variables
export class MissingEnvVarError extends Error {
  constructor(varName: string) {
    super(`Missing environment variable: ${varName}`);
    this.name = "MissingEnvVarError";
  }
}
