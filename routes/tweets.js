var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Tweet = require("../models/tweets");
const Tag = require("../models/tags");
const { checkBody } = require("../modules/checkBody");

router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.get("/getTweets/:token", async (req, res) => {
  const user = await User.findOne({ token: req.params.token });
  if (!user) {
    res.json({ result: false, error: "user not found" });
    return;
  }
  const tweets = await Tweet.find().populate("user").populate("tag");
  const modifiedTweets = tweets.map((tweet) => {
    const liked = tweet.likes.includes(user._id);
    return {
      ...tweet.toObject(),
      liked: liked,
    };
  });
  res.json({ result: true, tweets: modifiedTweets });
});

router.post("/newTweet", async (req, res) => {
  if (!checkBody(req.body, ["token", "tweetContent"])) {
    res.json({ result: false, error: "mising of empty fields" });
    return;
  }

  const { tweetContent, tag, token } = req.body;
  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      res.json({ result: false, error: "user not found" });
      return;
    }
    let tagDoc;
    let tagId = null;
    if (tag) {
      console.log("im here");
      tagDoc = await Tag.findOne({ name: tag });
      console.log("tagdoc is", tagDoc);
      if (!tagDoc) {
        console.log("im here again");
        tagDoc = await new Tag({
          name: tag,
        });
        await tagDoc.save();
        console.log("tagdoc is", tagDoc);
      }
      tagId = tagDoc._id;
    }

    const newTweet = await new Tweet({
      user: user._id,
      tweetContent: tweetContent,
      date: new Date(),
      tag: tagId,
      likeCount: 0,
    });

    await newTweet.save();
    if (tagDoc) {
      await Tag.updateOne({ _id: tagId }, { $push: { tweets: newTweet._id } });
    }
    res.json({ result: true });
  } catch (error) {
    console.error(error);
    res.json({ result: false, error: "error occured" });
  }
});

router.post("/handleLike", async (req, res) => {
  try {
    const user = await User.findOne({ token: req.body.token });
    if (!user) {
      res.json({ result: false, error: "user not found" });
      return;
    }
    let tweet = await Tweet.findOne({ _id: req.body.tweetId });
    if (!tweet) {
      res.json({ result: false, error: "tweet not found" });
      return;
    }

    const isLiked = tweet.likes.includes(user._id);

    const update = isLiked
      ? { $inc: { likeCount: -1 }, $pull: { likes: user._id } }
      : { $inc: { likeCount: 1 }, $push: { likes: user._id } };

    await Tweet.updateOne({ _id: req.body.tweetId }, update);
    tweet = await Tweet.findOne({ _id: req.body.tweetId });

    res.json({
      result: true,
      isLiked: isLiked,
      likeCount: tweet.likeCount,
    });
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

module.exports = router;
