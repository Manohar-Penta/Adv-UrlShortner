import "express-session";
import { prisma } from "./src/lib/prisma";
import { Prisma, Url } from "@prisma/client";
import { OptionalKeys } from "@prisma/client/runtime/library";

type prismaUser = Prisma.UserGetPayload<{ include: { Urls: false } }>;

declare module "express-session" {
  interface SessionData {
    custom?: {
      shortUrls: string[];
    };
  }
}

declare global {
  namespace Express {
    interface User extends prismaUser {}
  }
}
