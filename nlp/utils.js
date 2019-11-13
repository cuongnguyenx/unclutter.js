var lzstring = require('lz-string');
var tf = require("@tensorflow/tfjs");
var fs = require('fs');

const unpackVectors = function(data, type) {
	var jsonData = JSON.parse(lzstring.decompressFromBase64(data));
	var array = tf.tensor(jsonData.vectors, jsonData.shape, type);
	return array;
};

const fetchModel = async function(url) {
	var response = require(url);
	return response
};
module.exports = {unpackVectors, fetchModel};