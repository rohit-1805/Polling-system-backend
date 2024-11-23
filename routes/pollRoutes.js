const express = require("express");
const Poll = require("../models/Poll");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, options, allowVoteChange, showInstantResult } = req.body;
    const createdBy = req.userId;
    const newPoll = new Poll({
      title,
      options: options.map((option) => ({ text: option })),
      createdBy,
      allowVoteChange,
      showInstantResult,
    });
    await newPoll.save();
    res.status(201).json(newPoll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const allPolls = await Poll.find({
      createdBy: userId,
    });
    if (!allPolls || allPolls.length === 0) {
      return res.status(400).json({
        message: "No polls found.",
      });
    }

    res.status(200).json({
      Polls: allPolls,
    });
  } catch (error) {
    console.log("Error while getting dashboard polls");

    res.status(500).json({ error: error.message });
  }
});

// Search polls by title
router.get("/search", authMiddleware, async (req, res) => {
  try {
    // console.log("Search api hit");

    const { query } = req.query;
    // console.log("query = ", query);

    if (!query) {
      return res.status(400).json({ message: "Search query is required." });
    }

    // Perform case-insensitive search, sorted by creation date (newest first)
    const polls = await Poll.find({
      title: { $regex: query, $options: "i" },
    }).sort({ createdAt: -1 });

    res.status(200).json(polls);
  } catch (error) {
    console.error("Error searching polls:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get a specific poll by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });
    res.status(200).json(poll);
  } catch (error) {
    console.log("Error while get specific poll details : ", error);

    res.status(500).json({ error: error.message });
  }
});

// Vote on a poll
router.post("/:id/vote", authMiddleware, async (req, res) => {
  try {
    const { optionId } = req.body;
    const userId = req.userId;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    const existingVote = poll.votes.find((vote) => vote.userId === userId);

    if (existingVote) {
      if (!poll.allowVoteChange) {
        return res.status(400).json({ error: "Vote change not allowed" });
      }
      // Update existing vote
      existingVote.optionId = optionId;
    } else {
      // Add new vote
      poll.votes.push({ userId, optionId });
    }

    // Update the vote count
    poll.options.forEach((option) => {
      option.votes = poll.votes.filter(
        (vote) => String(vote.optionId) === String(option._id)
      ).length;
    });

    await poll.save();
    res.status(200).json(poll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get poll analytics
router.get("/:id/analytics", authMiddleware, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    res.json({
      title: poll.title,
      totalVotes: poll.votes.length,
      options: poll.options,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// router.get("/", authMiddleware, async (req, res) => {
//   try {
//     const allPolls = await Poll.find();
//     if (!allPolls) {
//       return res.status(400).json({
//         message: "No active polls found.",
//       });
//     }

//     res.status(200).json({
//       Polls: allPolls,
//     });
//   } catch (error) {
//     console.log("Error while get all polls");

//     res.status(500).json({ error: error.message });
//   }
// });

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Fetch the paginated polls
    const allPolls = await Poll.find()
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const totalPolls = await Poll.countDocuments(); // Total number of polls

    res.status(200).json({
      polls: allPolls,
      totalPolls, // Total number of polls for calculating pages
      totalPages: Math.ceil(totalPolls / limit), // Total pages
      currentPage: Number(page),
    });
  } catch (error) {
    console.log("Error while fetching polls:", error.message);

    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
