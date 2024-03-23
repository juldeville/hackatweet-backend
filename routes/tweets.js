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
    const tweetByUser = tweet.user._id.toString() === user._id.toString();
    return {
      ...tweet.toObject(),
      liked: liked,
      tweetByUser: tweetByUser,
    };
  });
  res.json({ result: true, tweets: modifiedTweets });
});

router.post("/getTweetsByTag/:token", async (req, res) => {
  const user = await User.findOne({ token: req.params.token });
  if (!user) {
    res.json({ result: false, error: "user not found" });
    return;
  }
  const tag = await Tag.findOne({ name: req.body.tagName });
  if (!tag) {
    res.json({ result: false, error: "no tag found" });
    return;
  }
  const tweetsByTag = await tag.populate({
    path: "tweets",
    populate: { path: "user" },
  });

  const extractedTweets = [...tweetsByTag.tweets];

  const modifiedTweets = extractedTweets.map((tweet) => {
    const liked = tweet.likes.includes(user._id);
    const tweetByUser = tweet.user._id.toString() === user._id.toString();
    return {
      ...tweet.toObject(),
      liked: liked,
      tweetByUser: tweetByUser,
    };
  });

  res.json({ result: true, modifiedTweets: modifiedTweets });
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
      tagDoc = await Tag.findOne({ name: tag });
      if (!tagDoc) {
        tagDoc = await new Tag({
          name: tag,
        });
        await tagDoc.save();
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

    await User.updateOne(
      { _id: user._id },
      { $push: { tweets: newTweet._id } }
    );

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

router.post("/deleteTweet", async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.body.tweetId);
    const tag = await Tag.findById(tweet.tag);
    if (!tag) {
      await Tweet.deleteOne({ _id: req.body.tweetId });
      return res.json({ result: true });
    }
    await Tag.updateOne(
      { _id: tweet.tag },
      { $pull: { tweets: req.body.tweetId } }
    );
    const result = await Tag.findById(tag._id);
    if (result.tweets.length === 0) {
      await Tag.deleteOne({ _id: tag._id });
    }
    await Tweet.deleteOne({ _id: req.body.tweetId });

    res.json({ result: true });
  } catch (error) {
    console.error(error);
    res.json({ result: false, error: "error occured" });
  }
});

module.exports = router;
