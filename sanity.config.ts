import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {contentCompareTool} from './tools/contentCompare'
import {contentExplorerTool} from './tools/contentExplorer'

export default defineConfig({
  name: 'default',
  title: 'agent-actions',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [structureTool(), visionTool()],
  tools: [contentExplorerTool(), contentCompareTool()],

  schema: {
    types: schemaTypes,
  },
})
