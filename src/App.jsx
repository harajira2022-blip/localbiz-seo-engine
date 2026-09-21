import { useState } from 'react'
import SchemaArchitect from './components/SchemaArchitect.jsx'
import MetaAuditor from './components/MetaAuditor.jsx'

export default function App() {
  const [tab, setTab] = useState('schema')

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">LB</span>
          <div>
            <h1>LocalBiz SEO Engine</h1>
            <br />
            <span>Schema markup + on-page meta health, in one dashboard</span>
          </div>
        </div>

        <nav className="tabs">
          <button
            className={`tab ${tab === 'schema' ? 'active' : ''}`}
            onClick={() => setTab('schema')}
          >
            Schema Architect
          </button>
          <button
            className={`tab ${tab === 'audit' ? 'active' : ''}`}
            onClick={() => setTab('audit')}
          >
            Meta Health Dashboard
          </button>
        </nav>
      </header>

      {tab === 'schema' ? <SchemaArchitect /> : <MetaAuditor />}
    </div>
  )
}