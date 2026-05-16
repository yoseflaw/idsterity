import './lib/styles/idsterity-tokens.css';

import '@fontsource/libre-baskerville/400.css';
import '@fontsource/libre-baskerville/700.css';
import '@fontsource/libre-baskerville/400-italic.css';
import '@fontsource/source-serif-4/300.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/jetbrains-mono/400.css';

import { mount } from 'svelte'
import App from './App.svelte'

mount(App, { target: document.getElementById('app') })
