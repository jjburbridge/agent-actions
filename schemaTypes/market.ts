import {defineField, defineType} from 'sanity'

export const market = defineType({
  name: 'market',
  type: 'document',
  fields: [defineField({name: 'title', type: 'string'})],
})
