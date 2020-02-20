import React, { Component } from "react";
import PropTypes from "prop-types";

import ws, { startNewGame, openNode, getMapGrid } from "../utils/ws-helper";

import {
  mapStringTo2DArray,
  array2DToGridString,
  getSetsDifference,
  properSubset,
  getRandomNode,
  isEqual
} from "../utils/helper";

// for simplicity throw SolvedException as Error
class SolvedException extends Error {
  constructor(message) {
    super(message);
    this.name = "SolvedException";
  }
}

class YouLoseException extends Error {
  constructor(message) {
    super(message);
    this.name = "YouLoseException";
  }
}

class GameView extends Component {
  state = {
    dataFromServer: null,
    level: "1",
    currentMapSnapshot: [],
    initialMap: [],
    mapSequenceList: [],
    solutionSequence: [],
    newGameStarted: false,
    gameSolving: false,
    lastNode: {}
  };

  iterationCount = 0;
  // this object set should contain the node coordinates, node recent value after markers or the number of unknown mines.
  constraintSet = [];
  markedNodes = [];
  unOpenedNodes = [];
  constraintInterset = [];
  isMarked = node =>
    this.markedNodes.some(item => item.x === node.x && item.y === node.y);

  lastIterationUnknownNeighbors = []; // used for improving choosing more lucky node
  existInUnknownNeighbors = node =>
    this.lastIterationUnknownNeighbors.some(
      item => item.x === node.x && item.y === node.y
    );

