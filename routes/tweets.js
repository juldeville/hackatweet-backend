var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Tweet = require("../models/tweets");
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
  const tweets = await Tweet.find().populate("user");
  const modifiedTweets = tweets.map((tweet) => {
    const liked = tweet.likes.includes(user._id);
    return {
      ...tweet.toObject(),
      liked: liked,
    };
  });
  res.json({ result: true, tweets: modifiedTweets });
});

router.post("/newTweet", (req, res) => {
  if (!checkBody(req.body, ["tweetContent"])) {
    res.json({ result: false, error: "missing or empty fields" });
    return;
  }
  if (!checkBody(req.body, ["token"])) {
    res.json({ result: false, error: "missing token" });
    return;
  }
  User.findOne({ token: req.body.token }).then((data) => {
    const newTweet = new Tweet({
      user: data._id,
      tweetContent: req.body.tweetContent,
      date: new Date(),
      tag: req.body.tag,
    });

    newTweet.save().then(() => {
      res.json({ result: true });
    });
  });
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
