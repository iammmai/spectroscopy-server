import SpectroscopyController from "./SpectroscopyController.js";
import FormulaController from "./FormulaController.js";
import Router from "@koa/router";

const router = new Router();
const spectroscopyRouter = new Router();
const formulaRouter = new Router();

spectroscopyRouter.get("/list", SpectroscopyController.getAll);
spectroscopyRouter.get(
  "/formulas/:spectroscopyId",
  FormulaController.getBySpectroscopyId
);
spectroscopyRouter.get("/:id", SpectroscopyController.get);
spectroscopyRouter.post("/:id", SpectroscopyController.update);
spectroscopyRouter.post("/", SpectroscopyController.create);

formulaRouter.post("/:id", FormulaController.update);
formulaRouter.post("/", FormulaController.create);
formulaRouter.delete("/:id", FormulaController.delete);

router.use(
  "/spectroscopy",
  spectroscopyRouter.routes(),
  spectroscopyRouter.allowedMethods()
);

router.use("/formulas", formulaRouter.routes(), formulaRouter.allowedMethods());

router.get("koa-example", "/", (ctx) => {
  ctx.body = "Hello Woooorld";
});

export default router;
