
var fs = require('fs'),
	http = require('http'),
	URL = require('url'),
	crypto = require('crypto');

var createServer =  function(file,done){
	this.port = 3128;
	this.file = file;
	this.done = done;
	var self = this;
	
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
		console.log('free port: ',port);
		this.server = http.createServer(function (req,res){
			if ( req.url == "/cipher" ) {
				var secret = new Buffer("This is a secret message");
				var secBuff = new Buffer(secret.toString("base64"),"base64");
				res.write(cipher.update(secBuff));
				res.end(cipher.final());
			} else if ( req.url == "/ptun_cipher") { 
				var localCipher = crypto.createCipher('aes-256-cbc',"secret1234");
				secret = new Buffer("ptun download");
				secBuff = new Buffer(secret.toString("base64"),"base64");
				res.write(localCipher.update(secBuff));
				res.end(localCipher.final());
			} else if ( req.url == "/chunk" ) {		
				var start = parseInt((req.headers.range.split("-"))[0]);
				var end = parseInt((req.headers.range.split("-"))[1]);
				var chunk = fs.createReadStream(self.file,{
					start: start,
					end: end
				});
				chunk.on('data',function(data){ res.write(data); });
				chunk.on('end',function(){ res.end(); });
			} else if ( req.url == "/ptun" ) {
				var bodyReq = "";
				req.on('data',function(data){
					bodyReq += data;
				});
				req.on('end',function(){
					var msg = "";
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
				
			} else {
				res.writeHead(200,{'Content-Type': 'text/plain'});
				var st = fs.createReadStream(self.file);
				st.on('data',function(data){res.write(data);});
				st.on('end',function(){
					st.close(function(){
						res.end();
					});
				});
			}
		}).listen(this.port,"127.0.0.1",this.done);
	};
	
	this.destroy = function(){
		
	};
};

module.exports = {createServer: createServer};
