import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [apiStatus,setApiStatus] = useState('connecting to backend...')
  
  useEffect(()=>{
    const fetchApiStatus = async ()=>{
      try {
        const response = await fetch('http://localhost:3001/api/v1/health')
        if(!response.ok){
          throw new Error(`HTTP error! status:${response.status}`)
        }

        const data = await response.json()
        setApiStatus(data.message)
      } catch (error) {
        console.error("Failed to fetch API status:", error);
        setApiStatus('Failed to connect to backend.');
      }
    }
    fetchApiStatus();
  },[])
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <h2>Backend Status</h2>
        {/* 6. 在页面上显示我们的 state 变量 */}
        <p style={{ color: 'lightgreen', fontSize: '1.2em' }}>
          {apiStatus}
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
