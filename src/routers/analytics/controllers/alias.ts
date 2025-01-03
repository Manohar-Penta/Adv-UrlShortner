import { HttpStatusCode } from "axios";
import { prisma } from "../../../lib/prisma";
import { Request, Response, NextFunction } from "express";
import { getdate } from "../../../utils/getdate";

export async function alias(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      res.sendStatus(HttpStatusCode.Unauthorized);
      return;
    }
    const url = await prisma.url.findUnique({
      where: {
        userId_alias: {
          userId: req.user?.id || "",
          alias: req.params.alias,
        },
      },
    });
    // console.log(url);
    if (!url) {
      res.sendStatus(HttpStatusCode.NotFound);
      return;
    }
    const totalClicks = (
      await prisma.url.findMany({
        where: {
          shortUrl: url?.shortUrl,
        },
        select: {
          HLclass: {
            where: {},
            select: {
              _count: {
                select: {
                  requests: true,
                },
              },
            },
          },
        },
      })
    )[0].HLclass.reduce((total, current) => {
      return total + current._count.requests;
    }, 0);
    const OsData = (
      await prisma.hLclass.findMany({
        where: {
          shortUrl: url?.shortUrl,
        },
        select: {
          os: true,
          uniqueUsers: true,
          _count: { select: { requests: true } },
        },
      })
    ).map((value) => {
      return {
        os: value.os,
        uniqueUsers: value.uniqueUsers,
        requests: value._count.requests,
      };
    });
    const DeviceData = (
      await prisma.hLclass.findMany({
        where: {
          shortUrl: url?.shortUrl,
        },
        select: {
          device: true,
          uniqueUsers: true,
          _count: { select: { requests: true } },
        },
      })
    ).map((value) => {
      return {
        device: value.device,
        uniqueUsers: value.uniqueUsers,
        requests: value._count.requests,
      };
    });
    let DateSortedData = [];
    for (let i = 1; i <= 7; i++) {
      DateSortedData.push({
        date: getdate(
          new Date(new Date().getTime() - (i - 1) * 24 * 60 * 60 * 1000)
        ),
        requests: (
          await prisma.url.findMany({
            where: {
              shortUrl: url?.shortUrl,
            },
            select: {
              HLclass: {
                where: {},
                select: {
                  _count: {
                    select: {
                      requests: {
                        where: {
                          date: {
                            gte: new Date(
                              new Date().getTime() - i * 24 * 60 * 60 * 1000
                            ),
                            lte: new Date(
                              new Date().getTime() -
                                (i - 1) * 24 * 60 * 60 * 1000
                            ),
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          })
        )[0].HLclass.reduce((total, current) => {
          return total + current._count.requests;
        }, 0),
      });
    }
    if (!OsData || !DeviceData || !totalClicks || !DateSortedData) {
      res.sendStatus(HttpStatusCode.NotFound);
      return;
    }
    res.send({ totalClicks, OsData, DeviceData, DateSortedData });
  } catch (e) {
    console.log(e);
    next(e);
  }
}
