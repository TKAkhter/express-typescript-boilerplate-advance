import { env } from "@/config/env";

export const generatePassword = (): string => {
  const getRandomChar = (characters: string): string =>
    characters[Math.floor(Math.random() * characters.length)];

  const categories = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ", // Uppercase letters
    "abcdefghijklmnopqrstuvwxyz", // Lowercase letters
    "0123456789", // Digits
    "!@#$%^&*()_-+=<>?/", // Special characters
  ];

  const password = categories.map(getRandomChar).join("");

  const remainingLength = env.GENERATED_PASSWORD_LENGTH - password.length;
  const allCharacters = categories.join("");
  const randomChars = Array.from({ length: remainingLength }, () => getRandomChar(allCharacters));

  console.log(`Generated Password ==> ${password + randomChars.join("")}`);
  return password + randomChars.join("");
};

export const extractDomainFromEmailAddress = (email: string): string | null => {
  const match = email.match(/@([\w.-]+)/);
  if (!match) {
    return null;
  }

  return match[1].toLowerCase();
};
