const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const { firebaseApp, firebaseStorage } = require("./config/fireBaseConfig")
const { getStorage, ref, uploadBytes, listAll, getDownloadURL } = require("firebase/storage")
const storage = getStorage()
const bodyParser = require("body-parser")
const expressUpload = require("express-fileupload")
const UsersDb = require("./models/users")
const videoStreamingUrl = `https://firebasestorage.googleapis.com/v0/b/video-app-3d061.appspot.com/o/videos%2F`
const session = require("express-session")
const bcrypt = require("bcrypt")
const usersVideos = require("./models/usersVideo");
const { reset } = require("nodemon");

app.use(session({
  secret:"videoApp",
  resave:false,
  saveUninitialized:false
}))
//const userDataBaseCollection = collection()
app.use(bodyParser.json())

app.use(bodyParser.urlencoded({ extended: true }))
//app.use(upload.array())
app.use(expressUpload())
app.set("view engine", "ejs");
const videoRef = ref(storage, 'videos')
const saltRounds = 10;


app.get('/upload', (req, res) => {
  if(!req.session.username){
    return res.status(400).send("Not logged in")
  }

  res.render('index')
})

app.get('/', (req, res) => {
  
  usersVideos.find({}, async(err, data) => {
    res.render('home', {
      title: data
    })
  })
})

app.get('/user/myvideos', async(req, res) => {
  if(!req.session.username){
    return res.status(400).send("You are not <a href=/login>logged in</a>")
  }
  
  const listUsersVideos = await usersVideos.find({ user: req.session.username }).select('title videoId')
  
  res.render('myVideos', { data: listUsersVideos })
})

app.get('/logout', (req, res) => {
  req.session.destroy()

  res.send("logged out")
})

app.get('/signup', (req, res) => {
  res.render('signup')
})

app.get('/login', (req, res) => {
  if(req.session.username){
    return res.redirect('/logout')
  }
  res.render('login')
})

app.post('/user/login', async(req, res) => {
  const username = req.body.username
  const password = req.body.password
  UsersDb.findOne({ username: username }, async(err, data) => {
    if(data){
      bcrypt.compare(password, data.password, function(error, result) {
        if(result == true){
          req.session.username = username
          req.session.email = data.email
          return res.status(200).send("Successfully logged in")
        }
      })
    } else {
      return res.status(400).send("Incorrect credentials")
    }
  })
})

app.post('/user/signup', async(req, res) => {
  const username = req.body.username
  const password = req.body.password
  const email = req.body.email
  UsersDb.findOne({ username: username }, async(err, data) => {
    if(data){
      return res.status(400).send("Already a user with this username")
    } else {
     bcrypt.genSalt(saltRounds, function(error, salt) {
      bcrypt.hash(password, salt, function(error, hash) {

         new UsersDb({
          username: username,
          password: hash,
          email: email
        }).save()

        req.session.username = username
        req.session.email = email

        res.send("Successfully created user")
      })
     })
    }
  })

})

app.post("/upload/video", async(req, res) => {
  if(!req.session.username) {
    return res.status(400).send("Not logged in")
  }
  const fileObject = req.files.fileData
  const title = req.body.title
  const thumbnail = req.files.thumbnail
  const thumbnailbase64 = Buffer.from(thumbnail.data).toString('base64')
  const customUUID = uuidv4()
  const metaData = {
    contentType: fileObject.mimetype,
    customMetadata:{
      videoId: customUUID,
      size: fileObject.size,
      name: fileObject.name,
      user: req.session.username
    },
    name: fileObject.name
  }

  const videoRefData = ref(storage, `videos/${customUUID}`)

  new usersVideos({
    videoId: customUUID,
    user: req.session.username,
    thumbnail: `data:${thumbnail.mimetype};base64,${thumbnailbase64}`,
    title: title
  }).save()

  uploadBytes(videoRefData, fileObject.data, metaData).then((snapshot) => {
    res.send("successfully uploaded the video")
  })

  
})

app.get('/video/:videoId', async(req, res) => {
  const getThumbnail = await usersVideos.findOne({ videoId: req.params.videoId }).distinct('thumbnail')
  const getTitle = await usersVideos.findOne({ videoId: req.params.videoId }).distinct('title')
  res.render('room', { videoId: videoStreamingUrl + req.params.videoId + "?alt=media", thumbnail: getThumbnail, title: getTitle })

})

app.get('/videos', async(req, res) => {
  const array = []

  usersVideos.find({}, async(err, data) => {
    console.log(data)
    res.render('videos', { data: data })
  })
  // listAll(videoRef)
  //   .then((videos) => {
  //     videos.items.forEach((item) => {
  //       array.push(item._location.path_)

        
  //     })
  //     res.render('videos', { data: array })
  //   })
    
})

app.listen(3000, () => {
  console.log("server is online")
})