  // Note: default character for unknown => (isNaN(parseInt))
  inspectMapSnapshot = mapSnapshot => {
    const { maxXLength, maxYLength } = this.state;
    this.constraintSet = []; // clear the list before iteration throw the whole 2d array
    this.unOpenedNodes = [];
    this.lastIterationUnknownNeighbors = [];
    for (var y = 0; y < maxYLength; y++) {
      for (var x = 0; x < maxXLength; x++) {
        var nodeValue = parseInt(mapSnapshot[x][y]);
        if (!isNaN(nodeValue) && nodeValue > 0) {
          // opened
          let unknownNeighbors = [];
          // look around
          // top-left
          if (y - 1 > -1 && x - 1 > -1) {
            var _node = { x: x - 1, y: y - 1 };
            var i = parseInt(mapSnapshot[_node.x][_node.y]);
            if (isNaN(i)) {
              if (this.isMarked(_node)) {
                nodeValue--;
              } else {
                unknownNeighbors.push(_node);
                if (!this.existInUnknownNeighbors(_node)) {
                  this.lastIterationUnknownNeighbors.push(_node);
                }
              }
            }
          }
          // top
          if (y - 1 > -1) {
            var _node = { x: x, y: y - 1 };
            var _i = parseInt(mapSnapshot[_node.x][_node.y]);
            if (isNaN(_i)) {
              if (this.isMarked(_node)) {
                nodeValue--;
              } else {
                unknownNeighbors.push(_node);
                if (!this.existInUnknownNeighbors(_node)) {
                  this.lastIterationUnknownNeighbors.push(_node);
                }
              }
            }
          }
          // top-right
          if (y - 1 > -1 && x + 1 < maxXLength) {
            var _node = { x: x + 1, y: y - 1 };
            var _i = parseInt(mapSnapshot[_node.x][_node.y]);
            if (isNaN(_i)) {
              if (this.isMarked(_node)) {
                nodeValue--;
              } else {
                unknownNeighbors.push(_node);
                if (!this.existInUnknownNeighbors(_node)) {
                  this.lastIterationUnknownNeighbors.push(_node);
                }
              }
            }
          }
          // mid-left
          if (x - 1 > -1) {
            var _node = { x: x - 1, y: y };
            var _i = parseInt(mapSnapshot[_node.x][_node.y]);
            if (isNaN(_i)) {
              if (this.isMarked(_node)) {
                nodeValue--;
              } else {
                unknownNeighbors.push(_node);
                if (!this.existInUnknownNeighbors(_node)) {
                  this.lastIterationUnknownNeighbors.push(_node);
                }
              }
            }
          }
          // mid-right
          if (x + 1 < maxXLength) {
            var _node = { x: x + 1, y: y };
            var _i = parseInt(mapSnapshot[_node.x][_node.y]);
            if (isNaN(_i)) {
              if (this.isMarked(_node)) {
                nodeValue--;
              } else {
                unknownNeighbors.push(_node);
                if (!this.existInUnknownNeighbors(_node)) {
                  this.lastIterationUnknownNeighbors.push(_node);
                }
              }
            }
          }
          // lower-left
          if (y + 1 < maxYLength && x - 1 > -1) {
            var _node = { x: x - 1, y: y + 1 };
            var _i = parseInt(mapSnapshot[_node.x][_node.y]);
            if (isNaN(_i)) {
              if (this.isMarked(_node)) {
                nodeValue--;
              } else {
                unknownNeighbors.push(_node);
                if (!this.existInUnknownNeighbors(_node)) {
                  this.lastIterationUnknownNeighbors.push(_node);
                }
              }
            }
          }
          // lower
          if (y + 1 < maxYLength) {
            var _node = { x: x, y: y + 1 };
            var _i = parseInt(mapSnapshot[_node.x][_node.y]);
            if (isNaN(_i)) {
              if (this.isMarked(_node)) {
                nodeValue--;
              } else {
                unknownNeighbors.push(_node);
                if (!this.existInUnknownNeighbors(_node)) {
                  this.lastIterationUnknownNeighbors.push(_node);
                }
              }
            }
          }
          // lower-right
          if (y + 1 < maxYLength && x + 1 < maxXLength) {
            var _node = { x: x + 1, y: y + 1 };
            var _i = parseInt(mapSnapshot[_node.x][_node.y]);
            if (isNaN(_i)) {
              if (this.isMarked(_node)) {
                nodeValue--;
              } else {
                unknownNeighbors.push(_node);
                if (!this.existInUnknownNeighbors(_node)) {
                  this.lastIterationUnknownNeighbors.push(_node);
                }
              }
            }
          }
          if (unknownNeighbors.length > 0) {
            this.constraintSet.push({
              //node: { x, y },
              nodeValue,
              unknownNeighbors
            });
          }
        } else {
          // add coordinate to unopenedList
          if (isNaN(nodeValue)) this.unOpenedNodes.push({ x, y });
        }
      }
    }
    this.constraintInterset = [];
    // 2: keep using the subset rule until exhausted
    var changed = true;
    while (changed) {
      changed = false;
      const _constraintSet = this.constraintSet.slice(0);
      const me = this;
      /* for (let e1Index = 0; e1Index < this.constraintSet.length; e1Index++) {
        const element = array[e1Index];
        
      } */
      // array => [1, 2, ...n]

      // eslint-disable-next-line no-loop-func
      _constraintSet.forEach(e1 => {
        _constraintSet.forEach(e2 => {
          if (!isEqual(e1, e2)) {
            // if e1 proper subset e2, c = e2 diff e1,
            //    mines of c = mines of e2 - mines of e1
            if (properSubset(e1.unknownNeighbors, e2.unknownNeighbors)) {
              if (e1.nodeValue < e2.nodeValue) {
                var _diff = getSetsDifference(
                  e2.unknownNeighbors,
                  e1.unknownNeighbors
                );
                var newConstraint = {
                  nodeValue: e2.nodeValue - e1.nodeValue,
                  unknownNeighbors: _diff
                };
                // if item not exist
                if (
                  !me.constraintSet.some(item => isEqual(item, newConstraint))
                ) {
                  me.constraintSet.push(newConstraint);
                  this.constraintInterset.push(newConstraint);
                  changed = true;
                }
              }
            }
          }
        });
      });
    }
  };

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleLevelChange = changeEvent => {
    this.resetAll();
    this.setState({
      level: changeEvent.target.value
    });
  };

