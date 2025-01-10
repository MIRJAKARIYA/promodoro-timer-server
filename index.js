const express = require("express");
const app = express();
const cors = require("cors");
const { connectToMongodb } = require("./database-connections/mongoose");
const { connectToRedis } = require("./database-connections/redis");
require("dotenv").config();
const userRouter = require("./routes/user");
const { rateLimiter } = require("./middlewares/apiRateLimiter");

const port = process.env.PORT || 5000;


// db connections
connectToMongodb()
.then(()=> console.log("Mongodb connected"))
.catch((err)=>console.log("Mongodb Connecction Error: ",err.message))

connectToRedis()
.then(()=>console.log("Redis connected"))
.catch((err)=> console.log("Redis Connection Error",err.message))

// middlewares
app.use(cors());
app.use(express.json());
app.use(rateLimiter)

//routes
app.use("/api/users",userRouter)

app.get("/",async(req,res)=>{
    res.send("Promodoro server is running")
})

app.listen(port, () => {
    console.log(`promodoro is sitting on port ${port}`);
  });

