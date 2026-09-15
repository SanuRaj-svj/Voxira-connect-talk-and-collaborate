import httpStatus from 'http-status';
import {User} from '../Models/users.model.js';
import bcrypt,{hash} from 'bcrypt';
import crypto from 'node:crypto';
const login= async (req,res)=>{
  const {username,password}=req.body ?? {};
  if(!username || !password){
      return res.status(400).json({message:"username and password are required"});
    }
  try{
    const user=await User.findOne({username});
    if(!user){
      return res.status(httpStatus.NOT_FOUND).json({message:"Invalid username or password"})
    }
    if (await bcrypt.compare(password,user.password)){
      let token= crypto.randomBytes(20).toString('hex');
      user.token=token;
      await user.save();
      return res.status(httpStatus.OK).json({message:"Login successfull", token})
    }

    return res.status(httpStatus.UNAUTHORIZED).json({message:"Invalid username or password"});
    
  }
  catch(err){
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message:"Error logging in user"})
  }
}

const registerUser= async (req,res)=>{
  const {name,username,password} = req.body ?? {};
  if(!name || !username || !password){
    return res.status(httpStatus.BAD_REQUEST).json({message:"name, username and password are required"});
  }
  try{
    const existingUser=await User.findOne({username});
    if(existingUser){
      return res.status(httpStatus.FOUND).json({message:"Username already exists "})
    }
    const hashedPassword=await bcrypt.hash(password,10);
    const newUser=new User({
      name:name,
      username:username,
      password:hashedPassword
    });
    await newUser.save();
    return res.status(httpStatus.CREATED).json({message:"User registered successfully"});
  }
  catch(err){
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message:"Error registering user"})
  }
}
export {login,registerUser};