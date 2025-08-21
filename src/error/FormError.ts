// Custom error for form validation/submission
export class FormError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = "FormError";
  }
}
