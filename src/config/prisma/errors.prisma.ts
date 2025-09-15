import { Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatValidationError = (error: any): string => {
  const { message } = error;
  const match = message.match(/Unknown argument `(\w+)`. Did you mean `(\w+)`?/);

  const unknownArg = match?.[1] || "Unknown";
  const suggestedArg = match?.[2] || "Check schema";

  return `-> Prisma Validation Error:
    - Unknown argument: \`${unknownArg}\`
    - Suggested fix: Replace \`${unknownArg}\` with \`${suggestedArg}\`
    - Full Message: ${message}`;
};

const formatKnownRequestError = (error: Prisma.PrismaClientKnownRequestError): string => {
  switch (error.code) {
    case "P2002":
      return "A record with this value already exists.";
    case "P2003":
      return "Foreign key constraint failed.";
    case "P2023":
      return "Invalid ID format. Please provide a correct ID.";
    case "P2025":
      return "Record Not Found: The requested record does not exist.";
    default:
      return `Prisma Request Error (${error.code}): ${error.message}`;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formatPrismaError = (error: any): string => {
  if (error instanceof Prisma.PrismaClientValidationError) {
    return formatValidationError(error);
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return formatKnownRequestError(error);
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return `-> Prisma Unknown Request Error: ${error.message}`;
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    return `-> Prisma Initialization Error: ${error.message}`;
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    return `-> Prisma Rust Panic Error: ${error.message}`;
  }
  return `-> Unknown Error: ${error.message || error}`;
};
