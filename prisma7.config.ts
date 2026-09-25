import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "packages/persistence/prisma/schema.prisma",
  migrations: {
    path: "packages/persistence/prisma/migrations"
  },
  datasource: {
    url: process.env["DATABASE_URL"]
  }
});
