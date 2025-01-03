import swaggerJSDoc from "swagger-jsdoc";
import { Options, SwaggerDefinition } from "swagger-jsdoc";

const swaggerDefinition: SwaggerDefinition = {
  swagger: "2.0",
  info: {
    version: "1.0.0",
    title: "URL Shortener API",
    description: "API documentation for the URL Shortener application.",
  },
  host: "adv-urlshortner.onrender.com",
  basePath: "/",
  schemes: ["https"],
  paths: {
    "/auth/google": {
      get: {
        summary: "Initiate Google Authentication",
        responses: {
          "200": {
            description: "Redirect to Google OAuth2.0 login.",
          },
        },
      },
    },
    "/auth/google/callback": {
      get: {
        summary: "Handle Google OAuth Callback",
        responses: {
          "200": {
            description: "Successful authentication.",
          },
          "302": {
            description: "Redirect to authentication status.",
          },
        },
      },
    },
    "/auth/status": {
      get: {
        summary: "Check Authentication Status",
        responses: {
          "200": {
            description: "User is authenticated.",
          },
          "401": {
            description: "User is unauthorized.",
          },
        },
      },
    },
    "/api/shorten": {
      post: {
        summary: "Create a Shortened URL",
        parameters: [
          {
            name: "body",
            in: "body",
            required: true,
            schema: {
              type: "object",
              properties: {
                longUrl: {
                  type: "string",
                },
                customAlias: {
                  type: "string",
                },
                topic: {
                  type: "string",
                },
              },
              required: ["longUrl"],
            },
          },
        ],
        responses: {
          "201": {
            description: "Short URL created successfully.",
          },
          "400": {
            description: "Bad Request. Missing or invalid parameters.",
          },
          "401": {
            description: "Unauthorized.",
          },
          "409": {
            description: "Conflict. Alias already exists.",
          },
        },
      },
    },
    "/api/shorten/{alias}": {
      get: {
        summary: "Redirect to Original URL",
        parameters: [
          {
            name: "alias",
            in: "path",
            required: true,
            type: "string",
          },
        ],
        responses: {
          "302": {
            description: "Redirect to original URL.",
          },
          "404": {
            description: "Short URL not found.",
          },
          "500": {
            description: "Server error.",
          },
        },
      },
    },
    "/api/analytics/{alias}": {
      get: {
        summary: "Get Analytics for a Short URL",
        parameters: [
          {
            name: "alias",
            in: "path",
            required: true,
            type: "string",
          },
        ],
        responses: {
          "200": {
            description: "Analytics data returned successfully.",
          },
          "401": {
            description: "Unauthorized.",
          },
          "404": {
            description: "Analytics data not found.",
          },
          "500": {
            description: "Server error.",
          },
        },
      },
    },
    "/api/analytics/topic/{topic}": {
      get: {
        summary: "Get Analytics for a Topic",
        parameters: [
          {
            name: "topic",
            in: "path",
            required: true,
            type: "string",
          },
        ],
        responses: {
          "200": {
            description: "Analytics data for the topic returned successfully.",
          },
          "401": {
            description: "Unauthorized.",
          },
          "404": {
            description: "Analytics data not found.",
          },
          "500": {
            description: "Server error.",
          },
        },
      },
    },
    "/api/analytics/overall": {
      get: {
        summary: "Get Overall Analytics",
        responses: {
          "200": {
            description: "Overall analytics data returned successfully.",
          },
          "401": {
            description: "Unauthorized.",
          },
          "500": {
            description: "Server error.",
          },
        },
      },
    },
  },
};

const options: Options = {
  definition: swaggerDefinition,
  apis: ["./src/**/*.ts"],
};

const swaggerspec = swaggerJSDoc(options);

export { swaggerspec };
