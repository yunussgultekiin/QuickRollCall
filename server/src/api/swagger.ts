import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { existsSync, readFileSync } from "fs";
import path from "path";
import YAML from "yaml";
import { config } from "./config";

function resolveComponentsPath(): string | undefined {
  const candidates = [
    path.resolve(__dirname, "components.yaml"),
    path.resolve(process.cwd(), "src", "api", "components.yaml"),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function loadComponents() {
  try {
    const filePath = resolveComponentsPath();
    if (!filePath) {
      console.warn("Swagger components.yaml not found in dist or src directory");
      return {};
    }
    const file = readFileSync(filePath, "utf8");
    const parsed = YAML.parse(file);
    if (parsed && typeof parsed === "object" && parsed.components) {
      return parsed.components;
    }
  } catch (err) {
    console.warn("Failed to load Swagger components.yaml", err);
  }
  return {};
}

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Quick Roll Call API",
      version: "1.0.0",
      description: "Quick Roll Call API Documentation",
    },
    servers: [
      {
        url: `http://localhost:${config.port || 5000}`,
      },
    ],
    components: loadComponents(),
  },
  apis: [
    "./src/api/app.ts",
    "./src/routes/*.ts",
  ], 
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
