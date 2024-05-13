// import { getProductFullInfo } from "../../controllers/products/getFInfo";
// import { Request, Response } from "express";
// import mysql, { Pool } from "mysql2";
// import { createPool } from "mysql2/promise";

// describe("getProductFullInfo", () => {
//   const connection = await createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASSWORD,
//     waitForConnections: true,
//     connectionLimit: 10,
//     maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
//     idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
//     queueLimit: 0,
//     enableKeepAlive: true,
//     keepAliveInitialDelay: 0,
//   });

// })

// // jest.spyOn(mysql, "createPool").mockReturnValue({
// //   connect: jest.fn(),
// //   end: jest.fn(),
// //   query: jest.fn(),
// //   on: jest.fn(),
// //   getConnection: jest.fn(),
// //   releaseConnection: jest.fn(),
// //   unprepare: jest.fn(),
// //   promise: jest.fn(),
// // } as unknown as Pool);

// // describe("getProductFullInfo", () => {
// //   it("should receive product_id from req.params", () => {
// //     const req = {
// //       params: {
// //         product_id: "1",
// //       },
// //     } as unknown as Request;
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     } as unknown as Response;
// //     const next = jest.fn(); // Add this line

// //     getProductFullInfo(req, res, next); // Pass next as well
// //     expect(req.params.product_id).toBe("1");
// //   });
// // });

import { createPool } from "mysql2/promise";

describe("Database Tests", () => {
  let connection;

  beforeEach(async () => {
    const createTableSQL =
      "CREATE TABLE `userstest` ( `id` INT(2) NOT NULL AUTO_INCREMENT , `name` VARCHAR(100) NOT NULL , `email` VARCHAR(50) NOT NULL , PRIMARY KEY (`id`)) ENGINE = InnoDB;";

    connection = await createPool({
      host: process.env.DB_HOST,
      port: 4192,

      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
      idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
    console.log("Connected to database");

    await connection.query(createTableSQL);
  });

  it("Test CREATE and READ", async () => {
    try {
      const total_test_users = 3;
      const insertQueries = [];

      for (let i = 0; i < total_test_users; i++) {
        const insertSQL = `INSERT INTO userstest (id, name, email) VALUES (NULL, 'Tim', 'Jim');`;

        insertQueries.push(connection.query(insertSQL));
      }

      await Promise.all(insertQueries);

      const [rows, fields] = await connection.query("SELECT * FROM userstest");

      expect(rows.length).toBe(total_test_users);
    } catch (error) {
      console.log(error);
      const dropTableSQL = "DROP TABLE IF EXISTS `userstest`";
      await connection.query(dropTableSQL);
      await connection.end();
    }
  }, 60000);

  afterEach(async () => {
    const dropTableSQL = "DROP TABLE IF EXISTS `userstest`";
    await connection.query(dropTableSQL);
    await connection.end();
  });
});