  handleSendWSMsg = () => {
    const { wsInputTxt } = this.state;
    ws.send(wsInputTxt);
  };

  handleStartNew = async () => {
    try {
      this.resetAll();
      let _res = await startNewGame(this.state.level);
      if (_res && _res.data && _res.data === "OK") {
        console.log("new game started");
        this.setState({
          newGameStarted: true
        });
        let _res = await getMapGrid();
        if (_res && _res.data) {
          var _mapArr = mapStringTo2DArray(_res.data);
          if (_mapArr.length && _mapArr[0].length) {
            this.setState({
              initialMap: _mapArr,
              currentMapSnapshot: _mapArr,
              maxXLength: _mapArr.length,
              maxYLength: _mapArr[0].length
            });
          } else {
            // something went wrong
            /// TODO throw invalid map response
          }
        }
      } else {
        alert((_res && _res.data && _res.data) || "Please restart the game");
      }
    } catch (error) {
      console.log(error);
      alert("Server error, try to reconnect or refresh the page");
    }
  };

  openedNodes = [];
  wasOpened = node =>
    this.openedNodes.some(item => item.x === node.x && item.y === node.y);

  openNodeAndGetMap = async node => {
    let _item = this.markedNodes.find(
      item => item.x === node.x && item.y === node.y
    );
    if (_item) {
      debugger;
    }
    if (this.isMarked(node)) {
      debugger;
    }
    let _res = await openNode(node.x, node.y);
    if (_res && _res.data && _res.data === "OK") {
      console.log("open succeed", node);
      this.openedNodes.push(node);
      // get brand new map snapshot
      let _res = await getMapGrid();
      if (_res && _res.data) {
        return { solved: false, map: mapStringTo2DArray(_res.data) };
      }
    } else {
      // check if it is solved
      if (_res.data === "You lose") {
        throw new YouLoseException(_res.data);
      } else {
        throw new SolvedException(_res.data);
        //return { solved: true, message: _res.data };
      }
      /* alert((_res && _res.data && _res.data) || "Please restart the game");
      throw _res && _res.data && _res.data; */
    }
  };

  handleSolveMap = async () => {
    try {
      const { maxXLength, maxYLength, mapSequenceList } = this.state;
      let newNode = getRandomNode(maxXLength, maxYLength);
      this.setState({
        gameSolving: true
      });
      var _res = await this.openNodeAndGetMap(newNode);
      if (!_res.solved) {
        var _mapArr = _res.map;
        var _sequence = mapSequenceList.slice(0);
        _sequence.push(_mapArr);
        this.setState({
          mapSequenceList: _sequence,
          solutionSequence: [newNode],
          lastNode: newNode,
          currentMapSnapshot: _mapArr
        });
        // solve the new map grid
        this.solveNext(_mapArr);
      }
    } catch (error) {
      if (error instanceof SolvedException) {
        alert(error.message);
      } else if (error instanceof YouLoseException) {
        // restart and try again
        console.log(error.message);
        console.log("restarting the game and try solving again");
        //alert(error.message);
        this.restartAndSolveAgain();
      }
    }
  };

  // attempt to eliminate mining nodes
  pickNewNodeCoordinates = () => {
    let _diffSets = getSetsDifference(this.unOpenedNodes, this.markedNodes);
    // return random from the difference set
    // to increase the performance try to eliminate also the unknown nodes, just to increase
    // the success open probability
    let _moreBetterChoices = getSetsDifference(
      _diffSets,
      this.lastIterationUnknownNeighbors
    );
    if (_moreBetterChoices.length) {
      return _moreBetterChoices[
        Math.floor(Math.random() * _moreBetterChoices.length)
      ];
    }
    return _diffSets[Math.floor(Math.random() * _diffSets.length)];
  };

