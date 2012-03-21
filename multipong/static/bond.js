// The Bond testing library - James Bond spies on your code while it's running and reports back to you.

// Bond keeps his records in a dictionary mapping observation locations to lists of observations made there.
// Each observation itself is a dictionary mapping labels of targets to their values
var Bond = {
    observations: [],
    remote: false,
    socket: null
};

// Tell Bond to start a new mission by clearing his past observations
Bond.start = function(){
    Bond.observations = [];
    // clear log file
    fs.createWriteStream('./BondLogs/log.txt', {
        flags: 'w',
        encoding: "utf8",
        mode: 0666
    }).write("");
};

// Call this to change to remote reporting mode, and pass the socket.io socket of the testing server.
// Remote mode allows Bond to report from a remote location, such as a client running javascript code in a browser.
// This really consists of two instances of Bond, one on the client and one on the server. The client Bond instance is
// put into remote mode, and forwards all observations to the server. The server Bond receives the message and logs it.
Bond.startRemoteClient = function(socket){
    this.remote = true;
    this.socket = socket;
};
Bond.startRemoteServer = function(socket){
    socket.on('Bond.spy', function(data){
        Bond.spy(data.location, data.observations);
    });
};

// Tell Bond to keep an eye on somebody with a call to Bond.spy(location, observations) where 'location' is a
// string labeling the place he is observing from and observations is a dictionary mapping variable names to values
// If we are in remote mode, send a socket.io message to the server, where the server's instance of Bond will log it.
Bond.spy = function(location, observations){
    if(this.remote){
        this.socket.emit('Bond.spy', {location: location, observations: observations});
    }else{
        if(!Bond.observations[location]){
            Bond.observations[location] = [];
        }
        Bond.observations[location].push(observations);

        // write to log file
        fs.createWriteStream('./BondLogs/log.txt', {
            flags: 'a',
            encoding: "utf8",
            mode: 0666
        }).write(location + ": " + JSON.stringify(observations) + "\n");
    }
};

// Ask Bond if he has seen something with a call to Bond.seen(location, observations) where 'location' is a string
// labeling the place and observations is a dictionary mapping variable names to values
// and he will respond with a list of the matching observations, or null if that list happens to be empty.
// You can ask Bond with an extra parameter value to filter his results by observations of the value given.
// The following predicates can be appended to a variable name to modify the comparison:
// _contains, _begins_with, _ends_with - the variable (a string or set) contains/begins with/ends with the given value
// _in - the variable is a member of the given set
// _neq - not equal to
// _gt, _gte - greater than, greater than or equal to
// _lt, _lte - less than, less than or equal to
Bond.seen = function(location, observations){
    var obs = Bond.observations[location];
    var results = [];
    var i;
    for(i=0; i<obs.length; i++){
        var match = true;
        for(var variable in observations){
            if(!evaluatePredicate(obs[i], variable, observations[variable])){
                match = false;
            }
        }
        if(match){
            results.push(obs[i]);
        }
    }
    if(results.length == 0){
        return null;
    }else{
        return results;
    }
};

function evaluatePredicate(observation, variable, value){
    var theVar;
    if(variable.endsWith('_contains')){
        theVar = observation[variable.stripLast(9)];
        return (isArray(theVar) || typeof(theVar)=="string") && theVar.contains(value);
    }else if(variable.endsWith('_begins_with')){
        theVar = observation[variable.stripLast(12)];
        return (isArray(theVar) || typeof(theVar)=="string") && theVar.beginsWith(value);
    }else if(variable.endsWith('_ends_with')){
        theVar = observation[variable.stripLast(10)];
        return (isArray(theVar) || typeof(theVar)=="string") && theVar.endsWith(value);
    }else if(variable.endsWith('_in')){
        return isArray(value) && value.contains(observation[variable.stripLast(3)]);
    }else if(variable.endsWith('_neq')){
        return observation[variable.stripLast(4)] != value;
    }else if(variable.endsWith('_lt')){
        return observation[variable.stripLast(3)] < value;
    }else if(variable.endsWith('_lte')){
        return observation[variable.stripLast(4)] <= value;
    }else if(variable.endsWith('_gt')){
        return observation[variable.stripLast(3)] > value;
    }else if(variable.endsWith('_gte')){
        return observation[variable.stripLast(4)] >= value;
    }else{
        return observation[variable] == value;
    }
}

// A shortcut method for asking Bond how many times he has made a specific observation
Bond.seenTimes = function(location, observations){
    var result = Bond.seen(location, observations);
    if(!result){
        return 0;
    }else{
        return result.length;
    }
};

// Helper functions
Array.prototype.contains = function(element){
    return this.indexOf(element) != -1;
};
Array.prototype.beginsWith = function(element){
    return this.indexOf(element) == 0;
};
Array.prototype.endsWith = function(element){
    return this.indexOf(element) == this.length - 1;
};
String.prototype.contains = function(substring){
    return this.indexOf(substring) != -1;
};
String.prototype.beginsWith = function(prefix){
    return this.indexOf(prefix) == 0;
};
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.stripLast = function(number) {
    return this.substring(0, this.length - number);
};

function isArray(a) { return Object.prototype.toString.apply(a) === '[object Array]'; }

var fs;
if (typeof window === 'undefined'){
    exports.Bond = Bond;
    var fs = require('fs');
}else{
    this.Bond = Bond;
}