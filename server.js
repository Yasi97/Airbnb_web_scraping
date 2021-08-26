const mongoose = require("mongoose");

const details = mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  hostName: String,
  hotelName: String,
  cleanliness_ratings: Number,
  accuracy_ratings: Number,
  checkin_ratings: Number,
  value_ratings: Number,
  location_ratings: Number,
  communication_ratings: Number,
  //policy_NO: String,
  bedrooms: String,
  beds: String,
  bath: String,
});

module.exports = mongoose.model("filtorDetails", details);
