const mongoose = require("mongoose");

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },
});

const VoteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  optionId: { type: mongoose.Schema.Types.ObjectId, required: true },
});

const PollSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    options: [OptionSchema],
    createdBy: { type: String, required: true },
    allowVoteChange: { type: Boolean, default: false },
    showInstantResult: { type: Boolean, default: false },
    votes: [VoteSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Poll", PollSchema);