  solveNext = async newMapArr => {
    try {
      const { solutionSequence, mapSequenceList } = this.state;
      let _solutionSequence = solutionSequence.slice(0);
      var _sequence = mapSequenceList.slice(0);
      var requireNewInspection = false;
      this.inspectMapSnapshot(newMapArr);

      var _probability = 1; // 100% there is mine there
      var _listToBeGuessed = [];

      for (let eIndex = 0; eIndex < this.constraintSet.length; eIndex++) {
        const e = this.constraintSet[eIndex];
        let _nodeValue = e.nodeValue;
        if (_nodeValue === 0) {
          // all set unknown neighbors are safe
          for (let index = 0; index < e.unknownNeighbors.length; index++) {
            const node = e.unknownNeighbors[index];
            if (!this.wasOpened(node)) {
              // ensure it was not opened before
              _solutionSequence.push(node);
              var _res = await this.openNodeAndGetMap(node);
              if (!_res.solved) {
                var _mapArr = _res.map;
                _sequence.push(_mapArr);
                this.setState({
                  mapSequenceList: [..._sequence],
                  currentMapSnapshot: _mapArr,
                  solutionSequence: [..._solutionSequence],
                  lastNode: node
                });
              }
            }
          }
          requireNewInspection = true;
        } else if (_nodeValue === e.unknownNeighbors.length) {
          // if the no. of mines is same as no. of squares, all the
          // squares are mines
          //let _mapSnapshotWithMarkers = _mapArr.slice(0);
          // eslint-disable-next-line no-loop-func
          e.unknownNeighbors.forEach(node => {
            // if item not already exist
            if (!this.markedNodes.some(item => isEqual(item, node))) {
              this.markedNodes.push(node);
            }
            //_mapSnapshotWithMarkers[node.y][node.x] = "X";
          });
          requireNewInspection = true;

          /* this.setState({
            currentMapSnapshot: _mapSnapshotWithMarkers,
          }); */
        } else {
          // get the unknown and non-marked items
          //e.unknownNeighbors
          let _tempValidUnknown = [];
          for (
            let _pCheckIndex = 0;
            _pCheckIndex < e.unknownNeighbors.length;
            _pCheckIndex++
          ) {
            const _element = e.unknownNeighbors[_pCheckIndex];
            if (!this.markedNodes.some(item => isEqual(item, _element))) {
              _tempValidUnknown.push(_element);
            }
          }
          var _minePropability = _nodeValue / _tempValidUnknown.length;
          if (_minePropability < _probability) {
            _probability = _minePropability;
            _listToBeGuessed = _tempValidUnknown;
          }
          // to ensure it is more than or equal 50%
          /* if(_diffValue >= (_nodeValue * 2))
          if(_diffValue > _highestConstraintValue)
          {
            //_h
          } */
        }
      }
      //requireNewInspection = true;
      // try inspect again
      if (requireNewInspection) {
        // get current map then call this.solveNext(_mapArr);
        let _res = await getMapGrid();
        if (_res && _res.data) {
          var _map = mapStringTo2DArray(_res.data);
          this.solveNext(_map);
        } else {
          // unexpected error
        }
      } else {
        // get the best constraint neighbors (the constraint with the bigger difference)
        // for example if nodeValue / neighbor.length is more less means more better to be used for guessing
        /* _probability
        _listToBeGuessed */
        var _probabilityInterset = 1; // 100% there is mine there
        var _listToBeGuessedInterset = [];
        for (
          let intersetIndex = 0;
          intersetIndex < this.constraintInterset.length;
          intersetIndex++
        ) {
          const cInterset = this.constraintInterset[intersetIndex];
          let _tempValidUnknown = [];
          for (
            let _pCheckIndex = 0;
            _pCheckIndex < cInterset.unknownNeighbors.length;
            _pCheckIndex++
          ) {
            const _element = cInterset.unknownNeighbors[_pCheckIndex];
            if (!this.markedNodes.some(item => isEqual(item, _element))) {
              _tempValidUnknown.push(_element);
            }
          }
          var _minePropabilityInterset =
            cInterset.nodeValue / _tempValidUnknown.length;
          if (_minePropabilityInterset < _probabilityInterset) {
            _probabilityInterset = _minePropabilityInterset;
            _listToBeGuessedInterset = _tempValidUnknown;
          }
        }
        if (_probabilityInterset <= 0.5 && _listToBeGuessedInterset.length) {
          // guess from those neighbors and try to solve again
          const _nodeGuessed =
          _listToBeGuessedInterset[
              Math.floor(Math.random() * _listToBeGuessedInterset.length)
            ];
          console.log("guessed node", _nodeGuessed);
          _solutionSequence.push(_nodeGuessed);
          _res = await this.openNodeAndGetMap(_nodeGuessed);
          if (!_res.solved) {
            _mapArr = _res.map;
            _sequence.push(_mapArr);
            this.setState({
              mapSequenceList: [..._sequence],
              currentMapSnapshot: _mapArr,
              solutionSequence: [..._solutionSequence],
              lastNode: _nodeGuessed
            });
            // recersive function should be breaked if error or solved exception
            this.solveNext(_mapArr);
          }
        } else if (_probability < 0.5 && _listToBeGuessed.length) {
          // guess from those neighbors and try to solve again
          const _nodeGuessed =
            _listToBeGuessed[
              Math.floor(Math.random() * _listToBeGuessed.length)
            ];
          console.log("guessed node", _nodeGuessed);
          _solutionSequence.push(_nodeGuessed);
          _res = await this.openNodeAndGetMap(_nodeGuessed);
          if (!_res.solved) {
            _mapArr = _res.map;
            _sequence.push(_mapArr);
            this.setState({
              mapSequenceList: [..._sequence],
              currentMapSnapshot: _mapArr,
              solutionSequence: [..._solutionSequence],
              lastNode: _nodeGuessed
            });
            // recersive function should be breaked if error or solved exception
            this.solveNext(_mapArr);
          }
        } else {
          // stuck try to get new random for non-opened node
          let newNode = this.pickNewNodeCoordinates();
          /* while (this.wasOpened(newNode)) {
            // ensure it was not opened before
            newNode = this.pickNewNodeCoordinates();
          } */
          console.log(newNode);
          _solutionSequence.push(newNode);
          _res = await this.openNodeAndGetMap(newNode);
          if (!_res.solved) {
            _mapArr = _res.map;
            _sequence.push(_mapArr);
            this.setState({
              mapSequenceList: [..._sequence],
              currentMapSnapshot: _mapArr,
              solutionSequence: [..._solutionSequence],
              lastNode: newNode
            });
            // recersive function should be breaked if error or solved exception
            this.solveNext(_mapArr);
          }
        }
      }
    } catch (error) {
      if (error instanceof SolvedException) {
        alert(error.message);
      } else if (error instanceof YouLoseException) {
        // restart and try again
        console.log(error.message);
        console.log("restarting the game and try solving again");
        //alert(error.message);
        this.restartAndSolveAgain();
      }
    }
  };

