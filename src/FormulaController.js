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
      const processName = R.path(["request", "body", "processName"], ctx);
      const spectroscopyId = R.path(["request", "body", "spectroscopyId"], ctx);
      const relatedProcesses =
        R.path(["request", "body", "relatedProcesses"], ctx) ||
        (await FormulaModel.find({ spectroscopyId }));

      const lts = renameStates(
        transformToLTS(ccs, processName, relatedProcesses),
        processName,
        ccs
      );

      const spec = new FormulaModel({
        ccs,
        lts,
        processName,
        spectroscopyId,
      });
      await spec.save().catch((err) => (ctx.body = err));
      ctx.body = spec;
    } catch (err) {
      console.error("ERRRRRRRRR", err);
      ctx.body = err;
      ctx.status = 500;
      throw err;
    }
  },
  update: async (ctx) => {
    try {
      const _id = R.path(["params", "id"], ctx);
      const ccs = R.path(["request", "body", "ccs"], ctx);
      // TODO: default prefix should be the one that is saved in the db
      const processName = R.path(["request", "body", "processName"], ctx);

      const formula = await FormulaModel.findOne({ _id });
      const relatedProcesses = await FormulaModel.find({
        spectroscopyId: formula.spectroscopyId,
      });

      ctx.body = await FormulaModel.findOneAndUpdate(
        { _id },
        {
          ...R.path(["request", "body"], ctx),
          ...(ccs
            ? {
                lts: renameStates(
                  transformToLTS(ccs, processName, relatedProcesses),
                  processName,
                  ccs
                ),
              }
            : {}),
        },
        { new: true }
      );
      // related processes also need to be updated if they contain a reference to this process
      await Promise.all(
        relatedProcesses.map(async (process) => {
          if (process.ccs.includes(processName)) {
            return FormulaController.update({
              params: { id: process._id },
              request: {
                body: { ccs: process.ccs, processName: process.processName },
              },
            });
          }
        })
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
