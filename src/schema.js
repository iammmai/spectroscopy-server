import mongoose from "mongoose";
const Schema = mongoose.Schema;

const SpectroscopySchema = new Schema(
  {
    p1: String,
    p2: String,
  },
  {
    timestamps: true,
  }
);

const SpectroscopyModel = mongoose.model(
  "SpectroscopyModel",
  SpectroscopySchema
);

export default SpectroscopyModel;
