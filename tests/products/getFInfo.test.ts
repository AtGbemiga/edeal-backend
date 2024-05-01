import { getProductFullInfo } from "../../controllers/products/getFInfo";
import { Request, Response } from "express";
import mysql from "mysql2";


// return value should be whatever you expect createPool should return
jest.spyOn(mysql, "createPool").mockReturnValue({
  connect: jest.fn(),
  end: jest.fn(),
  query: jest.fn(),
  on: jest.fn(),
}); 

// Mock Request and Response objects
const reqMock = {
  params: {},
} as Request;

const resMock = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
} as unknown as Response;

const nextMock = jest.fn();

describe("getProductFullInfo", () => {
  it("should respond with a 400 status and an error message when no product_id is provided", () => {
    getProductFullInfo(reqMock, resMock, nextMock);
    expect(resMock.status).toHaveBeenCalledWith(400);
    expect(resMock.json).toHaveBeenCalledWith({ error: "Missing product_id" });
  });
});
