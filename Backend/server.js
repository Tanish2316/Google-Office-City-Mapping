const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

const client = new MongoClient(MONGODB_URI, {
  ssl: true,
  retryWrites: true,
  w: "majority",
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
});
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

connectDB();

app.use(cors());
app.use(express.json());

app.get("/get-cities", async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: "Database not connected" });
    }
    const city = await db.collection("cities").find({}).toArray();
    res.json(city);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
});

app.get("/get-city-office", async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: "Database not connected" });
    }
    const officeId = req.query.officeId;
    const cityOffice = await db
      .collection("officeDistribution")
      .aggregate([
        {
          $facet: {
            currentOfficeCities: [
              { $match: { officeId: officeId } },
              {
                $lookup: {
                  from: "cities",
                  localField: "cityId",
                  foreignField: "id",
                  as: "city",
                },
              },
              {
                $unwind: {
                  path: "$city",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: 1,
                  officeId: 1,
                  cityId: 1,
                  city_name: "$city.name",
                  placeId: "$city.providerId",
                },
              },
            ],

            otherOfficeCities: [
              { $match: { officeId: { $ne: officeId } } },
              {
                $lookup: {
                  from: "cities",
                  localField: "cityId",
                  foreignField: "id",
                  as: "city",
                },
              },
              {
                $unwind: {
                  path: "$city",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: 1,
                  officeId: 1,
                  cityId: 1,
                  city_name: "$city.name",
                  placeId: "$city.providerId",
                },
              },
            ],
          },
        },
      ])
      .toArray();
    res.json(cityOffice);
  } catch (error) {
    console.error("Error fetching office data:", error);
    res.status(500).json({ error: "Failed to fetch office data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
