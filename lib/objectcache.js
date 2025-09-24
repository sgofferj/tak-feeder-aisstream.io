const util = require("util");
const NodeCache = require("node-cache");
const objectCache = new NodeCache({
  stdTTL: 60,
  checkperiod: 10
});

module.exports.store = (msg) => {
  let mmsi = (msg["MetaData"].hasOwnProperty("MMSI")) ? msg["MetaData"]["MMSI"] : 0
  
  let uid = `AIS-${mmsi}`;
  try {
    if (msg["MessageType"] == "ShipStaticData") {
      let data = msg["Message"]["ShipStaticData"]
      obj = objectCache.get(uid);
      if (typeof(obj) === 'undefined') obj = {
        "mmsi": mmsi
      }
      obj.mmsi = mmsi;
      obj.name = data["Name"];
      obj.callsign = data["CallSign"];
      obj.imo = data["ImoNumber"];
      obj.type = data["Type"];
      obj.destination = data["Destination"];
      obj.timestamp = new Date(msg["MetaData"]["time_utc"]).toISOString();
      obj.lat = msg["MetaData"]["latitude"];
      obj.lon = msg["MetaData"]["longitude"];
      success = objectCache.set(uid, obj,600);
    }
    else if (msg["MessageType"] == "PositionReport") {
      let data = msg["Message"]["PositionReport"]
      obj = objectCache.get(uid);
      if (typeof(obj) === 'undefined') obj = {
        "mmsi": mmsi
      }
      if (data.hasOwnProperty("Latitude")) obj.lat = data["Latitude"];
      else obj.lat = msg["MetaData"]["latitude"];;
      if (data.hasOwnProperty("Longitude")) obj.lon = data["Longitude"];
      else obj.lon = msg["MetaData"]["longitude"];
      obj.mmsi = mmsi;
      obj.gs = data["Sog"];
      obj.track = data["Cog"];
      obj.time = new Date(msg["MetaData"]["time_utc"]).toISOString();
      success = objectCache.set(uid, obj,600);
    }
  } catch (e) {
    console.error('error', e, msg);
  }
}

module.exports.getCache = () => {
  return objectCache;
}
