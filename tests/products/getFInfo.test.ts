import { getProductFullInfo } from "../../controllers/products/getFInfo";
import { Request, Response } from "express";
import pool from "../../db/db";

// Mocking the pool.execute method
jest.mock("../../db/db", () => ({
  execute: jest.fn(),
}));

describe("getProductFullInfo", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { product_id: "123" },
      headers: { authorization: "Bearer mocktoken" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if product_id is missing", async () => {
    req.params = {};

    await getProductFullInfo(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing product_id" });
  });

  it("should return 401 if user_id is missing", async () => {
    // Mock getUserIDAndToken to return an empty object
    jest.mock("../../controllers/users/getUserIdFromToken", () =>
      jest.fn().mockReturnValue({})
    );

    await getProductFullInfo(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  it("should return 500 if there is a database error", async () => {
    const mockExecute = require("../../db/db").execute;
    mockExecute.mockImplementation((query, params, callback) => {
      callback(new Error("Database error"), null);
    });

    await getProductFullInfo(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("should return 500 if there is a database error", async () => {
    jest.mock("../../db/db", () => ({
      execute: jest.fn().mockImplementation((query, params, callback) => {
        callback(new Error("Database error"), null);
      }),
    }));

    await getProductFullInfo(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  // it('should return 404 if no product is found', async () => {
  //   const mockExecute = require('../../db/db').execute;
  //   mockExecute.mockImplementation((query, params, callback) => {
  //     callback(null, []);
  //   });

  //   await getProductFullInfo(req as Request, res as Response, next);

  //   expect(res.status).toHaveBeenCalledWith(404);
  //   expect(res.json).toHaveBeenCalledWith({ error: "Product not found" });
  // });

  // it('should return 200 and the product info if product is found', async () => {
  //   const mockExecute = require('../../db/db').execute;
  //   const mockProduct = { id: 123, name: "Product name" }; // Example product info
  //   mockExecute.mockImplementation((query, params, callback) => {
  //     callback(null, [mockProduct]);
  //   });

  //   await getProductFullInfo(req as Request, res as Response, next);

  //   expect(res.status).toHaveBeenCalledWith(200);
  //   expect(res.json).toHaveBeenCalledWith({ result: [mockProduct] });
  // });
});
