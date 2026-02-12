import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LeaveProvider } from './context/LeaveContext'
import { StudentProvider } from './context/StudentContext'
import './index.css'
import App from './App'

import { MenuProvider } from './context/MenuContext'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <StudentProvider>
                    <LeaveProvider>
                        <MenuProvider>
                            <App />
                        </MenuProvider>
                    </LeaveProvider>
                </StudentProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>,
)
