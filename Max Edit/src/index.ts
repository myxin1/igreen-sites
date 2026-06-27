import express from "express";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", routes);
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use(errorHandler);

export default app;
