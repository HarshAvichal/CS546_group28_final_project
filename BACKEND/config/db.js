import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

const dbConnect = () => {
    mongoose.connect(process.env.DB_URI)
    .then(()=>{console.log("DB Connected");})
    .catch((e)=>{
        console.log("Connection Failed");
        console.error(e);
        process.exit(1);
    })
}

export default dbConnect;
