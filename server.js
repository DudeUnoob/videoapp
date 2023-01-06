const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const { firebaseApp, firebaseStorage } = require("./config/fireBaseConfig")
const { getStorage, ref, uploadBytes, listAll, getDownloadURL, deleteObject } = require("firebase/storage")
const storage = getStorage()
const bodyParser = require("body-parser")
const expressUpload = require("express-fileupload")
const UsersDb = require("./models/users")
const videoStreamingUrl = `https://firebasestorage.googleapis.com/v0/b/video-app-3d061.appspot.com/o/videos%2F`
const session = require("express-session")
const bcrypt = require("bcrypt")
const usersVideos = require("./models/usersVideo");
const router = require("./routes/videoRouter")
const Mux = require("@mux/mux-node")
const { Video } = new Mux("10a2b6f9-9be4-449c-b792-45db56f89a60","l86I/7emeW777FGXSfhSSZP+k464yyT9dimWFBYdlVZWH2rz54cgj1dl8YNvGgBKo2XXofvoPYt")



app.use(session({
  secret:"videoApp",
  resave:false,
  saveUninitialized:false
}))

app.use('/user', router)
//const userDataBaseCollection = collection()
app.use(express.json())
app.use(express.urlencoded())
app.use(bodyParser.json())
const parsing = bodyParser.json()

app.use(bodyParser.urlencoded({ extended: true }))
//app.use(upload.array())
app.use(expressUpload())
app.set("view engine", "ejs");
const videoRef = ref(storage, 'videos')
const saltRounds = 10;


app.get('/upload', (req, res) => {
  if(!req.session.username){
    return res.status(400).send("Not <a href=/login>logged in</a>")
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
  
  const listUsersVideos = await usersVideos.find({ user: req.session.username })
  
  res.render('myVideos', { data: listUsersVideos })
})

app.get('/logout', (req, res) => {
  req.session.destroy()

  res.redirect('/')
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
          return res.redirect('/')
        }
      })
    } else {
      return res.status(400).send("Incorrect <a href=/login>credentials</a>")
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

        res.redirect('/')
      })
     })
    }
  })

})

app.post("/upload/video", async(req, res) => {
  if(!req.session.username) {
    return res.status(400).send("Not <a href=/login>logged in</a>")
  }

  
  const fileObject = req.files.fileData
  const title = req.body.title
  const thumbnail = req.files.thumbnail
  if(thumbnail.size > 8000000){
    return res.status(400).send("Sorry, the thumbnail picture is above 8 megabytes!")
  }
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
    res.redirect('/user/myvideos')
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

app.post('/video/delete',  async(req, res) => {
  const videoId = req.body.videoId
  console.log(videoId)
  const videoRefData = ref(storage, `videos/${videoId}`)

  deleteObject(videoRefData).then(async() => {
    await usersVideos.findOneAndRemove({ videoId: videoId })
    res.status(200).send("Successfully deleted video")
    
  }).catch((error) => {
    res.status(400).send({ error: error, message:"Your video was not found?"})
  })
})


app.get("/livestream", async(req, res) => {

  if(!req.session.username){
    return res.status(400).send("You are not logged in")
  }
  await Video.LiveStreams.create({
    playback_policy: 'public',
    new_asset_settings: { playback_policy: 'public' }
}).then(response => {
  req.session.stream_key = response.stream_key
  req.session.playback_id = response.playback_ids[0].id

  // const getId = await UsersDb.findOne({ username: req.session.username }).select('playbackId')

  // if(getId != null){
  //   return;
  // } else {
  //   usersVideos.findOneAndUpdate({ username: req.session.username }, { playbackId: response.playback_ids[0].id })
  // }

 
    
      UsersDb.updateOne({ username: req.session.username }, { playbackId: response.playback_ids[0].id, streamKey: response.stream_key }).then((object) => console.log(object))
      
      res.json({ message:"copy the streamkey into your broadcasting software with the server being: rtmp://global-live.mux.com:5222/app" ,streamKey: response.stream_key, playbackId: response.playback_ids[0].id })
 
  
 
})


})


app.get(`/livestream/:live`, async(req, res) => {
  // if(!req.session.username){
  //   return res.status(400).send("You are not logged in")
  // }
  // } else {
  //   if(!req.session.stream_key){
  //   return res.status(400).send("You haven't received a streamkey")
  // }
  // }
  UsersDb.findOne({ username: req.session.username }, async(err, data) => {
    if(data){
      res.render('livestream', { streamKey: req.session.stream_key, playbackId: data.playbackId })
    } else {
      return res.status(400).send("User not found")
    }
  })
  
  
})
const userString = `10a2b6f9-9be4-449c-b792-45db56f89a60`
const passString = `l86I/7emeW777FGXSfhSSZP+k464yyT9dimWFBYdlVZWH2rz54cgj1dl8YNvGgBKo2XXofvoPYt`


app.get(`/livestreams`, async(req, res) => {
  

  // async function getData() {
  //   const response = await fetch('https://api.mux.com/video/v1/live-streams', {
  //     headers: {
  //       'Authorization': 'Basic ' + btoa(`${userString}:${passString}`)
  //     }
  //   });
  //   const data = await response.json();
    
  //   const filter = data.map((elm) => {
  //     console.log(elm)
  //   })

  //   res.send(data)
  // }
  
  // getData();

  fetch('https://api.mux.com/video/v1/live-streams', {
      headers: {
        'Authorization': 'Basic ' + btoa(`${userString}:${passString}`)
      }
    }).then(response => response.json()).then(data => {
      const filter = data.data.filter(elm => elm.status != "idle" && elm.status != "disabled")
      console.log(filter)
      res.send(filter)
    })

})


app.listen(3000, () => {
  console.log("server is online")
})