
var events = require("events"),
	util = require("util");

var TaskExecutor = function(tasks,nrt){
	events.EventEmitter.call(this);
	this.tasks = tasks;
	this.nrt = nrt;
	this.running = 0;
	this.cont = 0;
	
	this._endTaskHandler = function(success,error){
		self = this;
		this.running--;
		this.emit('taskComplete',success,error);
		this._fireTasks();
		/*
		if ( this.cont == this.tasks.length && !this.running ){
			this.emit('allTasksComplete');
		}*/
	};
	
	this._callEndTaskHandler = function(){
		self = this;
		return function(success,error){ self._endTaskHandler.call(self,success,error); };
	};
	
	this._fireTasks = function(){
		var self = this;
		while( this.running < this.nrt && this.cont < this.tasks.length ){
			setTimeout(function(cont){self.tasks[cont](self.__endTaskHandler);},1,this.cont);	
			this.cont++;
			this.running++;
		}
		if ( this.cont == this.tasks.length && !this.running ){
			this.emit('allTasksComplete');
		}
	};
	
	this.start = function(){
		this._fireTasks();
	};
	
	this.status = function(){
		return {tasks: this.tasks.length, running: this.running };
	};
	
	this.__endTaskHandler = this._callEndTaskHandler();
};

util.inherits(TaskExecutor,events.EventEmitter);

module.exports = TaskExecutor;


