var express = require("express");
var router = express.Router();
const Tag = require("../models/tags");

router.get("/getTags", async (req, res) => {
  try {
    const tags = await Tag.find();
    const modifiedTags = tags.sort((a, b) => {
      return b.tweets.length - a.tweets.length;
    });
    res.json({ result: modifiedTags });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("getTest", (req, res) => {
  console.log("success");
  res.json({ result: true, sucess: "dat right" });
});

module.exports = router;
