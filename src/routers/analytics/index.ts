import { Router } from "express";
import { overall } from "./controllers/overall";
import { alias } from "./controllers/alias";
import { topic } from "./controllers/topic";

const router = Router();

router.get("/overall", overall);

router.get("/topic/:topic", topic);

router.get("/:alias", alias);

export default router;
