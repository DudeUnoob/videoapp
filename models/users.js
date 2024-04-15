const mongoose = require('mongoose')


mongoose.connect("").then(() => console.log(`Connected to db`))

let Schema = new mongoose.Schema({
    username:String,
    password:String,
    email:String,
    videos: Array,
    streamKey:String,
    playbackId: String,
    
})


module.exports = mongoose.model('videoAppUsers', Schema)
