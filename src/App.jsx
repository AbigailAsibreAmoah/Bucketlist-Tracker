import { useState } from 'react'
import './App.css'

function App() {
  const [bucketItems, setBucketItems] = useState([])
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (newItem.trim()) {
      setBucketItems([...bucketItems, {
        id: Date.now(),
        text: newItem.trim(),
        completed: false,
        dateAdded: new Date().toLocaleDateString()
      }])
      setNewItem('')
    }
  }

  const toggleComplete = (id) => {
    setBucketItems(bucketItems.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const deleteItem = (id) => {
    setBucketItems(bucketItems.filter(item => item.id !== id))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addItem()
    }
  }

  const completedCount = bucketItems.filter(item => item.completed).length
  const totalCount = bucketItems.length

  return (
    <div className="app">
      <header className="app-header">
        <h1>🪣 My Bucket List</h1>
        <p>Dreams worth chasing, adventures worth having</p>
        {totalCount > 0 && (
          <div className="stats">
            <span>{completedCount} of {totalCount} completed</span>
          </div>
        )}
      </header>

      <div className="add-item-section">
        <div className="input-group">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What's your next adventure?"
            className="item-input"
          />
          <button onClick={addItem} className="add-button">
            Add to List
          </button>
        </div>
      </div>

      <div className="bucket-list">
        {bucketItems.length === 0 ? (
          <div className="empty-state">
            <p>Your bucket list is empty!</p>
            <p>Add your first dream above to get started.</p>
          </div>
        ) : (
          <div className="items-grid">
            {bucketItems.map(item => (
              <div key={item.id} className={`bucket-item ${item.completed ? 'completed' : ''}`}>
                <div className="item-content">
                  <div className="item-text" onClick={() => toggleComplete(item.id)}>
                    <span className="checkbox">{item.completed ? '✅' : '⬜'}</span>
                    <span className={item.completed ? 'completed-text' : ''}>{item.text}</span>
                  </div>
                  <div className="item-meta">
                    <span className="date">Added: {item.dateAdded}</span>
                    {item.completed && <span className="completed-badge">Completed!</span>}
                  </div>
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="delete-button"
                  title="Delete item"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App