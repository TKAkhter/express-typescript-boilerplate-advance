import { JwtPayload } from "jsonwebtoken";

export interface ExtendedJWTPayload extends JwtPayload {
  id?: string;
  name?: string;
  email?: string;
}
