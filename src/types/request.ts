import { Request } from "express";

export interface CustomRequest extends Request {
  loggedUser?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}
