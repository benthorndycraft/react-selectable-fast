import 'babel-polyfill'
import React, {Component, PropTypes} from 'react'
import isNodeInRoot from './nodeInRoot'
import getBoundsForNode from './getBoundsForNode'
import doObjectsCollide from './doObjectsCollide'
import Selectbox from './Selectbox'

const noop = () => {
}

class SelectableGroup extends Component {
	static propTypes = {
		scale: PropTypes.number,
		globalMouse: PropTypes.bool,
		ignoreList: PropTypes.array,
		scrollSpeed: PropTypes.number,
		minimumSpeedFactor: PropTypes.number,
		allowClickWithoutSelected: PropTypes.bool,
		style: PropTypes.object,
		selectionModeClass: PropTypes.string,
		onSelectionClear: PropTypes.func,
		enableDeselect: PropTypes.bool,
		mixedDeselect: PropTypes.bool,

		/**
		 * Scroll container selector
		 */
		scrollContainer: PropTypes.string,

		/**
		 * Event that will fire rapidly during selection (while the selector is
		 * being dragged). Passes an array of keys.
		 */
		duringSelection: PropTypes.func,

		/**
		 * Event that will fire when items are selected. Passes an array of keys.
		 */
		onSelectionFinish: PropTypes.func,

		/**
		 * The component that will represent the Selectable DOM node
		 */
		component: PropTypes.node,

		/**
		 * Amount of forgiveness an item will offer to the selectbox before registering
		 * a selection, i.e. if only 1px of the item is in the selection, it shouldn't be
		 * included.
		 */
		tolerance: PropTypes.number,

		/**
		 * In some cases, it the bounding box may need fixed positioning, if your layout
		 * is relying on fixed positioned elements, for instance.
		 * @type boolean
		 */
		fixedPosition: PropTypes.bool,

		//bt disable multiselect of items
		singleItemSelection: PropTypes.bool,

	}

	static defaultProps = {
		component: 'div',
		tolerance: 0,
		globalMouse: false,
		ignoreList: [],
		scale: 1,
		scrollSpeed: 0.25,
		minimumSpeedFactor: 60,
		duringSelection: noop,
		onSelectionFinish: noop,
		onSelectionClear: noop,
		allowClickWithoutSelected: true,
		selectionModeClass: 'in-selection-mode',

		//bt disable multiselect of items
		singleItemSelection: true,

	}

	static childContextTypes = {
		selectable: React.PropTypes.object,
	}

	constructor(props) {
		super(props)
		this.state = {selectionMode: false}

		this.mouseDownStarted = false
		this.mouseMoveStarted = false
		this.mouseUpStarted = false
		this.mouseDownData = null

		this.registry = new Set()
		this.selectedItems = new Set()
		this.selectingItems = new Set()
		this.ignoreCheckCache = new Map()
		this.ignoreList = this.props.ignoreList.concat([
			'.selectable-select-all',
			'.selectable-deselect-all',
		])
	}

	getChildContext() {
		return {
			selectable: {
				register: this.registerSelectable,
				unregister: this.unregisterSelectable,
				selectAll: this.selectAll,
				clearSelection: this.clearSelection,
				getScrolledContainer: () => this.scrollContainer,
			},
		}
	}

	componentDidMount() {
		this.resizeInProgress = false
		this.rootNode = this.selectableGroup
		this.scrollContainer = document.querySelector(this.props.scrollContainer) || this.rootNode
		this.initialRootBounds = this.rootNode.getBoundingClientRect()
		this.rootNode.addEventListener('mousedown', this.mouseDown)
		this.rootNode.addEventListener('touchstart', this.mouseDown)
		document.addEventListener('keydown', this.keyListener)
		document.addEventListener('keyup', this.keyListener)
		this.isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
	}

	componentWillUnmount() {
		this.rootNode.removeEventListener('mousedown', this.mouseDown)
		this.rootNode.removeEventListener('touchstart', this.mouseDown)
		document.removeEventListener('keydown', this.keyListener)
		document.removeEventListener('keyup', this.keyListener)
	}

	applyScale = (top, left) => ({
		scaledTop: top / this.props.scale,
		scaledLeft: left / this.props.scale,
	})

	setScollTop = e => {
		const scrollTop = this.scrollContainer.scrollTop
		this.checkScrollUp(e, scrollTop)
		this.checkScrollDown(e, scrollTop)
	}

