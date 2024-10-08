import React from 'react'
import VideoEditorContent from './components/VideoEditorContent/VideoEditorContent.jsx'

const App = () => {
  return (
    <div className='app' style={{backgroundColor:"black",margin:"0px",marginTop:"-8px",height:"100vh",width:"98vw",overflowX:"hidden"}} >
    <VideoEditorContent/>
    </div>
  )
}

export default App