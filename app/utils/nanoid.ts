import { getRandomBytes } from "expo-crypto"

/**
 * Gera um ID único usando expo-crypto
 * @returns string com ID único
 */
export function nanoid(): string {
  const bytes = getRandomBytes(8)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
