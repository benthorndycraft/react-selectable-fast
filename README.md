# React-selectable-single ![npm](https://img.shields.io/npm/v/react-selectable-single.svg) ![license](https://img.shields.io/npm/l/react-selectable-single.svg) ![github-issues](https://img.shields.io/github/issues/benthorndycraft/react-selectable-single.svg)

Enable a React component (or group of components) to be selectable via mouse/touch.

## Demo

http://benthorndycraft.github.io/react-selectable-single

## Install

```sh
npm i -S react-selectable-single
```

[![react-selectable-single](https://nodei.co/npm/react-selectable-single.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/react-selectable-single/)

## Based on react-selectable-fast & react-selectable
This project is an extended version of [react-selectable-fast](https://github.com/valerybugakov/react-selectable-fast) by [valerybugakov](https://github.com/valerybugakov)
This project was based on [react-selectable](https://github.com/unclecheese/react-selectable) by [unclecheese](https://github.com/unclecheese).
Main idea of this fork is to eliminate render during selection caused by state updates of SelectableGroup. Only items under selectbox rerender themself, which great for big lists of selectable items. Also this package extends the original functionality with ability to scroll items while selecting relative to window and specified scroll container.

## Usage

Package exports 4 entities `{ SelectableGroup, createSelectable, SelectAll, DeselectAll }`.
To make other components selectable wrap them using HoF `createSelectable` and put a list of them under `SelectableGroup`.

```js
import React, { Component } from 'react'
import { SelectableGroup } from 'react-selectable-single'

class App extends Component {
  ...

  render() {
    return (
      <SelectableGroup
        className="main"
        clickClassName="tick"
        enableDeselect
        tolerance={this.state.tolerance}
        globalMouse={this.state.isGlobal}
        allowClickWithoutSelected={false}
        duringSelection={this.handleSelecting}
        onSelectionClear={this.handleSelectionClear}
        onSelectionFinish={this.handleSelectionFinish}
        ignoreList={['.not-selectable', '.item:nth-child(10)', '.item:nth-child(27)']}
      >
        <List items={this.props.items} />
      </SelectableGroup>
    )
  }
}
```

```js
import React from 'react'
import { createSelectable } from 'react-selectable-single'

const SomeComponent = () => (
  <div>...</div>
)

export default createSelectable(SomeComponent)
```

```js
import React from 'react'
import { SelectAll, DeselectAll } from 'react-selectable-single'
import SelectableComponent from './SomeComponent'

const List = () => (
  <div>
    <SelectAll className="selectable-button">
      <button>Select all</button>
    </SelectAll>
    <DeselectAll className="selectable-button">
      <button>Clear selection</button>
    </DeselectAll>
    {this.props.items.map((item, i) => (
      <SelectableComponent
        key={i}
        title={item.title}
        year={item.year}
      />
    ))}
  </div>
)
```
## Configuration

The `<SelectableGroup />` component accepts a few optional props:
* `duringSelection` (Function) Callback fired rapidly during selection (while the selector is being dragged). Passes an array containing selectable items currently under the selector to the callback function.
* `onSelectionFinish` (Function) Callback.
* `onSelectionClear` (Function) Callback.
* `enableDeselect` (Boolean) Enables deselect with selectbox.
* `mixedDeselect` (Boolean) When enabled items can be selected and deselected with selectbox at the same time, `enableDeselect` should be set to `true`.
* `scrollContainer` (String) Selector of scroll container which will be used to calculate selectbox position. If not specified SelectableGroup element will be used as scroll container.
* `ignoreList` (Array) Array of ignored selectors.
* `clickableClassName` (String) On element with specified selector click item cotaining this element will be selected.
* `tolerance` (Number) The amount of buffer to add around your `<SelectableGroup />` container, in pixels.
* `className` (String) Class of selectable group element.
* `selectionModeClass` (String) Class indicating that there are more than 1 selected item. Defaults to 'in-selection-mode'.
* `component` (String) The component to render. Defaults to `div`.
* `allowClickWithoutSelected` (Boolean) When disabled items can be selected by click only if there are more than 1 already selected item.
* `fixedPosition` (Boolean) Whether the `<SelectableGroup />` container is a fixed/absolute position element or the grandchild of one.