	checkScrollUp = (e, currentTop) => {
		const {minimumSpeedFactor, scrollSpeed} = this.props
		const offset = this.scrollBounds.top - e.clientY

		if (offset > 0 || e.clientY < 0) {
			const newTop = currentTop - ((Math.max(offset, minimumSpeedFactor)) * scrollSpeed)
			this.scrollContainer.scrollTop = newTop
		}
	}

	checkScrollDown = (e, currentTop) => {
		const {minimumSpeedFactor, scrollSpeed} = this.props
		const offset = e.clientY - this.scrollBounds.bottom

		if (offset > 0 || e.clientY > window.innerHeight) {
			const newTop = currentTop + ((Math.max(offset, minimumSpeedFactor)) * scrollSpeed)
			this.scrollContainer.scrollTop = Math.min(newTop, this.maxScroll)
		}
	}

	updateRootBounds() {
		if (this.scrollBounds) {
			this.oldScrollBounds = this.scrollBounds
		}
		this.scrollBounds = this.scrollContainer.getBoundingClientRect()
		this.maxScroll = this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight
	}

	updateRegistry = () => {
		const containerScroll = {
			scrollTop: this.scrollContainer.scrollTop,
			scrollLeft: this.scrollContainer.scrollLeft,
		}

		for (const selectableItem of this.registry.values()) {
			selectableItem.registerSelectable(containerScroll)
		}
	}

	registerSelectable = selectableItem => {
		this.registry.add(selectableItem)
	}

	unregisterSelectable = selectableItem => {
		this.registry.delete(selectableItem)
	}

	toggleSelectionMode() {
		const {selectedItems, state: {selectionMode}} = this

		if (selectedItems.size && !selectionMode) {
			this.setState({selectionMode: true})
		}
		if (!selectedItems.size && selectionMode) {
			this.setState({selectionMode: false})
		}
	}

	applyContainerScroll = (value, scroll) => value + (scroll / this.props.scale)

	openSelectbox = event => {
		const e = this.desktopEventCoords(event)
		this.setScollTop(e)

		if (this.mouseMoveStarted) return
		this.mouseMoveStarted = true

		const scrollTop = this.scrollContainer.scrollTop
		const {scaledTop, scaledLeft} = this.applyScale(e.pageY, e.pageX)

		const windowTopScroll = this.isChrome ? window.scrollY : document.documentElement.scrollTop
		const windowLeftScroll = this.isChrome ? window.scrollX : document.documentElement.scrollLeft

		const top = this.applyContainerScroll(
			scaledTop - this.scrollBounds.top,
			scrollTop - windowTopScroll,
		)

		let boxTop = this.applyContainerScroll(
			this.mouseDownData.boxTop - this.scrollBounds.top,
			this.mouseDownData.scrollTop - windowTopScroll,
		)

		const boxHeight = boxTop - top
		boxTop = Math.min(boxTop - boxHeight, boxTop)

		const bowWidth = this.mouseDownData.boxLeft - scaledLeft
		const leftContainerRelative = this.mouseDownData.boxLeft - this.scrollBounds.left

		const boxLeft = this.applyContainerScroll(
			Math.min(
				leftContainerRelative - (bowWidth / this.props.scale),
				leftContainerRelative / this.props.scale,
			),
			-windowLeftScroll
		)

		this.updateSelecting()

		this.selectbox.setState({
			isBoxSelecting: true,
			boxWidth: Math.abs(bowWidth),
			boxHeight: Math.abs(boxHeight),
			boxLeft,
			boxTop,
		}, () => {
			this.mouseMoveStarted = false
		})

		this.props.duringSelection([...this.selectingItems])
	}

	updateSelecting = () => {
		const selectbox = this.selectbox.getRef()
		if (!selectbox) return

		const selectboxBounds = getBoundsForNode(selectbox)
		this.selectItems(selectboxBounds)
	}

	selectItems = (selectboxBounds, {click} = {}) => {
		//debugger;
		const {tolerance, enableDeselect, mixedDeselect} = this.props
		selectboxBounds.top += this.scrollContainer.scrollTop
		selectboxBounds.left += this.scrollContainer.scrollLeft

		for (const item of this.registry.values()) {
			this.processItem(
				item,
				tolerance,
				selectboxBounds,
				click,
				enableDeselect,
				mixedDeselect,
			)
		}
	}

