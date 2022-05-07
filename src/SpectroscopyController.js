import * as R from "ramda";
import SpectroscopyModel from "./SpectroscopySchema.js";
import FormulaModel from "./FormulaSchema.js";
import FormulaController from "./FormulaController.js";
import mongoose from "mongoose";
import * as eqSpectro from "./eqfiddle-api.cjs";

const spectroApi = eqSpectro.default;

const findLTS = (stateKey) =>
  R.pipe(R.find(R.propEq("prefix", R.head(stateKey))), R.prop("lts"));

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
      console.log(error);
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
      console.log(error);
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
      console.log(error);
      ctx.body = error;
    }
  },
  delete: async (ctx) => {
    try {
      const _id = R.path(["params", "id"], ctx);
      const processes =
        (await FormulaModel.find({ spectroscopyId: _id })) || [];
      await Promise.all(
        processes.map(async (process) => {
          await FormulaController.delete({ params: { id: process._id } });
        })
      );
      ctx.body = await SpectroscopyModel.deleteOne({ _id });
    } catch (error) {
      console.log(error);
      ctx.body = error;
    }
  },
  compare: async (ctx) => {
    try {
      const left = R.path(["request", "query", "left"], ctx);
      const right = R.path(["request", "query", "right"], ctx);
      const spectroscopyId = R.path(["params", "id"], ctx);

      if (!left || !right) {
        throw new Error("Missing states to compare");
      }
      const formulas = await FormulaController.getBySpectroscopyId({
        params: { spectroscopyId },
      });

      const leftLTS = findLTS(left)(formulas);
      const rightLTS = findLTS(right)(formulas);

      const ltsSpec =
        R.head(left) === R.head(right)
          ? { lts: leftLTS }
          : {
              lts: {
                ...leftLTS,
                states: { ...leftLTS.states, ...rightLTS.states },
              },
            };

      const lts = spectroApi.loadLTS(ltsSpec);
      const spectroResult = spectroApi.performSpectroscopy(lts, left, right);
      ctx.body = {
        leftLTS,
        rightLTS,
        result: spectroResult,
      };
    } catch (error) {
      console.log(error);
      ctx.body = error;
      ctx.status = 500;
    }
  },
};

export default SpectroscopyController;
