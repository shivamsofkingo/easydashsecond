const swaggerDocument = {
    openapi: "3.0.0",
    info: {
      title: "User API Documentation",
      version: "1.0.0",
      description:
        "API documentation for user-related routes in Node.js, Express.js, and MongoDB application",
    },
    servers: [
      {
        url: "http://localhost:8000/api",
      },
    ],
    paths: {
      "/loginWithEmail": {
        post: {
          summary: "Login a user with email and password",
          tags: ["User"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "user@example.com",
                    },
                    password: {
                      type: "string",
                      example: "123456",
                    },
                  },
                },
              },
            },
          },
          parameters: [
            {
              in: "header",
              name: "devicetype",
              required: false,
              schema: {
                type: "string",
                example: "android",
              },
              description: "The type of device used for login",
            },
            {
              in: "header",
              name: "deviceid",
              required: false,
              schema: {
                type: "string",
                example: "device12345",
              },
              description: "The device ID used for login",
            },
          ],
          responses: {
            200: getSuccessResponse({
              user: {
                type: "object",
                description: "User details (excluding password)",
              },
              profileDetails: {
                type: "object",
                description: "Additional profile details",
              },
              token: {
                type: "string",
                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              },
            }),
            400: getErrorResponse("Missing fields or invalid credentials"),
            500: getErrorResponse("Internal server error"),
          },
        },
      },
      "/getUserById/{id}": {
          get: {
            summary: "Get user by ID",
            tags: ["User"],
            parameters: [
              {
                in: "path",
                name: "id",
                required: true,
                schema: {
                  type: "string",
                  example: "63b2cfa48b5e2f001c123456",
                },
                description: "The ID of the user",
              },
            ],
            responses: {
              200: getSuccessResponse({
                user: {
                  type: "object",
                  description: "User details (excluding password)",
                },
                profileDetails: {
                  type: "object",
                  description: "Additional profile details",
                },
              }),
              400: getErrorResponse("User not found"),
              500: getErrorResponse("Internal server error"),
            },
          },
        },
    },
      
  };
  
  function getSuccessResponse(payloadSchema) {
    return {
      description: "Operation successful",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              status: {
                type: "integer",
                example: 1,
              },
              msg: {
                type: "string",
                example: "success",
              },
              payload: {
                type: "object",
                properties: payloadSchema,
              },
            },
          },
        },
      },
    };
  }
  
  function getErrorResponse(message) {
    return {
      description: message,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              status: {
                type: "integer",
                example: 0,
              },
              msg: {
                type: "string",
                example: message,
              },
            },
          },
        },
      },
    };
  }
  
module.exports = swaggerDocument;