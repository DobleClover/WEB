import express from "express";
const app = express();

import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config.js"; // En ESM se importa asi

import cookieParser from "cookie-parser";
import methodOverride from "method-override";
import mainRouter from "./routes/mainRouter.js";
import apiProductRouter from "./routes/api/apiProductRouter.js";
import apiAddressRouter from "./routes/api/apiAddressRouter.js";
import apiVariationRouter from "./routes/api/apiVariationRouter.js";
import apiColorRouter from "./routes/api/apiColorRouter.js";
import apiOrderRouter from "./routes/api/apiOrderRouter.js";
import apiPhoneRouter from "./routes/api/apiPhoneRouter.js";
import apiBrandRouter from "./routes/api/apiBrandRouter.js";
import apiDropRouter from "./routes/api/apiDropRouter.js";
import apiUserRouter from "./routes/api/apiUserRouter.js";
import apiTypeRouter from "./routes/api/apiTypeRouter.js";
import apiSettingRouter from "./routes/api/apiSettingRouter.js";
import apiStockAlertRouter from "./routes/api/apiStockAlertRouter.js";
import apiCouponRouter from "./routes/api/apiCouponRouter.js";
// import userRouter from './routes/userRouter.js';
import apiCartRouter from './routes/api/apiCartRouter.js'
// import apiShippingRouter from './routes/api/apiShippingRouter.js';
// import apiPaymentRouter from './routes/api/apiPaymentRouter.js';
import unverifiedUser from "./middlewares/unverifiedUser.js";

// way to replace __dirname in es modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "./views"));
app.use(express.static("./public"));

// Para capturar el body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Express-session
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const connectRedis = require("connect-redis");

import { createClient } from "redis";
import session from "express-session";

import memorystore from "memorystore";
const MemoryStore = memorystore(session);

let sessionStore;
if (process.env.NODE_ENV === "production") {
  // Para las cookies que se manden bien
  app.set("trust proxy", 1); // Configura Express para confiar en el primer proxy
  const RedisStore = connectRedis(session); // ✅ ejecutás la función PASÁNDOLE session
  const redisClient = createClient({
    url: process.env.REDIS_URL,
    legacyMode: true,
  });

  // Escuchar errores de conexión
  redisClient.on("error", (err) =>
    console.error("❌ Redis Client Error:", err)
  );

  // Opcional: Confirmación de conexión exitosa
  redisClient.on("connect", () => console.log("✅ Redis connected"));

  redisClient.connect().catch(console.error);
  sessionStore = new RedisStore({ client: redisClient }); // ✅ usás la clase que te devolvió la función
} else {
  sessionStore = new MemoryStore({
    checkPeriod: 86400000, // Limpia las sesiones expiradas cada 24 horas
  });
}
let sessionObject = {
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // set this to true on production
  },
};
app.use(session(sessionObject));
// Cookie-parser
app.use(cookieParser());

// Mehtod-override --> Para usar put y delete (?_method=...)
app.use(methodOverride("_method"));

// Rutas
// Rutas
app.use("/api/product", apiProductRouter);
app.use("/api/address", apiAddressRouter);
app.use("/api/variation", apiVariationRouter);
app.use("/api/color", apiColorRouter);
app.use("/api/order", apiOrderRouter);
app.use("/api/phone", apiPhoneRouter);
app.use("/api/brand", apiBrandRouter);
app.use("/api/drop", apiDropRouter);
app.use("/api/user", apiUserRouter);
app.use("/api/type", apiTypeRouter);
app.use("/api/setting", apiSettingRouter);
app.use('/api/cart', apiCartRouter);
app.use('/api/stockAlert', apiStockAlertRouter);
app.use('/api/coupon', apiCouponRouter);
// app.use('/api/shipping', apiShippingRouter);
// app.use('/api/shipping', apiShippingRouter);
// app.use('/api/payment', apiPaymentRouter);
app.use(unverifiedUser); //En todas las consultas de render
app.use("/", mainRouter);
// app.use('/user',userRouter);

// Correr el servidor
//404
app.use((req, res, next) => {
  res.status(404);
  return res.redirect("/");
});
const PORT = process.env.PORT || 3500;

app.listen(PORT, () => {
  console.log(" 🚀 Se levanto proyecto en htpp://localhost:" + PORT);
});
