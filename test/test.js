
var assert = require("assert"),
	should = require('should'),
	Chunker = require('../lib/chunker'),
	HttpDownloader = require('../lib/httpdownloader'),
	fs = require('fs'),
	http = require('http'),
	URL = require('url');

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
		var f = fs.createWriteStream('test/resweb.txt');
		f.on('open',function(){
			['a','b','c','d','e','f','g','h','i','l'].forEach(function(letter,i){
				f.write(new Array(1024*1024).join(letter));
				if ( letter == 'l' ) {
					f.end();
				}
			});
		});
		f.on('finish',function(){
			f.close();
			http.createServer(function (req,res) {
				res.writeHead(200,{'Content-Type': 'text/plain'});
				var st = fs.createReadStream('test/resweb.txt');
				st.on('data',function(data){res.write(data);});
				st.on('end',function(){
					st.close();
					res.end();
				});
				console.log('Server running at http://127.0.0.1:8080/'); 
			}).listen(8080,'127.0.0.1');
			//done();
		});
	});
	
	after(function(){
		fs.unlinkSync('test/resweb.txt');
	});
	
	describe('#start()',function(){
		it('start http docwnload',function(){
			var hd = new HttpDownloader({ reqOpt: URL.parse('http://127.0.0.1:8080/') });
			hd.start();
		});
	});
});
