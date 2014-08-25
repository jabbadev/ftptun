
var should = require('should'),
	DownloadManager = require('../lib/downloadManager.js'),
	fs = require('fs'),
	http = require('http'),
	URL = require('url'),
	crypto = require('crypto');

describe('DownloadManager',function(){

	before(function(done){
		var cipher = crypto.createCipher('aes-256-cbc',"secret1234");
		
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
			}).listen(8080,'127.0.0.1',function(){
				done();
				//console.log('Server running at http://127.0.0.1:8080/'); 
			});
			
		});
	});
	
	after(function(){
		//fs.unlinkSync('test/resweb.txt');
	});
	
	describe('#DownloadManager test',function(){
		it('test download manager',function(done){
			/*
			var dm = new DownloadManager({
					workers: 3,
					chunkSize: 1024,
					resSize: 10240,
					reqOpt: URL.parse('http://127.0.0.1:8080/chunk') 
			});
			*/
			var dm = new DownloadManager({
					workers: 1,
					chunkSize: 8611840,
					resSize: 8611840,
					reqOpt: URL.parse('http://127.0.0.1:8080/chunk') 
			});
			
			
			dm.on('data',function(data){
				console.log(data.toString());	
			});
			
			dm.on('finish',function(){
				console.log(end);
			});
			
			dm.start();
			
		});
	});

});