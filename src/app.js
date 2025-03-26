import express from "express";
const app = express();
// Para las sesiones
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const connectRedis = require("connect-redis");

import { createClient } from "redis";
import session from "express-session";

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
// import userRouter from './routes/userRouter.js';
// import apiCartRouter from './routes/api/apiCartRouter.js'
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

const RedisStore = connectRedis(session); // ✅ ejecutás la función PASÁNDOLE session
const redisClient = createClient({
  url: process.env.REDIS_URL,
  legacyMode: true,
});

// Escuchar errores de conexión
redisClient.on("error", (err) => console.error("❌ Redis Client Error:", err));

// Opcional: Confirmación de conexión exitosa
redisClient.on("connect", () => console.log("✅ Redis connected"));


redisClient.connect().catch(console.error);


app.use(
  session({
    store: new RedisStore({ client: redisClient }), // ✅ usás la clase que te devolvió la función
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
    },
  })
);

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
// app.use('/api/cart', apiCartRouter);
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
