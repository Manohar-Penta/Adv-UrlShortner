import { ErrorRequestHandler } from "express";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  res.status(500).send("Internal Server Error");
};

export default errorHandler;
