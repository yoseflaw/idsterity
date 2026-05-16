import './lib/styles/idsterity-tokens.css';

import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/400-italic.css';
import '@fontsource/eb-garamond/700.css';
import '@fontsource/eb-garamond/700-italic.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/400-italic.css';

import { mount } from 'svelte'
import App from './App.svelte'

mount(App, { target: document.getElementById('app') })
