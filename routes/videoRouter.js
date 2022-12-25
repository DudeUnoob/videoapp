const express = require("express")
const router = express.Router()

// router.get('/myvideos', async(req, res) => {
//     if(!req.session.username){
//       return res.status(400).send("You are not <a href=/login>logged in</a>")
//     }
    
//     const listUsersVideos = await usersVideos.find({ user: req.session.username })
    
//     res.render('myVideos', { data: listUsersVideos })
//   })


// router.post('/login', async(req, res) => {
//     const username = req.body.username
//     const password = req.body.password
//     UsersDb.findOne({ username: username }, async(err, data) => {
//       if(data){
//         bcrypt.compare(password, data.password, function(error, result) {
//           if(result == true){
//             req.session.username = username
//             req.session.email = data.email
//             return res.redirect('/')
//           }
//         })
//       } else {
//         return res.status(400).send("Incorrect <a href=/login>credentials</a>")
//       }
//     })
//   })


// router.post('/signup', async(req, res) => {
//     const username = req.body.username
//     const password = req.body.password
//     const email = req.body.email
//     UsersDb.findOne({ username: username }, async(err, data) => {
//       if(data){
//         return res.status(400).send("Already a user with this username")
//       } else {
//        bcrypt.genSalt(saltRounds, function(error, salt) {
//         bcrypt.hash(password, salt, function(error, hash) {
  
//            new UsersDb({
//             username: username,
//             password: hash,
//             email: email
//           }).save()
  
//           req.session.username = username
//           req.session.email = email
  
//           res.redirect('/')
//         })
//        })
//       }
//     })
  
//   })
module.exports = router