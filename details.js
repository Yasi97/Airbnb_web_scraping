const mongoose = require("mongoose");

const details = mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  title: String,
  rating: Number,
  No_Of_ratting: Number,
});

module.exports = mongoose.model("Airbnbe", details);
