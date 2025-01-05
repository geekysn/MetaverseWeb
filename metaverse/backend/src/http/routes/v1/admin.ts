import { Router } from 'express'
import { CreateAvatarSchema, CreateElementSchema, CreateMapSchema, UpdateElementSchema } from '../../types';
import client from '../../../db/index'

export const adminRouter = Router();

adminRouter.post("/element", async (req, res)=>{
    const parsedData = CreateElementSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({message: "Element admin Validation failed"});
        return;
    }

    const element = await client.element.create({
        data:{
            width: parsedData.data.width,
            height: parsedData.data.height,
            static: parsedData.data.static,
            imageUrl: parsedData.data.imageUrl
        }
    })

    res.json({
        id: element.id
    })
})

adminRouter.post("/element/:elementId", async (req, res)=>{
    const parsedData = UpdateElementSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({message: "Update Admin Validation failed"})
    }

    await client.element.update({
        where:{
            id: req.params.elementId
        },
        data:{
            imageUrl: parsedData.data?.imageUrl
        }
    }) 
    res.json({
        message: "Element Updated"
    })
})

adminRouter.post("/avatar", async (req, res)=>{
    const parsedData = CreateAvatarSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({message: "Create avatar Admin Validation failed"})
    }

    const avatar = await client.avatar.create({
        data:{
            imageUrl: parsedData.data?.imageUrl,
            name: parsedData.data?.name
        }
    })

    res.json({
        avatarId: avatar.id
    })
})

adminRouter.post("/map", async (req, res)=>{
    const parsedData = CreateMapSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({
            message: "Map creation validation failed"
        })
        return;
    }

    const map = await client.map.create({
        data:{
            name: parsedData.data.name,
            thumbnail: parsedData.data.thumbnail,
            width: parseInt(parsedData.data.dimensions.split("x")[0]),
            height: parseInt(parsedData.data.dimensions.split("x")[1]),
            mapElements: {
                create: parsedData.data.defaultElements.map((e)=>({
                    elementId: e.elementId,
                    x: e.x,
                    y: e.y
                }))
            }
        }
    })

    res.json({
        id: map.id
    })
})