import { HttpStatusCode } from "axios";
import { prisma } from "../../../lib/prisma";
import { getdate } from "../../../utils/getdate";
import { NextFunction, Request, Response } from "express";

export async function topic(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      res.sendStatus(HttpStatusCode.Unauthorized);
      return;
    }

    if (!req.params.topic) {
      res.sendStatus(HttpStatusCode.BadRequest);
      return;
    }

    const allRequests = await prisma.url.findMany({
      where: {
        userId: req.user?.id,
        topic: req.params.topic,
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
    });
    const totalClicks = allRequests.reduce((total, current) => {
      return (
        total +
        current.HLclass.reduce((total, current) => {
          return total + current._count.requests;
        }, 0)
      );
    }, 0);
    const shortUrls = await prisma.url.findMany({
      where: {
        userId: req.user?.id,
        topic: req.params.topic,
      },
      select: {
        shortUrl: true,
      },
    });

    //getting os related data and merging it
    const OsDataPrisma = await prisma.hLclass.findMany({
      where: { shortUrl: { in: shortUrls.map((value) => value.shortUrl) } },
      select: {
        os: true,
        uniqueUsers: true,
        _count: { select: { requests: true } },
      },
    });
    const OsData = Object.values(
      OsDataPrisma.reduce(
        (
          acc: {
            [os: string]: {
              os: string;
              uniqueUsers: number;
              requests: number;
            };
          },
          item
        ) => {
          const { os, uniqueUsers, _count } = item;

          if (!acc[os]) {
            // Initialize if os is not present
            acc[os] = {
              os,
              uniqueUsers,
              requests: _count.requests,
            };
          } else {
            // Merge values if os exists
            acc[os].uniqueUsers += uniqueUsers;
            acc[os].requests += _count.requests;
          }

          return acc;
        },
        {}
      )
    );

    // getting device data and merging them
    const DeviceDataPrisma = await prisma.hLclass.findMany({
      where: { shortUrl: { in: shortUrls.map((value) => value.shortUrl) } },
      select: {
        device: true,
        uniqueUsers: true,
        _count: { select: { requests: true } },
      },
    });
    const DeviceData = Object.values(
      DeviceDataPrisma.reduce(
        (
          acc: {
            [device: string]: {
              device: string;
              uniqueUsers: number;
              requests: number;
            };
          },
          item
        ) => {
          const { device, uniqueUsers, _count } = item;

          if (!acc[device]) {
            // Initialize if device is not present
            acc[device] = {
              device,
              uniqueUsers,
              requests: _count.requests,
            };
          } else {
            // Merge values if device exists
            acc[device].uniqueUsers += uniqueUsers;
            acc[device].requests += _count.requests;
          }

          return acc;
        },
        {}
      )
    );

    // getting date related data for the past 7 days
    let DateSortedData = [];
    for (let i = 1; i <= 7; i++) {
      DateSortedData.push({
        date: getdate(
          new Date(new Date().getTime() - (i - 1) * 24 * 60 * 60 * 1000)
        ),
        requests: (
          await prisma.url.findMany({
            where: {
              userId: req.user?.id,
              topic: req.params.topic,
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
        ).reduce((total, url) => {
          return (
            total +
            url.HLclass.reduce((total, hlclass) => {
              return total + hlclass._count.requests;
            }, 0)
          );
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
