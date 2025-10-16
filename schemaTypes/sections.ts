import {defineField, defineType} from 'sanity'

export const sections = defineType({
  name: 'section',
  type: 'document',
  fields: [defineField({name: 'title', type: 'string'})],
})

export const contentSections = defineType({
  name: 'contentSection',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'content', type: 'text'}),
    defineField({name: 'section', type: 'reference', to: {type: 'section'}}),
    defineField({name: 'market', type: 'reference', to: {type: 'market'}}),
  ],
})
