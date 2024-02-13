const mongoose = require("mongoose");

const tagSchema = mongoose.Schema({
  name: String,
  tweets: Number,
});

const Tag = mongoose.model("tags", tagSchema);

module.exports = Tag;
