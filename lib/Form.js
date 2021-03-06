'use strict';

var babelHelpers = require('./util/babelHelpers.js');

var React = require('react'),
    invariant = require('scoped-invariant')('formal-yup'),
    reach = require('yup/lib/util/reach'),
    expr = require('property-expr'),
    updateIn = require('react/lib/update'),
    Validator = require('react-input-message/lib/Validator'),
    Container = require('react-input-message/lib/MessageContainer'),
    uncontrollable = require('uncontrollable'),
    getChildren = require('./util/parentContext'),
    toUpdateSpec = require('./util/pathToUpdateSpec');

var done = function done(e) {
  return setTimeout(function () {
    throw e;
  });
};

var parent = function parent(path) {
  return expr.join(expr.split(path).slice(0, -1));
};

/**
 * Form component renders a `value` to be updated and validated by child Fields. 
 * Forms can be thought of as `<input/>`s for complex values, or models. A Form aggregates 
 * a bunch of smaller inputs, each in charge of updating a small part of the overall model.
 * The Form will integrate and validate each change and fire a single unified `onChange` with the new `value`.
 *
 * Validation messages can be displayed anywhere inside a Form with Message Components. 
 * 
 * ```editable
 * var defaultStr = yup.string().default('')
 *   , modelSchema = yup.object({
 *       name: yup.object({
 *         first: defaultStr.required('please enter a first name'),
 *         last:  defaultStr.required('please enter a surname'),
 *       }),
 *    
 *       dateOfBirth: yup.date()
 *         .max(new Date(), "You can't be born in the future!"),
 *      
 *       colorId: yup.number().nullable()
 *         .required('Please select a color')
 *     });
 *
 * var form = (
 *   <Form 
 *     schema={modelSchema}
 *     defaultValue={modelSchema.default()}
 *   >
 *     <div> {\/\*'grandchildren' are no problem \*\/}
 *       <label>Name</label>
 *
 *       <Form.Field name='name.first' placeholder='First name'/>
 *       <Form.Field name='name.last' placeholder='Surname'/>
 *     
 *       <Form.Message for={['name.first', 'name.last']}/>
 *     </div>
 *
 *     <label>Date of Birth</label>
 *     <Form.Field name='dateOfBirth'/>
 *     <Form.Message for='dateOfBirth'/>
 *
 *     <label>Favorite Color</label>
 *     <Form.Field name='colorId' type='select'>
 *       <option value={null}>Select a color...</option>
 *       <option value={0}>Red</option>
 *       <option value={1}>Yellow</option>
 *       <option value={2}>Blue</option>
 *       <option value={3}>other</option>
 *     </Form.Field>
 *     <Form.Message for='colorId'/>
 *   
 *   <Form.Button type='submit'>Submit</Form.Button>
 * </Form>)
 * React.render(form, mountNode);
 * ```
 */

