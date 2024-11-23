// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    // name: { type: String, require: true },
    password: { type: String, required: true }, // In real apps, always hash passwords!
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
