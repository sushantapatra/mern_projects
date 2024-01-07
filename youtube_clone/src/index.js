// require("dotenv").config({ path: "../.env" }); // dotenv file loading when index.js file run/ server run  for avaliable for every file - Type 1
import dotenv from "dotenv";
import connectDB from "./db/dbconnection.js";

import { app } from "./app.js";
// dotenv file loading when index.js file run/ server run  for avaliable for every file - Type 2
dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;
//database connection
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running at port 127.0.0.1:${port}`);
    });
  })
  .catch((err) => {
    console.error("MONGO DB connection failed !!!", err);
  });

app.get("/", (error, req, res, next) => {
  res.json({
    success: true,
  });
});

/*import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "./constants";
//express app initialization
const app = express();
//database connection - first Approach
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("ERROR: ", error);
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("ERROR: ", error);
    throw error;
  }
})();
*/
