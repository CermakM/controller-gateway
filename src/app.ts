import express, {Response, Request} from "express";
import process from "process";
import _ from "lodash";

const app  = express();

// Controllers (route handlers)
import APIController from "./controllers/api";

// Express configuration
app.set("PORT", _.get(process.env, "PORT", 5000));

// Routes
app.get("/", (req: Request, res: Response) => {
    return res.send(null);  // TODO: return the schema
});

/**
 * API routes
 */
app.get("/api", APIController);

export default app;