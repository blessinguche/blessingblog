function isProd() {
  return process.env.NODE_ENV === "production";
}

export function getWriterPassword(): string {
  const password = process.env.WRITER_PASSWORD?.trim();
  if (password) return password;
  if (isProd()) {
    console.error(
      "[env] WRITER_PASSWORD is missing. Set it in Vercel → Settings → Environment Variables."
    );
  }
  return "blessing";
}

export function getSessionSecret(): string {
  const secret = process.env.WRITER_SESSION_SECRET?.trim();
  if (secret) return secret;
  if (isProd()) {
    console.error(
      "[env] WRITER_SESSION_SECRET is missing. Set it in Vercel → Settings → Environment Variables."
    );
  }
  return "dev-secret";
}

export function hasRequiredWriterEnv(): boolean {
  return Boolean(
    process.env.WRITER_PASSWORD?.trim() &&
      process.env.WRITER_SESSION_SECRET?.trim()
  );
}
