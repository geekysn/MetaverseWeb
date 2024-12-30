import express from 'express'
import client from '../../../db/index'
import { SigninSchema, SignupSchema } from '../../types'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const router = express.Router()

const JWT_PASSWORD = process.env.JWT_PASSWORD || 'metaverse'

router.post("/signup", async (req, res) => {
    console.log("inside signup")
    // check the user
    const parsedData = SignupSchema.safeParse(req.body)
    if (!parsedData.success) {
        console.log("parsed data incorrect")
        res.status(400).json({ message: "Validation failed" })
        return
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(parsedData.data.password, salt)

    try {
        const user = await client.user.create({
            data: {
                username: parsedData.data.username,
                password: parsedData.data.password,
                role: parsedData.data.type === "admin" ? "Admin" : "User",
            }
        })
    } catch (error) {
        console.log("error thrown")
        console.log(error)
        res.status(400).json({ message: "User already exists" })
    }
})

router.post('/signin', async (req, res) => {
    console.log("inside signin")
    const parsedData = SigninSchema.safeParse(req.body)
    if (!parsedData.success) {
        console.log("parsed data incorrect")
        res.status(403).json({ message: "Validation failed" })
        return
    }

    try {
        const user = await client.user.findUnique({
            where: {
                username: parsedData.data.username
            }
        })
        if (!user) {
            res.status(403).json({ message: "User not found" })
            return
        }
        const isValid = bcrypt.compareSync(parsedData.data.password, user.password)

        if (!isValid) {
            res.status(403).json({ message: "Invalid password" })
            return
        }

        const token = jwt.sign({
            userId: user.id,
            role: user.role,
        }, JWT_PASSWORD)

        res.json({
            token
        })

    } catch (error) {
        console.log('error in signin');
        console.log(error);
        res.status(400).json({ message: "Internal server error" })
    }
})