import bcrypt from "bcryptjs";
import User from "../model/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


export const register = async (req, res) => {
  
  const regexEmail = /^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/;
  const regexUsername = /^[a-zA-Z0-9]{3,20}$/;
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const re_password = req.body.re_password;

  if (
    !regexUsername.test(username) ||
    !password ||
    password.length < 6 ||
    !re_password
  ) {
    return res.status(401).json("Invalid username or password");
  }
  if (!email || !regexEmail.test(email)) {
    return res.status(402).json("Invalid email address");
  }
  if (re_password != password) {
    return res.status(402).json("Password not match");
  }
  const existingEmail = await User.findOne({ Email: email });
  
  if (existingEmail) {
    res.status(409).json("email is already in use, please enter another email");
  } else {
    const Password = await bcrypt.hash(password, 10);
    const user = new User({
      Name: username,
      Email: email,
      Password: Password,
      isAdmin: false,
    });
    user.save((error, result) => {
      if (error) console.log(error);
    });

    return res.status(200).json({
      _id: user._id,
      name: user.Name,
      email: user.Email,
      isAdmin: user.isAdmin,
    });
  }
};
export const login = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(402).json("Empty pasword or email not allowed");
  } else {
    const existingEmail = await User.findOne({ Email: email });

    //enter wrong email or password
    if (!existingEmail) {
      return res
        .status(401)
        .json("We cannot find an account with that email address");
    }
    //In case the username, password is entered correctly
    else {
      const validPassword = bcrypt.compareSync(
        password,
        existingEmail.Password
      );
      if (!validPassword && password) {
        return res.status(401).json("Your password is incorrect");
      }
      const token = jwt.sign(
        {
          id: existingEmail.id,
          Email: existingEmail.Email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES,
        }
      );
      const temp = JSON.stringify(existingEmail);
      const data = JSON.parse(temp);
      const {Password, ...other} = data;
      const cookie_option = {
        expiresIn: new Date(
          Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: false,
      };
      return res
        .cookie("userRegister", token, cookie_option)
        .status(200)
        .json(other);
    }
  }
};

export const logout = (req, res) => {
    res.clearCookie('userInfo', {
    sameSite: true,
    secure: true
  }).status(200).json("user has been logged out")
};
