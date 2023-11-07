const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//midleware
app.use(cors());
app.use(express.json());


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

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();

		const userCollection = client.db("offlineServices").collection("users");
		const serviceCollection = client
			.db("offlineServices")
			.collection("services");

		//! user relaed apis
		app.post("/api/v1/users", async (req, res) => {
			const user = req.body;
			const result = await userCollection.insertOne(user);
			res.send(result);
		});
		app.get("/api/v1/users", async (req, res) => {
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
