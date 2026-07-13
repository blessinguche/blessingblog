export function getWriterPassword(): string {
  const password = process.env.WRITER_PASSWORD;
  if (password) return password;
  if (process.env.NODE_ENV === "production") {
    throw new Error("WRITER_PASSWORD must be set in production.");
  }
  return "blessing";
}

export function getSessionSecret(): string {
  const secret = process.env.WRITER_SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("WRITER_SESSION_SECRET must be set in production.");
  }
  return "dev-secret";
}
