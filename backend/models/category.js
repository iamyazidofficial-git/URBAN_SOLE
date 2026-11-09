const mongoose=require("mongoose")

const categoryScheama=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    description:{
        type:String,
        trim:true,
        default:""
    },
    offer:{
        type:Number,
        default:null
    },
    offerExpiry:{
        type:Date,
        default:null
    },
    status:{
        type:String,
        enum: ['Active', 'InActive'],
        default:"Active"
    },
    isDeleted:{
        type:Boolean,
        default:false
    }
},{
    timestamps:true
})

module.exports=mongoose.model("Category",categoryScheama,"category")