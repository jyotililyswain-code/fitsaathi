import crypto from "node:crypto";
import fs from "node:fs";
import sharp from "sharp";

const abusive = ["escort", "nude", "sex", "hate", "kill", "terror"];
const scam = ["guaranteed income", "crypto investment", "send otp", "bank pin", "instant profit", "whatsapp only"];
const spam = /(?:https?:\/\/\S+.*){3,}|(.)\1{8,}/i;

export function moderateText(value: string) {
  const normalized = value.toLowerCase().trim();
  const categories = [
    ...abusive.filter(term => normalized.includes(term)).map(() => "abuse"),
    ...scam.filter(term => normalized.includes(term)).map(() => "scam"),
    ...(spam.test(normalized) ? ["spam"] : [])
  ];
  return { clean: categories.length === 0, riskScore: Math.min(100, categories.length * 40), categories: [...new Set(categories)] };
}

export function saferUsername(value: string) {
  const safe = value.replace(/[^a-zA-Z0-9_. ]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
  return safe || `FitSaathi Member ${crypto.randomInt(1000, 9999)}`;
}

export async function inspectPhoto(file: Express.Multer.File) {
  const bytes = await fs.promises.readFile(file.path);
  const metadata = await sharp(bytes).metadata();
  const hash = crypto.createHash("sha256").update(bytes).digest("hex");
  const tooSmall = Number(metadata.width || 0) < 400 || Number(metadata.height || 0) < 400;
  return { hash, riskScore: tooSmall ? 45 : 0, notes: tooSmall ? "Image resolution is too low for reliable identity review." : "Image passed automated integrity checks." };
}
