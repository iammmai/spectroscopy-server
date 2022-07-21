import * as R from "ramda";
import SpectroscopyModel from "./SpectroscopySchema.js";
import FormulaModel from "./FormulaSchema.js";
import FormulaController from "./FormulaController.js";
import mongoose from "mongoose";
import * as eqSpectro from "./eqfiddle-api.cjs";

const spectroApi = eqSpectro.default;

const findLTS = (stateKey) => {
  const hasSamePrefix = (stateKey) => (formula) =>
    R.head(formula.processName) === R.head(stateKey);
  return R.pipe(R.find(hasSamePrefix(stateKey)), R.prop("lts"));
};

const pickLTS = (prefix) =>
  R.find((lts) => R.head(prefix) === R.head(lts.initialState));

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
      ctx.status = 500;
      ctx.body = error;
    }
  },
  create: async (ctx) => {
    try {
      const spec = new SpectroscopyModel(
        R.path(["request", "body", "spectroscopy"], ctx)
      );
      await spec.save().catch((err) => (ctx.body = err));
      const relatedProcesses = R.path(["request", "body", "processes"], ctx);
      await Promise.all(
        R.path(["request", "body", "processes"], ctx).map(
          async ({ ccs, processName }) => {
            await FormulaController.create({
              request: {
                body: {
                  ccs,
                  processName,
                  spectroscopyId: spec._id,
                  relatedProcesses,
                },
              },
            });
          }
        )
      );
      ctx.body = spec;
    } catch (error) {
      console.log(error);
      ctx.status = 500;
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
      ctx.status = 500;
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
          return await FormulaController.delete({
            params: { id: process._id },
          });
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
      const result = spectroApi.performSpectroscopy(lts, left, right);

      const sorted = R.sort((a, b) => {
        const leftProp = R.prop("left");
        if ([left, right].includes(leftProp(a))) {
          return -Infinity;
        }
        return (leftProp(a) || "").length - (leftProp(b) || "").length;
      }, result);

      const ltsData = [leftLTS, rightLTS];

      ctx.body = {
        leftLTS,
        rightLTS,
        result: sorted.map((resultItem) => {
          return {
            ...resultItem,
            left: {
              stateKey: resultItem.left,
              ccs: R.path(["states", resultItem.left, "ccs"])(
                pickLTS(R.head(resultItem.left))(ltsData)
              ),
            },
            right: {
              stateKey: resultItem.right,
              ccs: R.path(["states", resultItem.right, "ccs"])(
                pickLTS(R.head(resultItem.right))(ltsData)
              ),
            },
          };
        }),
      };
    } catch (error) {
      console.log(error);
      ctx.body = error;
      ctx.status = 500;
    }
  },
};

export default SpectroscopyController;
