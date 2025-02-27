import jwt from 'jsonwebtoken'
import expressAsyncHandler from 'express-async-handler'
import { decode } from 'js-base64'
import User from '../models/userModel.js'

const protect = expressAsyncHandler(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = decode(req.headers.authorization.split(' ')[1])
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      req.user = await User.findById(decoded.userId).select('-password')

      next()
    } catch (error) {
      console.log(error)
      res.status(401).json({ success: false, message: 'not_authorized', another: error.message })
    }
  }

  if (!token) res.status(401).json({ success: false, message: 'not_authorized_no_token' })
})

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin' && !req.user.block) next()
  else if (req.user.block)
    res.status(400).json({ message: false, message: 'Your account is inactive' })
  else res.status(401).json({ success: false, message: 'not_authorized_as_an_admin' })
}

const client = (req, res, next) => {
  if (req.user && req.user.role === 'client' && !req.user.block) next()
  else if (req.user.block)
    res.status(400).json({ message: false, message: 'Your account is inactive' })
  else res.status(401).json({ success: false, message: 'not_authorized_as_a_client' })
}

export { protect, admin, client }
