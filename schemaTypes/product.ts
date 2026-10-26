import {defineField, defineType} from 'sanity'

export const product = defineType({
  name: 'product',
  type: 'document',
  fields: [defineField({name: 'title', type: 'string'})],
})
