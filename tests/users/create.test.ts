import express from "express";
import { createUser } from "../../controllers/users/create";
import pool from "../../db/db";
import { jwtGenerateToken } from "../../middleware/jwt/jwt";
import { setToken } from "../../middleware/jwt/setToken";

jest.mock("../../db/db");
jest.mock("../../middleware/jwt/jwt");
jest.mock("../../middleware/jwt/setToken");

// Faulty
describe("createUser function", () => {
  it("should create a new user successfully", async () => {
    const req = {
      body: {
        email: "test@example.com",
        password: "password123",
        phone_number: "1234567890",
        account_type: "customer",
        account_name: "Test User",
      },
    };

    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    // Mock any dependencies or functions as needed

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "User created successfully",
      token: expect.any(String),
    });
  });

  // Add more test cases for other scenarios
});
