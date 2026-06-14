import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import companiesRouter from "./companies";
import usersRouter from "./users";
import ewaybillsRouter from "./ewaybills";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(companiesRouter);
router.use(usersRouter);
router.use(ewaybillsRouter);
router.use(statsRouter);

export default router;
