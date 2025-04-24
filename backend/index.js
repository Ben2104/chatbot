import express from "express";
import cors from "cors";
import { config } from "dotenv";
import sendMessages from "./routes/sendMessages.js";

config();


const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use("/sendText", sendMessages);


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });