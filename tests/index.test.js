const axios2 = require("axios");

const BACKEND_URL = "http://localhost:3000"

const axios = {
    post: async(...args)=>{
        try{
            const res = await axios2.post(...args);
            return res;
        }
        catch(e){
            return e.response;
        }
    },
    get: async(...args)=>{
        try{
            const res = await axios2.get(...args);
            return res;
        }
        catch(e){
            return e.response;
        }
    },
    put: async(...args)=>{
        try{
            const res = await axios2.put(...args);
            return res;
        }
        catch(e){
            return e.response;
        }
    },
    delete: async(...args)=>{
        try{
            const res = await axios2.delete(...args);
            return res;
        }
        catch(e){
            return e.response;
        }
    },
}

describe("Authentication", ()=>{
    test('User is able to Sign Up only once', async()=>{
        const username = `metaverse-${Math.random()}`;
        const password = "password"
        
        const res = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: "admin"
        })

        expect(res.status).toBe(200);
        expect(res.data.userId).toBeDefined();

        const res2 = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })
        expect(res2.status).toBe(400)
    });

    test('Sign Up request fails if the username is empty', async ()=>{
        const username = `metaverse-${Math.random()}`;
        const password = "password"

        const res = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            password
        })
        expect(res.status).toBe(400)
    });

    test('Sign In succeeds if the username and password are correct', async ()=>{
        const username = `metaverse-${Math.random()}`
        const password = "password"

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });

        const res = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        });
        expect(res.status).toBe(200);
        expect(res.data.token).toBeDefined();
    });

    test('Sign In fails if the username and password are incorrect', async ()=>{
        const username = `metaverse-#${Math.random()}`;
        const password = "password";

        await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: 'admin'
        })

        const res = await axios.post(`${BACKEND_URL}/api/v1/signin`,{
            username: "WrongUser",
            password
        })
        expect(res.status).toBe(403);
    })
})

describe("User metadata endpoints", ()=>{
    let token = "";
    let avatarId = "";

    beforeAll(async ()=>{
        const username = `metaverse-${Math.random()}`;
        const password = "password";

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });

        const res = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })

        token = res.data.token;

        const avatarRes = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`,{
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
	        "name": "Timmy"
        },{
            headers:{
                Authorization: `Bearer ${token}`
            }
        })

        avatarId = avatarRes.data.avatarId
    })

    test("user can't update their metadata with wrong avatarId", async ()=>{
        const res = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`,{
            avatarId: "123123123"
        },{
            headers:{
                Authorization:`Bearer ${token}`
            }
        })
        expect(res.status).toBe(400);
    });

    test("user can update their metadata with right avatarId", async ()=>{
        const res = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        }, {
            headers:{
                Authorization:`Bearer ${token}`
            }
        })
        expect(res.status).toBe(200)
    })

    test("user is unable to update their metadata if the auth header is absent", async ()=>{
        const res = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        })
        expect(res.status).toBe(403);
    })
})

describe("User avatar endpoints", ()=>{
    let avatarId;
    let token;
    let userId;

    beforeAll( async ()=>{
        const username = `metaverse-${Math.random()}`;
        const password = 'password';

        const signUpRes = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: "admin"
        })

        userId = signUpRes.data.userId;

        const signInRes = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })

        token = signInRes.data.token;

        const avatarRes = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
	        "name": "Timmy"
        }, {
            headers:{
                Authorization: `Bearer ${token}`
            }
        })

        avatarId = avatarRes.data.avatarId;
    })

    test("Get back avatar information for a user", async ()=>{
        const res = await axios.get(`${BACKEND_URL}/api/v1/user/metadata/bulk?ids=[${userId}]`);

        expect(res.data.avatars.length).toBe(1);
        expect(res.data.avatars[0].userId).toBe(userId);
    });

    test("Available avatars, lists the recently created avatars", async()=>{
        const res = await axios.get(`${BACKEND_URL}/api/v1/avatars`);
        expect(res.data.avatars.length).not.toBe(0);

        const avatarRes = res.data.avatars.find(x => x.id == avatarId);
        expect(avatarRes).toBeDefined()
    })
});

