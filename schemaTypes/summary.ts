import {defineField, defineType} from 'sanity'

export const summary = defineType({
  name: 'summary',
  title: 'Summary',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'baseText', type: 'array', of: [{type: 'block'}]}),
  ],
})
