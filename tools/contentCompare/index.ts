import {TransferIcon} from '@sanity/icons/Transfer'
import type {Tool} from 'sanity'
import {ContentCompare} from './ContentCompare'

export const contentCompareTool = (): Tool => ({
  name: 'content-compare',
  title: 'Content Compare',
  icon: TransferIcon,
  component: ContentCompare,
})
