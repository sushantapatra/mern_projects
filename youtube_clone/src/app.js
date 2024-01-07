import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
//express app initialize
const app = express();
//set middlewares
//CORS settings
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//allow JSON file and JSON file limit
app.use(
  express.json({
    limit: "16kb",
  })
);
//URL Params encoded data reading
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // extended => Objects andar objects pass kara sakte ho url main
//public Assets for images and other files
app.use(express.static("public"));
// set Cookie parser settings to read only server
app.use(cookieParser({}));

//routes import
import userRouter from './routes/user.routes.js';
//routes declarations
app.use("/api/v1/users",userRouter ) //http://127.0.0.1:8000/api/v1/users/
export { app };

