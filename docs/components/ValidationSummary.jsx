var React = require('react')
  , Link = require('react-router').Link
  , Playground = require('component-playground');

module.exports = class  extends React.Component {
  render(){
    return (
      <div>
<h2 id="summary">Summary</h2>
<p>Display all Form validation <code>{`errors`}</code> in a single summary list.</p>
<Playground lang="js" theme="neo" scope={this.props.scope} codeText={`<Form 
  schema={modelSchema} 
  defaultValue={modelSchema.default()}
>
  <Form.Summary/>

  <Form.Field name='name.first' placeholder='first'/>
  <Form.Field name='name.last' placeholder='surname'/>
  <Form.Field name='dateOfBirth' placeholder='dob'/>

  <Form.Button>Validate</Form.Button> 
</Form>`} noRender/>

<h3 id="props">Props</h3>
<h4 id="-formatmessage-__-required-__"><code>{`formatMessage`}</code> <strong>(required)</strong></h4>
<p>An error message renderer, Should return a <code>{`ReactElement`}</code></p>
<pre><code className="">{`function(
  message: string, 
  idx: number, 
  messages: array
) -> ReactElement`}
</code></pre>
<p>type: <code>{`func`}</code>  <em>default</em>: <code>{`(message, idx) => <li key={idx}>{message}</li>`}</code></p>
<h4 id="-component-__-required-__"><code>{`component`}</code> <strong>(required)</strong></h4>
<p>A DOM node tag name or Component class the Message should render as.</p>
<p>type: <code>{`func, string`}</code>  <em>default</em>: <code>{`'ul'`}</code></p>
<h4 id="-errorclass-"><code>{`errorClass`}</code></h4>
<p>A css class that should be always be applied to the Summary container.</p>
<p>type: <code>{`string`}</code>  <em>default</em>: <code>{`'validation-error'`}</code></p>
<h4 id="-group-"><code>{`group`}</code></h4>
<p>Specify a group to show erros for, if empty all form errors will be shown in the Summary.</p>
<p>type: <code>{`string`}</code>  </p>

      </div>
    )
  }
}
