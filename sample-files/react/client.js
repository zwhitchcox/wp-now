import './style.css'

import { hydrate } from 'react-dom'
import React from 'react'

import { App } from './app'

hydrate(<App />, document.querySelector('app'))

