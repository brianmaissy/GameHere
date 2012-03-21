// The Bond testing library - James Bond spies on your code while it's running and reports back to you.

// Bond keeps his records in a dictionary mapping observation locations to lists of observations made there.
// Each observation itself is a dictionary mapping labels of targets to their values
var Bond = {
    observations: []
};

// Tell Bond to start a new mission by clearing his past observations
Bond.start = function(){
    Bond.observations = [];
};

// Tell Bond to keep an eye on somebody with a call to Bond.spy(location, observations) where 'location' is a
// string labeling the place he is observing from and observations is a dictionary mapping variable names to values
Bond.spy = function(location, observations){
    if(!Bond.observations[location]){
        Bond.observations[location] = [];
    }
    Bond.observations[location].push(observations);
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

if (typeof window === 'undefined'){
    exports.Bond = Bond;
}else{
    this.Bond = Bond;
}