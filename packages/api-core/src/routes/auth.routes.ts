import { Router } from "express";
import { createUser } from "../controllers/index";

const router = Router()

router.post('/register', createUser)

export default router