const mongoose = require('mongoose')


mongoose.connect("mongodb+srv://ZeroX:Balaram26@cluster0.b2lzi.mongodb.net/Roast-API?retryWrites=true&w=majority").then(() => console.log(`Connected to db`))

let Schema = new mongoose.Schema({
    videoId: String,
    user: String
})


module.exports = mongoose.model('usersVideos', Schema)