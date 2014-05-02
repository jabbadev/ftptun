
var assert = require("assert"),
	should = require('should'),
	Chunker = require('../lib/chunker');

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