var Form = (function (_React$Component) {
  function Form(props, context) {
    babelHelpers.classCallCheck(this, Form);

    _React$Component.call(this, props, context);

    this.validator = new Validator(function (path, props) {
      var model = props.value,
          schema = reach(props.schema, path),
          value = props.getter(path, model),
          context = schema._conditions.length ? props.getter(parent(path), model) || {} : undefined; // an optimization may save a .toJS() call

      return schema.validate(value, { strict: props.strict, context: context }).then(function () {
        return void 0;
      })['catch'](function (err) {
        return err.errors;
      });
    });

    syncErrors(this.validator, props.errors || {});

    this.state = {
      children: getChildren(this.props.children, this.getChildContext())
    };
  }

  babelHelpers.inherits(Form, _React$Component);

  Form.prototype.componentWillUnmount = function componentWillUnmount() {
    var timers = this._timers || {};

    this._unmounted = true;
    for (var k in timers) if (has(timers, k)) clearTimeout(timers[k]);
  };

  Form.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
    syncErrors(this.validator, nextProps.errors || {});
    this._flushValidations(nextProps);

    this.setState({
      children: getChildren(nextProps.children, this.getChildContext())
    });
  };

  Form.prototype.getChildContext = function getChildContext() {
    var _this2 = this;

    return this._context || (this._context = {

      noValidate: function noValidate() {
        return _this2.props.noValidate;
      },

      schema: function schema(path) {
        return path && reach(_this2.props.schema, path);
      },

      value: function value(path) {
        return _this2.props.getter(path, _this2.props.value);
      },

      onChange: function onChange(path, updates, val) {
        return _this2._update(path, val, updates);
      }
    });
  };

  Form.prototype._update = function _update(path, widgetValue, mapValue) {
    var model = this.props.value,
        updater = this.props.setter;

    if (process.env.NODE_ENV !== 'production') updater = wrapSetter(updater);

    if (typeof mapValue === 'function') model = updater(path, model, mapValue(widgetValue));else if (mapValue) {
      for (var key in mapValue) if (mapValue.hasOwnProperty(key)) model = updater(key, model, getValue(widgetValue, key, mapValue));
    } else model = updater(path, model, widgetValue);

    this.notify('onChange', model);

    function getValue(val, key, map) {
      var field = map[key];
      return typeof field === 'function' ? field(val) : val[field];
    }
  };

  Form.prototype.render = function render() {
    var _this3 = this;

    var _props = this.props;
    var children = _props.children;
    var onChange = _props.onChange;
    var value = _props.value;
    var Element = _props.component;
    var props = babelHelpers.objectWithoutProperties(_props, ['children', 'onChange', 'value', 'component']);

    if (Element === 'form') props.noValidate = true; // disable html5 validation

    return React.createElement(
      Container,
      {
        ref: function (ref) {
          return _this3._container = ref;
        },
        messages: this.props.errors,
        onValidationNeeded: this.props.noValidate ? function () {} : function (e) {
          return _this3._handleValidationRequest(e);
        } },
      React.createElement(
        Element,
        babelHelpers._extends({}, props, { onSubmit: this._submit.bind(this) }),
        this.state.children
      )
    );
  };

  Form.prototype._handleValidationRequest = function _handleValidationRequest(e) {
    var _this4 = this;

    this.notify('onValidate', e);

    if (e.event === 'onChange') return this._queueValidation(e.field);

    this.timeout(e.field, function () {
      _this4.validator.validate(e.field, _this4.props).then(function () {
        return _this4.notify('onError', _this4.validator.errors());
      })['catch'](done);
    }, this.props.delay);
  };

  Form.prototype._submit = function _submit(e) {
    var _this5 = this;

    var options = {
      strict: this.props.strict,
      abortEarly: false
    };

    e.preventDefault();

    this.props.schema.validate(this.props.value, options).then(function () {
      return _this5.notify('onSubmit', e);
    })['catch'](function (err) {
      var errors = err.inner.reduce(function (list, e) {
        list[e.path] = (list[e.path] || (list[e.path] = [])).concat(e.errors);
        return list;
      }, {});

      _this5.notify('onError', errors);
    });
  };

  Form.prototype.timeout = function timeout(key, fn, ms) {
    var timers = this._timers || (this._timers = Object.create(null));

    if (this._unmounted) return;

    clearTimeout(this._timers[key]);
    this._timers[key] = setTimeout(fn, ms);
  };

  Form.prototype._queueValidation = function _queueValidation(path) {
    var queue = this._queue || (this._queue = []);

    if (queue.indexOf(path) === -1) queue.push(path);
  };

  Form.prototype._flushValidations = function _flushValidations(newProps) {
    var _this6 = this;

    var newValue = newProps.value,
        oldValue = this.props.value,
        fields = this._queue || [];

    if (fields.length) {
      this.timeout('yup_flush_validations', function () {
        _this6._queue = [];

        _this6.validator.validate(fields, newProps).then(function () {
          return _this6.notify('onError', _this6.validator.errors());
        })['catch'](done);
      }, newProps.delay);
    }
  };

  Form.prototype.notify = function notify(event, arg) {
    this.props[event] && this.props[event](arg);
  };

  babelHelpers.createClass(Form, null, [{
    key: 'propTypes',
    value: {

      /**
       * Form value object, can be left uncontrolled; 
       * use the `defaultValue` prop to initialize an uncontrolled form.
       */
      value: React.PropTypes.object,

      /**
       * Callback that is called when the `value` prop changes.
       */
      onChange: React.PropTypes.func,

      /**
       * An object hash of field errors for the form. The object should be keyed with paths
       * with the values being string messages or an array of messages. Errors can be left 
       * uncontrolled (use `defaultErrors` to set an initial value) or managed along with the `onError` callback
       * 
       * ```js
       * errors={{
       *  "name.first": [
       *    'First names are required', 
       *    "Names must be at least 2 characters long"
       *  ],
       * }}
       * ```
       */
      errors: React.PropTypes.object,

      /**
       * Callback that is called when a validation error occures. It is called with an `errors` object
       * ```js
       * function onError(errors){
       *   errors['name.first'] 
       *   // => 'required field', "Names must be at least 2 characters long"]
       * }
       * ```
       */
      onError: React.PropTypes.func,

      /**
       * Callback that is called whenever a validation is triggered. 
       * It is called _before_ the validation is actually run.
       * ```js
       * function onError(e){
       *   { event, field, args, target } = e
       * }
       * ```
       */
      onValidate: React.PropTypes.func,

      /**
       * Callback that is fired when the native onSubmit event is triggered. Only relevant when 
       * the `component` prop renders a `<form/>` tag. onSubmit will trigger only if the form is valid.
       * 
       * ```js
       * function onSubmit(e){
       *   // do something with valid value
       * }
       * ```
       */
      onSubmit: React.PropTypes.func,

      /**
       * A value getter function. `getter` is called with `path` and `value` and 
       * should return the plain **javascript** value at the path.
        * ```js
       * function(
       *  path: string,
       *  value: any,
       * ) -> object
       * ```
       */
      getter: React.PropTypes.func,

      /**
       * A value setter function. `setter` is called with `path`, the form `value` and the path `value`. 
       * The `setter` must return updated form `value`, which allows you to leave the original value unmutated.
       *
       * The default implementation uses the [react immutability helpers](http://facebook.github.io/react/docs/update.html), 
       * letting you treat the form `value` as immutable.
       * ```js
       * function(
       *  path: string,
       *  formValue: object,
       *  pathValue: any
       * ) -> object
       * ```
       */
      setter: React.PropTypes.func.isRequired,

      /**
       * Time in milliseconds that validations should be debounced. Reduces the amount of validation calls
       * made at the expense of a slight delay. Helpful for performance.
       */
      delay: React.PropTypes.number,

      /**
       * Validations will be strict, making no attempt to coarce input values to the appropriate type.
       */
      strict: React.PropTypes.bool,

      /**
       * Turns off input validation for the Form, value updates will continue to work.
       */
      noValidate: React.PropTypes.bool,

      /**
       * A tag name or Component class the Form should render as
       */
      component: React.PropTypes.oneOfType([React.PropTypes.func, React.PropTypes.string]).isRequired,

      /**
       * A Yup schema  that validates the Form `value` prop. Used to validate the form input values 
       * For more information about the yup api check out: https://github.com/jquense/yup/blob/master/README.md
       * @type {YupSchema}
       */
      schema: function schema(props, name, componentName) {
        var err = !props.noValidate && React.PropTypes.any.isRequired(props, name, componentName);

        if (!err && !props[name].__isYupSchema__) err = new Error('`schema` must be a proper yup schema: (' + componentName + ')');

        return err;
      }
    },
    enumerable: true
  }, {
    key: 'defaultProps',
    value: {
      component: 'form',
      strict: true,
      delay: 300,
      getter: function getter(path, model) {
        return expr.getter(path, true)(model || {});
      },
      setter: function setter(path, model, val) {
        return updateIn(model, toUpdateSpec(path, val));
      } },
    enumerable: true
  }, {
    key: 'childContextTypes',
    value: {
      schema: React.PropTypes.func,
      value: React.PropTypes.func,
      onChange: React.PropTypes.func,
      onSubmit: React.PropTypes.func,
      noValidate: React.PropTypes.func },
    enumerable: true
  }]);
  return Form;
})(React.Component);

module.exports = uncontrollable(Form, { value: 'onChange', errors: 'onError' });

function wrapSetter(setter) {
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var result = setter.apply(undefined, args);
    invariant(result && typeof result === 'object', '`setter(..)` props must return the form value object after updating a value.');
    return result;
  };
}

function syncErrors(validator, errors) {
  validator._errors = {};
  Object.keys(errors).forEach(function (key) {
    if (errors[key] != null) validator._errors[key] = [].concat(errors[key]);
  });
}

function has(o, k) {
  return o ? Object.prototype.hasOwnProperty.call(o, k) : false;
}