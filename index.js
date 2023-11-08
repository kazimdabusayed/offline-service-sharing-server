const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//midleware
app.use(
	cors({
		origin: ["http://localhost:5174"],
		credentials: true,
	})
);
app.use(express.json());
app.use(cookieParser());

//?mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b2huxcc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

//midleware
const logger = async (req, res, next) => {
	console.log("called", req.hostname, req.originalUrl);
	next();
};

const verifyToken = async (req, res, next) => {
	const token = req.cookies?.token;
	console.log("value of token in middeware", token);
	if (!token) {
		return res.status(401).send({ massage: "not authorized" });
	}
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
		//error
		if (err) {
			console.log(err);
			return res.status(401).send({ massage: "unauthorized" });
		}
		// if token is valid then it would be decoded
		console.log("Value in the token", decoded);
		req.user = decoded;
		next();
	});
};

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();

		const userCollection = client.db("offlineServices").collection("users");
		const serviceCollection = client
			.db("offlineServices")
			.collection("services");

		//! auth
		app.post("/jwt", logger, async (req, res) => {
			const user = req.body;
			console.log(user);
			const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
				expiresIn: "1h",
			});
			res.cookie("token", token, {
				httpOnly: true,
				secure: true,
				sameSite: "none",
			}).send({ succes: true });
		});

		app.post("/logout", async (req, res) => {
			const user = req.body;
			console.log(user);
			res.clearCookie("token", { maxAge: 0 }).send({ succes: true });
		});

		//! user relaed apis
		app.post("/api/v1/users", logger, async (req, res) => {
			const user = req.body;
			const result = await userCollection.insertOne(user);
			res.send(result);
		});
		app.get("/api/v1/users", logger, verifyToken, async (req, res) => {
			const cursor = userCollection.find();
			const result = await cursor.toArray();
			res.send(result);
		});

		//! service relaed apis
		app.post("/api/v1/services", async (req, res) => {
			const service = req.body;
			console.log(service);
			const result = await serviceCollection.insertOne(service);
			res.send(result);
		});
		app.get("/api/v1/services", async (req, res) => {
			const cursor = serviceCollection.find();
			const result = await cursor.toArray();
			res.send(result);
		});
		//update
		app.get("/api/v1/services/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await serviceCollection.findOne(query);
			res.send(result);
		});
		app.put("/api/v1/services/:id", async (req, res) => {
			const id = req.params.id;
			const filter = { _id: new ObjectId(id) };
			const options = { upsert: true };
			const updatedservice = req.body;
			const product = {
				$set: {
					name: updatedservice.name,
					quantity: updatedservice.quantity,
					supplier: updatedservice.supplier,
					taste: updatedservice.taste,
					category: updatedservice.category,
					details: updatedservice.details,
					photo: updatedservice.photo,
				},
			};
			const result = await serviceCollection.updateOne(filter, product);
			res.send(result);
		});
		//delete
		// app.delete("/api/v1/services/:id", async (req, res) => {
		// 	const id = req.params.id;
		// 	const query = { _id: new ObjectId(id) };
		// 	const result = await productCollection.deleteOne(query);
		// 	res.send(result);
		// });

		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("Offline services sharing is running");
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
