const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  name: String,
  startingDate: Date,
  endDate: Date,
  level: String,
  available: {
    type: Boolean,
    default: true
  }
});

const Course = mongoose.model(`Course`, courseSchema);

module.exports = Course;
