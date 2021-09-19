import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fileUpload from "express-fileupload";
import { dirname } from "path";
import { fileURLToPath } from "url";
import Assignment from "./model/assignment.model.js";
const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();
app.use(express.json());
app.use(express.static("public"));
app.use(fileUpload());
app.use(cors());

const __dirname = dirname(fileURLToPath(import.meta.url));

// app.use(fileUpload({
//   limits: { fileSize: 50 * 1024 * 1024 },
// }));

// db config
const db = mongoose.connection;

// fix for deprecations
const DEPRECATED_FIX = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// listen for errors after the connection is established (errors during the session)
db.on("error", (error) => console.log("❌ MongoDB:", error));

// listen when db is disconnected
db.on("disconnected", () => console.log("❌ MongoDB disconnected"));

db.once("open", () => {
  console.log("✅ MongoDB connected");
});

// connect to db
mongoose
  .connect(process.env.MONGODB_CONNECTION_URL, DEPRECATED_FIX)
  .catch((error) => console.log("❌ MongoDB:", error));

// home route
app.get("/", (req, res) => {
  res.send("Todo list backend");
});

// view all data
app.get("/data", async (req, res) => {
  //   const todos = await Todo.find();
  try {
    const assignments = await Assignment.find();
    res.status(201).json({ status: "ok", assignments });
  } catch (err) {
    res.status(500).json({ status: "failed", err: err || "error" });
  }
});

// add form data
app.post("/data", async (req, res) => {
  try {
    const { file } = req.files,
      { name, email } = req.body;
    const timestamp = Date.now().toString();
    const uploadPath = "/public/files/" + timestamp + "_" + file.name;
    file.mv("." + uploadPath, (err) => {
      if (err) return res.status(500).send(err);

      const newAssignment = {
        name,
        email,
        assignmentURL: uploadPath,
      };
      Assignment.create(newAssignment)
        .then(() => {
          res.status(201).send({ status: "ok" });
        })
        .catch((err) => {
          res.status(500).send(err || "error");
        });
    });
    console.log("File upload success! ✅");
  } catch (error) {
    res.json({ status: "error", error });
    console.log("File upload failed ☠");
  }
});

app.get("/public/files/:fileName", (req, res) => {
  res.sendFile(__dirname + "/public/files/" + req.params.fileName);
});

app.listen(PORT, () => {
  console.log(`Server started on PORT: ${PORT}`);
});
