import { generateSalt } from "../../middleware/bcrypt/bcryptUtils";

import * as bcrypt from "bcrypt"; // Import the entire bcrypt library

// Faulty
jest.mock("bcrypt", () => ({
  genSalt: jest.fn((rounds, callback) => callback(null, "mockedSalt")),
}));

describe("generateSalt", () => {
  it("should generate a salt", async () => {
    const salt = await generateSalt(10);
    expect(salt).toBe("mockedSalt");
  });

  //   it('should handle error', async () => {
  //     jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error output
  //     const errorMessage = 'Something went wrong';
  //     jest.spyOn(bcrypt, 'genSalt').mockImplementation((rounds, callback) => callback(errorMessage));
  //     try {
  //       await generateSalt(10);
  //     } catch (error) {
  //       expect(error).toBe(errorMessage);
  //     }
  //   });
});
