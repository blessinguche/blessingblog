"use server";

import { Resend } from "resend";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { validateContactInput } from "@/lib/validate";

export type ContactResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "blesinucheuche7@gmail.com";

export async function contactAction(
  _prev: ContactResult | null,
  formData: FormData
): Promise<ContactResult> {
  const honeypot = String(formData.get("company") || "").trim();
  if (honeypot) {
    return { ok: true, message: "Thanks — your message was sent." };
  }

  const validated = validateContactInput({
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    subject: String(formData.get("subject") || ""),
    body: String(formData.get("body") || ""),
  });

  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  const { name, email, subject, body } = validated.data;

  const text = [
    `From: ${name} <${email}>`,
    `Subject: ${subject}`,
    "",
    body,
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    const resend = new Resend(apiKey);
    const from =
      process.env.CONTACT_FROM_EMAIL || "Blessing <onboarding@resend.dev>";

    const { error } = await resend.emails.send({
      from,
      to: TO_EMAIL,
      replyTo: email,
      subject: `[Blessing] ${subject}`,
      text,
    });

    if (error) {
      console.error("contactAction", error);
      return { ok: false, error: "Could not send your message. Try again later." };
    }

    return { ok: true, message: "Thanks — your message was sent." };
  }

  try {
    const dir = path.join(process.cwd(), "data");
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, "contact-messages.json");
    let list: unknown[] = [];
    try {
      list = JSON.parse(await fs.readFile(file, "utf8")) as unknown[];
    } catch {
      list = [];
    }
    list.push({
      id: randomUUID(),
      name,
      email,
      subject,
      body,
      to: TO_EMAIL,
      created_at: new Date().toISOString(),
    });
    await fs.writeFile(file, JSON.stringify(list, null, 2), "utf8");
    return { ok: true, message: "Thanks — your message was sent." };
  } catch (err) {
    console.error("contactAction local", err);
    return { ok: false, error: "Could not send your message. Try again later." };
  }
}
