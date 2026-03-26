function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalEnv(name: string) {
  return process.env[name]?.trim() || null;
}

export const config = {
  port: Number(process.env.PORT) || 8080,
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  s3EndpointUrl: optionalEnv("S3_ENDPOINT_URL"),
  s3AccessKeyId: optionalEnv("S3_ACCESS_KEY_ID"),
  s3SecretAccessKey: optionalEnv("S3_SECRET_ACCESS_KEY"),
  s3BucketName: optionalEnv("S3_BUCKET_NAME"),
  s3Region: process.env.S3_REGION?.trim() || "us-east-1",
  couchDbUrl: optionalEnv("COUCHDB_URL"),
  couchDbUser: optionalEnv("COUCHDB_USER"),
  couchDbPassword: optionalEnv("COUCHDB_PASSWORD"),
  couchDbDatabase: optionalEnv("COUCHDB_DATABASE")
};
