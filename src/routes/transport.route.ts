import { Router } from 'express';
import { updateTransports, getTransports, deleteTransport, createTransport } from '../controllers/transport.js';

const transportRouter = Router();

transportRouter.get("/transports", getTransports);

transportRouter.put("/transports", updateTransports);

transportRouter.delete("/transports/:id", deleteTransport);

transportRouter.post("/transports", createTransport);


export default transportRouter;