import mongoose from "mongoose";
const Schema = mongoose.Schema;

const SpectroscopySchema = new Schema(
  {
    title: String,
    description: String,
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
