const focusSessions = require("../models/focus_session");

const getAllFocusSessions = async (req,res) =>{
    console.log(getAllFocusSessions)
    try{
        const allFocusSessions = await focusSessions.find({})
        return res.send({success:true,data:allFocusSessions})
    }
    catch(err){
        return res.send({success:false,message:err.message})
    }
    
}

const createFocusSession = async (req,res) =>{
    const data = req.body
 
    const {user_id,duration} = data

    if(!user_id || !duration){
        return res.send({success:false,message:"All fields are required"})
    }
    try{
        const result = await focusSessions.create({
            user_id,
            duration
        })
        res.send({success:true,data:result})
    }
    catch(err){
        res.send({success:false,message:err.message})
    }
}

const getUserSpecificFocusSessions = async(req,res) =>{ 
    const id = req.params.id
    try{
        const specificSessions = await focusSessions.find({user_id:id})
        return res.send({success:true,data:specificSessions})
    }
    catch(err){
        return res.send({success:false,message:err.message})
    }
}

module.exports = {
    getAllFocusSessions,
    createFocusSession,
    getUserSpecificFocusSessions
};
