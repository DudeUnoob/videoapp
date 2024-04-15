const mongoose = require('mongoose')


mongoose.connect("").then(() => console.log(`Connected to db`))

let Schema = new mongoose.Schema({
    videoId: String,
    user: String,
    thumbnail: String,
    title: String
})


module.exports = mongoose.model('usersVideos', Schema)
