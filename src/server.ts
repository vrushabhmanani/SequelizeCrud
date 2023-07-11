require('dotenv').config();
import express from "express";
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/API/V1/',require('./controller/usersController'));
app.use('/API/V1/',require('./controller/eventController'));

app.get("/", (req: any, res: any) => {
    res.send("Demo api");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("server started at port:", process.env.PORT);
})