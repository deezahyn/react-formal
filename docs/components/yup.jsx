var React = require('react')
  , Link = require('react-router').Link
  , Playground = require('component-playground');

module.exports = class  extends React.Component {
  render(){
    return (
      <div>
<h2 id="a-quick-guide-to-yup">A Quick Guide to yup</h2>
<p><em>You can find the entire list of validations and transforms at the <a href="https://github.com/jquense/yup/blob/master/README.md">yup documentation site</a>.</em></p>
<p>Create schemas by calling the type factories on the <code>{`yup`}</code> object.</p>
<Playground lang="js" theme="neo" scope={this.props.scope} codeText={`// base: matches every type
yup.mixed() 

// primitive types
yup.string()
yup.date()
yup.number()
yup.bool()

// complex types
yup.array().of(yup.number())
yup.object({
    property: yup.string()    
})`} es6Console />

<p>Schema objects are immutable, so each method returns a <em>new</em> schema object. This is helpful for reusing schemas without worrying about breaking existing ones.</p>
<Playground lang="js" theme="neo" scope={this.props.scope} codeText={`var string = yup.string();
var requiredString = string.required();

console.log(string !== requiredString)

console.log(
  requiredString !== requiredString.max(5))`} es6Console />

<p>Schemas can be combined (as long as they are the same type) using <code>{`.concat()`}</code></p>
<Playground lang="js" theme="neo" scope={this.props.scope} codeText={`var defaultString = yup.string().default('hi');
var reqString = yup.string().required();

var reqDefaultString = defaultString.concat(reqString)

console.log(reqDefaultString.default())

reqDefaultString.isValid('').then(
  valid => console.log(valid))`} es6Console />

<p>You can use <code>{`yup`}</code> to coerce objects to match the defined schema with <code>{`.cast()`}</code></p>
<Playground lang="js" theme="neo" scope={this.props.scope} codeText={`var schema = yup.object()
  .camelcase()
  .shape({
    firstName: yup.string().trim(),
    age:       yup.number()
  })

console.log(
  schema.cast({ FIRST_NAME: '  John  ', age: '6' }))`} es6Console />

<p>Validate an object against a schema with <code>{`.validate()`}</code> or <code>{`.isValid()`}</code>, By default validation will also call <code>{`.cast()`}</code> unless you pass the <code>{`strict`}</code> option, during validation.</p>
<Playground lang="js" theme="neo" scope={this.props.scope} codeText={`var schema = yup.object()
  .camelcase()
  .shape({
    firstName: yup.string().trim(),
    age:       yup.number()
  })

schema.validate({ FIRST_NAME: '  John  ', age: '6' })
  .then(value => console.log('validate: ', value))

// pass in the strict option to disable coercion
schema.validate(
    { FIRST_NAME: '  John  ', age: '6' },
    { strict: true }
  ).catch(err => console.log('strict: ', err.errors))

schema.isValid(
    { FIRST_NAME: '  John  ', age: '6' }, 
    { strict: true }
  ).then( valid => console.log('isValid:', valid))`} es6Console />

<p>You can write custom transformations or validations with <code>{`.transform()`}</code> and <code>{`.test()`}</code>. </p>
<Playground lang="js" theme="neo" scope={this.props.scope} codeText={`var schema = yup.string()
  .transform(value => {
    // capitalize
    return value && (value[0].toUpperCase() + value.substr(1))
  })
  .test('caps', 'must be a capitalized!', value => {
    return value == null || value[0] === value[0].toUpperCase()
  })

console.log(schema.cast('john'))

// transforms do not run when strict is true
schema.validate('john', { strict: true })
  .catch(err => console.log(err.errors[0]))`} es6Console />


      </div>
    )
  }
}
