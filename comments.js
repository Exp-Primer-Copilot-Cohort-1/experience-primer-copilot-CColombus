// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

// Route: GET /posts/:id/comments
app.get('/posts/:id/comments', (req, res) => {
  res.send(posts[req.params.id] || []);
});

// Route: POST /posts/:id/comments
app.post('/posts/:id/comments', async (req, res) => {
  const { content } = req.body;
  const { id } = req.params;

  let comments = posts[id] || [];

  const comment = {
    id: Math.random().toString(36).substr(2, 9),
    content,
    status: 'pending',
  };

  comments.push(comment);
  posts[id] = comments;

  // Emit event to event bus
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: {
      ...comment,
      postId: id,
    },
  });

  res.status(201).send(comments);
});

// Route: POST /events
app.post('/events', async (req, res) => {
  console.log('Event received:', req.body.type);
  const { type, data } = req.body;

  if (type === 'CommentModerated') {
    const { postId, id, status } = data;
    const comments = posts[postId];

    const comment = comments.find((comment) => comment.id === id);
    comment.status = status;

    // Emit event to event bus
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: {
        ...comment,
        postId,
      },
    });
  }

  res.send({});
});

app.listen(4001, () => {
  console.log('Server listening on port 4001');
});