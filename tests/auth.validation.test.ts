import request from "supertest";
import app from "../src/app";
import { RedisClient } from "../src/config/redis/redis";
import { logger } from "../src/common/winston/winston";
import { loadTestData } from "./test.helper";
import { Users } from "@prisma/client";

const ROUTE = "/api/auth";

// eslint-disable-next-line no-empty-function
jest.spyOn(logger, "info").mockImplementation(() => {});
// eslint-disable-next-line no-empty-function
jest.spyOn(logger, "warn").mockImplementation(() => {});
// eslint-disable-next-line no-empty-function
jest.spyOn(logger, "error").mockImplementation(() => {});

describe("Auth API Tests", () => {
  let authToken: string;
  let testUser: Users;

  afterAll(async () => {
    await RedisClient.disconnect();
  });

  test("User Registration - Success", async () => {
    const { register } = loadTestData();

    const res = await request(app).post(`${ROUTE}/register`).send(register);
    if (res.error) {
      console.log("User Login - Success", JSON.parse(res.text));
    }
    if (res.status >= 200) {
      authToken = res.body.data.token;
      testUser = res.body.data.user;
    }
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "User registered successfully");
  });

  test("User Login - Success", async () => {
    const { login } = loadTestData();

    const res = await request(app).post(`${ROUTE}/login`).send(login);

    if (res.error) {
      console.log("User Login - Success", JSON.parse(res.text));
    }

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("token");
    authToken = res.body.data.token;
    testUser = res.body.data.user;
  });

  test("Login with Invalid Credentials - Failure", async () => {
    const { invalidLogin } = loadTestData();

    const res = await request(app).post(`${ROUTE}/login`).send(invalidLogin);

    expect(res.status).toBe(400);
  });

  test("Register with Existing Email - Failure", async () => {
    const { register } = loadTestData();

    const res = await request(app).post(`${ROUTE}/register`).send(register);

    expect(res.status).toBe(400);
  });

  test("Password Reset Request - Success", async () => {
    const res = await request(app).post(`${ROUTE}/forgot-password`).send({
      email: testUser.email,
    });

    if (res.error) {
      console.log("Password Reset Request - Success", JSON.parse(res.text));
    }

    expect(res.status).toBe(200);
  });

  test("Password Reset with Valid Token - Success", async () => {
    const { login, newPassword } = loadTestData();

    const loginRes = await request(app).post(`${ROUTE}/login`).send(login);

    const res = await request(app).post(`${ROUTE}/reset-password`).send({
      resetToken: loginRes.body.data.user.resetToken,
      password: newPassword,
      confirmPassword: newPassword,
    });

    if (res.error) {
      console.log("Password Reset with Valid Token - Failure", JSON.parse(res.text));
    }

    expect(res.status).toBe(200);
  });

  test("Password Reset with Invalid Token - Success", async () => {
    const { newPassword } = loadTestData();

    const res = await request(app).post(`${ROUTE}/reset-password`).send({
      resetToken: "invalidToken",
      password: newPassword,
      confirmPassword: newPassword,
    });

    expect(res.status).toBe(400);
  });

  test("Access Protected Route Without Token - Failure", async () => {
    const res = await request(app).get("/api/user");
    expect(res.status).toBe(401);
  });

  test("Access Protected Route With Valid Token - Failure", async () => {
    const res = await request(app).get("/api/user").set("Authorization", `Bearer ${authToken}`);
    expect(res.status).toBe(200);
  });

  // Test("Invalid Email Format in Registration - Failure", async () => {
  //   Const res = await request(app).post(`${ROUTE}/register`).send({
  //     Email: "invalid-email",
  //     Password: "Test@123",
  //     Name: "Test User"
  //   });
  //   Expect(res.status).toBe(400);
  // });

  // Test("Short Password in Registration - Failure", async () => {
  //   Const res = await request(app).post(`${ROUTE}/register`).send({
  //     Email: "valid@email.com",
  //     Password: "123",
  //     Name: "User"
  //   });
  //   Expect(res.status).toBe(400);
  // });
});
