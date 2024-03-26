import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {EvoluProvider} from "@evolu/react";
import {evolu} from "./evolu.ts";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EvoluProvider value={evolu}>
      <App/>
    </EvoluProvider>
  </React.StrictMode>,
)
