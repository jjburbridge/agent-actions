import {MasterDetailIcon} from '@sanity/icons/MasterDetail'
import type {Tool} from 'sanity'
import {ContentExplorer} from './ContentExplorer'

export const contentExplorerTool = (): Tool => ({
  name: 'content-explorer',
  title: 'Content Explorer',
  icon: MasterDetailIcon,
  component: ContentExplorer,
})
