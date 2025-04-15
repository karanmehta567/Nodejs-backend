import mongoose from "mongoose"
export const DBconeect = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI)
        console.log("DB CONNECTED", connection.connection.host)
    } catch (error) {
        console.log("DB coneection failed!,try again", error)
    }
}