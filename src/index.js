"use strict";

import Koa from "koa";
import mongoose from "mongoose";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import "dotenv/config";
import router from "./router.js";

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on("error", console.error);

const app = new Koa();
app
  .use(cors({ credentials: true }))
  .use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      // will only respond with JSON
      ctx.status = err.statusCode || err.status || 500;
      ctx.body = {
        message: err.message,
      };
    }
  })
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(process.env.PORT || 8080);
