var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
});

var docClient = new AWS.DynamoDB.DocumentClient();

var table = "Vendors";

var vendorId = 2;

var params = {
    TableName:table,
    Item:{
        "vendorId": vendorId,
        "imei": null,
        "biographicalData":{
            "FP": "FingerPrint2",
            "DoB": "1998-05-13",
            "lat": -32.62327,
            "longitude": 25.25828
        }
    }
};

console.log("Adding a new item with params...", params);
docClient.put(params, function(err, data) {
  console.log("DATA: ", data);
    if (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Added item:", JSON.stringify(data, null, 2));
    }
});
