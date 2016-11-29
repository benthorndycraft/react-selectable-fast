import React, { Component } from 'react'
import { SelectableGroup } from '../src'
import List from './List'

class App extends Component {
  state = {
    selectedItems: [],
    selectingItems: [],
    tolerance: 0,
  }

  handleSelecting = selectingItems => {
    this.setState({ selectingItems })
  }

  handleSelectionFinish = selectedItems => {
    this.setState({
      selectedItems,
      selectingItems: [],
    })
    console.log(`Finished selection ${selectedItems.length}`)
  }

  handleSelectionClear() {
    console.log('Cancel selection')
  }

  render() {
    const { selectedItems, selectingItems, tolerance, isGlobal } = this.state

    return (
      <div>
        <p>
          Selecting: <span className="counter">{selectingItems.length}</span>
          <br />
          Selected: <span className="counter">{selectedItems.length}</span>
        </p>
        <SelectableGroup
          className="main"
          clickClassName="tick"
          enableDeselect
          tolerance={tolerance}
          globalMouse={isGlobal}
          allowClickWithoutSelected={true}
          duringSelection={this.handleSelecting}
          onSelectionClear={this.handleSelectionClear}
          onSelectionFinish={this.handleSelectionFinish}
          ignoreList={['.not-selectable', '.item:nth-child(10)', '.item:nth-child(27)']}
		  singleItemSelection={true}
		  dragSelect={false}
        >
          <List items={this.props.items} />
        </SelectableGroup>
      </div>
    )
  }
}

export default App
