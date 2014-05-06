
var assert = require("assert"),
	should = require('should'),
	Chunker = require('../lib/chunker'),
	HttpDownloader = require('../lib/httpdownloader'),
	fs = require('fs'),
	http = require('http');

describe('Chunker',function(){
	describe('#next()',function(){
		it('should return the next chunk [ start, end ]',function(){
			var ck = new Chunker(3011,1000);
			[0,999].should.eql(ck.next());
			[1000,1999].should.eql(ck.next());
			[2000,2999].should.eql(ck.next());
			[3000,3011].should.eql(ck.next());
			(function(){ck.next()}).should.throw('No more chunks');
		});
	});
	describe('#cn()',function(){
		it('should return actual chunk number',function(){
			var ck = new Chunker(3011,1000);
			(0).should.eql(ck.cn());
			(0).should.eql(ck.cn());
			ck.next();
			ck.next();
			(2).should.eql(ck.cn());
			
		});
	});
	describe('#chunks()',function(){
		it('should return number of chunks',function(){
			var ck = new Chunker(3011,1000);
			(4).should.eql(ck.chunks());
			var ck = new Chunker(3000,1000);
			(3).should.eql(ck.chunks());
		});
	});
	describe('#forEach(callBack)',function(){
		it('should exec callBack on every chunk',function(){
			var ck = new Chunker(3011,1000),
				chunks = [[3000,3011],[2000,2999],[1000,1999],[0,999]];
			ck.forEach(function(chunk){
				var ac = chunks.pop();
				ac.should.eql(chunk);
			});
		});
	});
});

describe('HttpDownloader',function(){

	before(function(){
		var fd = fs.openSync('test/resweb.txt','w');
		for( var c in ['a','b','c','d','e','f','g','h','i','l']) {
			fs.writeSync(fd,new Array(1024*1024).join(c));
		}
		fs.closeSync(fd);
		 
		http.createServer(function (req, res) {
			res.writeHead(200,{'Content-Type': 'text/plain'});
			var st = fs.createReadStream('test/resweb.txt');
			st.on('data',function(chunk){res.write(data)});
			st.on('end',function(){
				st.close();
				res.end();
			});
			
		}).listen(8080,'127.0.0.1');
		console.log('Server running at http://127.0.0.1:8080/'); 
	});
	
	after(function(){
		fs.unlinkSync('test/resweb.txt');
	});
	
	describe('#start()',function(){
		it('start http docwnload',function(){
			console.log('start()');
			var hd = new HttpDownloader({});
		});
	});
	describe('#suspend()',function(done){
		it('suspend the download ',function(){
			console.log('start()');
		});
	});
});
