const fs = require("fs");
const { cot, proto } = require("@vidterra/tak.js");
const uuid = require("uuid");
const util = require("util");

const aisDBFile =
  typeof process.env.AISDB !== "undefined"
    ? process.env.AISDB
    : "lib/countries.json";
const myCallsign =
  typeof process.env.CALLSIGN !== "undefined"
    ? process.env.CALLSIGN
    : "ais-traffic-fin";
const myType =
  typeof process.env.MYCOT !== "undefined" ? process.env.MYCOT : "a-f-G-U";
const myUID =
  typeof process.env.UUID !== "undefined" ? process.env.UUID : uuid.v4();
const typeFilter =
  typeof process.env.TYPE_FILTER !== "undefined"
    ? process.env.TYPE_FILTER.split(",")
    : [];

let aisdb;
if (aisDBFile != null) {
  let rawdata = fs.readFileSync(aisDBFile);
  aisdb = JSON.parse(rawdata);
} else aisdb = null;

let typedb = JSON.parse(fs.readFileSync("lib/types.json"));

module.exports.checkFile = (path) => {
  let result = false;
  try {
    if (fs.existsSync(path)) {
      console.log("Found " + path);
      result = true;
    } else {
      console.log("Can't find " + path);
      result = false;
    }
  } catch (err) {
    console.error(err);
  }
  return result;
};

module.exports.heartbeatcot = (stale) => {
  const dt = Date.now();
  const dtD = new Date(dt).toISOString();
  const dtDs = new Date(dt + 3 * stale * 1000).toISOString();

  let packet = {
    event: {
      _attributes: {
        version: "2.0",
        uid: myUID,
        type: myType,
        how: "h-g-i-g-o",
        time: dtD,
        start: dtD,
        stale: dtDs,
      },
      point: {
        _attributes: {
          lat: "0.000000",
          lon: "0.000000",
          hae: "9999999.0",
          ce: "9999999.0",
          le: "9999999.0",
        },
      },
      detail: {
        takv: {
          _attributes: {
            os: "Docker",
            device: "Server",
            version: "1",
            platform: "NodeJS AIS feeder",
          },
        },
        contact: {
          _attributes: {
            callsign: myCallsign,
          },
        },
        uid: { _attributes: { Droid: myCallsign } },
        precisionlocation: {
          _attributes: { altsrc: "GPS", geopointsrc: "GPS" },
        },
        track: { _attributes: { course: "0", speed: "0" } },
        __group: { _attributes: { role: "Server", name: "Blue" } },
      },
    },
  };
  return cot.js2xml(packet);
};

function getAffil(mmsi) {
  let result;
  let country = mmsi.substring(0, 3);
  if (aisdb != null) {
    if (typeof aisdb[country] !== "undefined") result = aisdb[country];
    else result = "o";
  } else result = "u";
  return result;
}

module.exports.ais2cot = (item, stale) => {
  const dt = Date.now();
  const dtD = new Date(dt).toISOString();
  const dtDs = new Date(dt + stale * 1000).toISOString();
  if (item.hasOwnProperty("lat") && item.hasOwnProperty("lon")) {
    let mmsi = item["mmsi"].toString();
    let cottype = "a-";
    let affil = getAffil(mmsi);
    let typesuffix = typedb.hasOwnProperty(item.type)
      ? typedb[item.type]
      : "-S-X";
    cottype += affil[0];
    cottype += typesuffix;
    country = affil[1];
    let course = item.hasOwnProperty("track") ? item.track : 0;
    let speed = item.hasOwnProperty("gs") ? item.gs * 0.514444 : 0;
    let name = item.hasOwnProperty("name") ? item.name : mmsi;

    let remarks = `${name}\nAIS type: ${item["type"]}\nMMSI: ${mmsi}\nIMO: ${item["imo"]}\nDest: ${item["destination"]}\nCountry: ${country}\nLast Pos: ${item["time"]}\nMetadata: ${item["timestamp"]}\n#AIS`;
    let uid = "AIS-" + mmsi;
    packet = {
      event: {
        _attributes: {
          version: "2.0",
          uid: uid,
          type: cottype,
          how: "m-g",
          time: dtD,
          start: dtD,
          stale: dtDs,
        },
        point: {
          _attributes: {
            lat: item.lat,
            lon: item.lon,
            hae: 0.0,
            ce: 0.0,
            le: 0.0,
          },
        },
        detail: {
          contact: {
            _attributes: {
              callsign: name,
            },
          },
          precisionlocation: {
            _attributes: { altsrc: "GPS", geopointsrc: "GPS" },
          },
          link: {
            _attributes: {
              uid: myUID,
              production_time: dtD,
              type: myType,
              parent_callsign: myCallsign,
              relation: "p-p",
            },
          },
          link: {
            _attributes: {
              url: `https://www.marinetraffic.com/en/ais/details/ships/mmsi:${mmsi}`,
              relation: "r-u",
              type: "a-f-G",
              uid: myUID,
              remarks: "Marinetraffic lookup",
              mime: "text/html",
              version: "1.0",
            },
          },
          track: { _attributes: { course: course, speed: speed } },
          remarks: [remarks],
        },
      },
    };
    result = cot.js2xml(packet);
    if (typeof item["type"] !== "undefined") {
      let aisType = item["type"].toString();
      if ((typeFilter.length == 0) | typeFilter.includes(aisType))
        return result;
    }
  }
};
