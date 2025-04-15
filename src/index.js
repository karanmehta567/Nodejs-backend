import dotenv from 'dotenv'
import { DBconeect } from './db/index.js'

dotenv.config({
    path: '.env'
})
DBconeect()