const { Language } = require("@google/genai");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const problemSchema = new Schema({
  tittle: {
    type: String,
    required: true,
  },

  description: {
    type: true,
    required: true,
  },

  tags: {
    type: String,
    enum: [
      "array",
      "string",
      "dynamic programin",
      "linkedList",
      "stack",
      "queue",
      "trie",
      "recursion",
    ],
    required: true,
  },

  difficulty: {
    type: String,
    enum: ["easy", "mediun", "hard"],
    required: true,
  },

  visibleTestCases: [
    {
      input: {
        type: String,
        required: true,
      },
      output: {
        type: String,
        required: true,
      },
      explanation: {
        type: String,
        required: true,
      },
    },
  ],

  hiddenTestCases: [
    {
      input: {
        type: String,
        required: true,
      },
      output: {
        type: String,
        required: true,
      },
    },
  ],

  boilerPlateCode: [
    {
      language: {
        type: String,
        required: true,
      },
      initialCode: {
        type: String,
        required: true,
      },
    },
  ],

  problemCreator: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
});

const Problem = mongoose.model("Problem", problemSchema);
module.exports = Problem;
