import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
const app = express()

app.use(cors({
    origin: 'http://localhost:8000',
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))
app.use(express.static('public'))
app.use(cookieParser())

//need to import routes here good practice
import userRouter from './routes/user.route.js'

//router declaration
app.use('/user', userRouter)

export { app }