const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/jb-glass-production-29-10";

const client = new MongoClient(MONGODB_URI);
let db;

async function connectDB() {
  await client.connect();
  db = client.db();
  console.log("MongoDB connected");
}

connectDB().catch(err => {
  console.error("Mongo connection failed:", err);
});

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app' 
  ],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

app.get("/get-cities", async (req, res) => {
  const city = await db.collection("cities").find({}).toArray();
  res.json(city);
});

app.get("/get-city-office", async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
