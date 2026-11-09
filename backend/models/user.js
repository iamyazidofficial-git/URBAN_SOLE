const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
           type: String,
            required: function () {
            return !this.googleId;
           }
        },

        gender: {
            type: String,
            enum: ["male", "female", "other"],
            required: true
        },

        referralCode: {
            type: String,
            trim: true,
            default: null
        },
        googleId: {
            type: String,
             default: null
        },

        profileImage: {
            type: String,
            default: ""
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        isBlocked: {
            type: Boolean,
            default: false
        },
        isVerified:{
            type: Boolean,
            default:false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User",userSchema)