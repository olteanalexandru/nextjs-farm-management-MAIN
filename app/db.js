
const mongoose = require('mongoose')

export async function connectDB() {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log('Connected ' +conn.connection.host)
   
    } catch (error){
        console.log(error);
        process.exit(1);
    }
}


