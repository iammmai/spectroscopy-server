import * as R from "ramda";
import FormulaModel from "./FormulaSchema.js";
import { renameStates, transformToLTS } from "./ltsConversion.js";

const FormulaController = {
  getBySpectroscopyId: async (ctx) => {
    const spectroscopyId = R.path(["params", "spectroscopyId"], ctx);
    const result = await FormulaModel.find({ spectroscopyId });
    ctx.body = result;
    return result;
  },
  create: async (ctx) => {
    try {
      const ccs = R.path(["request", "body", "ccs"], ctx);
      const prefix = R.path(["request", "body", "prefix"], ctx);
      const spectroscopyId = R.path(["request", "body", "spectroscopyId"], ctx);
      const lts = renameStates(transformToLTS(ccs), prefix);

      const spec = new FormulaModel({
        ccs,
        lts,
        prefix,
        spectroscopyId,
      });
      await spec.save().catch((err) => (ctx.body = err));
      ctx.body = spec;
    } catch (err) {
      console.error(err);
      ctx.status = 500;
      ctx.body = err;
      throw err;
    }
  },
  update: async (ctx) => {
    try {
      const _id = R.path(["params", "id"], ctx);
      const ccs = R.path(["request", "body", "ccs"], ctx);
      // TODO: default prefix should be the one that is saved in the db
      const prefix = R.path(["request", "body", "prefix"], ctx);

      ctx.body = await FormulaModel.findOneAndUpdate(
        { _id },
        {
          ...R.path(["request", "body"], ctx),
          ...(ccs ? { lts: renameStates(transformToLTS(ccs), prefix) } : {}),
        },
        { new: true }
      );
    } catch (err) {
      console.error(err);
      ctx.body = err;
    }
  },
  delete: async (ctx) => {
    try {
      const _id = R.path(["params", "id"], ctx);
      ctx.body = await FormulaModel.deleteOne({ _id });
    } catch (error) {
      ctx.body = error;
    }
  },
};

export default FormulaController;
