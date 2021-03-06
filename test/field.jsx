var React = require('react/addons')
  , yup = require('yup')
  , inputs = require('../src/inputs')
  , Form = require('../src');

var $ = require('react-testutil-query')

describe('Field', ()=> {
  var schema = yup.object({ 
    name: yup.string().default('') 
  })

  class TestInput extends React.Component {
    render(){
      return <input {...this.props}/>
    } 
  }

  it('should pass props to inner type', function(){
    var inst = $(
      <Form schema={schema} defaultValue={{}}>
        <Form.Field name='name' type={TestInput} className='test'/>
      </Form>)

    var input = inst.single(TestInput)[0]

    input.props.className.should.equal('test')
  })

  it('should fall back to using schema types', function(){
    var schema = yup.object({ 
      string: yup.string(),
      number: yup.number(),
      date:   yup.date(),
      bool:   yup.bool(),
      array:  yup.array().of(yup.string())
    })

    var inst = $(
      <Form schema={schema} defaultValue={{}}>
        <Form.Field name='string'/>
        <Form.Field name='number'/>
        <Form.Field name='date'/>
        <Form.Field name='bool'/>
        <Form.Field name='array'/>
      </Form>)

    inst.single(inputs.Input)
    inst.single(inputs.Number)
    inst.single(inputs.Date)
    inst.single(inputs.Bool)
    inst.single(inputs.Select)
  })

  it('should use type override', function(){
    var inst = $(
      <Form schema={schema} defaultValue={{}}>
        <Form.Field name='name'/>
        <Form.Field name='name' type='textarea'/>
        <Form.Field name='name' type={TestInput}/>
      </Form>)

    inst.single(TestInput)
    inst.find(inputs.Input).length.should.equal(2)
  })

  it('should fire onChange', function(done){
    var inst = $(
      <Form schema={schema} defaultValue={{}}>
        <Form.Field name='name' type={TestInput} onChange={()=> done()}/>
      </Form>)

    inst.single('input').trigger('change')
  })
})