const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');

dotenv.config(); // Load environment variables from .env file

const secret="asdfe45we45w345wegw345werjktjwertkj";
const app = express();
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

app.use(cookieParser());
app.use(cors({ credentials: true, origin: 'http://localhost:3000'}));
app.use(express.json());
app.use('/uploads', express.static(__dirname + '/uploads'));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

mongoose
  .connect(process.env.MONOGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const db = mongoose.connection;
    db.once('open', async () => {
      await User.createIndexes();
      await Post.createIndexes();
      console.log('Database connected!');
    });
  })
  .catch((err) => console.log(err));



app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.findOne({ username });
    if (!userDoc) {
      return res.status(400).json('User not found');
    }
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      const token = jwt.sign({ username, id: userDoc._id }, secret, {});
      res.cookie('token', token, { httpOnly: true }).json({
        id: userDoc._id,
        username,
      });
    } else {
      res.status(400).json('Wrong credentials');
    }
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.get('/profile', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json('Unauthorized');
  }
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) {
      return res.status(401).json('Unauthorized');
    }
    res.json(info);
  });
});

app.post('/logout', (req, res) => {
  res.clearCookie('token').json('Logout successful');
});

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path + '.' + ext;
  fs.renameSync(path, newPath);

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json('Unauthorized');
  }
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
      return res.status(401).json('Unauthorized');
    }
    const { title, summary, content } = req.body;
    try {
      // Upload image to Cloudinary
      const cloudinaryResult = await cloudinary.uploader.upload(newPath);

      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: cloudinaryResult.secure_url, // Store the image URL from Cloudinary
        author: info.id,
      });
      res.json(postDoc);
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  });
});


app.put('/post/:id', uploadMiddleware.single('file'), async (req, res) => {
  const postId = req.params.id;
  const { title, summary, content } = req.body;

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json('Unauthorized');
  }
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
      return res.status(401).json('Unauthorized');
    }
    try {
      const postDoc = await Post.findById(postId);
      if (!postDoc) {
        return res.status(404).json('Post not found');
      }
      if (postDoc.author.toString() !== info.id) {
        return res.status(403).json('You are not the author');
      }
      postDoc.title = title;
      postDoc.summary = summary;
      postDoc.content = content;

      if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = path + '.' + ext;
        fs.renameSync(path, newPath);

        // Upload updated image to Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(newPath);
        postDoc.cover = cloudinaryResult.secure_url; // Update the image URL in Cloudinary
      }

      const updatedPost = await postDoc.save();
      res.json(updatedPost);
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  });
});

app.get('/post', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', ['username'])
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(posts);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.get('/post/:id', async (req, res) => {
  const postId = req.params.id;
  try {
    const post = await Post.findById(postId).populate('author', ['username']);
    if (!post) {
      return res.status(404).json('Post not found');
    }
    res.json(post);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.listen(4000, () => {
  console.log('Server is running on port 4000');
});
