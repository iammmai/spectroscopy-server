import * as R from "ramda";
import SpectroscopyModel from "./SpectroscopySchema.js";
import FormulaModel from "./FormulaSchema.js";
import FormulaController from "./FormulaController.js";
import mongoose from "mongoose";

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
    try {
      const result = await SpectroscopyModel.find({}).lean();

      const response = await Promise.all(
        result.map(async (spectroscopy) => {
          const formulas = await FormulaModel.find({
            spectroscopyId: mongoose.Types.ObjectId(spectroscopy._id),
          });
          return { ...spectroscopy, processes: formulas };
        })
      );
      ctx.body = response;
    } catch (error) {
      ctx.body = error;
    }
  },
  create: async (ctx) => {
    try {
      const spec = new SpectroscopyModel(
        R.path(["request", "body", "spectroscopy"], ctx)
      );
      await spec.save().catch((err) => (ctx.body = err));
      R.path(["request", "body", "processes"], ctx).forEach(
        async ({ ccs, prefix }) => {
          await FormulaController.create({
            request: {
              body: {
                ccs,
                prefix,
                spectroscopyId: spec._id,
              },
            },
          });
        }
      );
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