  resetAll = () => {
    // reset all initial values
    this.markedNodes = [];
    this.constraintSet = [];
    this.markedNodes = [];
    this.unOpenedNodes = [];
    this.openedNodes = [];
    this.lastIterationUnknownNeighbors = [];

    this.setState({
      dataFromServer: null,
      currentMapSnapshot: [],
      initialMap: [],
      mapSequenceList: [],
      solutionSequence: [],
      newGameStarted: false,
      gameSolving: false,
      lastNode: {}
    });
  };

  restartAndSolveAgain = async () => {
    try {
      this.resetAll();
      let _res = await startNewGame(this.state.level);
      if (_res && _res.data && _res.data === "OK") {
        console.log("new game started");
        this.setState({
          newGameStarted: true
        });
        let _res = await getMapGrid();
        if (_res && _res.data) {
          var _mapArr = mapStringTo2DArray(_res.data);
          this.setState({
            initialMap: _mapArr,
            currentMapSnapshot: _mapArr
          });
          this.handleSolveMap();
        }
      } else {
        alert((_res && _res.data && _res.data) || "Please restart the game");
      }
    } catch (error) {
      console.log(error);
      alert("Server error, try to reconnect or refresh the page");
    }
  };

  getStyleForLevel = level => {
    switch (level) {
      case "1":
        return { fontSize: "2em" };
      case "2":
        return { fontSize: "1.5em" };
      case "3":
        return { fontSize: "1em" };
      case "4":
        return { fontSize: "0.5em" };
      default:
        return {};
    }
  };