describe("Space Information", ()=>{
    let mapId;
    let elementId1;
    let elementId2;
    let adminToken;
    let adminId;
    let userToken;
    let userId;

    beforeAll( async ()=>{
        const username = `metaverse-${Math.random()}`;
        const password = 'password';

        const signUpRes = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: "admin"
        })

        adminId = signUpRes.data.userId;

        const signInRes = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })

        adminToken = signInRes.data.token;

        const userSignUpRes = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username: username + '-user',
            password,
            type: "user"
        })

        userId = userSignUpRes.data.userId;

        const userSignInRes = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + '-user',
            password
        })

        userToken = userSignInRes.data.token;


        const elememt1Res = await axios.post(`${BACKEND_URL}/api/v1/admin/elememt`,{
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true // weather or not the user can sit on top of this element (is it considered as a collission or not)
        },{
            headers:{
                Authorization: `Bearer ${adminToken}`
            }
        });
        elementId1 = elememt1Res.data.id;

        const elememt2Res = await axios.post(`${BACKEND_URL}/api/v1/admin/elememt`,{
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true // weather or not the user can sit on top of this element (is it considered as a collission or not)
        },{
            headers:{
                Authorization: `Bearer ${adminToken}`
            }
        })
        elementId2 = elememt2Res.data.id;

        const mapRes = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "100 person interview room",
            "defaultElements": [{
                    elementId: elementId1,
                    x: 20,
                    y: 20
                }, {
                  elementId: elementId1,
                    x: 18,
                    y: 20
                }, {
                  elementId: elementId2,
                    x: 19,
                    y: 20
                }
            ]
        }, {
            headers:{
                Authorization: `Bearer ${adminToken}`
            }
        })
        mapId = mapRes.data.id;
    })

    test("User is able to create a space", async ()=>{
        const res = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200",
            "mapId": mapId
        },{
            headers:{
                Authorization:` Bearer ${userToken}`
            }
        })
        expect(res.status).toBe(200);
        expect(res.data.spaceId).toBeDefined();
    })

    test("User is able to create a space without mapId (empty space)", async ()=>{
        const res = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200",
        },{
            headers:{
                Authorization:` Bearer ${userToken}`
            }
        })
        expect(res.status).toBe(200);
        expect(res.data.spaceId).toBeDefined();
    })

    test("User is not able to create a space without mapId and dimensions", async ()=>{
        const res = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
        },{
            headers:{
                Authorization:` Bearer ${userToken}`
            }
        })
        expect(res.status).toBe(400);
    })

    test("User is not able to delete a space which doesn't exist", async ()=>{
        const res = await axios.delete(`${BACKEND_URL}/api/v1/space/randomIdThatDoesn'texist`,{
            headers:{
                Authorization:` Bearer ${userToken}`
            }
        })
        expect(res.status).toBe(400);
    });

    test("User is able to delete a space which they created", async()=>{
        const res = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200"
        },{
            headers:{
                Authorization:` Bearer ${userToken}`
            }
        })

        const deleteRes = await axios.delete(`${BACKEND_URL}/api/v1/space/${res.data.spaceId}`,{
            headers:{
                Authorization:`Bearer ${userToken}`
            }
        })
        expect(deleteRes.status).toBe(200);
    })

    test("User is not able to delete a space created by another user", async()=>{
        const res = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200"
        },{
            headers:{
                Authorization:` Bearer ${userToken}`
            }
        })

        const deleteRes = await axios.delete(`${BACKEND_URL}/api/v1/space/${res.data.spaceId}`,{
            headers:{
                Authorization:`Bearer ${adminToken}`
            }
        })
        expect(deleteRes.status).toBe(403);
    })

    test("Admin has no space initially", async()=>{
        const res = await axios.get(`${BACKEND_URL}/api/v1/space/all`,{
            headers:{
                Authorization: `Bearer ${adminToken}`
            }
        })
        expect(res.data.spaces.length).toBe(0);
    })

    test("Admin has got one space after", async()=>{
        const spaceCreationRes = await axios.post(`${BACKEND_URL}/api/v1/space`,{
            "name": "Test",
            "dimensions": "100x200"
        }, {
            headers:{
                Authorization: `Bearer ${adminToken}`
            }
        })

        const res = await axios.get(`${BACKEND_URL}/api/v1/space/all`,{
            headers:{
                Authorization: `Bearer ${adminToken}`
            }
        })
        const filterdSpaceRes = res.data.spaces.find(x => x.id === spaceCreationRes.data.spaceId);
        expect(res.data.spaces.length).toBe(1);
        expect(filterdSpaceRes).toBeDefined();
    })
})