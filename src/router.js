import SpectroscopyController from "./SpectroscopyController.js";
import Router from "@koa/router";

const router = new Router();
const spectroscopyRouter = new Router();

spectroscopyRouter.get("/:id", SpectroscopyController.get);
spectroscopyRouter.post("/:id", SpectroscopyController.update);
spectroscopyRouter.post("/", SpectroscopyController.create);

router.use(
  "/spectroscopy",
  spectroscopyRouter.routes(),
  spectroscopyRouter.allowedMethods()
);

router.get("koa-example", "/", (ctx) => {
  ctx.body = "Hello Woooorld";
});

export default router;
