const mongoose = require("mongoose");

const tweetSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  tweetContent: String,
  date: Date,
  tag: String,
});

const Tweet = mongoose.model("tweets", tweetSchema);

module.exports = Tweet;
