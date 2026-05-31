
import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone:{type:String},
verified:{
type:Boolean,
default:false,
},
    role: { type: String, enum: ["user", "worker"], default: "user" },
  },
{ timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
