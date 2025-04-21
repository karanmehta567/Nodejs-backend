import dotenv from 'dotenv'
import { DBconeect } from './db/index.js'
import { app } from './app.js'
dotenv.config({
    path: '.env'
})
DBconeect().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`DB connected at ${process.env.PORT}`)
    })
}).catch((error) => {
    console.log('DB Coneection failed', error)
})