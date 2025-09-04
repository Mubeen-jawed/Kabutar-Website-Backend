const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
app.use(cors({
    origin: ["http://localhost:5173", "https://kabutarmagazine.com"],
    credentials: true,
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"],
  }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose.connect(process.env.MONGO_URI, { dbName: "kabutar" })
  .then(()=>console.log("MongoDB connected"))
  .catch(e=>console.error(e));

app.use("/api/articles", require("./routes/articles"));
app.use("/api/uploads",  require("./routes/uploads"));
app.use("/api/admin",    require("./routes/admin"));   // NEW

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("API listening on", PORT));
