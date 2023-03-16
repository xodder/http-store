import crypto from "crypto";
import { ENCRYPTION_KEY } from "~/_constants";

export function encrypt(data: any) {
  const [key, iv] = get_cipher_key_and_iv();
  const cipher = crypto.createCipheriv("aes256", key, iv);
  const encrypted_data =
    cipher.update(JSON.stringify(data), "binary", "hex") + cipher.final("hex");

  return encrypted_data;
}

export function decrypt(encrypted_data: string) {
  const [key, iv] = get_cipher_key_and_iv();
  const decipher = crypto.createDecipheriv("aes256", key, iv);
  const decrypted_data =
    decipher.update(encrypted_data, "hex", "binary") + decipher.final("binary");
  return JSON.parse(decrypted_data);
}

function get_cipher_key_and_iv() {
  const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
  const iv = crypto.createHash("sha256").update(key).digest();
  const iv_resized = Buffer.allocUnsafe(16);
  iv.copy(iv_resized);
  return [key, iv_resized];
}
