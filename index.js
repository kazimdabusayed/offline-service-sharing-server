const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5001;

//midleware
app.use(cors());
app.use(express());


app.get("/", (req, res) => {
	res.send("Offline services sharing is running");
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
