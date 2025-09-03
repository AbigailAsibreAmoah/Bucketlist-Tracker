import React, { useState, useEffect, useCallback } from 'react'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/api'
import { getCurrentUser } from 'aws-amplify/auth'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import awsExports from './aws-exports'
import './App.css'

// GraphQL queries and mutations
const listBucketItems = `
  query ListBucketItems {
    listBucketItems {
      items {
        id
        title
        description
        completed
        createdAt
        updatedAt
        owner
      }
    }
  }
`

const createBucketItem = `
  mutation CreateBucketItem($input: CreateBucketItemInput!) {
    createBucketItem(input: $input) {
      id
      title
      description
      completed
      createdAt
      updatedAt
      owner
    }
  }
`

const updateBucketItem = `
  mutation UpdateBucketItem($input: UpdateBucketItemInput!) {
    updateBucketItem(input: $input) {
      id
      title
      description
      completed
      createdAt
      updatedAt
      owner
    }
  }
`

const deleteBucketItem = `
  mutation DeleteBucketItem($input: DeleteBucketItemInput!) {
    deleteBucketItem(input: $input) {
      id
    }
  }
`

// Configure Amplify
Amplify.configure(awsExports)
const client = generateClient()

function App() {
  const [bucketItems, setBucketItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch bucket items from backend
  const fetchBucketItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await client.graphql({
        query: listBucketItems
      })
      setBucketItems(result.data.listBucketItems.items || [])
    } catch (err) {
      console.error('Error fetching items:', err)
      setError('Failed to load your bucket list')
    } finally {
      setLoading(false)
    }
  }, [])

  // Check if user is authenticated and fetch data
  const checkUser = useCallback(async () => {
    try {
      await getCurrentUser()
      fetchBucketItems()
    } catch (err) {
      console.log('User not authenticated:', err.message || err)
      setLoading(false)
      setError('Please sign in to view your bucket list')
    }
  }, [fetchBucketItems])

  // Get current user on component mount
  useEffect(() => {
    checkUser()
  }, [checkUser])

  // Add new item to backend
  const addItem = async () => {
    if (!newItem.trim()) return

    try {
      const itemData = {
        title: newItem.trim(),
        description: '',
        completed: false
      }
      
      const result = await client.graphql({
        query: createBucketItem,
        variables: { input: itemData }
      })
      
      setBucketItems(prevItems => [...prevItems, result.data.createBucketItem])
      setNewItem('')
      setError(null)
    } catch (err) {
      console.error('Error creating item:', err)
      setError('Failed to add item. Please try again.')
    }
  }

  // Toggle item completion in backend
  const toggleComplete = async (item) => {
    try {
      const updatedItem = {
        id: item.id,
        completed: !item.completed
      }
      
      const result = await client.graphql({
        query: updateBucketItem,
        variables: { input: updatedItem }
      })
      
      setBucketItems(prevItems => 
        prevItems.map(bucketItem => 
          bucketItem.id === item.id ? result.data.updateBucketItem : bucketItem
        )
      )
      setError(null)
    } catch (err) {
      console.error('Error updating item:', err)
      setError('Failed to update item. Please try again.')
    }
  }

  // Delete item from backend
  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return

    try {
      await client.graphql({
        query: deleteBucketItem,
        variables: { input: { id } }
      })
      
      setBucketItems(prevItems => prevItems.filter(item => item.id !== id))
      setError(null)
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Failed to delete item. Please try again.')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addItem()
    }
  }

  const completedCount = bucketItems.filter(item => item.completed).length
  const totalCount = bucketItems.length

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="app">
          <header className="app-header">
            <div className="header-top">
              <div>
                <h1>🪣 My Bucket List</h1>
                <p>Dreams worth chasing, adventures worth having</p>
              </div>
              <div className="user-info">
                <span>Welcome, {user?.username || user?.signInDetails?.loginId || 'User'}!</span>
                <button onClick={signOut} className="sign-out-button">
                  Sign Out
                </button>
              </div>
            </div>
            {totalCount > 0 && (
              <div className="stats">
                <span>{completedCount} of {totalCount} completed</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </header>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          <div className="add-item-section">
            <div className="input-group">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What's your next adventure?"
                className="item-input"
                maxLength={200}
              />
              <button 
                onClick={addItem} 
                className="add-button" 
                disabled={loading || !newItem.trim()}
              >
                {loading ? 'Adding...' : 'Add to List'}
              </button>
            </div>
          </div>

          <div className="bucket-list">
            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Loading your bucket list...</p>
              </div>
            ) : bucketItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h3>Your bucket list is empty!</h3>
                <p>Start adding your dreams and adventures above.</p>
              </div>
            ) : (
              <div className="items-grid">
                {bucketItems
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map(item => (
                    <div key={item.id} className={`bucket-item ${item.completed ? 'completed' : ''}`}>
                      <div className="item-content">
                        <div className="item-text" onClick={() => toggleComplete(item)}>
                          <span className="checkbox">
                            {item.completed ? '✅' : '⬜'}
                          </span>
                          <span className={item.completed ? 'completed-text' : ''}>
                            {item.title}
                          </span>
                        </div>
                        <div className="item-meta">
                          <span className="date">
                            Added: {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          {item.completed && (
                            <span className="completed-badge">
                              🎉 Completed!
                            </span>
                          )}
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
                  ))
                }
              </div>
            )}
          </div>

          <footer className="app-footer">
            <p>Keep dreaming, keep achieving! 🌟</p>
          </footer>
        </div>
      )}
    </Authenticator>
  )
}

export default App