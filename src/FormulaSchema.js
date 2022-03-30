import mongoose from "mongoose";
const Schema = mongoose.Schema;

const LTSSchema = new Schema({
  initialState: String,
  states: Schema.Types.Mixed,
});

const FormulaSchema = new Schema(
  {
    ccs: String,
    lts: LTSSchema,
    spectroscopyId: { type: Schema.Types.ObjectId, required: true },
  },
  {
    timestamps: true,
  }
);

const FormulaModel = mongoose.model("FormulaModel", FormulaSchema);

export default FormulaModel;
