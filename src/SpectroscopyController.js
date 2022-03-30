import * as R from "ramda";
import SpectroscopyModel from "./SpectroscopySchema.js";

const SpectroscopyController = {
  get: async (ctx) => {
    const _id = R.path(["params", "id"], ctx);
    ctx.body = await SpectroscopyModel.findOne({ _id });
  },
  getAll: async (ctx) => {
    ctx.body = await SpectroscopyModel.find({});
  },
  create: async (ctx) => {
    const spec = new SpectroscopyModel(R.path(["request", "body"], ctx));
    await spec.save().catch((err) => (ctx.body = err));
    ctx.body = spec;
  },
  update: async (ctx) => {
    const _id = R.path(["params", "id"], ctx);
    ctx.body = await SpectroscopyModel.findOneAndUpdate(
      { _id },
      R.path(["request", "body"], ctx),
      { new: true }
    );
  },
};

export default SpectroscopyController;
