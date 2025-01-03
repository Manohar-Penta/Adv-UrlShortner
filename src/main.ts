import express from "express";
import session from "express-session";
import { passport } from "./lib/passport";
import "dotenv/config";
import MongoStore from "connect-mongo";
import { MongoClient } from "mongodb";
import { HttpStatusCode } from "axios";
import { prisma } from "./lib/prisma";
import crypto from "node:crypto";
import { UAParser } from "ua-parser-js";
import AnalyticsRouter from "./routers/analytics";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "./lib/redisClient";
import { getRedisData } from "./utils/redisCache";
import { HLclass, Url } from "@prisma/client";
import errorHandler from "./utils/errorHandler";
import { swaggerspec } from "./docs/swagger";
import swaggerUi from "swagger-ui-express";

// Redis based rate limiter to prevent abuse of the api endpoints...
const limiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later",
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
});

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// mongo based session storage and retreival
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    saveUninitialized: true,
    resave: false,
    cookie: { secure: false },
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL as string,
    }),
  })
);

app.use(passport.session());

// ------------- auth routes ahead ---------
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] }),
  (req, res) => {
    // console.log(req.sessionID);
    res.send("Hello World!");
  }
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/status",
    successRedirect: "/auth/status",
  }),
  (req, res) => {
    res.sendStatus(200);
  }
);

app.get("/auth/status", limiter, (req, res) => {
  if (!req.isAuthenticated()) {
    res.sendStatus(HttpStatusCode.Unauthorized);
    return;
  }
  res.status(HttpStatusCode.Ok).send("Login successful");
});

// ------------- api routes ahead ---------

app.post("/api/shorten", limiter, async (req, res) => {
  if (!req.isAuthenticated()) {
    res.sendStatus(HttpStatusCode.Unauthorized);
    return;
  } else {
    try {
      let {
        longUrl,
        customAlias,
        topic,
      }: { longUrl: string; customAlias?: string; topic?: string } = req.body;
      if (!longUrl) {
        res.sendStatus(HttpStatusCode.BadRequest);
        return;
      } else {
        // creating shorturl and alias(if doesn't exist) using cryptography
        const shortUrl = crypto
          .createHash("sha256")
          .update(longUrl + req.user.id)
          .digest("base64")
          .slice(0, 10)
          .replace(/\+/g, "0")
          .replace(/\//g, "1")
          .replace(/=/g, "2");
        if (!customAlias)
          customAlias = crypto
            .createHash("sha256")
            .update(shortUrl)
            .digest("base64")
            .slice(0, 8)
            .replace(/\+/g, "0")
            .replace(/\//g, "1")
            .replace(/=/g, "2");
        //saving the long url, created shorturl and alias to the db...
        const url = await prisma.url
          .create({
            data: {
              alias: customAlias,
              longUrl,
              topic: topic || null,
              shortUrl,
              userId: req.user.id,
            },
          })
          .catch((err) => {
            console.log(err);
            res.sendStatus(HttpStatusCode.Conflict);
          });

        res.status(HttpStatusCode.Created).send({
          shortUrl: process.env.HOST_URL + "/api/shorten/" + url?.shortUrl,
          alias: url?.alias,
          createdAt: url?.createdAt,
        });
      }
    } catch (e) {
      console.log(e);
      res.sendStatus(HttpStatusCode.BadRequest);
    }
  }
});

app.get("/api/shorten/:alias", async (req, res, next) => {
  if (!req.params.alias) {
    res.sendStatus(HttpStatusCode.BadRequest);
    return;
  }
  try {
    if (!req.session.custom) {
      req.session.custom = { shortUrls: [] };
    }

    // getting the url from redis cache or the db(if cache doesn't exist)
    let url: Url | null = await getRedisData("/api/shorten/:alias");

    if (!url) {
      url = await prisma.url.findUnique({
        where: {
          shortUrl: req.params.alias,
        },
      });
      if (url) redisClient.set("/api/shorten/:alias", JSON.stringify(url));
    }
    if (url) {
      // getting user agent details
      const parser = new UAParser();
      const userAgent = req.headers["user-agent"] as string;
      const uaResult = parser.setUA(userAgent).getResult();

      const ipAddress = req.ip;
      const osType = uaResult.os.name;
      const deviceType = uaResult.device.type || "desktop";
      let uniqueClicks = 0;

      // searching the user session for the previous visit to the current short url
      if (
        !req.session.custom ||
        req.session.custom.shortUrls.find((url) => url === req.params.alias)
      ) {
        req.session.custom.shortUrls.push(req.params.alias);
        uniqueClicks = 1;
      }

      // getting the url from redis cache or the db(if cache doesn't exist)
      let existingUrl: HLclass | null = await getRedisData(
        "/api/shorten/:alias" + osType + deviceType
      );
      if (!existingUrl) {
        existingUrl = await prisma.hLclass.findFirst({
          where: {
            shortUrl: req.params.alias,
            os: osType as string,
            device: deviceType,
          },
        });
        if (existingUrl)
          redisClient.set(
            "/api/shorten/:alias" + req.params.alias + osType + deviceType,
            JSON.stringify(existingUrl)
          );
      }

      // updating the db with the details of request and the user...
      if (!existingUrl) {
        await prisma.hLclass.create({
          data: {
            shortUrl: req.params.alias,
            os: osType as string,
            device: deviceType,
            requests: {
              create: {
                ip: ipAddress as string,
                ua: userAgent,
              },
            },
          },
        });
      } else {
        const updateddata = await prisma.hLclass.update({
          where: {
            id: existingUrl.id,
          },
          data: {
            uniqueUsers: { increment: uniqueClicks },
            requests: {
              create: {
                ip: ipAddress as string,
                ua: userAgent,
              },
            },
          },
          include: {
            requests: true,
          },
        });
        // console.log(updateddata);
      }

      res.redirect(url.longUrl);
    } else res.sendStatus(HttpStatusCode.NotFound);
  } catch (err) {
    next(err);
  }
});

// analytics endpoints with a rate limiter
app.use("/api/analytics", limiter, AnalyticsRouter);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerspec));

app.use(errorHandler);

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started on port 3000");
});
