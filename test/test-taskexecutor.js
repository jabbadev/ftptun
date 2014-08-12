
var TaskExecutor = require('../lib/taskexecutor'),
	should = require('should');

describe('TaskExecutor',function(){
	
	before(function(){
		this.te = new TaskExecutor([
	       function(callback){
			   console.log('eseguo task1 .... ');
			   setTimeout(function(){
				   callback(5000,null);
			   },5000);
		   },
		   function(callback){
			   console.log('eseguo task2 .... ');
			   setTimeout(function(){
				   callback(2000,null);
			   },2000);
		   },
		   function(callback){
			   console.log('eseguo task3 .... ');
			   setTimeout(function(){
				   callback(3000,"task 3 in errore");
			   },3000);
		   },
		   function(callback){
			   console.log('eseguo task4 .... ');
			   setTimeout(function(){
				   callback(10000,null);
			   },10000);
		   },
		   function(callback){
			   console.log('eseguo task5 .... ');
			   setTimeout(function(){
				   callback(8000,null);
			   },8000);
		   }
		],3);
	});
	
	describe('#TaskExecutor.staus()',function(){
		it("should return the TaskExecutor status",function(){
			({ tasks: 5, running: 0 }).should.eql(this.te.status());
		});
	});
	
	describe('#TaskExecutor.start()',function(){
		it("should return the TaskExecutor status",function(){
			this.te.start();
			({ tasks: 5, running: 3 }).should.eql(this.te.status());
		});
	});
	
});