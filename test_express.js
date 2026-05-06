const express = require('express');
const app = express();
app.get('/test', (req, res) => res.json({ ok: true }));

const http = require('http');

async function test() {
  const req = new http.IncomingMessage(null);
  req.method = 'GET';
  req.url = '/test';
  
  const res = new http.ServerResponse(req);
  res.assignSocket({}); // mock socket
  
  // mock what vercel adds
  res.status = function(code) { this.statusCode = code; return this; };
  res.json = function(data) { console.log("JSON:", data); return this; };
  
  app(req, res);
}
test();
