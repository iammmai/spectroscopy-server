import * as R from "ramda";
import SpectroscopyModel from "./schema.js";

const SpectroscopyController = {
  get: async (ctx) => {
    const _id = R.path(["params", "id"], ctx);
    ctx.body = await SpectroscopyModel.findOne({ _id });
  },
  create: async (ctx) => {
    const spec = new SpectroscopyModel({
      p1: R.path(["request", "body", "p1"], ctx),
      p2: R.path(["request", "body", "p2"], ctx),
    });
    await spec.save().catch((err) => (ctx.body = err));
    ctx.body = spec;
  },
};

export default SpectroscopyController;
