import express from "express";
import { getProductFullInfo } from "../../controllers/products/getFInfo";
import pool from "../../db/db";
jest.mock("../../db/db");

jest.mock("../../db/db", () => ({
  execute: jest.fn(),
}));

const pool = require("../../db/db"); // Mocked pool

import express, { Request, Response } from "express";
import { getProductFullInfo } from "./yourFilePath/getProductFullInfo"; // Replace with your actual file path

describe("getProductFullInfo", () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    req = { params: { product_id: 123 } } as Request;
    res = jest.fn() as Response;
  });

  it("should return a 400 error for missing product_id", async () => {
    delete req.params.product_id;

    await getProductFullInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing product_id" });
    expect(pool.execute).not.toHaveBeenCalled();
  });

  it("should return a 404 error for non-existent product", async () => {
    pool.execute.mockImplementation((query, values, callback) => {
      callback(null, []); // Simulate empty result
    });

    await getProductFullInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Product not found" });
    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT"),
      expect.arrayContaining([req.params.product_id]),
      expect.anyFunction()
    );
  });

  it("should return product details on success", async () => {
    const mockProductData = [
      {
        id: 123,
        name: "Test Product",
        // ... other product details
      },
    ];

    pool.execute.mockImplementation((query, values, callback) => {
      callback(null, mockProductData);
    });

    await getProductFullInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ result: mockProductData });
    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT"),
      expect.arrayContaining([req.params.product_id]),
      expect.anyFunction()
    );
  });

  it("should catch database errors and return 500", async () => {
    const mockError = new Error("Database error");

    pool.execute.mockImplementation((query, values, callback) => {
      callback(mockError);
    });

    await getProductFullInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT"),
      expect.arrayContaining([req.params.product_id]),
      expect.anyFunction()
    );
  });

  it("should catch other errors and return 500", async () => {
    const mockError = new Error("Unexpected error");

    jest
      .spyOn(getProductFullInfo, "getProductFullInfo")
      .mockImplementationOnce(() => {
        throw mockError;
      });

    await getProductFullInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
