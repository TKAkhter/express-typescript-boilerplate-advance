import request from "supertest";
import path from "path";
import app from "../src/app";
import { RedisClient } from "../src/config/redis/redis";
import { logger } from "../src/common/winston/winston";
import { loadTestData } from "./test.helper";
import { Users, Files } from "@prisma/client";

const ROUTE = "/api/files";

// eslint-disable-next-line no-empty-function
jest.spyOn(logger, "info").mockImplementation(() => {});
// eslint-disable-next-line no-empty-function
jest.spyOn(logger, "warn").mockImplementation(() => {});
// eslint-disable-next-line no-empty-function
jest.spyOn(logger, "error").mockImplementation(() => {});

afterAll(async () => {
  await RedisClient.disconnect();
});

describe("Files API Tests", () => {
  let authToken: string;
  let testUser: Users;
  let testFile: Files;

  beforeAll(async () => {
    const { login } = loadTestData();
    // Authenticate user and get token
    const loginResponse = await request(app).post("/api/auth/login").send(login);

    authToken = loginResponse.body.data.token;
    testUser = loginResponse.body.data.user;
  });

  // Should successfully upload a file
  it("should successfully upload a file", async () => {
    const response = await request(app)
      .post(`${ROUTE}/upload`)
      .set("Authorization", `Bearer ${authToken}`)
      .field({
        tags: "test, file",
        userRef: testUser.id,
      })
      .attach("file", path.join(__dirname, "test-file.png"));

    testFile = response.body.data;

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty("filePath");
  });

  it("should fetch uploaded file", async () => {
    const response = await request(app).get(ROUTE).set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("should fetch uploaded file by id", async () => {
    const response = await request(app)
      .get(`${ROUTE}/id/${testFile.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });

  it("should fetch uploaded file by user id", async () => {
    const response = await request(app)
      .get(`${ROUTE}/user/${testFile.userId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });
});