  render() {
    const { level, initialMap, currentMapSnapshot } = this.state;
    return (
      <div>
        <div>
          <label>
            <input
              type="radio"
              value="1"
              checked={level === "1"}
              onChange={this.handleLevelChange}
            />
            Level 1
          </label>
          <label>
            <input
              type="radio"
              value="2"
              checked={level === "2"}
              onChange={this.handleLevelChange}
            />
            Level 2
          </label>
          <label>
            <input
              type="radio"
              value="3"
              checked={level === "3"}
              onChange={this.handleLevelChange}
            />
            Level 3
          </label>
          <label>
            <input
              type="radio"
              value="4"
              checked={level === "4"}
              onChange={this.handleLevelChange}
            />
            Level 4
          </label>
        </div>
        <br />
        <div>
          <button type="button" onClick={this.handleStartNew}>
            Start
          </button>
        </div>
        <br />
        <br />
        <div className="solution-sequence">
          {initialMap && initialMap.length > 0 && (
            <div>
              {/* <h3>
                <strong>Initial Map:</strong>
              </h3>
              <div>
                <pre style={this.getStyleForLevel(level)}>
                  {array2DToGridString(initialMap)}
                </pre>
              </div> */}
              <button type="button" onClick={this.handleSolveMap}>
                Solve
              </button>
            </div>
          )}
          <br />
          <br />
          {currentMapSnapshot && currentMapSnapshot.length > 0 && (
            <div>
              <h3>
                <strong>Current snapshot:</strong>
              </h3>
              <div>
                <pre style={this.getStyleForLevel(level)}>
                  {array2DToGridString(currentMapSnapshot, this.markedNodes)}
                </pre>
              </div>
            </div>
          )}
          {/* {this.state.mapSequenceList && this.state.mapSequenceList.length > 0 && (
            <div>
              <div>
                <strong>Solution Sequence:</strong>
              </div>
              <div>
                {this.state.mapSequenceList.map((mapSnapshot, i) => (
                  <div key={i}>
                    <pre style={{ fontSize: "1.5em" }}>
                      {array2DToGridString(mapSnapshot)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>
        <br />
        <br />
        <p>
          Please choose the level then press New then Solve buttons to get the
          password for each level
        </p>
        {/* <div>
          <input
            type="text"
            name="wsInputTxt"
            value={this.state.wsInputTxt}
            onChange={this.handleChange}
          />

          <button type="button" onClick={this.handleSendWSMsg}>
            Send
          </button>
        </div> */}
        {/* <DisplayMessageState {...this.state} /> */}
      </div>
    );
  }
}

const DisplayMessageState = props => (
  <div style={{ margin: "1rem 0", background: "#f6f8fa", padding: ".5rem" }}>
    <div>
      <code>states:</code> {/* <pre>{props.dataFromServer}</pre> */}
      <pre>{JSON.stringify(props, null, 2)}</pre>
      <code>Response Row:</code> <pre>{props.dataFromServer}</pre>
      {/* {JSON.stringify(props.dataFromServer, null, 2)} */}
    </div>
  </div>
);

const DisplayMap = props => (
  <div style={{ margin: "1rem 0", background: "#f6f8fa", padding: ".5rem" }}>
    <div>
      <code>dataFromServer:</code> <pre>{props.dataFromServer}</pre>
      {/* {JSON.stringify(props.dataFromServer, null, 2)} */}
    </div>
  </div>
);

GameView.propTypes = {};

export default GameView;
