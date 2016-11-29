'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _getBoundsForNode = require('./getBoundsForNode');

var _getBoundsForNode2 = _interopRequireDefault(_getBoundsForNode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var createSelectable = function createSelectable(WrappedComponent) {
  var _class, _temp;

  var SelectableItem = (_temp = _class = function (_Component) {
    _inherits(SelectableItem, _Component);

    function SelectableItem() {
      _classCallCheck(this, SelectableItem);

      var _this = _possibleConstructorReturn(this, (SelectableItem.__proto__ || Object.getPrototypeOf(SelectableItem)).call(this));

      _this.registerSelectable = function (containerScroll) {
        _this.bounds = (0, _getBoundsForNode2.default)(_this.node, containerScroll);
        _this.context.selectable.register(_this);
      };

      _this.state = {
        selected: false,
        selecting: false
      };
      return _this;
    }

    _createClass(SelectableItem, [{
      key: 'componentDidMount',
      value: function componentDidMount() {
        this.node = _reactDom2.default.findDOMNode(this); // eslint-disable-line
        this.registerSelectable();
      }
    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        this.context.selectable.unregister(this.props.selectableKey);
      }
    }, {
      key: 'render',
      value: function render() {
        var props = _extends({}, this.props, {
          selected: this.state.selected,
          selecting: this.state.selecting
        });

        return _react2.default.createElement(WrappedComponent, props, this.props.children);
      }
    }]);

    return SelectableItem;
  }(_react.Component), _class.propTypes = {
    children: _react.PropTypes.array,
    selectableKey: _react.PropTypes.any
  }, _class.contextTypes = {
    selectable: _react2.default.PropTypes.object
  }, _temp);


  return SelectableItem;
};

exports.default = createSelectable;