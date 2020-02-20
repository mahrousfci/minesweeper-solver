/* const getOpenedNodes = mapSnapshot => {
    let _openedNodes = [];
    mapSnapshot.forEach((r, xIndex) => {
      r.forEach((i, yIndex) => {
        if (!isNaN(parseInt(i))) {
          _openedNodes.push({
            x: xIndex,
            y: yIndex
          });
        }
      });
    });
    return _openedNodes;
  }; */

//this.getNeighbors();
//let openedNodes = this.getOpenedNodes(currentMapSnapshot);
//let lastNodeValue = currentMapSnapshot[lastNode.x][lastNode.y];

/* getNeighbors = node => {
    //node.x;
    let _res = [];

    //if(node.x)
  }; */

export function mapStringTo2DArray(mapString) {
  let _res = [];
  let _rows = mapString.split("\n");
  _rows.forEach(row => {
    _res.push(row.split(""));
  });
  return _res;
}

export function getSetsDifference(arr1, arr2) {
  return arr1.filter(function(el) {
    return !arr2.some(item => item.x === el.x && item.y === el.y);
  });
}

export function properSubset(arr1, arr2) {
  return arr1.length < arr2.length && subset(arr2, arr1);
}

function subset(arr, target) {
  return target.every(v => arr.some(item => item.x === v.x && item.y === v.y));
}

/* const getLevelXMax = level => switch(level) {
  case "1":
    return 10;
    case "1":
      return 10;
      case "1":
        return 10;
        case "1":
          return 10;
} */

export function getRandomNode(xMax, yMax) {
  var x = Math.floor(Math.random() * xMax);
  var y = Math.floor(Math.random() * yMax);
  return { x, y };
}

/* export function getRandomNode(level) {
  let maxLength = parseInt(level) * 10;
  var x = Math.floor(Math.random() * maxLength);
  var y = Math.floor(Math.random() * maxLength);
  return { x, y };
} */

export function array2DToGridString(arr, markedNodes) {
  let _tempArr = arr.slice(0);
  markedNodes.forEach(node => {
    _tempArr[node.x][node.y] = "X";
  });
  return arr.map(a => a.join("|")).join("\n");
}

// ensure deep object equal 
export function isEqual(value, other) {
  // Get the value type
  var type = Object.prototype.toString.call(value);
  // If the two objects are not the same type, return false
  if (type !== Object.prototype.toString.call(other))
    return false;
  // If items are not an object or array, return false
  if (["[object Array]", "[object Object]"].indexOf(type) < 0)
    return false;
  // Compare the length of the length of the two items
  var valueLen = type === "[object Array]" ? value.length : Object.keys(value).length;
  var otherLen = type === "[object Array]" ? other.length : Object.keys(other).length;
  if (valueLen !== otherLen)
    return false;
  // Compare two items
  var compare = function (item1, item2) {
    // Get the object type
    var itemType = Object.prototype.toString.call(item1);
    // If an object or array, compare recursively
    if (["[object Array]", "[object Object]"].indexOf(itemType) >= 0) {
      if (!isEqual(item1, item2))
        return false;
    }
    // Otherwise, do a simple comparison
    else {
      // If the two items are not the same type, return false
      if (itemType !== Object.prototype.toString.call(item2))
        return false;
      // Else if it's a function, convert to a string and compare
      // Otherwise, just compare
      if (itemType === "[object Function]") {
        if (item1.toString() !== item2.toString())
          return false;
      }
      else {
        if (item1 !== item2)
          return false;
      }
    }
  };
  // Compare properties
  if (type === "[object Array]") {
    for (var i = 0; i < valueLen; i++) {
      if (compare(value[i], other[i]) === false)
        return false;
    }
  }
  else {
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        if (compare(value[key], other[key]) === false)
          return false;
      }
    }
  }
  // If nothing failed, return true
  return true;
};