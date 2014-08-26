var should = require('should'),
	HttpDownloader = require('../lib/httpdownloader'),
	fs = require('fs'),
	http = require('http'),
	URL = require('url'),
	crypto = require('crypto'),
	HTTP_PORT = 8080;

describe('HttpDownloader',function(){

	before(function(done){
		var cipher = crypto.createCipher('aes-256-cbc',"secret1234");
		
		/* Check free port */
		
		function findFreePort(callback){
			http.get("http://127.0.0.1:" + HTTP_PORT, function(res) {
				HTTP_PORT += 1;
				findFreePort(callback);
			}).on('error', function(e) {
				callback(HTTP_PORT);
			});
		}
		
		var f = fs.createWriteStream('test/resweb.txt');
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
			
			findFreePort(function(port){
				http.createServer(function (req,res) {
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
						var chunk = fs.createReadStream('test/resweb.txt',{
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
						var st = fs.createReadStream('test/resweb.txt');
						st.on('data',function(data){res.write(data);});
						st.on('end',function(){
							st.close(function(){
								res.end();
							});
						});
					}
				}).listen(port,'127.0.0.1',function(){
					console.log('listen on: ',HTTP_PORT);
					done();
				});
			});
			
		});
	});
	
	after(function(){
		fs.unlinkSync('test/resweb.txt');
	});
	
	describe('#start()',function(){
		it('start http docwnload',function(done){
			var bytes = 0;
			var hd = new HttpDownloader({ reqOpt: URL.parse('http://127.0.0.1:8080/') });
			
			hd.on('data',function(data){
				bytes = bytes + data.length;
			});
		
			hd.on('end',function(){
				bytes.should.eql(10240);
				done();
			});
			
			hd.start();
		});
		
		describe('#cipher download',function(){
			it('cipher download',function(done){
				var secMsg = "";
				var hd = new HttpDownloader({ reqOpt: URL.parse('http://127.0.0.1:8080/cipher'),
										  ptun: { "server": "http://127.0.0.1:8080/cipher", secretkey: "secret1234","algorithm": "aes-256-cbc" }});
			
				hd.on('data',function(data){
					secMsg = secMsg + data.toString();
				});
		
				hd.on('end',function(data){
					if(data != null){
						secMsg = secMsg + data.toString();
					}
					secMsg.should.eql("This is a secret message");
					done();
				});
			
				hd.start();
			});
		});
		
		describe('#chunk download',function(){
			it('chunk download',function(done){
				var secMsg = "";
				var hd = new HttpDownloader({ reqOpt: URL.parse('http://127.0.0.1:8080/chunk'),
										      chunk: { start: 1024, end: 2047 } });
	
				hd.on('data',function(data){
					secMsg = secMsg + data.toString();
				});
		
				hd.on('end',function(data){
					if(data != null){
						secMsg = secMsg + data.toString();
					}
					secMsg.should.eql(new Array(1024).join('b')+'b');
					done();
				});
			
				hd.start();
				
			});
		});
		
		describe('#ptun download',function(){
			it('download using ptun',function(done){
				var secMsg = "";
				var hd = new HttpDownloader({ reqOpt: URL.parse('http://127.0.0.1:8080/ptun_cipher'),
										      ptun: { "server": "http://127.0.0.1:8080/ptun", secretkey: "secret1234","algorithm": "aes-256-cbc" } });
	
				hd.on('data',function(data){
					secMsg = secMsg + data.toString();
				});
		
				hd.on('end',function(data){
					if(data != null){
						secMsg = secMsg + data.toString();
					}
					secMsg.should.eql("ptun download");
					done();
				});
			
				hd.start();
				
			});
		});
		
	});
});