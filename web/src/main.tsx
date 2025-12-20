import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Providers } from './spa/Providers.js';
import { RootApp } from './spa/RootApp.js';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Providers>
            <BrowserRouter>
                <RootApp />
            </BrowserRouter>
        </Providers>
    </React.StrictMode>
);
