import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    components: {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
},
    openapi: "3.0.0",
    info: {
      title: "NorteCRM API",
      version: "1.0.0",
      description: "API del CRM para gestión de clientes, oportunidades y tareas",
    },
    servers: [
      { url: "http://localhost:3000" }
    ],
  },
  apis: ["./routes/*.js"],
};


export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiMiddleware = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec);
