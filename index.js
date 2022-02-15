"use strict";

import Koa from "koa";
import mongoose from "mongoose";
import bodyParser from "koa-bodyparser";
import "dotenv/config";
import router from "./router.js";

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on("error", console.error);

const app = new Koa();
app.use(bodyParser());

app.use(router.routes()).use(router.allowedMethods());

app.listen(8080);