	processItem(item, tolerance, selectboxBounds, click, enableDeselect, mixedDeselect) {
		if (this.inIgnoreList(item.node)) {
			return null
		}
		const isCollided = doObjectsCollide(selectboxBounds, item.bounds, tolerance)
		const {selecting, selected} = item.state

		//bt define singleItemSelection from props
		const singleItemSelection = this.props.singleItemSelection;

		if (click && isCollided) {
			if (selected) {
				this.selectedItems.delete(item)
			} else {
				//bt remove other items
				if (singleItemSelection && this.selectedItems.size > 0 ) {
					for (const i of this.selectedItems.values()) {
						i.setState({selected: false})
						this.selectedItems.delete(i)
					}
				}

				this.selectedItems.add(item)
			}
			item.setState({selected: !selected})
			return this.clickedItem = item
		}

		if (!click && isCollided) {
			debugger;
			if (selected && enableDeselect && (!this.selectionStarted || mixedDeselect)) {
				item.setState({selected: false})
				item.deselected = true
				this.deselectionStarted = true
				return this.selectedItems.delete(item)
			}

			const canSelect = mixedDeselect ? !item.deselected : !this.deselectionStarted
			if (!selecting && !selected && canSelect) {
				item.setState({selecting: true})
				this.selectionStarted = true
				return this.selectingItems.add(item)
			}
		}

		if (!click && !isCollided && selecting) {
			debugger;
			if (this.selectingItems.has(item)) {
				item.setState({selecting: false})
				return this.selectingItems.delete(item)
			}
		}

		return null
	}

	clearSelection = () => {
		debugger;
		for (const item of this.selectedItems.values()) {
			item.setState({selected: false})
			this.selectedItems.delete(item)
		}
		this.setState({selectionMode: false})
		this.props.onSelectionFinish([...this.selectedItems])
		this.props.onSelectionClear()
	}

	selectAll = () => {
		this.updateWhiteListNodes()
		for (const item of this.registry.values()) {
			if (!this.inIgnoreList(item.node) && !item.state.selected) {
				item.setState({selected: true})
				this.selectedItems.add(item)
			}
		}
		this.setState({selectionMode: true})
		this.props.onSelectionFinish([...this.selectedItems])
	}

	inIgnoreList(target) {
		if (this.ignoreCheckCache.get(target) !== undefined) {
			return this.ignoreCheckCache.get(target)
		}

		const shouldBeIgnored = this.ignoreListNodes.some(node => (
			target === node || node.contains(target)
		))
		this.ignoreCheckCache.set(target, shouldBeIgnored)
		return shouldBeIgnored
	}

	updateWhiteListNodes() {
		this.ignoreListNodes = [...document.querySelectorAll(this.ignoreList.join(', '))]
	}

	mouseDown = e => {
		if (this.mouseDownStarted) return
		this.mouseDownStarted = true
		this.mouseUpStarted = false
		e = this.desktopEventCoords(e)

		this.updateWhiteListNodes()
		if (this.inIgnoreList(e.target)) {
			this.mouseDownStarted = false
			return
		}

		const node = this.selectableGroup
		if (!this.props.globalMouse && !isNodeInRoot(e.target, node)) {
			const offsetData = getBoundsForNode(node)
			const collides = doObjectsCollide(
				{
					top: offsetData.top,
					left: offsetData.left,
					bottom: offsetData.offsetHeight,
					right: offsetData.offsetWidth,
				},
				{
					top: e.pageY,
					left: e.pageX,
					offsetWidth: 0,
					offsetHeight: 0,
				}
			)
			if (!collides) return
		}

		this.updateRootBounds()
		this.updateRegistry()

		const {scaledTop, scaledLeft} = this.applyScale(e.pageY, e.pageX)
		this.mouseDownData = {
			boxLeft: scaledLeft,
			boxTop: scaledTop,
			scrollTop: this.scrollContainer.scrollTop,
			scrollLeft: this.scrollContainer.scrollLeft,
			target: e.target,
		}

		e.preventDefault()


		document.addEventListener('mousemove', this.openSelectbox)
		document.addEventListener('touchmove', this.openSelectbox)
		document.addEventListener('mouseup', this.mouseUp)
		document.addEventListener('touchend', this.mouseUp)
	}

