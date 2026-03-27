import crypto from "node:crypto";

export function newId(): string {
  return crypto.randomBytes(8).toString("hex");
}
