const http = require("http");
const auth = require("./api/auth.js");
const req = new http.IncomingMessage(null);
const res = new http.ServerResponse(req);
res.json = (data) => console.log("JSON:", data);
res.status = (code) => { console.log("Status:", code); return res; };
auth(req, res);