	preventEvent(target, type) {
		const preventHandler = e => {
			target.removeEventListener(type, preventHandler, true)
			e.preventDefault()
			e.stopPropagation()
		}
		target.addEventListener(type, preventHandler, true)
	}

	mouseUp = event => {
		if (this.mouseUpStarted) return

		this.mouseUpStarted = true
		this.mouseDownStarted = false

		document.removeEventListener('mousemove', this.openSelectbox)
		document.removeEventListener('touchmove', this.openSelectbox)
		document.removeEventListener('mouseup', this.mouseUp)
		document.removeEventListener('touchend', this.mouseUp)

		if (!this.mouseDownData) return

		const e = this.desktopEventCoords(event)

		const {scaledTop, scaledLeft} = this.applyScale(e.pageY, e.pageX)
		const {boxTop, boxLeft} = this.mouseDownData
		const isClick = (scaledLeft === boxLeft && scaledTop === boxTop)

		if (isClick && isNodeInRoot(e.target, this.rootNode)) {
			this.handleClick(e, scaledTop, scaledLeft)
		} else {
			for (const item of this.selectingItems.values()) {
				item.setState({selected: true, selecting: false})
			}
			this.selectedItems = new Set([...this.selectedItems, ...this.selectingItems])
			this.selectingItems.clear()

			if (e.which === 1 && this.mouseDownData.target === e.target) {
				this.preventEvent(e.target, 'click')
			}

			this.selectbox.setState({
				isBoxSelecting: false,
				boxWidth: 0,
				boxHeight: 0,
			})
			this.props.onSelectionFinish([...this.selectedItems])
		}

		this.toggleSelectionMode()
		this.cleanUp()
	}

	handleClick(e, top, left) {
		const isMouseUpOnClickElement =
			[...(e.target.classList || [])].indexOf(this.props.clickClassName) > -1

		if (
			this.props.allowClickWithoutSelected ||
			this.selectedItems.size ||
			isMouseUpOnClickElement ||
			this.ctrlPressed
		) {
			this.selectItems({top, left, offsetWidth: 0, offsetHeight: 0}, {click: true})
			this.props.onSelectionFinish([...this.selectedItems], this.clickedItem)

			if (e.which === 1) {
				this.preventEvent(e.target, 'click')
			}
			if (e.which === 2 || e.which === 3) {
				this.preventEvent(e.target, 'contextmenu')
			}
		}
	}

	keyListener = e => {
		this.ctrlPressed = e.ctrlKey || e.metaKey

		if (this.ctrlPressed) {
			return
		}

		if (e.keyCode === 27) {
			this.clearSelection()
		}
	}

	cleanUp() {
		this.deselectionStarted = false
		this.selectionStarted = false
		if (this.props.mixedDeselect) {
			for (const item of this.registry.values()) {
				item.deselected = false
			}
		}
	}

	/**
	 * Used to return event object with desktop (non-touch) format of event
	 * coordinates, regardless of whether the action is from mobile or desktop.
	 */
	desktopEventCoords(e) {
		if (e.pageX === undefined || e.pageY === undefined) { // Touch-device
			if (
				e.targetTouches[0] !== undefined &&
				e.targetTouches[0].pageX !== undefined
			) { // For touchmove
				e.pageX = e.targetTouches[0].pageX
				e.pageY = e.targetTouches[0].pageY
			} else if (
				e.changedTouches[0] !== undefined &&
				e.changedTouches[0].pageX !== undefined
			) { // For touchstart
				e.pageX = e.changedTouches[0].pageX
				e.pageY = e.changedTouches[0].pageY
			}
		}
		return e
	}

	getGroupRef = c => this.selectableGroup = c
	getSelectboxRef = c => this.selectbox = c

	render() {
		return (
			<this.props.component
				ref={this.getGroupRef}
				style={this.props.style}
				className={
					`${this.props.className} ${this.state.selectionMode ? this.props.selectionModeClass : ''}`
				}
			>
				<Selectbox
					ref={this.getSelectboxRef}
					fixedPosition={this.props.fixedPosition}
				/>
				{this.props.children}
			</this.props.component>
		)
	}
}

export default SelectableGroup
