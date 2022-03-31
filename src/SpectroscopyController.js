import * as R from "ramda";
import SpectroscopyModel from "./SpectroscopySchema.js";
import FormulaModel from "./FormulaSchema.js";

const SpectroscopyController = {
  get: async (ctx) => {
    try {
      const _id = R.path(["params", "id"], ctx);
      ctx.body = await SpectroscopyModel.findOne({ _id });
    } catch (error) {
      ctx.body = error;
    }
  },
  getAll: async (ctx) => {
    ctx.body = await SpectroscopyModel.find({});
  },
  create: async (ctx) => {
    try {
      const spec = new SpectroscopyModel(
        R.path(["request", "body", "spectroscopy"], ctx)
      );
      await spec.save().catch((err) => (ctx.body = err));
      R.path(["request", "body", "processes"], ctx).forEach(async (process) => {
        const formula = new FormulaModel({
          ...process,
          spectroscopyId: spec._id,
        });
        await formula.save().catch((err) => (ctx.body = err));
      });
      ctx.body = spec;
    } catch (error) {
      ctx.body = error;
    }
  },
  update: async (ctx) => {
    try {
      const _id = R.path(["params", "id"], ctx);
      ctx.body = await SpectroscopyModel.findOneAndUpdate(
        { _id },
        R.path(["request", "body"], ctx),
        { new: true }
      );
    } catch (error) {
      ctx.body = error;
    }
  },
};

export default SpectroscopyController;
