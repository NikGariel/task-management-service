import { Elysia } from "elysia";

export const errorHandler = new Elysia().onError(({ code, error, set }) => {
  console.error("Error:", error);

  const errorMessage = error instanceof Error ? error.message : String(error);

  if (code === "VALIDATION") {
    set.status = 400;
    return {
      error: "Validation error",
      message: errorMessage,
      details: error instanceof Error ? error.cause : undefined,
    };
  }

  if (code === "NOT_FOUND") {
    set.status = 404;
    return {
      error: "Not found",
      message: errorMessage,
    };
  }

  set.status = 500;
  return {
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
  };
});

