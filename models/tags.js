const mongoose = require("mongoose");

const tagSchema = mongoose.Schema({
  name: String,
  tweets: [{ type: mongoose.Schema.Types.ObjectId, ref: "tweets" }],
});

const Tag = mongoose.model("tags", tagSchema);

module.exports = Tag;
