import { randomBytes, scryptSync } from "node:crypto";

const PASSWORD_BYTES = 64;

export function validateEnglishNumberPassword(password: string) {
  const trimmedPassword = password.trim();

  if (trimmedPassword.length < 6) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }

  if (!/[A-Za-z]/.test(trimmedPassword) || !/[0-9]/.test(trimmedPassword)) {
    return "비밀번호는 영문과 숫자를 함께 포함해야 합니다.";
  }

  return null;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, PASSWORD_BYTES).toString("hex");
  return `${salt}:${hash}`;
}
