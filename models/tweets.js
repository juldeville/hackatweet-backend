const mongoose = require("mongoose");

const tweetSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  tweetContent: String,
  date: Date,
  tag: { type: mongoose.Schema.Types.ObjectId, ref: "tags" },
  likeCount: Number,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
});

const Tweet = mongoose.model("tweets", tweetSchema);

module.exports = Tweet;
