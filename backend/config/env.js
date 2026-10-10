const requiredEnvVariables = [
  "MONGO_URI",
  "JWT_SECRET",
];

const optionalEnvVariables = [
  "FRONTEND_URL",
  "PORT",
  "NODE_ENV",
];

export const validateEnvironment = () => {
  const missingVariables = requiredEnvVariables.filter(
    (variable) => !process.env[variable]
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}`
    );
  }

  const undefinedOptionals = optionalEnvVariables.filter(
    (variable) => process.env[variable] === undefined
  );

  if (undefinedOptionals.length > 0) {
    console.info(
      `Using defaults for optional environment variables: ${undefinedOptionals.join(", ")}`
    );
  }
};

export const getAllowedOrigins = () => {
  const configuredOrigins = (
    process.env.FRONTEND_URL || "https://e-commerce-store-nine-sable.vercel.app"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [
    ...new Set([
      ...configuredOrigins,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]),
  ];
};