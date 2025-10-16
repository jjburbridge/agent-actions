import {defineField, defineType} from 'sanity'

export const instructions = defineType({
  name: 'instructions',
  title: 'Instructions',
  type: 'document',
  fields: [
    defineField({
      name: 'section',
      type: 'reference',
      to: {type: 'section'},
    }),
    defineField({
      name: 'market',
      type: 'reference',
      to: {type: 'market'},
    }),
    defineField({name: 'instructions', type: 'text'}),
  ],
})
