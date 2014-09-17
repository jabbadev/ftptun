
var fs = require('fs'),
	http = require('http'),
	URL = require('url'),
	crypto = require('crypto');

var createServer =  function(file,done){
	this.port = 8080;
	this.file = file;
	this.done = done;
	var self = this,
		cipher = crypto.createCipher('aes-256-cbc',"secret1234");
	
	var f = fs.createWriteStream(this.file);
	f.on('open',function(){
		['a','b','c','d','e','f','g','h','i','l'].forEach(function(letter,i){
			f.write((new Array(1024).join(letter)) + letter,function(){
				if ( letter == 'l' ) {
					f.end();
				}
			});
		});
	});
	
	f.on('finish',function(){
		f.close();
		self.findFreePort(self.port,self._createServer);
	});
	
	this.findFreePort = function(port,callback){
		var self = this;
		http.get("http://127.0.0.1:" + port, function(res) {
			port++;
			self.findFreePort(port,self.findFreePort);
		}).on('error', function(e) {
			self._createServer(port);
		});
	};
	
	this._createServer = function(port){
		var self = this;
		this.port = port;
		this.server = http.createServer(function (req,res){
			if ( req.url == "/cipher" && req.method == 'POST' ) {
				var secret = new Buffer("This is a secret message");
				var secBuff = new Buffer(secret.toString("base64"),"base64");
				res.write(cipher.update(secBuff));
				res.end(cipher.final());
			} else if ( req.url == "/ptun_cipher" && req.method == 'GET' ) { 
				var localCipher = crypto.createCipher('aes-256-cbc',"secret1234");
				secret = new Buffer("ptun download");
				secBuff = new Buffer(secret.toString("base64"),"base64");
				res.write(localCipher.update(secBuff));
				res.end(localCipher.final());
			} else if ( req.url == "/chunk" && req.method == 'GET' ) {
				res.writeHead(200,{'Content-Type': 'text/plain','Content-length': 1024 });
				var range = req.headers.range.replace("bytes=",""),
					start = parseInt((range.split("-"))[0]),
					end = parseInt((range.split("-"))[1]),
					chunk = fs.createReadStream(self.file,{
						start: start,
						end: end
					});
				chunk.on('data',function(data){ res.write(data); });
				chunk.on('end',function(){ res.end(); });
			} else if ( req.url == "/chunk" && req.method == 'HEAD') {
				res.writeHead(200,{'Content-Type': 'text/plain','Content-length': 10240 });
				res.end();
			} else if ( req.url == "/chunk-deferred" && req.method == 'GET' ) {
				res.writeHead(200,{'Content-Type': 'text/plain','Content-length': 1024 });
				var range = req.headers.range.replace("bytes=",""),
					start = parseInt((range.split("-"))[0]),
					end = parseInt((range.split("-"))[1]),
				 	chunk = fs.createReadStream(self.file,{
						start: start,
						end: end
				 	}),
				 	dataToSend = null;
				 	
				chunk.on('data',function(data){
					dataToSend = data;
				});
				chunk.on('end',function(){ 
					if ( start == 0 && end == 1023 ) {
						setTimeout(function(){
							res.end(dataToSend);
						},100);
					}
					else {
						res.end(dataToSend);
					}
				});
			} else if ( req.url == "/chunk-deferred" && req.method == 'HEAD' ) {
				res.writeHead(200,{'Content-Type': 'text/plain','Content-length': 10240 });
				res.end();
			} else if ( req.url == "/check-size" && req.method == 'GET' ) {
				res.writeHead(200,{'Content-Type': 'text/plain','Content-length': 3000 });
				
				res.write(new Array(1001).join('a'));
				setTimeout(function(){
					res.write(new Array(1001).join('b'));
				},100);
				setTimeout(function(){
					res.end(new Array(1001).join('c'));
				},100);
				
			} else if ( req.url == "/check-size" && req.method == 'HEAD' ) {
				res.writeHead(200,{'Content-Type': 'text/plain','Content-length': 3000 });
				res.end();
			} else if ( req.url == "/ptun" ) {
				var bodyReq = "";
				req.on('data',function(data){
					bodyReq += data;
				});
				req.on('end',function(){
					var webResReq = http.request(JSON.parse(bodyReq),function(webResRes){
						webResRes.on('data',function(data){
							res.write(data); 
						});
						webResRes.on('end',function(){
							res.end();
						});
					});
					webResReq.end();
				});
				
			} else if (req.url == "/size" && req.method == 'HEAD' ){
				res.writeHead(200,{'content-length': 10240});
				res.end();
			} else if (req.url == "/undefined-size" && req.method == 'GET' ){
				res.writeHead(200,{'Content-Type': 'text/plain'});
				res.write('chunk 0');
				setTimeout(function(){
					res.write('chunk 1');
					res.end();
				},300);
			} else if (req.url == "/undefined-size" && req.method == 'HEAD' ){
				res.writeHead(200);
				res.end();
			} else if ( req.url == "/download-all" && req.method == 'GET' ){
				res.writeHead(200,{'Content-Type': 'text/plain','Content-length': 10240 });
				var st = fs.createReadStream(self.file);
				st.on('data',function(data){res.write(data);});
				st.on('end',function(){
					st.close(function(){
						res.end();
					});
				});
			}
		}).listen(this.port,"127.0.0.1",function(){self.done(self);});
	};
	
	this.close = function(){
		this.server.close();
		fs.unlinkSync(self.file);
	};
};

module.exports = {createServer: createServer};

if (require.main === module){
	var path = require('path');
	createServer(path.dirname(module.filename) + "/webserver-res.txt",function(server){
		console.log('standalone webserver running on port [ ',server.port,' ]');
	});
}
