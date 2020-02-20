import WebSocketAsPromised from "websocket-as-promised";

// command key used to async requests (for simplicity, ideal solution should use some generatedId)
const ws = new WebSocketAsPromised("wss://hometask.eg1236.com/game1/", {
  packMessage: data => data,
  unpackMessage: resonseMsg => {
    let respSplit = resonseMsg && resonseMsg.split(":");
    return {
      requestId: respSplit[0],
      data: resonseMsg.substring(resonseMsg.indexOf(":") + 1).trim()
    };
  },
  attachRequestId: (data, requestId) => data,
  extractRequestId: data => data && data.requestId // the request command key come with the response {CMD}: data
});

ws.onopen = () => {
  // on connecting, do nothing but log it to the console
  console.log("connected");
};

ws.onmessage = evt => {
  // listen to data sent from the websocket server
  const message = evt.data; //JSON.parse(evt.data);
  //this.setState({ dataFromServer: message });
  //this.handleResponseMsg(message && message.trim());
};

ws.onclose = () => {
  console.log("disconnected");
  // automatically try to reconnect on connection loss
};
ws.open();

export default ws;

// websecket requests
// new L
export function startNewGame(level) {
  return ws.sendRequest(`new ${level}`, {
    requestId: "new"
  });
}

// open X Y
export function openNode(y, x) {
  return ws.sendRequest(`open ${x} ${y}`, {
    requestId: "open"
  });
}

// map
export function getMapGrid() {
  return ws.sendRequest(`map`, {
    requestId: "map"
  });
}

/* handleResponseMsg = message => {
    if (message) {
      let _tempArr = message.split(":");
      if (_tempArr.length > 1) {
        let _cmdKey = _tempArr[0].trim();
        let _cmdValue = _tempArr[1].trim();
        switch (_cmdKey) {
          case "new":
            if (_cmdValue === "OK") {
              this.setState({
                currentMapSnapshot: [],
                mapSequenceList: [],
                solutionSequence: [],
                newGameStarted: true,
                gameSolving: false
              });
              this.ws.send("map");
            } else {
              alert("Server error, try to reconnect or refresh the page");
            }
            break;
          case "open":
            if (_cmdValue === "OK") {
              debugger;
              this.ws.send("map");
            } else {
              console.log(_cmdValue);
              debugger;
              if (_cmdValue === "You lose") {
                alert("You lose, restart the game and try again..");
              }
            }
            break;
          case "map":
            if (this.state.newGameStarted) {
              var _mapArr = this.mapStringTo2DArray(_cmdValue.trim());
              if (this.state.gameSolving) {
                var _sequence = this.state.mapSequenceList.slice(0);
                _sequence.push(_mapArr);
                this.setState({
                  mapSequenceList: _sequence,
                  currentMapSnapshot: _mapArr
                });
                debugger;
                !this.solvingIteration && this.solveNext(_mapArr);
                if (this.solvingIteration) {
                  debugger;
                }
              } else {
                this.setState({
                  initialMap: _mapArr,
                  currentMapSnapshot: _mapArr
                });
              }
            } else {
              alert("Please start the game");
            }
            break;
          default:
            break;
        }
      } else {
        console.log("unknown message");
      }
    }
  }; */
