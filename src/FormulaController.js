import * as R from "ramda";
import FormulaModel from "./FormulaSchema.js";
import { renameStates, transformToLTS } from "./ltsConversion.js";

const FormulaController = {
  getBySpectroscopyId: async (ctx) => {
    const spectroscopyId = R.path(["params", "spectroscopyId"], ctx);
    ctx.body = await FormulaModel.find({ spectroscopyId });
  },
  create: async (ctx) => {
    const ccs = R.path(["request", "body", "ccs"], ctx);
    const prefix = R.path(["request", "body", "prefix"], ctx);
    const spectroscopyId = R.path(["request", "body", "spectroscopyId"], ctx);
    const lts = renameStates(transformToLTS(ccs), prefix);

    const spec = new FormulaModel({
      ccs,
      lts,
      spectroscopyId,
    });
    await spec.save().catch((err) => (ctx.body = err));
    ctx.body = spec;
  },
  update: async (ctx) => {
    const _id = R.path(["params", "id"], ctx);
    const ccs = R.path(["request", "body", "ccs"], ctx);
    const prefix = R.path(["request", "body", "prefix"], ctx);

    ctx.body = await FormulaModel.findOneAndUpdate(
      { _id },
      {
        ...R.path(["request", "body"], ctx),
        ...(ccs ? { lts: renameStates(transformToLTS(ccs), prefix) } : {}),
      },
      { new: true }
    );
  },
};

export default FormulaController;
