var http = require('http');
var url = require('url');
var querystring = require('querystring'); //utilities for parsing and formatting URL query strings
var AWS = require('aws-sdk'); //AWS SDK for JavaScript in Node.js

AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
});

var gDocClient = new AWS.DynamoDB.DocumentClient()
var gTable = "Vendors";

var server = http.createServer(function(req, res){
  var vendorParams = querystring.parse(url.parse(req.url).query); //parse url for the paramaters and separates them

  var arrOfVendorParamsKeys = Object.keys(vendorParams); //Object.keys gives an array of strings that represent all the enumerable properties of the given object.

  res.writeHead(200, {"Content-Type": "text/plain"});

  if('vendorId' in vendorParams && arrOfVendorParamsKeys.length === 1){
    getDataFromDynamoforId(res, Number(vendorParams['vendorId'])); //Number converts id from a string to a number
  }
  else if ('vendorId' in vendorParams && vendorParams['action'] === 'update'){
    if('imei' in vendorParams){
      updateDynamoForId(res, Number(vendorParams['vendorId']), 'imei', vendorParams);
    }
    if('FP' in vendorParams){
      updateDynamoForId(res, Number(vendorParams['vendorId']), 'FP', vendorParams);
    }
    if('DoB' in vendorParams){
      updateDynamoForId(res, Number(vendorParams['vendorId']), 'DoB', vendorParams);
    }
    if('lat' in vendorParams){
      updateDynamoForId(res, Number(vendorParams['vendorId']), 'lat', vendorParams);
    }
    if('longitude' in vendorParams){
      updateDynamoForId(res, Number(vendorParams['vendorId']), 'longitude', vendorParams);
    }
  }
  else if('vendorId' in vendorParams && vendorParams['action'] === 'delete'){
    deleteDataForId(res, Number(vendorParams['vendorId']));
  }
  else{
    res.write("No ID paramater in request URL" + "\n");
    res.end();
  }
})


function getDataFromDynamoforId(response, id){
  var params = {
      TableName: gTable,
      Key:{
          "vendorId": id,
      }
  };

  //query DynamoDB to get the data for the vendorId passed in.
  gDocClient.get(params, function(err, data) {
    if(err){
      response.write("Unable to read item. Error JSON:" + JSON.stringify(err, null, 2) + "\n");
    }

    else {
      if(Object.keys(data).length === 0){ //if id passed in does not exist in Dynamo
        response.write("vendorId " + id + " does not exist." + "\n");
      }
      else{ //checkValidity of data received from dynamodb
        var isValid = checkValidity(data.Item);
        // console.log("isValid: ", isValid);
        response.write("Data: " + JSON.stringify(data) + "\n" + "Is Valid?: " + isValid + "\n");
      }
    }
    response.end();
  });
}

//iterate through the object returned from dynamo to check if any value is null.
//if there is a field that is null, return false
//if all fields are filled, return true
//if the value is an object and not null, iterate through that nested object to check each value
function checkValidity(dataObj){
  // console.log("checkValidity(): data: ", dataObj);
  for(let key in dataObj){
    if(typeof dataObj[key] === "object" && dataObj[key] != null){
      var nestedObj = dataObj[key];
      for(let key in nestedObj){
        if(nestedObj[key] === null){
          return false;
        }
      }
    }

    else{
      if(typeof dataObj[key] === "object" && dataObj[key] === null){
        return false;
      }
    }
  }
  return true;
}

function updateDynamoForId(response, id, field, paramsFromReq){

  var updateExpressionOptions = {
    "imei": "set imei = :i",
    "FP": "set biographicalData.FP = :fp",
    "DoB": "set biographicalData.DoB = :dob",
    "lat": "set biographicalData.lat = :la",
    "longitude": "set biographicalData.longitude = :lo"
  }

  var expressionAttributeValuesOptions = {
    "imei": ":i",
    "FP": ":fp",
    "DoB": ":dob",
    "lat": ":la",
    "longitude": ":lo"
  }

  var params = {
    TableName: gTable,
    Key:{
      "vendorId": id
    },

    UpdateExpression: updateExpressionOptions[field], //ex: UpdateExpression: "set imei = :i"
    ExpressionAttributeValues: {
      [expressionAttributeValuesOptions[field]]: paramsFromReq[field] //ex: ":i": paramsFromReq['imei']
    },
    ReturnValues: "UPDATED_NEW"
  };

  gDocClient.update(params, function(err, data){
    if(err){
      response.write("Unable to update item. Error JSON:" +  JSON.stringify(err, null, 2) + "\n");
    }
    else{
      response.write("UpdateItem succeeded:" + JSON.stringify(data, null, 2) + "\n");
    }
  });
}

function deleteDataForId(response, id){
  console.log("deleteDataForId(): response = ", response);

  var params = {
    TableName: gTable,
    Key:{
        "vendorId":id,
    }
  }

  gDocClient.delete(params, function(err, data){
    if(err){
      // console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
      response.write("Unable to delete item. Error JSON:" + JSON.stringify(err, null, 2) + "\n");
    }
    else{
      // console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
      response.write("DeleteItem succeeded:" + JSON.stringify(data, null, 2) + "\n");
    }
  });
}


server.listen(8080);
